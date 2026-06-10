from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Q

from accounts.clerk_auth import (
    _primary_email,
    get_clerk_client,
    link_user_to_clerk,
    set_clerk_kapita_metadata,
)

User = get_user_model()


def _clerk_username(user):
    """Clerk usernames must be 4–64 chars and unique in your Clerk instance."""
    base = (user.username or '').strip()
    if len(base) < 4 and user.email:
        local = user.email.split('@')[0].strip()
        if len(local) >= 4:
            base = local
    if len(base) < 4:
        base = f'kapita{user.id}'
    candidate = f'{base}_{user.id}'
    return candidate[:64]


class Command(BaseCommand):
    help = (
        'Link existing Kapita users to Clerk accounts by email. '
        'Optionally create missing Clerk users so legacy signups can sign in via Clerk.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would happen without writing changes.',
        )
        parser.add_argument(
            '--create-missing',
            action='store_true',
            help='Create a Clerk user for Kapita accounts that are not in Clerk yet.',
        )
        parser.add_argument(
            '--skip-staff',
            action='store_true',
            default=True,
            help='Skip staff/admin users (default: true). Use --no-skip-staff to include them.',
        )
        parser.add_argument(
            '--no-skip-staff',
            action='store_false',
            dest='skip_staff',
            help='Include staff users when syncing.',
        )
        parser.add_argument(
            '--refresh-metadata',
            action='store_true',
            help='Update Clerk metadata for all Kapita users already linked to Clerk.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        create_missing = options['create_missing']
        skip_staff = options['skip_staff']
        refresh_metadata = options['refresh_metadata']

        client = get_clerk_client()
        if not client:
            self.stderr.write(self.style.ERROR('CLERK_SECRET_KEY is not configured.'))
            return

        if refresh_metadata:
            meta_qs = User.objects.exclude(clerk_id__isnull=True).exclude(clerk_id='')
            if skip_staff:
                meta_qs = meta_qs.filter(is_staff=False)
            updated = 0
            for user in meta_qs.order_by('id'):
                self.stdout.write(f'Metadata #{user.id} {user.email} → Clerk {user.clerk_id}')
                if not dry_run:
                    set_clerk_kapita_metadata(user.clerk_id, user)
                updated += 1
            self.stdout.write(self.style.SUCCESS(f'Metadata updated for {updated} user(s)'))
            if not create_missing:
                return

        from clerk_backend_api.models.getuserlistop import GetUserListRequest

        queryset = User.objects.filter(Q(clerk_id__isnull=True) | Q(clerk_id=''))
        if skip_staff:
            queryset = queryset.filter(is_staff=False)

        linked = 0
        created = 0
        skipped = 0

        for user in queryset.distinct().order_by('id'):
            email = (user.email or '').strip()
            if not email or email.endswith('@users.clerk.local'):
                self.stdout.write(self.style.WARNING(f'Skip user #{user.id} ({user.username}): no real email'))
                skipped += 1
                continue

            clerk_matches = client.users.list(
                request=GetUserListRequest(email_address=[email], limit=10),
            )

            if clerk_matches:
                clerk_user = clerk_matches[0]
                clerk_email = _primary_email(clerk_user)
                self.stdout.write(
                    f'Link #{user.id} {user.username} <{email}> → Clerk {clerk_user.id} ({clerk_email})'
                )
                if not dry_run:
                    link_user_to_clerk(
                        user,
                        clerk_user.id,
                        first_name=clerk_user.first_name or user.first_name,
                        last_name=clerk_user.last_name or user.last_name,
                    )
                linked += 1
                continue

            if create_missing:
                self.stdout.write(
                    f'Create Clerk user for #{user.id} {user.username} <{email}>'
                )
                if not dry_run:
                    clerk_user = client.users.create(
                        email_address=[email],
                        username=_clerk_username(user),
                        first_name=user.first_name or None,
                        last_name=user.last_name or None,
                        skip_password_requirement=True,
                    )
                    link_user_to_clerk(
                        user,
                        clerk_user.id,
                        first_name=user.first_name,
                        last_name=user.last_name,
                    )
                created += 1
                continue

            self.stdout.write(
                self.style.WARNING(
                    f'No Clerk account for #{user.id} {user.username} <{email}> — '
                    'sign up in Clerk with this email, or re-run with --create-missing'
                )
            )
            skipped += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done. linked={linked} created={created} skipped={skipped}'
            + (' (dry run)' if dry_run else '')
        ))

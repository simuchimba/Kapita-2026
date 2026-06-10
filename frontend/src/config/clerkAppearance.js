/** Kapita-branded Clerk appearance — sits inside AuthPageLayout card shell. */
export const kapitaClerkAppearance = {
  variables: {
    colorPrimary: '#059669',
    colorPrimaryForeground: '#ffffff',
    colorText: '#111827',
    colorTextSecondary: '#4b5563',
    colorInputBackground: '#ffffff',
    colorInputText: '#111827',
    colorBackground: '#ffffff',
    colorDanger: '#dc2626',
    colorSuccess: '#059669',
    colorNeutral: '#6b7280',
    colorMuted: '#f9fafb',
    borderRadius: '0.625rem',
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSize: '0.875rem',
    spacingUnit: '0.875rem',
  },
  elements: {
    rootBox: 'w-full max-w-full mx-auto font-sans',
    cardBox: 'w-full max-w-full shadow-none',
    card: 'w-full max-w-full shadow-none border-0 bg-transparent p-0 gap-4',
    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    logoBox: 'hidden',
    logoImage: 'hidden',
    main: 'gap-4',
    form: 'gap-4',
    formFieldRow: 'gap-4',
    formFieldLabel: 'text-sm font-medium text-gray-700',
    formFieldInput:
      'h-10 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 shadow-sm ' +
      'transition-colors placeholder:text-gray-400 ' +
      'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none',
    formFieldInputShowPasswordButton: 'text-gray-400 hover:text-primary-600',
    formButtonPrimary:
      'h-10 w-full rounded-lg bg-primary-600 text-sm font-semibold text-white shadow-sm ' +
      'shadow-primary-600/15 transition-all hover:bg-primary-700 active:bg-primary-800 ' +
      'normal-case disabled:opacity-60',
    formButtonReset: 'text-sm font-medium text-primary-600 hover:text-primary-700',
    footer: 'bg-transparent pt-1',
    footerAction: 'justify-center py-2',
    footerActionText: 'text-sm text-gray-600',
    footerActionLink: 'text-sm font-semibold text-primary-600 hover:text-primary-700',
    identityPreview: 'rounded-lg border border-gray-200 bg-primary-50/50 px-3 py-2',
    identityPreviewText: 'text-sm font-medium text-gray-900',
    identityPreviewEditButton: 'text-sm font-medium text-primary-600 hover:text-primary-700',
    formResendCodeLink: 'text-sm font-medium text-primary-600 hover:text-primary-700',
    otpCodeFieldInput:
      'rounded-lg border border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
    socialButtonsBlockButton:
      'h-10 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 ' +
      'shadow-sm transition-colors hover:border-gray-400 hover:bg-gray-50',
    socialButtonsProviderIcon: 'opacity-100',
    socialButtonsIconButton:
      'rounded-lg border border-gray-300 bg-white hover:bg-gray-50',
    dividerLine: 'bg-gray-200',
    dividerText: 'text-xs font-medium uppercase tracking-wider text-gray-400',
    alert: 'rounded-lg border text-sm',
    alertText: 'text-sm',
    formFieldErrorText: 'mt-1 text-xs text-red-600',
    formFieldSuccessText: 'mt-1 text-xs text-primary-700',
    formFieldHintText: 'text-xs text-gray-500',
    backLink: 'text-sm font-medium text-primary-600 hover:text-primary-700',
    backRow: 'mb-2',
    navbar: 'hidden',
    footerPagesLink: 'text-sm text-primary-600 hover:text-primary-700',
    alternativeMethodsBlockButton:
      'text-sm font-medium text-primary-600 hover:text-primary-700',
    formFieldAction: 'text-sm font-medium text-primary-600 hover:text-primary-700',
  },
  layout: {
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'blockButton',
    showOptionalFields: true,
  },
}

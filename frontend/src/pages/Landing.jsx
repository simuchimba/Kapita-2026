import { Link } from 'react-router-dom'
import LandingAuthNavLegacy from '../components/LandingAuthNavLegacy'
import {
  BarChart3,
  Package,
  Users,
  TrendingUp,
  Shield,
  Smartphone,
  Check,
  ArrowRight,
  DollarSign,
  LineChart,
  MessageSquare,
  Activity,
  BellRing,
  Sparkles,
  LayoutGrid,
  CreditCard,
  HelpCircle,
  Mail,
  MapPin,
  Wallet,
  Receipt,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Github,
} from 'lucide-react'

function FloatingNavbar() {
  return (
    <header className="fixed left-0 right-0 top-4 z-50 flex justify-center px-4 sm:top-5">
      <div className="floating-nav-shell w-full max-w-3xl">
        <div className="floating-nav-glow" aria-hidden />
        <nav className="floating-nav-inner">
          <a href="#" className="flex shrink-0 items-center" aria-label="Kapita home">
            <img
              src="/logo1.png"
              alt="Kapita Logo"
              className="h-8 w-auto object-contain sm:h-9"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextElementSibling.style.display = 'flex'
              }}
            />
            <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-primary-600 sm:h-9 sm:w-9">
              <span className="text-sm font-semibold text-white sm:text-base">K</span>
            </div>
          </a>

          <div className="hidden items-center gap-1 md:flex">
            <a
              href="#features"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <LandingAuthNavLegacy />
          </div>
        </nav>
      </div>
    </header>
  )
}

function HeroPreview() {
  const bars = [38, 52, 44, 68, 56, 78, 62, 84, 58, 72]

  return (
    <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
      <div className="absolute -left-3 top-8 z-10 hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:block lg:-left-6">
        <Package className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
      </div>
      <div className="absolute -right-2 top-1/3 z-10 hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:block lg:-right-4">
        <Users className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
      </div>
      <div className="absolute -bottom-2 right-6 z-10 hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:block">
        <Wallet className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          </div>
          <div className="ml-2 h-2 flex-1 max-w-[140px] rounded-full bg-slate-200/80" />
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { icon: BarChart3, tone: 'bg-primary-50 text-primary-600' },
              { icon: Package, tone: 'bg-slate-100 text-slate-600' },
              { icon: TrendingUp, tone: 'bg-primary-50 text-primary-600' },
            ].map(({ icon: Icon, tone }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-2 py-3"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="h-1.5 w-full max-w-[48px] rounded-full bg-slate-200" />
                <div className="h-1 w-2/3 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-3 sm:p-4">
            <div className="mb-3 flex items-end justify-between gap-1">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="w-full max-w-[18px] rounded-sm bg-primary-500/90 transition-colors"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
                <div className="h-2 w-16 rounded-full bg-slate-200" />
              </div>
              <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-primary-600" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MONTHLY_PRICE = 'K29.99'

export default function Landing() {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Dashboard',
      description: 'Monitor your business performance with live metrics and analytics',
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track stock levels, get low stock alerts, and manage products efficiently',
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Maintain customer database with purchase history and credit tracking',
    },
    {
      icon: DollarSign,
      title: 'Sales Tracking',
      description: 'Record sales with multiple payment types and automatic profit calculations',
    },
    {
      icon: TrendingUp,
      title: 'Financial Analytics',
      description: 'Track expenses, calculate capital, and monitor cashflow in real-time',
    },
    {
      icon: LineChart,
      title: 'Business Projections',
      description: '30-day revenue and profit forecasts based on your business trends',
    },
    {
      icon: MessageSquare,
      title: 'Mumu',
      description: 'Ask Mumu questions about your business and get instant insights powered by AI',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your business data is encrypted and protected with enterprise-grade security',
    },
    {
      icon: Smartphone,
      title: 'Mobile Responsive',
      description: 'Access your business data anywhere, anytime from any device',
    },
  ]

  const benefits = [
    'Track inventory and prevent stockouts',
    'Monitor sales and profits in real-time',
    'Manage customer credits and payments',
    'Control expenses and cashflow',
    'Calculate business capital automatically',
    'Generate financial reports instantly',
    'Get insights from Mumu, your AI assistant',
    'Make data-driven decisions',
  ]

  const heroStats = [
    { label: 'Live sales', value: '24/7', icon: Activity },
    { label: 'Inventory alerts', value: 'Auto', icon: BellRing },
    { label: 'Business insights', value: 'Mumu', icon: Sparkles },
  ]

  const footerProductLinks = [
    { label: 'Features', href: '#features', icon: LayoutGrid },
    { label: 'Pricing', href: '#pricing', icon: CreditCard },
    { label: 'FAQ', href: '#cta', icon: HelpCircle },
  ]

  const footerCompanyLinks = [
    { label: 'About', href: '#why-choose', icon: MapPin },
    { label: 'Contact', href: 'mailto:support@kapita.app', icon: Mail, external: true },
    { label: 'Support', href: 'mailto:support@kapita.app', icon: MessageSquare, external: true },
  ]

  const footerLegalLinks = [
    { label: 'Privacy', href: '#footer-legal' },
    { label: 'Terms', href: '#footer-legal' },
  ]

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
  ]

  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-900 antialiased">
      <FloatingNavbar />

      <main>
        {/* Hero — background extends to viewport top, behind navbar */}
        <section className="relative overflow-hidden border-b border-slate-100 px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8 lg:pb-28 lg:pt-32">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-slate-50/60"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(16,185,129,0.1),transparent_65%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 bottom-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)] opacity-45"
            aria-hidden
          />

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                  Smart Business Tracking
                  <span className="mt-1 block text-primary-600">Made Simple</span>
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
                  The complete business management solution for small businesses in Africa.
                  Track inventory, sales, customers, and finances all in one place.
                </p>
                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4 lg:justify-start">
                  <Link
                    to="/register"
                    className="landing-btn-primary landing-btn-lg group"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link to="/login" className="landing-btn-secondary landing-btn-lg">
                    Sign In
                  </Link>
                </div>
                <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3">
                  {heroStats.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-slate-300"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                        <item.icon className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {item.label}
                        </div>
                        <div className="text-lg font-semibold text-slate-900">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-slate-500 lg:text-left">
                  Only {MONTHLY_PRICE}/month • No credit card required • Cancel anytime
                </p>
              </div>

              <div className="relative lg:pl-4">
                <HeroPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-t border-slate-100 bg-slate-50/50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Everything You Need to Run Your Business
              </h2>
              <p className="mt-3 text-lg text-slate-600 sm:mt-4 sm:text-xl">
                Powerful features designed for small businesses
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 ring-4 ring-primary-50/50">
                    <feature.icon className="h-5 w-5 text-primary-600" strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose + Pricing */}
        <section id="why-choose" className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Why Choose Kapita?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
                Built specifically for small businesses in Zambia and Africa.
                Simple, affordable, and powerful.
              </p>
              <ul className="mt-8 space-y-3.5 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3 w-3 text-green-600" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm text-slate-700 sm:text-base">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="pricing" className="scroll-mt-24 rounded-2xl border border-primary-700/20 bg-primary-600 p-6 text-white sm:p-8">
              <div className="border-b border-white/15 pb-6">
                <div className="text-4xl font-semibold tracking-tight">{MONTHLY_PRICE}</div>
                <div className="mt-1 text-sm text-white/80">per month</div>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base">
                  <Check className="h-4 w-4 flex-shrink-0 text-white/90" strokeWidth={2.5} />
                  <span>Unlimited products</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base">
                  <Check className="h-4 w-4 flex-shrink-0 text-white/90" strokeWidth={2.5} />
                  <span>Unlimited sales tracking</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base">
                  <Check className="h-4 w-4 flex-shrink-0 text-white/90" strokeWidth={2.5} />
                  <span>Customer management</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base">
                  <Check className="h-4 w-4 flex-shrink-0 text-white/90" strokeWidth={2.5} />
                  <span>Financial reports</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base">
                  <Check className="h-4 w-4 flex-shrink-0 text-white/90" strokeWidth={2.5} />
                  <span>Mumu — your AI assistant</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base">
                  <Check className="h-4 w-4 flex-shrink-0 text-white/90" strokeWidth={2.5} />
                  <span>Mobile app access</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base">
                  <Check className="h-4 w-4 flex-shrink-0 text-white/90" strokeWidth={2.5} />
                  <span>24/7 support</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="landing-btn-white mt-8 py-3.5 text-sm sm:text-base"
              >
                Start Your Free Trial
              </Link>
              <p className="mt-4 text-center text-xs text-white/75 sm:text-sm">
                No credit card required • 14-day free trial
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          id="cta"
          className="border-t border-slate-100 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-4 text-lg text-slate-600 sm:mt-5 sm:text-xl">
              Join hundreds of small businesses already using Kapita to grow their operations
            </p>
            <Link
              to="/register"
              className="landing-btn-primary landing-btn-lg group mt-8"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-4 flex items-center">
                <img
                  src="/logo1.png"
                  alt="Kapita Logo"
                  className="h-9 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
                <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
                  <span className="text-lg font-semibold text-white">K</span>
                </div>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-slate-600">
                Smart business tracking made simple for Zambian entrepreneurs
              </p>

              <div className="mt-5 flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="landing-social-icon"
                  >
                    <social.icon className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                ))}
              </div>

            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Product</h3>
              <ul className="space-y-2.5">
                {footerProductLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="group inline-flex items-center gap-2.5 text-sm text-slate-600 transition-colors hover:text-primary-600"
                    >
                      <item.icon
                        className="h-4 w-4 text-slate-400 transition-colors group-hover:text-primary-600"
                        strokeWidth={1.75}
                      />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Company</h3>
              <ul className="space-y-2.5">
                {footerCompanyLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      {...(item.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="group inline-flex items-center gap-2.5 text-sm text-slate-600 transition-colors hover:text-primary-600"
                    >
                      <item.icon
                        className="h-4 w-4 text-slate-400 transition-colors group-hover:text-primary-600"
                        strokeWidth={1.75}
                      />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Legal</h3>
              <ul className="space-y-2.5">
                {footerLegalLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-600 transition-colors hover:text-primary-600"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            id="footer-legal"
            className="mt-10 border-t border-slate-200 pt-8 text-center text-sm text-slate-500"
          >
            <p>&copy; 2026 Kapita. All rights reserved, built by Wazingwa Mugala - Software Engineer, from Kitwe, Zambia</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

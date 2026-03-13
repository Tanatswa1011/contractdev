import Link from "next/link";
import {
  Shield,
  Zap,
  Bell,
  FileText,
  TrendingUp,
  Lock,
  ChevronRight,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "AI Risk Analysis",
    description:
      "Automatically score every contract's risk profile. Catch liability gaps, unfavourable clauses, and data-processing risks before they bite."
  },
  {
    icon: Bell,
    title: "Renewal Alerts",
    description:
      "Never miss a renewal window again. Configurable notice-period reminders across email, Slack, and Teams keep every deadline visible."
  },
  {
    icon: FileText,
    title: "Clause Extraction",
    description:
      "AI reads your PDFs and surfaces termination, SLA, confidentiality, and payment clauses — no manual review needed."
  },
  {
    icon: TrendingUp,
    title: "Portfolio Dashboard",
    description:
      "One view of your entire contract estate. Filter by risk level, status, or upcoming dates and drill down in seconds."
  },
  {
    icon: Zap,
    title: "Instant AI Q&A",
    description:
      "Ask any question about a contract in plain English. \"What's the termination notice?\" — answered in under a second."
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "Row-level security on every record, SOC 2-ready infrastructure, and GDPR-compliant data processing out of the box."
  }
];

const stats = [
  { label: "Contracts analysed", value: "12,000+" },
  { label: "Average risk score accuracy", value: "94%" },
  { label: "Time saved per review", value: "3 hrs" },
  { label: "Renewal windows caught", value: "99.8%" }
];

const testimonials = [
  {
    quote:
      "ContractGuardAI caught a hidden auto-renewal on a €240k software deal with just 9 days left on the notice window. Paid for itself instantly.",
    name: "Sara Meier",
    title: "Head of Legal, TechCorp GmbH"
  },
  {
    quote:
      "We manage 400+ vendor contracts. The risk dashboard and AI Q&A have completely replaced our manual spreadsheet process.",
    name: "James Okafor",
    title: "VP Operations, Nordika Group"
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "For individuals and early-stage teams.",
    features: [
      "Up to 10 contracts",
      "AI clause extraction",
      "Renewal reminders",
      "1 workspace member"
    ],
    cta: "Get started free",
    href: "/signup",
    highlighted: false
  },
  {
    name: "Pro",
    price: "€19",
    period: "/mo",
    description: "For growing legal and operations teams.",
    features: [
      "Unlimited contracts",
      "Full AI risk analysis",
      "All integrations (Slack, Calendar)",
      "Up to 10 workspace members",
      "AI Q&A per contract",
      "Priority support"
    ],
    cta: "Start free trial",
    href: "/signup",
    highlighted: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organisations with advanced needs.",
    features: [
      "Everything in Pro",
      "SSO & advanced permissions",
      "Dedicated onboarding",
      "SLA guarantee",
      "Custom AI models",
      "On-prem deployment option"
    ],
    cta: "Talk to sales",
    href: "mailto:sales@contractguardai.com",
    highlighted: false
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold tracking-tight">
              CG
            </div>
            <span className="text-sm font-medium">ContractGuardAI</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-20 md:px-8 md:pt-28 md:pb-28 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Now with GPT-4o powered clause extraction
          <ChevronRight className="h-3 w-3" />
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl leading-[1.08]">
          Your contracts,{" "}
          <span className="text-muted-foreground">intelligently guarded</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
          ContractGuardAI monitors your entire contract portfolio for risk, renewals,
          and critical deadlines — so your legal team can focus on strategy, not spreadsheets.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Start for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            View demo dashboard
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required · Free plan available · GDPR compliant
        </p>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-foreground md:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything your contracts team needs
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base max-w-xl mx-auto">
            From first upload to expiry, ContractGuardAI handles the entire lifecycle
            so nothing slips through the cracks.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 hover:border-foreground/20 transition-colors"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        id="testimonials"
        className="border-y border-border bg-card"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Trusted by legal teams worldwide
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="rounded-xl border border-border bg-background p-6"
              >
                <blockquote className="text-sm leading-relaxed text-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4">
                  <div className="text-xs font-medium text-foreground">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.title}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Start free. Upgrade when you need more contracts or teammates.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground border border-background px-3 py-0.5 text-[10px] font-medium text-background">
                  Most popular
                </div>
              )}
              <div className="mb-4">
                <div
                  className={`text-xs font-medium ${
                    plan.highlighted ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.name}
                </div>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span
                      className={`text-sm ${
                        plan.highlighted ? "text-background/70" : "text-muted-foreground"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    plan.highlighted ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>
              </div>
              <ul className="mb-6 space-y-2">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-xs">
                    <CheckCircle
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                        plan.highlighted ? "text-background" : "text-muted-foreground"
                      }`}
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full rounded-full py-2 text-center text-xs font-medium transition-opacity hover:opacity-90 ${
                  plan.highlighted
                    ? "bg-background text-foreground"
                    : "bg-foreground text-background"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Ready to protect your contracts?
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Join teams that use ContractGuardAI to catch risky clauses, missed renewals,
            and critical deadlines before they become problems.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground md:flex-row md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded border border-border text-[9px] font-semibold">
              CG
            </div>
            <span>ContractGuardAI</span>
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="mailto:hello@contractguardai.com" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
          <span>© 2026 ContractGuardAI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

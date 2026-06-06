import { useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { login } from "./auth.js";
import { AuthLogo } from "./AuthLogo.jsx";
import { goToAppPage, goToResetPassword, goToSignUp } from "../app/navigation.js";
import { DonutGauge, MiniBars, SparkLine } from "../app/components/Visuals.jsx";

const promoCards = [
  {
    icon: Sparkles,
    label: "AI Readiness Score",
    value: "82 / 100",
    delta: "+12 pts vs last audit",
    viz: "spark",
  },
  {
    icon: LockKeyhole,
    label: "Content Access",
    value: "91%",
    delta: "+8% vs last audit",
    viz: "donut",
    donut: 91,
  },
  {
    icon: Target,
    label: "Discoverability",
    value: "76%",
    delta: "+9% vs last audit",
    viz: "bars",
  },
];

export function LoginPage() {
  const [email, setEmail] = useState("admin@glasgate.ai");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = login(email, password);
    setLoading(false);
    if (result.ok) goToAppPage("overview");
    else setError(result.error);
  }

  return (
    <div className="auth-page auth-login premium-auth">
      <div className="auth-ambient" aria-hidden="true" />

      <header className="auth-header">
        <AuthLogo />
      </header>

      <div className="auth-layout auth-layout-split premium-auth-grid">
        <section className="auth-card premium-glass fx-fade-in is-visible">
          <span className="pill auth-pill"><Sparkles size={14} /> AI-ready data pipeline</span>
          <h1>Welcome back</h1>
          <p className="auth-lead">Sign in to your glasgate.ai account to continue.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="app-field">
              <span>Email address</span>
              <span className="auth-input-wrap premium-input">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="username"
                  required
                />
              </span>
            </label>
            <label className="app-field">
              <span className="auth-label-row">
                Password
                <button type="button" className="text-link" onClick={goToResetPassword}>Forgot password?</button>
              </span>
              <span className="auth-input-wrap premium-input">
                <LockKeyhole size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </span>
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="primary-button auth-submit shimmer-btn" type="submit" disabled={loading}>
              Sign in <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-divider"><span>or continue with</span></div>
          <div className="auth-social">
            <button type="button" className="outline-button premium-outline">Continue with Google</button>
            <button type="button" className="outline-button premium-outline">Continue with Microsoft 365</button>
          </div>
          <p className="auth-footer-link">
            Don&apos;t have an account? <button type="button" className="text-link" onClick={goToSignUp}>Book a demo →</button>
          </p>
        </section>

        <aside className="auth-promo premium-promo fx-fade-in is-visible" style={{ "--fx-delay": "120ms" }}>
          <h2>Turn your website into <span>AI-ready</span> data</h2>
          <p>Crawl, clean, and structure your content into reliable datasets that power AI agents and automations.</p>

          <div className="auth-promo-cards">
            {promoCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article className="auth-promo-card premium-glass" key={card.label} style={{ "--i": index }}>
                  <div className="auth-promo-card-head">
                    <span className="gradient-icon"><Icon size={20} /></span>
                    <div>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                      <small className="metric-delta positive"><TrendingUp size={12} /> {card.delta}</small>
                    </div>
                  </div>
                  <div className="auth-promo-viz">
                    {card.viz === "spark" && <SparkLine />}
                    {card.viz === "donut" && <DonutGauge value={card.donut} size={56} stroke={5} sublabel="" />}
                    {card.viz === "bars" && <MiniBars values={[40, 62, 48, 76, 58, 68]} />}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="auth-trust-row">
            <div><ShieldCheck size={18} /><span>Enterprise-grade security</span></div>
            <div><Sparkles size={18} /><span>Trusted by teams worldwide</span></div>
          </div>
        </aside>
      </div>

      <footer className="auth-page-footer premium-auth-foot">
        <span>© 2025 glasgate.ai, Inc. All rights reserved.</span>
        <span>Privacy · Terms</span>
      </footer>
    </div>
  );
}

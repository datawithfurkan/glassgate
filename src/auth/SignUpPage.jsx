import { useState } from "react";
import { Building2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { register } from "./auth.js";
import { AuthLogo } from "./AuthLogo.jsx";
import { goToAppPage, goToLogin } from "../app/navigation.js";

export function SignUpPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const result = register(email, password, company);
    if (result.ok) goToAppPage("overview");
    else setError(result.error);
  }

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /\d/.test(password),
  ];

  return (
    <div className="auth-page auth-signup premium-auth">
      <div className="auth-ambient" aria-hidden="true" />
      <header className="auth-header auth-header-between">
        <AuthLogo />
        <p>Already have an account? <button type="button" className="text-link" onClick={goToLogin}>Sign in</button></p>
      </header>

      <div className="auth-layout auth-layout-signup">
        <section className="auth-card auth-card-wide premium-glass">
          <span className="pill auth-pill"><Sparkles size={14} /> AI-ready data pipeline</span>
          <h1>Create your workspace</h1>
          <p className="auth-lead">Start building reliable AI-ready data pipelines for your website in minutes.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="app-field">
              <span>Work email</span>
              <span className="auth-input-wrap">
                <Mail size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </span>
            </label>
            <label className="app-field">
              <span>Company</span>
              <span className="auth-input-wrap">
                <Building2 size={18} />
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company name" />
              </span>
            </label>
            <label className="app-field">
              <span>Password</span>
              <span className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" required />
              </span>
            </label>
            <ul className="auth-checks">
              {["8+ characters", "One uppercase", "One number"].map((label, i) => (
                <li key={label} className={checks[i] ? "ok" : ""}>{label}</li>
              ))}
            </ul>
            {error && <p className="auth-error">{error}</p>}
            <button className="primary-button auth-submit" type="submit">Create account</button>
          </form>

          <div className="auth-divider"><span>or</span></div>
          <button type="button" className="outline-button auth-social-single">Sign up with Google</button>
          <p className="auth-legal">By creating an account you agree to our Terms of Service and Privacy Policy.</p>
        </section>

        <aside className="auth-signup-visual">
          <h3>Connect → Generate → Monitor</h3>
          <ol>
            <li><strong>Connect site</strong> — Connect your website to get started.</li>
            <li><strong>Generate artifacts</strong> — We crawl and structure your content.</li>
            <li><strong>Monitor AI readiness</strong> — Track readiness and quality over time.</li>
          </ol>
        </aside>
      </div>
    </div>
  );
}

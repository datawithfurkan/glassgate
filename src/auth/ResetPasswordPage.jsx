import { useState } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { AuthLogo } from "./AuthLogo.jsx";
import { goToLogin } from "../app/navigation.js";

export function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className="auth-page auth-reset premium-auth">
      <div className="auth-ambient" aria-hidden="true" />
      <header className="auth-header auth-header-between">
        <AuthLogo />
        <button type="button" className="text-link" onClick={goToLogin}>Need help?</button>
      </header>

      <div className="auth-layout auth-layout-reset">
        <section className="auth-card premium-glass">
          <span className="auth-icon-badge"><LockKeyhole size={28} /></span>
          <h1>Reset password</h1>
          <p className="auth-lead">
            {sent
              ? "If an account exists for that email, we sent a reset link."
              : "Enter your email and we'll send you a link to reset your password."}
          </p>

          {!sent && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="app-field">
                <span>Email address</span>
                <span className="auth-input-wrap">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </span>
              </label>
              <button className="primary-button auth-submit" type="submit">
                Send reset link <ArrowRight size={18} />
              </button>
            </form>
          )}

          <button type="button" className="text-link auth-back" onClick={goToLogin}>
            <ArrowLeft size={16} /> Back to sign in
          </button>
        </section>

        <aside className="auth-security-card">
          <h3><ShieldCheck size={20} /> Your security matters</h3>
          <p>We use industry-standard security to keep your data safe.</p>
          <ul>
            <li>Secure links sent to your inbox</li>
            <li>Advanced security at every step</li>
            <li>We never share your information</li>
          </ul>
        </aside>
      </div>

      <footer className="auth-page-footer">
        <span>© 2025 glasgate.ai</span>
        <span>Privacy policy · Terms of service · Security</span>
      </footer>
    </div>
  );
}

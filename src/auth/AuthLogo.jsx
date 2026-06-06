import { goToHome } from "../app/navigation.js";

export function LogoMark({ small = false }) {
  return (
    <span className={`logo-mark ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

export function AuthLogo({ onClick = goToHome }) {
  return (
    <button type="button" className="auth-logo" onClick={onClick}>
      <LogoMark />
      <span>glasgate.ai</span>
    </button>
  );
}

import { useEffect, useRef, useState } from "react";

export function FadeIn({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`fx-fade-in ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={{ "--fx-delay": `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

export function AnimatedNumber({ value, suffix = "", duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const numeric = parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;

  useEffect(() => {
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(numeric * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numeric, duration]);

  return (
    <span className="fx-count">
      {display}
      {suffix}
    </span>
  );
}

export function DonutGauge({ value = 82, size = 120, stroke = 10, label, sublabel, className = "" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const gradId = `donut-${size}-${value}`;

  return (
    <div className={`fx-donut ${className}`.trim()} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8d42f6" />
            <stop offset="100%" stopColor="#2655ff" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="fx-donut-track" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fx-donut-fill"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ "--circ": c }}
        />
      </svg>
      <div className="fx-donut-label">
        {label ?? (
          <>
            <strong>{value}</strong>
            {sublabel && <small>{sublabel}</small>}
          </>
        )}
      </div>
    </div>
  );
}

export function ScoreRing({ value, size = 48, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <svg width={size} height={size} className="fx-score-ring" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="fx-donut-track" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="fx-donut-fill"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export function SparkLine({ points = "8,72 34,58 58,68 83,44 108,52 132,28 160,42 184,20", className = "" }) {
  return (
    <svg className={`fx-sparkline ${className}`.trim()} viewBox="0 0 190 48" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8d42f6" />
          <stop offset="100%" stopColor="#2655ff" />
        </linearGradient>
      </defs>
      <polyline points={points} />
    </svg>
  );
}

export function MiniBars({ values = [22, 38, 56, 74, 48, 62, 40], className = "" }) {
  return (
    <div className={`fx-mini-bars ${className}`.trim()} aria-hidden="true">
      {values.map((h, i) => (
        <span key={i} style={{ "--h": `${h}%`, "--i": i }} />
      ))}
    </div>
  );
}

export function AreaChart({ className = "" }) {
  return (
    <svg className={`fx-area-chart ${className}`.trim()} viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(38,85,255,0.35)" />
          <stop offset="100%" stopColor="rgba(38,85,255,0)" />
        </linearGradient>
      </defs>
      <path
        className="fx-area-fill"
        d="M0,90 C40,70 80,85 120,55 C160,25 200,65 240,45 C280,25 320,50 360,30 L400,20 L400,120 L0,120 Z"
        fill="url(#areaGrad)"
      />
      <polyline className="fx-area-line" points="0,90 40,70 80,85 120,55 160,45 200,65 240,45 280,35 320,50 360,30 400,20" />
    </svg>
  );
}

export function HealthGauge({ value = 86, size = 140 }) {
  return (
    <div className="fx-health-gauge">
      <DonutGauge value={value} size={size} stroke={12} label={<><strong>{value}%</strong><small>Healthy</small></>} />
      <p className="app-muted">Overall system health</p>
      <span className="status-pill success">All systems operational</span>
    </div>
  );
}

export function MetricTile({ icon: Icon, label, value, delta, deltaPositive = true, chart, delay = 0, highlight = false }) {
  return (
    <FadeIn delay={delay} className={`premium-metric ${highlight ? "highlight" : ""}`}>
      <div className="premium-metric-head">
        <span className="gradient-icon"><Icon size={22} /></span>
        <span className="premium-metric-label">{label}</span>
      </div>
      <strong className="premium-metric-value">{value}</strong>
      {delta && <small className={`metric-delta ${deltaPositive ? "positive" : "negative"}`}>{delta}</small>}
      {chart}
    </FadeIn>
  );
}

export function PremiumPanel({ children, className = "", delay = 0 }) {
  return (
    <FadeIn delay={delay} className={`audit-panel premium-panel ${className}`.trim()}>
      {children}
    </FadeIn>
  );
}

export function StatusDot({ status = "success" }) {
  return <span className={`status-dot ${status}`} aria-hidden="true" />;
}

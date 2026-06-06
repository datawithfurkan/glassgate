import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter, isAppRoute } from "./app/AppRouter.jsx";
import { goToAudit } from "./app/navigation.js";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Braces,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Cloud,
  Code2,
  Database,
  FileJson,
  FileText,
  Globe2,
  Layers3,
  LineChart,
  LockKeyhole,
  Menu,
  PackageCheck,
  Play,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Zap
} from "lucide-react";
import ecommerceMaskedFront from "./assets/ecommerce-masked-front.png";
import groceryMaskedFront from "./assets/grocery-masked-front.png";
import "./styles.css";

const navItems = [
  { label: "Platform", id: "platform" },
  { label: "How it works", id: "how-it-works" },
  { label: "Solutions", id: "solutions" },
  { label: "Pricing", id: "pricing" },
  { label: "Docs", id: "docs" },
  { label: "Company", id: "company" }
];

const sectionAliases = Object.fromEntries(navItems.map(({ label, id }) => [label, id]));
sectionAliases.Audit = "audit";

function scrollToSection(id) {
  const section = document.getElementById(sectionAliases[id] ?? id);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function goToSection(id) {
  const targetId = sectionAliases[id] ?? id;
  if (isAppRoute()) {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new Event("routechange"));
    window.setTimeout(() => scrollToSection(targetId), 0);
    return;
  }
  window.dispatchEvent(new CustomEvent("goto", { detail: targetId }));
}

const pipeline = [
  { icon: Bot, title: "Crawl", text: "Discover pages" },
  { icon: Sparkles, title: "Clean", text: "Remove noise" },
  { icon: Boxes, title: "Structure", text: "Create schemas" },
  { icon: Rocket, title: "Deliver", text: "APIs and files" },
  { icon: LineChart, title: "Monitor", text: "Track freshness" }
];

const outputs = [
  {
    name: "pages.json",
    label: "Structured map",
    lines: ["{", "  \"pages\": 12,", "  \"agentReady\": true", "}"]
  },
  {
    name: "content.md",
    label: "Clean content",
    lines: ["# Product guide", "- Pricing", "- FAQs"]
  },
  {
    name: "llms.txt",
    label: "Public AI source map",
    lines: ["# Agent source map", "/docs", "/pricing"]
  }
];

const cards = [
  [Target, "Accurate", "High precision extraction agents can trust."],
  [Zap, "Fresh", "Smart recrawling keeps sources up to date."],
  [LockKeyhole, "Secure", "Policy controls for enterprise teams."],
  [BarChart3, "Observable", "Pipelines, quality, and access in one place."],
  [Sparkles, "AI-Optimized", "Structured for retrieval and agent use."]
];

const solutionCards = [
  [Cloud, "SaaS", "Docs, pricing, changelog, support."],
  [Store, "Commerce", "Products, offers, reviews, inventory."],
  [BriefcaseBusiness, "Agencies", "Client pipelines at scale."],
  [Globe2, "Local", "Hours, services, FAQs, locations."]
];

const plans = [
  ["Starter", "$29", "1 pipeline", "10k pages", "Standard connectors"],
  ["Growth", "$99", "5 pipelines", "100k pages", "All connectors"],
  ["Business", "$299", "Unlimited pipelines", "1M pages", "Priority support"],
  ["Enterprise", "Custom", "Unlimited", "Custom connectors", "SLA and compliance"]
];

const motionCapturedPages = [
  {
    image: ecommerceMaskedFront,
    label: "Masked ecommerce front page capture",
    sourceLabel: "source website",
    mirrorLines: [
      "llms.txt",
      "---",
      "title: Agent-ready storefront",
      "canonical: https://example.com/",
      "type: ecommerce_homepage",
      "markdown:",
      "  # Fresh arrivals",
      "  - Hero offer extracted",
      "  - Navigation normalized",
      "  - Product categories indexed",
      "json:",
      "  {",
      "    \"pageType\": \"storefront\",",
      "    \"sections\": [\"hero\", \"nav\", \"cards\"],",
      "    \"agentReady\": true",
      "  }"
    ]
  },
  {
    image: groceryMaskedFront,
    label: "Masked grocery storefront capture",
    sourceLabel: "next source",
    mirrorLines: [
      "page.json",
      "{",
      "  \"siteType\": \"grocery_storefront\",",
      "  \"primaryOffer\": \"Summer grilling\",",
      "  \"categories\": [",
      "    \"produce\", \"meat\", \"snacks\",",
      "    \"pantry\", \"weekly specials\"",
      "  ],",
      "  \"structuredFor\": \"agents\",",
      "  \"llmsTxt\": \"/llms.txt\",",
      "  \"tokens\": {",
      "    \"source\": 18420,",
      "    \"mirror\": 4620",
      "  }",
      "}"
    ]
  }
];

const motionParticles = Array.from({ length: 170 }, (_, index) => ({
  "--x": `${(index % 17) * 12 - 96}px`,
  "--y": `${Math.floor(index / 17) * 20 - 104}px`,
  "--d": `${(index % 17) * 0.09}s`,
  "--s": `${2 + (index % 4)}px`,
  "--o": `${0.34 + (index % 5) * 0.1}`
}));

function Logo() {
  return (
    <button className="logo" onClick={() => goToSection("platform")}>
      <LogoMark />
      <span>glassgate.app</span>
    </button>
  );
}

function LogoMark({ small = false }) {
  return (
    <span className={`logo-mark ${small ? "small" : ""}`} aria-hidden="true">
      <i />
      <b />
    </span>
  );
}

function Header({ activeSection, onNavigate, onAudit }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (id) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <Logo />
      <nav className={menuOpen ? "open" : ""}>
        {navItems.map(({ label, id }) => (
          <button
            className={activeSection === id ? "active" : ""}
            key={id}
            onClick={() => handleNavigate(id)}
            aria-current={activeSection === id ? "true" : undefined}
          >
            {label}
            {(label === "Solutions" || label === "Company") && <ChevronDown size={14} />}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button className="signin" onClick={goToAudit}>Sign in</button>
        <button className="primary-button" onClick={onAudit}>
          Book a demo <ArrowRight size={17} />
        </button>
        <button
          className="mobile-menu"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

function HeroVisual({ mode = "website" }) {
  return (
    <div className="hero-visual" aria-label="AI-ready pipeline visualization">
      <SourceCard mode={mode} />
      <Connector side="left" />
      <Processor />
      <Connector side="right" />
      <OutputStack mode={mode} />
    </div>
  );
}

function SourceCard({ mode }) {
  const isCommerce = mode === "commerce";
  return (
    <div className="source-card float-a">
      <div className="mini-browser">
        <span />
        <span />
        <span />
      </div>
      <div className={`source-art ${isCommerce ? "commerce" : ""}`}>
        {isCommerce ? <PackageCheck size={54} /> : <Globe2 size={54} />}
      </div>
      <strong>{isCommerce ? "Product page" : "Any website"}</strong>
      <small>https://example.com</small>
    </div>
  );
}

function Processor() {
  return (
    <div className="processor float-b">
      <div className="dot-field" />
      <LogoMark />
      <strong>glassgate.app</strong>
      <span>
        <i /> Processing
      </span>
    </div>
  );
}

function OutputStack({ mode }) {
  const rows = mode === "commerce"
    ? [
        { name: "products.json", label: "Catalog data", lines: ["{", "  \"products\": 48,", "  \"offers\": true", "}"] },
        { name: "content.md", label: "Clean copy", lines: ["# Storefront", "- Categories", "- Policies"] },
        { name: "llms.txt", label: "AI source map", lines: ["# Commerce map", "/products", "/shipping"] }
      ]
    : outputs;

  return (
    <div className="output-stack" aria-label="Agent-ready outputs">
      <h3>Agent-ready outputs</h3>
      {rows.map(({ name, label, lines }, index) => (
        <article className="output-card float-c" style={{ "--d": `${index * 0.08}s` }} key={name}>
          <strong>{name}</strong>
          <span>{label}</span>
          <pre>{lines.join("\n")}</pre>
        </article>
      ))}
    </div>
  );
}

function Connector({ side }) {
  const isRight = side === "right";
  const targets = isRight ? [90, 216, 342] : [186];
  return (
    <svg className={`connector ${side}`} viewBox="0 0 240 372" aria-hidden="true">
      {targets.map((targetY, line) => (
        <path
          key={targetY}
          className="dash-line"
          style={{ "--i": line }}
          d={isRight
            ? `M 12 186 C 82 186, 112 ${targetY}, 226 ${targetY}`
            : "M 18 186 C 82 186, 134 186, 224 186"}
        />
      ))}
      {targets.map((targetY) => (
        <circle className="pulse-dot" key={targetY} cx={isRight ? 226 : 224} cy={targetY} r="5" />
      ))}
    </svg>
  );
}

function Platform() {
  return (
    <>
      <section className="hero page-shell" id="platform">
        <div className="hero-copy">
          <div className="pill">
            <Sparkles size={15} /> AI-ready data pipeline
          </div>
          <h1>
            Turn any website into <span>AI-ready</span> data.
          </h1>
          <p>We crawl, clean, and structure web content for agents and automations.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={goToAudit}>Book a demo <ArrowRight size={18} /></button>
            <button className="secondary-button" onClick={() => goToSection("how-it-works")}><Play size={18} /> See how it works</button>
          </div>
          <div className="trust-row">
            <span><Check size={15} /> No credit card</span>
            <span><Check size={15} /> Set up in minutes</span>
            <span><Check size={15} /> Enterprise ready</span>
          </div>
        </div>
        <HeroVisual />
      </section>
      <DemoBand />
    </>
  );
}

function PipelineRail() {
  return (
    <section className="pipeline-rail page-shell">
      {pipeline.map(({ icon: Icon, title, text }, index) => (
        <div className="pipeline-step" key={title}>
          <span className="round-icon">
            <Icon size={26} />
            <b>{index + 1}</b>
          </span>
          <div>
            <strong>{title}</strong>
            <small>{text}</small>
          </div>
          {index < pipeline.length - 1 && <ArrowRight className="step-arrow" size={26} />}
        </div>
      ))}
    </section>
  );
}

function FeatureCards() {
  return (
    <section className="feature-grid page-shell">
      {cards.map(([Icon, title, text]) => (
        <article className="feature-card" key={title}>
          <span className="gradient-icon"><Icon size={25} /></span>
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function DemoBand({ compact = false }) {
  return (
    <section className={`demo-band page-shell ${compact ? "compact" : ""}`}>
      <div>
        <h2>{compact ? "Ready to build AI-ready pipelines?" : "See glassgate.app in action."}</h2>
        <p>{compact ? "Simple setup. Structured output. Enterprise control." : "Book a personalized demo with our team."}</p>
      </div>
      <button className="primary-button" onClick={goToAudit}>Book a demo <ArrowRight size={18} /></button>
      <MiniDashboard />
    </section>
  );
}

function MiniDashboard() {
  return (
    <div className="mini-dashboard">
      <div className="chart-card">
        <svg viewBox="0 0 190 110">
          <polyline points="8,72 34,58 58,68 83,44 108,52 132,28 160,42 184,20" />
          {[22, 38, 56, 74, 48].map((height, index) => (
            <rect key={index} x={18 + index * 28} y={94 - height} width="14" height={height} rx="3" />
          ))}
        </svg>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <>
      <section className="motion-scroll-section" id="how-it-works" aria-label="Website to agent-ready data animation">
        <AgentMotionGraphic />
      </section>
      <ArchitectureStrip />
    </>
  );
}

function AgentMotionGraphic() {
  const motionRef = useRef(null);
  const animationStartRef = useRef(0);
  const [reductionPercent, setReductionPercent] = useState(0);

  useEffect(() => {
    let frameId;
    let isVisible = false;
    const duration = 12000;
    const holdMs = 900;

    animationStartRef.current = performance.now();

    const tick = (time) => {
      const elapsed = (time - animationStartRef.current) % duration;
      const activeDuration = duration - holdMs * 2;
      const activeElapsed = Math.max(0, Math.min(activeDuration, elapsed - holdMs));
      const phase = activeElapsed / activeDuration;
      const wave = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
      setReductionPercent(elapsed < holdMs || elapsed > duration - holdMs ? 0 : Math.round(wave * 100));
      frameId = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          isVisible = true;
          animationStartRef.current = performance.now();
          setReductionPercent(0);
        } else if (!entry.isIntersecting) {
          isVisible = false;
        }
      },
      { threshold: 0.45 }
    );

    if (motionRef.current) observer.observe(motionRef.current);
    frameId = window.requestAnimationFrame(tick);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div ref={motionRef} className="agent-motion" aria-label="Animated transformation from website content to agent-ready files">
      <div className="motion-stat motion-stat-left">
        <span>Original website</span>
        <strong>18,420 tokens</strong>
      </div>
      <div className="motion-stat motion-stat-right">
        <span>Agent-ready mirror</span>
        <strong>4,620 tokens</strong>
      </div>
      <div className="motion-stage">
        <div className="motion-capture-track" aria-hidden="true">
          {motionCapturedPages.map((page, index) => (
            <figure
              className="motion-source-card"
              key={page.label}
              style={{ animationDelay: `${index * -6}s` }}
            >
              <div className="motion-browser">
                <i />
                <i />
                <i />
                <strong>{page.sourceLabel}</strong>
              </div>
              <img className="motion-capture-image" src={page.image} alt="" />
              <div className="motion-converted-panel">
                <pre>
                  {page.mirrorLines.map((line, lineIndex) => (
                    <span key={`${page.label}-${lineIndex}`}>{line}</span>
                  ))}
                </pre>
              </div>
            </figure>
          ))}
        </div>
        <div className="motion-converter">
          <div className="motion-token">
            <small>Token reduction</small>
            <strong>{reductionPercent}%</strong>
          </div>
          <div className="motion-beam" />
          <div className="motion-particles">
            {motionParticles.map((style, index) => (
              <i key={index} style={style} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureStrip() {
  return (
    <section className="architecture page-shell">
      <h2>Built for scale. Designed for AI.</h2>
      <div className="arch-row">
        {["Data sources", "Crawl", "Clean", "Structure", "Deliver", "Monitor", "Destinations"].map((item, index) => (
          <div className="arch-box" key={item}>
            {index === 0 ? <Database /> : index === 6 ? <Cloud /> : React.createElement(pipeline[Math.max(0, Math.min(index - 1, 4))].icon)}
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="arch-tags">
        {["Security & Compliance", "Scalable Infrastructure", "Data Lineage", "Access & Permissions"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function Solutions() {
  return (
    <>
      <section className="solutions-hero page-shell" id="solutions">
        <div>
          <div className="pill"><Sparkles size={15} /> AI-ready solutions</div>
          <h1>Solutions built for <span>every team.</span></h1>
          <p>Clean, structured data for real workflows.</p>
          <button className="primary-button" onClick={goToAudit}>Book a demo <ArrowRight size={18} /></button>
        </div>
        <div className="solution-orbit">
          <Processor />
          {solutionCards.map(([Icon, title, text], index) => (
            <article className="solution-card" style={{ "--n": index }} key={title}>
              <span className="gradient-icon"><Icon size={26} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <a>Learn more <ArrowRight size={15} /></a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Pricing() {
  return (
    <>
      <section className="pricing page-shell" id="pricing">
        <div className="center-heading">
          <div className="pill"><Sparkles size={15} /> Pricing</div>
          <h1>Plans that <span>scale</span> with you.</h1>
          <p>Simple pricing for every team size.</p>
        </div>
        <div className="plan-grid">
          {plans.map((plan, index) => (
            <article className={`plan-card ${index === 1 ? "popular" : ""}`} key={plan[0]}>
              {index === 1 && <b className="popular-label">Most popular</b>}
              <span className="gradient-icon">
                {index === 0 ? <Rocket /> : index === 1 ? <LineChart /> : index === 2 ? <BriefcaseBusiness /> : <Boxes />}
              </span>
              <h3>{plan[0]}</h3>
              <div className="price">{plan[1]}{plan[1].startsWith("$") && <small>/month</small>}</div>
              <button className={index === 1 ? "primary-button" : "outline-button"} onClick={goToAudit}>
                {index === 3 ? "Contact sales" : "Start free trial"}
              </button>
              {plan.slice(2).map((item) => (
                <p key={item}><Check size={16} /> {item}</p>
              ))}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Docs() {
  return (
    <>
      <section className="docs page-shell" id="docs">
        <div className="docs-copy">
          <div className="pill"><Sparkles size={15} /> Docs</div>
          <h1>Docs</h1>
          <p>Build, integrate, and scale with glassgate.app.</p>
          <label className="search-box">
            <Search size={25} />
            <input placeholder="Search the documentation..." />
            <kbd>⌘ K</kbd>
          </label>
        </div>
        <DocsVisual />
      </section>
      <section className="docs-grid page-shell">
        {[
          [Rocket, "Quickstart", "Get running in minutes."],
          [Braces, "API Reference", "Endpoints, objects, schemas."],
          [BookOpen, "Guides", "Best practices and tutorials."],
          [Code2, "Examples", "Real workflow snippets."],
          [ClipboardList, "Changelog", "What shipped recently."]
        ].map(([Icon, title, text]) => (
          <article className="feature-card" key={title}>
            <span className="gradient-icon"><Icon size={25} /></span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
            <ArrowRight size={20} />
          </article>
        ))}
      </section>
    </>
  );
}

function DocsVisual() {
  return (
    <div className="docs-visual">
      <div className="code-card float-a">
        <div className="mini-browser"><span /><span /><span /></div>
        <pre>{["const gate = new Glasgate()", "await gate.audit(url)", "gate.publish('/llms.txt')"].join("\n")}</pre>
      </div>
      <div className="doc-bubble float-b"><BookOpen size={42} /></div>
      <div className="doc-bubble small float-c"><Braces size={34} /></div>
      <MiniDashboard />
    </div>
  );
}

function Company() {
  return (
    <>
      <section className="simple-hero page-shell" id="company">
        <div>
          <div className="pill"><Sparkles size={15} /> Company</div>
          <h1>The agentic web needs a delivery layer.</h1>
          <p>We make business data readable, reliable, and ready for AI systems.</p>
        </div>
        <HeroVisual />
      </section>
      <DemoBand compact />
    </>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState("platform");
  const [route, setRoute] = useState(() => (isAppRoute() ? "app" : "home"));

  useEffect(() => {
    const updateRoute = () => {
      setRoute(isAppRoute() ? "app" : "home");
    };

    window.addEventListener("popstate", updateRoute);
    window.addEventListener("routechange", updateRoute);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      window.removeEventListener("routechange", updateRoute);
    };
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const targetId = sectionAliases[event.detail] ?? event.detail;
      setActiveSection(targetId);
      scrollToSection(targetId);
    };
    window.addEventListener("goto", handler);
    return () => window.removeEventListener("goto", handler);
  }, []);

  useEffect(() => {
    const updateActiveSection = () => {
      const current = navItems.reduce((active, { id }) => {
        const section = document.getElementById(id);
        if (!section) return active;
        return section.getBoundingClientRect().top <= 120 ? id : active;
      }, "platform");
      setActiveSection(current);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, []);

  if (route === "app") {
    return <AppRouter />;
  }

  return (
    <>
      <Header activeSection={activeSection} onNavigate={goToSection} onAudit={goToAudit} />
      <main className="landing-page">
        <Platform />
        <HowItWorks />
        <Solutions />
        <Pricing />
        <Docs />
        <Company />
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);

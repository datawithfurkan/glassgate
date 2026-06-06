# GlassGate Market Research Memo

Date: 2026-06-06

## Executive Judgment

GlassGate is investable only if it is framed as agent delivery infrastructure, not as a file generator or vague AI SEO.

The category is validated by three simultaneous shifts:

1. AI agents need machine-readable software and web surfaces.
2. Website owners need visibility, control, and monetization for AI crawler/agent access.
3. AI-search visibility has become a funded market, but most products focus on measurement rather than structured source delivery.

The market is not empty. Cloudflare and Scrunch are the strongest signals that this opportunity is real and competitive.

## Primary Market Signals

### YC: Software for Agents

YC's 2026 Requests for Startups include strong language around software that agents need to operate: APIs, MCPs, CLIs, machine-readable interfaces, documentation, and programmatic flows. This supports GlassGate's thesis that agents need a different interface to the web than humans do.

Source: https://www.ycombinator.com/rfs

### Cloudflare: Agentic Web Infrastructure

Cloudflare is moving quickly into the agentic web:

- AI Crawl Control lets site owners manage AI crawler access.
- Pay Per Crawl uses HTTP 402-style flows to let site owners charge AI crawlers.
- Web Bot Auth and Signature Agent Card point to agent identity and verified bot traffic.
- Markdown for Agents lets Cloudflare-hosted content be served in an LLM-friendly format.
- Browser Run `/crawl` can crawl sites and return HTML, Markdown, or structured JSON.

This is the strongest category validation and the strongest strategic threat.

Sources:

- https://developers.cloudflare.com/ai-crawl-control/features/pay-per-crawl/what-is-pay-per-crawl/
- https://www.cloudflare.com/en-gb/press/press-releases/2026/cloudflare-and-godaddy-partner-to-help-enable-an-open-agentic-web/
- https://developers.cloudflare.com/browser-run/quick-actions/crawl-endpoint/
- https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/

### OpenAI: AI Crawlers Are Explicit Website Actors

OpenAI documents multiple web actors:

- OAI-SearchBot for ChatGPT search features.
- GPTBot for model training crawls.
- ChatGPT-User for user-triggered browsing/actions.

This supports the idea that businesses need a crawler/agent access strategy, but it also means GlassGate must be precise about what it can and cannot control.

Source: https://platform.openai.com/docs/bots

### Google: No Special AI Files Required

Google states that sites do not need special AI text files, machine-readable files, or special schema to appear in AI Overviews or AI Mode. This matters because GlassGate should not pitch guaranteed Google AI ranking improvements.

Correct GlassGate framing:

- Better crawlability.
- Cleaner source representation.
- Easier agent retrieval.
- Better structured data quality.
- Crawler/access analytics.

Incorrect framing:

- Guaranteed AI Overview inclusion.
- Guaranteed ChatGPT ranking.
- "AI SEO magic file."

Source: https://developers.google.com/search/docs/appearance/ai-features

### `llms.txt`: Real But Not Enough

The `llms.txt` proposal defines a Markdown file at `/llms.txt` to help LLMs use websites at inference time. It also proposes page-level `.md` versions and expanded context files.

This validates GlassGate's Layer 1, but also commoditizes simple `llms.txt` generation.

Source: https://llmstxt.org/

## Competitor Landscape

| Company/tool | Category | Evidence | Impact on GlassGate |
|---|---|---|---|
| Cloudflare | Web/edge infrastructure for agentic web | AI Crawl Control, Pay Per Crawl, Web Bot Auth, Markdown for Agents, `/crawl` | Biggest strategic threat; also validates the market |
| Scrunch | AI visibility plus Agent Experience Platform | Serves AI-optimized site versions and monitors AI visibility | Closest direct competitor |
| Profound | Enterprise AI search/marketing platform | Raised USD 96M Series C at USD 1B valuation; over 700 enterprise customers claimed | Validates budget and enterprise demand |
| Peec AI | AI search visibility | Berlin company, EUR/US-focused, USD 21M Series A, USD 4M+ ARR claimed in 2025 announcement | Local European validation and competitive pressure |
| Semrush AI Visibility | SEO incumbent entering AI visibility | AI Visibility Toolkit monitors ChatGPT Search and Google AI Mode | Incumbents are packaging AI visibility into existing SEO workflows |
| Yoast/plugins/static tools | File generation | `llms.txt` and Markdown-generation plugins | Commoditize basic file generation |

Sources:

- Scrunch: https://scrunch.com/
- Profound: https://www.globenewswire.com/news-release/2026/02/24/3243475/0/en/profound-raises-series-c-at-1b-valuation-to-lead-a-new-category-of-marketing.html
- Peec AI: https://peec.ai/blog/we-raised-21m-series-a-to-help-brands-win-in-ai-search
- Semrush: https://www.semrush.com/kb/1496-getting-started-with-ai-visibility-toolkit

## Positioning Gap

Most competitors are clustered in three lanes:

1. Monitoring: "How do AI systems mention my brand?"
2. Crawler control: "Can AI bots access, pay, or be blocked?"
3. Simple generation: "Can I create `llms.txt` or Markdown files?"

GlassGate should occupy the space between them:

> Managed source-of-truth delivery for agents.

This means:

- Generate the files.
- Keep them synced.
- Validate them against canonical pages.
- Host or proxy them.
- Show access logs.
- Apply policies.
- Serve APIs to agents.

## Market Wedge

### Best first market: Agencies and SMEs

Reason:

- Agencies understand SEO budgets.
- SMEs lack technical resources.
- AI visibility anxiety is high.
- A concrete audit is easy to sell.
- Hamburg provides a believable local network.

### Why not start with OpenAI/Gemini partnerships?

That is a later platform goal. It is not credible as the first proof point because major model providers will not integrate with a new network before it has meaningful supply.

Correct sequence:

1. Get businesses and agencies paying for agent-readable mirrors.
2. Build a corpus of structured business endpoints.
3. Add logs and policy controls.
4. Approach smaller vertical agents and AI search apps.
5. Later approach major model providers.

## Investor Concern Responses

### "Is this just `llms.txt`?"

No. `llms.txt` is one file and mostly a sitemap-like convention. GlassGate is the managed layer around it: crawling, sync, validation, Markdown/JSON mirrors, hosted endpoints, analytics, policies, and future API delivery.

### "Is this AI SEO hype?"

It should not be sold as guaranteed AI ranking. It is infrastructure that makes a website more readable, verifiable, and accessible to agents. The strongest proof is before/after extraction quality, token reduction, and crawl/access visibility.

### "Is Cloudflare already doing this?"

Cloudflare is building much of the network layer. GlassGate should not deny that. The opportunity is to be a business-facing implementation layer and agent-readable source-of-truth product, especially for agencies, SMEs, and companies that do not want to configure Cloudflare's full stack.

### "What is the venture-scale outcome?"

The venture outcome is not selling audits forever. It is becoming a trusted delivery network for structured agent access to business websites, with subscription, API, policy, and paid-access revenue.

## Final Market Verdict

GlassGate has real potential if pitched honestly:

- Strong local/hackathon conviction: 80 to 85 percent.
- Strong global venture conviction: 70 to 78 percent if the Agent Delivery Network angle is clear.
- Weak conviction if reduced to a simple `llms.txt` generator: below 50 percent.

The strongest pitch:

> AI agents are becoming the next traffic layer of the internet. GlassGate gives businesses a controlled, structured, verified endpoint for that traffic.

# GlassGate Pitch Deck Outline

## Slide 1: Title

Claim: GlassGate is the Agent Delivery Network for the web.

Supporting line:

> We turn websites into structured, verified, low-latency endpoints for AI agents.

## Slide 2: Problem

Claim: AI agents are reading a browser-shaped internet.

Proof points:

- Websites are optimized for humans and search crawlers, not agents.
- AI systems must parse noisy HTML, JavaScript, inconsistent metadata, PDFs, and stale snippets.
- Businesses have little visibility into how agents access or understand them.
- This creates hallucinated facts, missed citations, and future lost transactions.

## Slide 3: Why Now

Claim: The web access layer is being rebuilt for agents right now.

Proof points:

- YC is calling for software and machine-readable interfaces for agents.
- Cloudflare is shipping AI Crawl Control, Pay Per Crawl, Web Bot Auth, Markdown for Agents, and structured crawl outputs.
- OpenAI documents distinct crawlers and user agents.
- AI search visibility companies are raising serious funding.
- Agent commerce and identity standards are emerging.

## Slide 4: Solution

Claim: GlassGate gives each website an agent-ready source layer.

Product:

- `llms.txt`
- `llms-full.txt`
- page-level Markdown
- page-level JSON
- structured AI index
- crawler/access analytics
- policy controls

## Slide 5: Product Layers

Claim: We start with a sellable mirror product and expand into network infrastructure.

Layer 1: GlassGate Mirror

- AI-readiness audit.
- Mirror generation.
- Sync and validation.
- Reports and logs.

Layer 2: GlassGate Edge

- Agent gateway.
- Policy controls.
- Structured API.
- Authenticated or paid agent access.

## Slide 6: Architecture

Claim: GlassGate sits between the website's source content and the agent ecosystem.

Diagram:

Website/CMS -> GlassGate crawler/sync -> validation -> structured endpoints -> agents/model apps.

Endpoint examples:

- `/llms.txt`
- `/about.md`
- `/products/widget.json`
- `/ai-index.json`
- `/agent-policy`

## Slide 7: Market Wedge

Claim: Start where the pain is urgent and the sale is believable: agencies and SMEs.

Segments:

- SEO/web agencies.
- B2B SaaS.
- Ecommerce.
- Hotels/tourism/local services.
- Logistics and industrial B2B in Hamburg/EU.
- Professional services.

Why Hamburg:

- Strong local SME and agency base.
- Logistics/trade/industrial companies with complex websites.
- Credible local pilots without needing global platform partnerships first.

## Slide 8: Competition

Claim: Competitors validate the category, but leave room for a managed agent delivery product.

Matrix:

- Profound/Peec/Semrush: visibility and monitoring.
- Cloudflare: crawler control, identity, edge tooling.
- Scrunch: closest AI-optimized site delivery competitor.
- Plugins/tools: simple file generation.
- GlassGate: managed source delivery, sync, validation, policy, agency wedge, future ADN.

## Slide 9: Business Model

Claim: Start with paid AI-readiness, compound into subscriptions, then network usage.

Pricing:

- Free audit.
- Starter: EUR 79/month.
- Growth: EUR 249/month.
- Agency: EUR 799/month.
- Enterprise/API: custom.

Future:

- Usage-based agent requests.
- API access.
- Paid content/access revenue share.

## Slide 10: Roadmap

Claim: The path from hackathon MVP to platform is staged and credible.

0 to 30 days:

- URL audit.
- Generated mirrors.
- Before/after demo.

30 to 90 days:

- Scheduled sync.
- WordPress/static integrations.
- Agency dashboard.

3 to 12 months:

- Hosted endpoints.
- Agent logs.
- Policy controls.
- Vertical-agent APIs.

12+ months:

- Agent identity.
- Paid access.
- Agent Delivery Network.

## Slide 11: Risks

Claim: The risks are real, but manageable with the right entry point.

Risks:

- `llms.txt` adoption is not guaranteed.
- Google does not require special AI files.
- Cloudflare can own infrastructure.
- Scrunch is close.
- Two-sided marketplace problem.

Mitigation:

- Sell one-sided value first.
- Avoid ranking guarantees.
- Build around public, canonical content.
- Use Cloudflare as validation/infrastructure where useful.
- Win agencies and SMEs before chasing model-provider integrations.

## Slide 12: Ask

Claim: GlassGate needs pilots, agency partners, and pre-seed feedback.

Ask:

- 5 agency design partners.
- 50 pilot websites.
- Investor feedback on category, wedge, and pricing.
- Technical/product support to build the first automated mirror pipeline.

Closing line:

> Every business needed a website for Google. Every business will need an agent endpoint for AI.

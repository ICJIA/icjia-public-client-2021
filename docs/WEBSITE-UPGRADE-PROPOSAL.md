# Upgrading the ICJIA Public Website

**A proposal for leadership and the communications team.**

---

## At a Glance

We are proposing to rebuild the ICJIA public website on a newer, better-supported software foundation. The agency keeps the same content, the same web addresses, the same editor tools, and the same hosting provider. Visitors get a faster, **more accessible** site. The communications team gets a faster path from "publish" to "live." IT gets a simpler, safer operation. The rewrite runs on its own, separately from the current site, which stays live the entire time. No downtime. No content loss.

The rewrite is **accessibility-first**: every page, every feature, every update passes automated accessibility testing before it reaches the public. This is not just good practice — for a government agency in 2026, it is **the law**. This proposal treats that obligation as the central design constraint of the project, not an afterthought.

This document is written in plain language for readers who do not work with web software day-to-day. Every technical term is defined the first time it appears, and the short glossary at the end is a reference you can keep open during the meeting.

---

## Where the Website Stands Today

The current ICJIA public website went live in its current form in 2021. It is a modern, accessible, reliable site, and the team that built it has kept it in good shape. A few facts worth highlighting:

- **It passes every automated accessibility check.** Across fifty-seven audited pages, the site has zero accessibility violations. For a government agency, that is a real achievement, and it is the baseline we intend to protect.
- **It is a large reference site, not a brochure.** The site holds more than a thousand publications, nearly two hundred news posts, more than a hundred staff biographies, program pages, events, meetings, funding notices, and jobs. Thousands of individual pages in total.
- **The underlying software foundation is aging out.** The foundation the current site is built on has reached what the software industry calls "end-of-life." Its creators no longer issue security or bug fixes for it. The car analogy is apt: the website runs fine today, but the factory that makes replacement parts has closed.
- **The site's speed is capped by that aging foundation.** The team has already done the performance work that is possible inside the current system. Meaningful gains from here forward require moving to a newer foundation.

> **Foundation.** Think of a foundation as the chassis and engine that a website is built on top of. You don't see it when you visit the site, but every feature depends on it. A modern foundation gets regular updates — like a car manufacturer issuing recalls and improvements. An end-of-life foundation stops getting those updates.

This is not a rescue mission. The site works. The proposal is about making a **responsible, planned** foundation change **now**, before the aging parts start to create problems.

---

## What We Are Proposing, in One Sentence

> **Rebuild the website on a modern foundation that is designed specifically for content-heavy government sites, while preserving every page, every web address, every content workflow, and the agency's accessibility record.**

Here is what that sentence actually means, broken out:

1. **Faster for visitors.** Pages appear more quickly, especially for people on phones and on slower connections.
2. **More accessible, not less.** The site starts the rewrite from a clean accessibility record and raises the ceiling further. Accessibility is the first design constraint, not the last.
3. **Easier to maintain.** The new foundation is actively supported by a well-funded open-source team, with regular updates and a broad community.
4. **Faster to publish.** When an editor approves a post, the public site updates within minutes, automatically.
5. **Lower long-term cost.** Less vendor risk, fewer emergency patches, less reliance on "only-one-person-knows-how-this-works" specialist knowledge.

---

## What Is "The New Foundation"?

This section is the single most important one for non-technical readers. If you take nothing else away, take this: the proposal is to move the website from an old, no-longer-supported set of parts to a new, actively-supported set of parts that does the same job, faster and more reliably.

Here is what that new foundation actually is, in plain language.

### A foundation, not a product

When people build a website, they do not start by writing every single piece of software from scratch. That would be like asking a contractor to build a house by first forging their own nails. Instead, they start with a pre-built foundation that handles the routine tasks every website has to handle: rendering pages, fetching content from the CMS, managing the web address structure, generating search indexes, handling the menu and the footer, and so on. The developer then builds the ICJIA-specific parts on top of that foundation.

That foundation is what we are proposing to replace. The ICJIA-specific parts — the content, the design, the branding, the editor workflow — stay as they are.

### Who makes it, and what it is called

The foundation we are proposing to move to has a name. It is called **Nuxt** (pronounced "nuksed," rhymes with "mixed"). The name is a developer brand — like "Microsoft Word" is the developer brand for a word processor. Managers do not need to remember the name, but it will come up in technical conversations, so here is what it actually is:

- **Nuxt is a free, open-source software project.** "Open source" means the source code — the instructions that make the software work — is published publicly on the internet. Anyone can read it. Anyone can contribute fixes. There is no vendor to license it from. There is no purchase order, no contract, no per-user fee, and no renewal to negotiate.
- **It is maintained by a team of full-time engineers** at a well-funded organization called **NuxtLabs**, backed by a broader non-profit ecosystem. Security issues are patched quickly. Updates come out on a regular, predictable schedule. Documentation is extensive and actively kept up-to-date.
- **It has a very large global community.** Tens of thousands of developers use Nuxt, contribute improvements to it, and build tooling around it. This is the opposite of a niche or experimental tool.
- **It is used in production at scale** by organizations most managers will recognize. Examples include: the marketing sites of **Netflix** and **Apple**, parts of the **Louis Vuitton** web presence, **Ecosia**, several Fortune-500 engineering blogs, and many state and federal agency sites. Nuxt is mainstream infrastructure.

Managers can think of Nuxt the way they think of a specific make of truck chassis used by multiple delivery companies: the agency does not need to be in the truck-chassis business to benefit from choosing a well-supported, widely-used chassis. The alternative — continuing on an end-of-life chassis — is the avoidable risk.

### Context: what the current site runs on, for comparison

The current ICJIA website is built on a foundation called **Vue 2** (a predecessor generation of the Nuxt family) paired with a component library called **Vuetify 2** (a visual toolkit). Both of these are at end-of-life: their creators have ended regular maintenance and have asked users to migrate to newer versions. Nuxt is the natural next step because it is from the **same family** — the team does not have to learn an entirely new technology stack, just a newer, better-supported generation of it. This is a large part of why the rewrite is cheaper than it otherwise would be.

### How it is different from what we have now

Two concrete differences matter for a non-technical audience.

**1. Pages are pre-built, not assembled on demand.**

The current site works like a restaurant that cooks each meal to order as customers arrive. That is fine when there are few customers, but it means every visitor waits a little while for their page to be prepared. The new foundation works like a cafeteria: every page is pre-prepared and kept ready on the shelf, so a visitor walks in and gets their meal instantly.

The technical name for this pre-build approach is **static site generation**. It is how the fastest government and news websites on the internet operate. For a site that publishes a handful of updates per week, rather than per second, this is the right model.

**2. The first thing a visitor downloads is tiny.**

The current site, when a visitor first arrives, asks the browser to download a relatively large bundle of software before showing the first page. This is invisible on a fast office connection but becomes noticeable on a phone or on a slow public-Wi-Fi network. The new foundation sends the visitor the finished page directly, with only a small amount of supporting software. First pages appear faster on every device, and dramatically faster on slower networks.

### Why this is the obvious choice for ICJIA specifically

The ICJIA website is, at heart, a **reference publication**. It contains over a thousand research documents, nearly two hundred news posts, staff directories, program descriptions, funding notices, and meeting minutes. Content changes a handful of times per week, not per second. Visitors arrive, read, and leave. They do not sign in, do not submit forms (except for a few specific request forms), and do not interact with live data.

This is exactly the usage pattern that pre-built, statically-generated sites excel at. A live, constantly-changing application — something like a banking dashboard or a social network — would need a different foundation. ICJIA does not.

### Why a non-technical reader can trust the recommendation

Three independent reasons:

- **It is mainstream.** The foundation we are proposing is not a niche experiment. It is one of the most widely-adopted choices in the industry for exactly this category of site.
- **It is free and open.** There is no vendor to be beholden to. If the team running it ever went away, the source code is public and the community would continue it. This is the opposite of vendor lock-in.
- **It is the natural next step from what we already have.** The new foundation is in the same family of technology as the current site — just a newer generation, the way a modern sedan is the natural successor to the same manufacturer's twenty-year-old model. The team that built the current site already understands the content, the URLs, the editor workflow, and the accessibility requirements. The rewrite is a foundation swap, not a restart.

---

## Why Strapi Is the Right CMS for ICJIA

Some managers have raised a reasonable question: *is the CMS the right tool?* This section answers that question from the ground up, assuming no prior knowledge. It explains what a CMS is, what makes one CMS different from another, why the choice matters specifically for a state government agency, and why the current CMS — called Strapi — is not only adequate but genuinely the right tool for ICJIA's mission. The short answer is that once the alternatives are laid out honestly, it is hard to make a case for anything else. The rest of the section is the longer answer.

### First: What Is a CMS?

**CMS** stands for **content management system**. It is the software the communications team logs into in order to write, edit, and publish content to the public website. Think of a CMS as the newsroom's typewriter, filing cabinet, and printing press, combined into a single web application:

- It provides the **forms** editors fill out to create a news post, a staff biography, a publication record, a meeting notice, or a job listing.
- It provides a **library** that stores every piece of content the agency has ever published, along with drafts, revisions, categories, attachments, and publish dates.
- It provides **workflow tools** — draft, review, schedule, publish, unpublish — so a post is not accidentally released before it is ready.
- It provides a **delivery mechanism** that makes the finished content available to whatever system needs to display it (in this case, the public website).

Every modern website of any size has a CMS behind it. The *New York Times* has one. The State of Illinois has several. Every county and municipal government in the country has one. Without a CMS, editing a website would require a web developer for every comma change. With one, a trained editor updates the site directly.

**The question is not whether to have a CMS. The question is which CMS.** There are hundreds on the market. They differ dramatically in cost, flexibility, ease of use, and how tightly they lock the agency to a single vendor. Those differences are the subject of the rest of this section.

### Second: What Is a Headless CMS?

This is the single most important concept in the section. It explains why the current CMS is not only fine but is actively the reason this whole rewrite is feasible at scale and affordable.

**Traditional (coupled) CMS.** Picture a restaurant that owns everything under one roof: the kitchen, the dining room, the menus, the silverware, and the decor — and insists you take all of them as a package. If you ever want to change how the dining room looks, you have to fight the restaurant's opinions about the menus, the recipes, and the table layout. Leaving the restaurant means re-creating the entire operation from scratch somewhere else, because the kitchen does not work without the dining room attached. Examples of traditional, coupled systems include WordPress (in its default configuration), Drupal, and — most relevantly to this conversation — **Adobe Experience Manager** (AEM), which is what the State of Illinois uses on some of its properties.

**Headless CMS.** Now picture a commissary kitchen. It prepares and manages all the food — the content — but does not care where the food is served. One day the food goes to a dining room downtown. The next day the same food goes to a food truck. The day after that, it is delivered to a catering event. The kitchen does not need to be rebuilt for each setting. A **headless CMS** is a kitchen with no dining room attached. Its job is to manage content and **serve it, on demand, to any front end** — the public website, a mobile app, a partner portal, an API for researchers, a future redesigned site. Whatever consumes the content is separate from, and independent of, the CMS itself.

**Why this matters for ICJIA, specifically.** The entire rewrite proposal described in this document is only inexpensive and low-risk because the CMS is headless. The rewrite is a **front-end replacement** — the dining room is being rebuilt. The kitchen (the content, the structure, the editor workflow, the thousand-plus research documents) stays exactly where it is and keeps serving the new front end the same way it served the old one. There is no content migration. There is no editor retraining. There is no vendor to negotiate with. **If ICJIA were on a traditional, coupled CMS, this rewrite would cost several times more and would carry meaningful risk of content loss.** The reason this project is as small and safe as it is, is because the CMS choice made years ago was the right one.

### Third: What Is Open Source — and Why Does It Matter for Government?

**Open source** describes software whose full source code — the human-readable instructions that make the software work — is published publicly, free for anyone to read, use, modify, and redistribute. The opposite is **proprietary** (or "closed-source") software, whose inner workings are a trade secret controlled by a single vendor, accessed only through paid licenses, and usable only under the vendor's terms.

For a private company, the choice between open-source and proprietary is mostly about cost, flexibility, and strategic risk. For a **state government agency**, the stakes are structurally different and structurally higher. Several reasons:

- **Public money, public code.** The agency is a steward of taxpayer funds. Paying hundreds of thousands of dollars per year in license fees to a single private vendor — when a free, mature, widely-adopted open-source alternative exists and does the job better — is difficult to defend on public-interest grounds. Open-source software means public funds are spent on people (editors, developers, mission work), not on recurring vendor license payments.
- **No vendor capture.** Proprietary vendors can and do raise prices, change terms, discontinue products, be acquired, be sued, or go out of business. When an agency's content lives inside a proprietary system, any of these events becomes an emergency. With open-source software, the agency is not dependent on a single company's continued cooperation. The code is public; the community is distributed; there is no single point of failure.
- **Auditability and transparency.** Open-source code can be inspected, independently audited for security flaws, and reviewed for compliance with accessibility and privacy standards. Proprietary code cannot. For a public agency that may be asked — by legislators, by advocates, by journalists under FOIA — what its systems do and how, the ability to point to the code is a real accountability asset.
- **Portability.** Open-source systems generally use standard, documented data formats. Content can be moved, migrated, or duplicated. Proprietary systems often store content in formats that only their own software can read, which is a deliberate lock-in mechanism. A public agency being locked into a single vendor's proprietary format is a governance problem, not just a technical one.
- **Sovereignty.** An increasing number of U.S. federal, state, and municipal governments have adopted formal "open-source first" or "public money, public code" policies, on the reasoning above. The federal government's Office of Management and Budget has endorsed this direction. Several European countries have made it a legal default. Picking open-source CMS and framework software aligns ICJIA with a well-established, defensible direction for public-sector technology.
- **Community resilience.** Popular open-source projects are maintained by global communities of thousands of contributors. If the company behind the project disappears, the software keeps working and the community keeps maintaining it. This is not theoretical: it has happened many times, and the software almost always survives. Proprietary software, by contrast, can simply be shut down.

For ICJIA, these are not abstract principles. They are the reason the agency's current website — built on open-source software at every layer — has been stable, affordable, accessible, and under the team's own control, rather than being at the mercy of a vendor's roadmap or renewal negotiation. The rewrite proposed in this document preserves that posture deliberately.

### What Strapi Is

With the groundwork above, Strapi is easy to describe. **Strapi is the specific open-source, headless CMS the ICJIA communications team already uses.** It is where staff log in to write a news post, update a bio, publish a research document, or schedule a meeting notice. It is mature software — on its fifth major version — with hundreds of thousands of active installations worldwide, including at government agencies, universities, media organizations, and Fortune-500 companies. It has a full-time engineering team behind it, a large contributor community, and a clear, public long-term roadmap. It is free to use, forever, with no license fees, no per-user costs, and no renewal negotiations. It is headless, so the presentation layer — the public website — can be swapped, redesigned, or extended without touching content. And it is open source, so the agency is not dependent on any one company's continued existence or cooperation.

In other words, Strapi combines every one of the properties described in the three preceding subsections. It is a CMS. It is headless. It is open source. Those three properties, together, are exactly what a public agency with a research-heavy content mission needs.

### The ICJIA Communications Team Already Has Full Control

One point worth stating plainly, because it has occasionally been misunderstood: **the ICJIA communications team has full, unrestricted administrative access to Strapi.** Specifically, every member of the communications team with a Strapi account is provisioned as a **super-administrator** — the highest access level the software offers.

In concrete terms, this means the communications team can, today, without asking anyone's permission:

- Create, edit, publish, unpublish, schedule, and delete any content of any type.
- Create and manage new user accounts for additional staff.
- Assign and change roles and permissions for other users.
- Create new content types and new fields on existing content types.
- Upload, organize, and manage every asset in the media library.
- View and export content in standard formats.
- Configure site-wide settings the CMS exposes to administrators.

There is no hidden tier of access being withheld from the communications team. There is no "developer-only" console sitting behind a curtain. The communications department is, in Strapi's own terminology, at the top of the permission hierarchy. If the perception has been that CMS access is the limiting factor on what the team can do, that perception is incorrect — and this document is the place to correct it on the record.

What the developer does, separately from editing, is maintain the **code of the public website** (the front end that renders Strapi's content to visitors) and the **infrastructure** that runs Strapi itself (the server, the database, the backups). Those are different concerns from editorial access, and they are distinct jobs by design. The editorial authority — every decision about what content exists, what it says, when it is published, and who can edit it — belongs to the communications team, and the tooling reflects that.

This is not a property of Strapi uniquely; any competent CMS supports super-administrator roles. But it is worth underlining in this document because it means a common objection to the current setup — *"we don't have enough control over our own content"* — is not actually true at the CMS level. The control is already there. If there are specific editorial workflows the team wants that are not currently available, the right conversation is about those specific workflows, not about replacing the CMS.

### The Honest Comparison: Strapi vs. AEM

When managers worry about "the CMS," the implicit comparison is usually to a proprietary enterprise CMS — most often **Adobe Experience Manager (AEM)**, which is what the State of Illinois uses on some of its properties. This comparison is worth making openly, because the contrast is stark.

| | **Strapi (current)** | **Adobe Experience Manager (AEM)** |
|---|---|---|
| **License cost** | Free. Forever. | Six to seven figures per year, per environment. Enterprise licensing. |
| **Vendor lock-in** | None. Open source. Content is portable. | Severe. Content, templates, and workflows are tied to Adobe's ecosystem. Leaving AEM is a multi-year project. |
| **Editor experience** | Modern, fast, web-based. Editors typically become productive in a day. | Widely reported by users across state and federal government as slow, confusing, and frustrating. "Everybody using it hates it" is not an exaggeration — it is the consensus. |
| **Developer experience** | Documented, mainstream, easy to hire for. | Specialist-only. AEM developers command premium rates and are hard to find. |
| **Headless architecture** | Headless by design. Works with any front end. | AEM has a headless mode, but the product is fundamentally oriented around its own full-stack rendering. |
| **Flexibility to change the public site** | Easy. The front end is independent. This entire proposal depends on that flexibility. | Hard. Template changes often require Adobe consultants or partner agencies. |
| **Time to publish a new content type** | Hours, by the existing team. | Weeks or months, often via a vendor statement of work. |
| **Infrastructure** | Runs on a small, inexpensive server. | Requires Adobe-certified infrastructure; operational cost is a standing line item. |
| **Fit for ICJIA's size and mission** | Purpose-fit for content-heavy reference sites at agency scale. | Designed for global enterprises with large marketing teams. Overbuilt for a research agency. |

Managers who are used to hearing "enterprise software = safer choice" should look carefully at this table. In the CMS market, that reflex does not hold. AEM is not a safer choice for ICJIA. It is a **more expensive**, **more restrictive**, **harder to hire for**, and **operationally harder** choice — and the people who use it at other Illinois agencies will say so candidly if asked. The reason AEM persists in some agencies is not that it is better. It is that escaping it is a project of its own.

ICJIA is in the fortunate position of already being on the better-fit CMS. Staying on Strapi is not a compromise — it is the recommendation.

### Why Strapi Is Specifically Right for ICJIA

Several reasons, each independent:

- **Research-agency content is structured content.** ICJIA publishes research documents, news, bios, events, meetings, grants, and jobs — each with defined fields, categories, dates, attachments, and relationships. Strapi is designed around exactly this kind of structured content. It is built for agencies like ICJIA. AEM, by contrast, is designed around marketing campaigns and brand storytelling — the wrong mental model for a research agency.
- **No editor retraining.** The communications team already knows Strapi. The rewrite does not change the editor's interface in any way. A CMS swap would invalidate years of accumulated editor knowledge.
- **No content migration.** Strapi already holds over a thousand publications, nearly two hundred news posts, and more than a hundred bios. Migrating that content to a different CMS would be a project of comparable size to this rewrite — and would introduce real risk of data loss or corruption.
- **Predictable, zero cost.** No license fees in the budget, no renewal negotiations, no per-seat pricing as the communications team grows or shrinks.
- **Public-interest alignment.** A state agency running on free, open, public-interest software (rather than funnelling public funds to a single private vendor) is a choice that holds up well under scrutiny.
- **Fit with the rewrite.** The rewrite specifically works because the CMS is headless. Strapi is the reason Phase 2 of this proposal is cheap; a closed, full-stack CMS would make the same work dramatically more expensive.

### A Word on Strapi 5

The current industry-supported release of Strapi is **version 5** — a major upgrade that landed in late 2024, with long-term maintenance commitments from the Strapi team and an active migration path from version 4. Strapi 5 brings stricter content modeling, better performance, cleaner APIs for headless delivery, improved draft-and-publish workflows, and updated accessibility in the editor interface itself. For ICJIA, this means the CMS is **not at end-of-life** the way the public-site foundation is. Strapi is a forward-looking, healthy, actively-invested-in piece of software. Keeping it — and keeping up with it — is the low-risk choice.

### The Bottom Line for Leadership

If the conversation in the room is *"should we swap the CMS?"*, the answer is **no**, and for concrete, defensible reasons:

1. Strapi is free, open-source, and headless — the three properties that most matter for a public agency.
2. Strapi is a **better fit** for ICJIA's research-agency mission than the proprietary alternatives the state uses elsewhere.
3. Switching the CMS is a separate, expensive, disruptive project that would provide no benefit over what ICJIA already has.
4. The rewrite described in this proposal **works because Strapi is headless**. Changing the CMS would undo the one property that makes this whole plan feasible.

The concern is understood, and it is worth airing. But once aired, the answer is clear: Strapi stays, and it stays because it is the right tool.

---

## Accessibility Is the Law, and the First Constraint of This Project

This section is important enough to stand on its own. Accessibility is not one feature among many on this project. It is the first design constraint, the first test every update has to pass, and the reason this rewrite is worth doing **independent of any other benefit**.

### The legal picture, in plain English

Under federal law — the **Americans with Disabilities Act** (ADA) and **Section 508 of the Rehabilitation Act** — government agencies are required to make their digital services accessible to people with disabilities. In April 2024, the U.S. Department of Justice finalized a rule under **Title II of the ADA** that specifically requires state and local government websites and mobile apps to conform to **WCAG 2.1 Level AA** (the global standard for web accessibility). Compliance deadlines for state and local governments are in effect during 2026–2027, and enforcement is active.

At the state level, Illinois has its own **Information Technology Accessibility Act** (IITAA), which applies to Illinois state agencies and requires that public-facing websites be accessible. ICJIA is an Illinois state agency. Both the federal rule and the state statute apply to this website.

In practical terms: **an inaccessible ICJIA website is not a risk; it is a violation.** This is no longer the "nice to have" it may once have been framed as. It is a baseline legal obligation, and complaints — from advocacy groups, from individual users, or from auditors — can and do result in formal findings.

### Where ICJIA stands today

The current site has done the work. Fifty-seven audited pages have zero automated accessibility violations. The team has put real engineering effort into remediation, including full axe-core clean bills across all content types, plus extensive manual screen-reader and keyboard testing. This record is a real asset, and protecting it is one of the central goals of this rewrite.

But automated tests catch only a portion of what the law requires. Accessibility is also about color contrast at 200 % zoom, keyboard navigation, screen-reader labeling, form error handling, heading structure, and a dozen other concerns that require both automated checks and considered human design. The current foundation limits how far we can push on some of these concerns, because Vuetify (the component library the current site uses) has known accessibility gaps that the team has had to work around rather than fix at the source.

### What changes on the new foundation

Three concrete things change:

**1. Accessibility is built in, not bolted on.**
The component library we are proposing for the new site is designed from the ground up with accessibility as a first-class requirement. Interactive elements — menus, modals, tabs, form inputs, search — come with correct keyboard support, screen-reader labeling, and focus management **by default**. The team no longer has to work around the foundation to achieve compliance; the foundation is already aligned with WCAG 2.1 Level AA out of the box.

**2. Accessibility tests block every deploy.**
Every time content is updated or code changes, the automated accessibility test suite runs. A build that fails accessibility **cannot deploy to the public**. This is not a policy that depends on human diligence; it is enforced by the build system itself. This means the zero-violation record can be maintained across years of content updates without slippage.

**3. Manual testing becomes cheaper and more frequent.**
Because the new foundation produces pre-built, static pages, they can be tested with screen readers, keyboard-only navigation, and color-contrast auditors in exactly the state visitors see them. This removes a class of false positives and missed negatives that live-rendered sites produce. The cost of running a full manual accessibility pass drops meaningfully, which means the agency can run them more often.

### Why this approach is sustainable

The federal rule, the state statute, and the underlying WCAG standard are not static. WCAG 2.2 is already published. WCAG 3.0 is in development. Over the life of the new site, accessibility standards **will** continue to evolve. The new foundation is actively maintained in step with these standards; its component library tracks WCAG updates; its testing tools are updated by their respective communities.

The current foundation has stopped receiving those updates. Staying on it means falling further behind the evolving legal standard every quarter.

### The bottom line for leadership

Accessibility is both a **legal requirement** and a **mission alignment** for ICJIA. The agency serves a public that includes people with disabilities, and the public it serves is entitled — by law — to equal digital access. This rewrite treats that obligation as non-negotiable and enforces it with both design choices and the build system itself. Doing the rewrite protects the agency from the legal exposure of an aging, harder-to-maintain codebase, and raises the accessibility ceiling beyond where the current foundation can reach.

---

## A Short Vocabulary

Before we go further, here are the terms that will come up in the rest of the document. Each is defined once.

- **Foundation** — the reusable software chassis a website is built on. Every site has one.
- **Nuxt** — the name of the specific, open-source foundation we are proposing to move to. Pronounced "nuksed." Developers around the world use it to build content-heavy websites. It is free.
- **Vue 2 / Vuetify 2** — the names of the current foundation the ICJIA site runs on. Both have reached end-of-life (no more security patches). Nuxt is the natural successor generation.
- **Netlify** — the web hosting company ICJIA already uses. It is the "loading dock" that delivers the finished website to visitors. It stays in place in this proposal — no vendor change.
- **Domain** — the public web address. `icjia.illinois.gov` is the domain. It does not change.
- **Open source** — a style of software whose source code is published publicly, maintained by a community, and free to use. The opposite of a closed, proprietary product. Both Nuxt and the current foundation are open source.
- **Static site generation** (**SSG**) — pre-building every page of a website **ahead of time**, so visitors receive already-finished pages instantly.
- **CMS** (**content management system**) — the editor interface where the communications team writes and publishes content. The current CMS (a separate piece of software called **Strapi**) stays **exactly as it is**.
- **Headless CMS** — a CMS that manages content but does not control how it is displayed. The public website is a separate, independent front end. Strapi is a headless CMS; this is why the rewrite is feasible.
- **Strapi** — the specific open-source, headless CMS the ICJIA communications team already uses. Free, mature (version 5), used by agencies and enterprises worldwide. The ICJIA comms team already has super-administrator access.
- **Super-administrator** — the highest permission level in Strapi. Every member of the ICJIA communications team with a Strapi account has this level. There is no hidden tier of access.
- **AEM (Adobe Experience Manager)** — a proprietary, closed-source enterprise CMS used on some State of Illinois properties. Expensive, inflexible, widely disliked by its users. Mentioned here because it is the implicit comparison when managers ask "should we change the CMS?" — and the comparison favors Strapi decisively.
- **WCAG 2.1 Level AA** — the global standard for web accessibility. The federal rule requires state and local government websites to meet this standard.
- **ADA Title II** — the section of the Americans with Disabilities Act that applies to state and local governments. The 2024 federal rule extends it explicitly to websites and apps.
- **IITAA** — the Illinois Information Technology Accessibility Act, the state-level accessibility law for Illinois state agencies.
- **Accessibility audit** — an automated review that checks whether a website meets WCAG standards for users with disabilities, including users of screen readers.
- **Lighthouse** — Google's standard scorecard for websites. It rates performance, accessibility, best practices, and search-engine friendliness on a scale of 0–100.
- **Single-page application** (**SPA**) — the current architecture of the ICJIA site. The new site is not an SPA.
- **Deploy** — the automated act of putting a new version of the site onto the public internet.

---

## Why Now

Three reasons, each independent:

**1. The foundation has reached end-of-life.**
The foundation the current site runs on is no longer receiving security patches or bug fixes from its maintainers. A site in this situation does not break overnight, but the longer it sits there, the higher the cost of any eventual problem. Doing the planned rewrite now is the difference between routine maintenance and emergency repair.

**2. The legal accessibility landscape is tightening.**
The 2024 federal rule and the Illinois state statute both apply to this website, and compliance deadlines are active. The current foundation has accessibility ceilings that the new foundation does not. Rewriting now is the cleanest way to stay ahead of the standard as it evolves.

**3. There is a performance ceiling we cannot push through.**
The team has already pulled every reasonable performance lever inside the current system. The Lighthouse score cannot meaningfully rise from here without changing the foundation. The team's own engineering notes acknowledge this openly.

**4. The rewrite is much cheaper now than it will be later.**
The new foundation is mature and its patterns for content-heavy government sites are well-established. The team that will do the rewrite already knows the content model, the routing, and the accessibility requirements because they built the current site. If we wait another two years, these favorable conditions erode.

---

## What Visitors Will Notice

Visitors do not care about foundations. They care about the experience. This is what changes for them:

- **Pages appear faster.** Especially on phones and slower connections.
- **Search feels instant.** The new site builds its search index ahead of time.
- **Accessibility is preserved and raised.** The baseline is the current zero-violation record; the ceiling is higher.
- **Nothing obvious changes at the content level.** Same pages. Same web addresses. Same titles. Same links in search engines. A visitor arriving from Google or from a bookmarked URL lands on exactly the same address as today.

---

## What Changes for the Communications Team

This is the section that most directly affects the editors who use the site every day.

- **The CMS stays exactly the same.** Editors log in to the same tool they use today. There is no retraining. There is no migration of editor accounts. The editor experience is **unchanged**.
- **Publishing is faster.** When an editor approves a post in the CMS, the live site updates itself, automatically, within minutes. Today's "request a rebuild, wait for deploy, email the webmaster" workflow goes away.
- **Preview is more reliable.** Draft content can be previewed on a private staging site that looks identical to the live site, so what you see is genuinely what visitors will see.
- **Fewer "the page looks broken" calls.** The new foundation is stricter about catching content issues — oversized images, bad links, broken embeds — at editing time, before they reach the public.
- **Content governance improves.** Publishing, unpublishing, and scheduling become cleaner and more predictable.

None of this requires the communications team to change how they write, research, or review content.

---

## What Changes for IT and Operations

- **Same hosting provider.** The site stays on **Netlify**, which is the company the current ICJIA website is already hosted with.
  > **Netlify** is a web hosting company — specifically, a kind of hosting service designed for the type of pre-built static websites this proposal recommends. Think of Netlify as the specialized "loading dock and delivery fleet" that takes the finished website and makes it available to the public internet, instantly, from servers around the world. ICJIA already has a Netlify contract. No vendor change. No migration of the hosting relationship. No new purchasing paperwork.
- **Same domain.** `icjia.illinois.gov` stays `icjia.illinois.gov`. A **domain** is the public web address the site lives at. It is a separate asset from the hosting provider and the foundation — changing the underlying software does not change the address.
- **Simpler deploys.** A successful build deploys itself automatically through Netlify. A failing build never reaches the public — Netlify simply does not replace the live site with a broken one.
- **Smaller on-call surface.** The new site has fewer moving parts at the moment a visitor requests a page, because the pages are already built. Fewer moving parts means fewer things that can break at 2 a.m.
- **Easier to hire for.** Nuxt is among the most widely-taught modern web technologies. The current foundation (Vue 2 / Vuetify 2) requires specialists who are increasingly hard to find.

---

## What About the Design? If We Want Visual Changes, How Does That Work?

The default scope of this project is **visual parity with the current site**. That is the safest, fastest, lowest-risk path, and it is what this proposal recommends.

However, the agency may reasonably want to refresh the look of the site at the same time — new color palette, new typography, updated branding, refreshed homepage layout, clearer navigation. That is a legitimate, common conversation during a foundation change. This section explains how it would work, and **when the decision has to be made**.

### The three possible levels of visual change

| Level | What it means | Effect on the project |
|---|---|---|
| **Parity (default)** | The new site looks identical to the current site. Same colors, type, layout, header, footer, cards. | No impact on timeline or risk. This is the baseline. |
| **Light refresh** | Same overall structure, but updated colors, typography, spacing, and card styles. The site still feels like "the same site, polished." | Adds a focused design phase at the **beginning** of the project. The team designs once, builds once. |
| **Full redesign** | New information architecture, new homepage, new navigation, new page templates, new interaction patterns. A visibly "new" site. | Adds a substantial design-and-review phase at the **beginning**, plus additional parity and accessibility testing. Still deliverable within a planned schedule, but a larger commitment. |

### The critical rule: design decisions happen at the **start**, not the end

This is the single most important point in this section, and it is the one that tends to go wrong on projects of this kind if it is not said out loud:

> **Visual and design changes must be decided and approved at the start of the project, not added at the end.**

Here is why. Every page template, every component (buttons, cards, forms, menus, headings, publication lists, bio cards, news cards, search results, etc.) is **built to a specific design**. Once those components exist, the site is wired together, accessibility-tested, and integrated with the CMS. Changing the design after those components exist means going back and rebuilding every one of them, re-testing accessibility on every one of them, and re-verifying content parity on every one of them.

In practical terms:
- **Design changes requested in Phase 1 or early Phase 2** cost hours.
- **Design changes requested in Phase 3** cost weeks and a re-run of accessibility and parity testing.
- **Design changes requested in Phase 4 or after launch** cost a second project of roughly the same scope as the rewrite itself.

This is not a quirk of this project — it is true of every software project, in every industry. The cost of change rises sharply as the project progresses. The same rule applies to construction, manufacturing, book publishing, and film.

### What this means in practice

If the agency wants a refresh or redesign, the decision needs to be made **before Phase 2 begins**. The early project phases include an explicit design track:

1. **Define the scope of visual change.** Parity, refresh, or full redesign?
2. **Produce design mockups** of the key page templates — homepage, content page, publication page, news article, research hub, search results.
3. **Review and approve those mockups** with leadership, the communications team, and any brand stakeholders.
4. **Lock the design.** From this point, the team builds to the approved designs.

Everything that happens in Phase 2 onward is built to that locked design. Small tweaks are cheap and normal. Large direction changes after the lock date are either deferred to a future project or accepted as a scope expansion with timeline and cost impact.

### Recommendation

Unless the agency has a specific reason to refresh or redesign — a rebrand, a usability complaint pattern, a new strategic direction — the recommendation is **parity for this project**. The rewrite is about the foundation, which is where the urgent legal, accessibility, and maintainability concerns live. A future, separate project can refresh the visual design at the agency's chosen pace, on top of the already-modernized foundation.

But if there is appetite for visual change, it is genuinely cheaper to do it now, during the rewrite, than as a separate project later — **as long as the decision is made at the beginning**.

---

## Risk and How We Handle It

Managers calm down fastest when risk is laid out honestly alongside its mitigation. Here is the honest list.

| Risk | Mitigation |
|---|---|
| **Content or web addresses get lost in the rewrite.** | Every page, every URL, every content type is audited against the existing site before launch. A redirect safety net stays in place for six months after launch to catch anything missed. |
| **The accessibility record slips.** | Automated accessibility tests run on every single build. A build that fails accessibility cannot reach the public. The zero-violation record is protected by the build system itself, not by human diligence. |
| **Design changes are requested late in the project.** | The design track is front-loaded. Scope is locked at the end of the design phase. Late changes are either deferred to a future project or explicitly accepted as a scope expansion with timeline impact. |
| **The rewrite drags on and nothing visible happens for months.** | The old site stays live the entire time. The new site goes live only when it passes every parity and accessibility check. There is no "down period." Leadership and communications can review the new site on a private staging URL at every phase. |
| **The team cannot support both sites at once.** | The current site is already in maintenance-only mode. The rewrite runs in a separate codebase, so development of the new site does not interrupt routine patching of the old one. |
| **Something unexpected comes up during the rewrite.** | The current site continues to serve the public. Whatever is uncovered can be addressed on the new site, on a schedule the agency chooses, without any visible impact. |

There is no category of risk in this project that results in "the public website is unavailable." That outcome is architecturally prevented.

---

## How the Work Unfolds

The rewrite proceeds in four phases. These are described in plain English, without calendar commitments, because the right cadence depends on leadership's priorities and the rhythm of the communications team.

### Phase 1 — Preparation and Design

**What happens.** The new site's foundation is set up, the CMS connection is wired in, and — critically — the design scope is decided (parity, refresh, or full redesign), mockups are produced for the key page templates, and the design is reviewed and approved. A small handful of page templates (homepage, basic content page, news listing) are built as a working proof.

**What the agency sees.** Design mockups to review and approve. A private preview link showing a skeletal version of the new site rendering real ICJIA content. It is unfinished but proves the foundation works and the approved design is achievable.

**Decision gate.** Design is locked at the end of this phase. Subsequent changes are scoped as either small adjustments or deferred to future work.

### Phase 2 — Build

**What happens.** The rest of the page templates are filled in — publications, staff biographies, research hub, events, meetings, grants, jobs, the search experience, RSS feeds, the sitemap. Automated accessibility tests run continuously.

**What the agency sees.** The private preview grows. Each week, more of the site is complete and available for leadership and communications to click through.

### Phase 3 — Parity Migration

**What happens.** The team walks every existing URL, every content type, every edge case, and verifies the new site renders them the same way (or better). Accessibility is tested across every template, with both automated tools and manual screen-reader and keyboard checks. Any visual or content mismatches are caught and fixed. The redirect safety net is built.

**What the agency sees.** A staging URL where the new site can be reviewed side-by-side with the current public site. Leadership and the communications team are invited to kick the tires and file feedback. Feedback is triaged and addressed before launch.

### Phase 4 — Launch

**What happens.** At a quiet moment chosen with leadership, the domain is pointed at the new site. The redirect safety net stays on for six months. The team monitors for any issue in the first several days.

**What the agency sees.** The public site looks the same (or, if a refresh was approved in Phase 1, looks refreshed), at the same address. It is faster, more accessible, and easier to publish to. The old site is archived, not destroyed, so the previous version remains available for audit.

> **A note on timing.** Content sites of similar size and pattern, built on the proposed foundation, have been shipped in under a quarter by small teams. The rewrite is not a multi-year undertaking. The right pace for ICJIA specifically depends on leadership's priorities and the scope of visual change decided in Phase 1.

---

## What This Proposal Does **Not** Ask For

Because this kind of project often picks up scope along the way, it is worth being explicit about what is **out of scope** by default. Any of these items can be brought in if leadership chooses, but they are not included automatically:

- **Redesign.** By default, visual parity with the current site is a hard constraint. A refresh or redesign can be added **if approved in Phase 1**; it is not added silently later.
- **Change of CMS.** The communications team keeps the exact same editor tool.
- **Change of hosting provider.** Same contract.
- **Content rewrite.** Content migrates as-is. Editorial decisions about content are not part of this proposal.
- **New hiring.** The existing team knows the content model, routes, and accessibility requirements already.
- **New ongoing vendor contract.** The new foundation is free and open-source.

---

## What Leadership Is Being Asked To Do

A short, specific list:

1. **Approve the rewrite in principle.** A go-ahead to begin Phase 1.
2. **Decide the design scope in Phase 1.** Parity, refresh, or full redesign. This is a one-time decision, made at the start, and locked at the end of Phase 1.
3. **Approve a private staging URL** so that leadership and the communications team can review the new site at every phase, before anything is public.
4. **Approve the launch cutover** at the end of Phase 4, after the full parity and accessibility checklist has been signed off.

There is nothing in this proposal that asks leadership to make irreversible decisions. Every phase produces a reviewable artifact. Every decision can be paused, reconsidered, or sequenced differently — with the single caveat that design decisions belong at the beginning, not the end.

---

## In Closing

ICJIA already runs one of the more accessible and well-maintained agency websites in the state. The proposal on the table is not a pivot or a reinvention. It is a responsible, planned replacement of the underlying foundation, carried out by the same team that built the current site, on a schedule that leadership chooses, with the current site continuing to serve the public the entire time.

The rewrite preserves what is good about the current site — content, addresses, accessibility, brand — and fixes three things that cannot be fixed from inside the current system: the aging foundation itself, the accessibility ceiling imposed by that foundation, and the growing legal exposure of staying on a no-longer-supported platform in an environment of tightening accessibility law.

It is the right move, at the right time, with the right team in place to carry it out calmly.

---

## Glossary

- **Foundation** — the reusable software chassis a website is built on. Every site has one. This proposal is about replacing ours with a newer, actively-supported one.
- **Nuxt** — the specific open-source foundation we propose to move to. Free, mainstream, actively maintained. Pronounced "nuksed."
- **Vue 2 / Vuetify 2** — the current foundation. Both are end-of-life. Nuxt is the successor generation, from the same technology family.
- **Netlify** — the existing web hosting provider. Stays in place. No vendor change in this proposal.
- **Strapi** — the current CMS (editor interface). Open source, free, headless, on its stable fifth major version. The ICJIA communications team already has super-administrator access. Stays in place. No editor retraining.
- **Headless CMS** — a CMS that manages content independently of how it is displayed. The reason this rewrite is cheap and low-risk.
- **Open source** — software whose source code is public, free to use, and not controlled by a single vendor. Especially important for public agencies because it avoids vendor lock-in, respects public funds, and supports transparency.
- **AEM (Adobe Experience Manager)** — a proprietary enterprise CMS used on some State of Illinois properties. Expensive, inflexible, and unpopular with its users. Not recommended, and not proposed, for ICJIA.
- **Domain** — the public web address of the site (`icjia.illinois.gov`). Does not change.
- **Open source** — software whose source code is public, maintained by a community, and free to use. No license fees, no vendor lock-in.
- **Static site generation (SSG)** — pre-building every page ahead of time so visitors get instant delivery. The single biggest reason the new site will feel faster.
- **CMS (content management system)** — the editor interface for the communications team. Unchanged in this proposal.
- **WCAG 2.1 Level AA** — the global accessibility standard. Federal rule requires state and local government sites to meet this level.
- **ADA Title II** — the section of the Americans with Disabilities Act that applies to state and local governments, extended to websites and apps by a 2024 federal rule.
- **IITAA** — the Illinois Information Technology Accessibility Act, the state accessibility law for Illinois agencies.
- **Accessibility audit** — an automated check of whether the site meets WCAG standards.
- **Lighthouse** — Google's scorecard for performance, accessibility, best practices, and search-engine friendliness.
- **Single-page application (SPA)** — the current architecture. The new site is not an SPA.
- **Deploy** — the automated act of putting a new version of the site onto the public internet.
- **Parity** — the explicit commitment that every page, URL, and content item on the new site matches the current site.
- **Redirect safety net** — a temporary catch-all that forwards any missed URL to the right new page, in place for six months after launch.
- **Design lock** — the point at the end of Phase 1 after which the visual design of the new site is frozen. Changes after this point are scoped as future work.

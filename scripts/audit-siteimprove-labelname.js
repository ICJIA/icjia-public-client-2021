/**
 * Targeted axe-core audit for SiteImprove sia-r14 "Visible label and accessible name do not match"
 *
 * Combined sample: the 6 pages flagged on 2026-04-16 plus the 43 unique paths flagged on
 * 2026-05-05. The 2026-05-05 list spans every page type on the site (about, grants/funding NOFOs,
 * grants/programs, news, researchhub articles, researchhub landing) — confirming the rule fires on
 * the shared `<nav aria-labelledby>` landmark structure rendered by the global app shell, not on
 * any per-page content. See docs/SITEIMPROVE-FALSE-POSITIVES.md row #1 for the rationale.
 */
const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");

const BASE_URL = "http://localhost:8080";

const PAGES = [
  // 2026-04-16 batch
  { url: "/about/", name: "About (2 occ, 2026-04-16)" },
  { url: "/about/privacy/", name: "Privacy (2 occ, 2026-04-16)" },
  { url: "/researchhub/articles/comprehensive-legal-services-for-victims-of-crime/", name: "Comp legal svcs (2026-04-16 + 2026-05-05)" },
  { url: "/researchhub/articles/the-victim-offender-overlap-examining-the-relationship-between-victimization-and-offending/", name: "Victim-offender overlap (2026-04-16)" },
  { url: "/researchhub/articles/firearm-prohibitors-and-records-improvement-task-force-2023-report/", name: "Firearm prohibitors (2026-04-16)" },
  { url: "/researchhub/articles/what-s-next-for-infonet-how-a-statewide-case-management-system-is-shaping-responses-to-illinois-victims/", name: "InfoNet next (2026-04-16)" },

  // 2026-05-05 batch — about pages
  { url: "/about/about-the-authority/", name: "About the Authority (2026-05-05)" },
  { url: "/about/foia/", name: "FOIA (3 occ, 2026-05-05)" },

  // 2026-05-05 batch — grants/funding NOFOs
  { url: "/grants/funding/2021-cbvip-sfy22/", name: "CBVIP SFY22 (2026-05-05)" },
  { url: "/grants/funding/2021-emergency-pilot/", name: "Emergency Pilot (2026-05-05)" },
  { url: "/grants/funding/2021-vcric/", name: "VCRIC (2026-05-05)" },
  { url: "/grants/funding/albany-park-irving-park-vp-nofo-3048-1222/", name: "Albany/Irving Park VP NOFO (2026-05-05)" },
  { url: "/grants/funding/ari-ttad-nofo-2115-0426/", name: "ARI TTAD NOFO (2026-05-05)" },
  { url: "/grants/funding/death-penalty-abolition-fund-services-to-assist-chicago-families/", name: "Death Penalty Abolition (2026-05-05)" },
  { url: "/grants/funding/edward-byrne-justice-assistance-grant-comprehensive-law-enforcement-response-to-violent-crime-category-1-violent-crime-prosecution-program-nofo-2094-2864/", name: "Byrne Cat 1 NOFO (2026-05-05)" },
  { url: "/grants/funding/edward-byrne-justice-assistance-grant-comprehensive-law-enforcement-response-to-violent-crime-category-2-multijurisdictional-violent-crime-law-enforcement-program-nofo-2094-2891/", name: "Byrne Cat 2 NOFO (2026-05-05)" },
  { url: "/grants/funding/lead-entity-underserved-areas-and-victim-groups/", name: "Lead Entity (2026-05-05)" },
  { url: "/grants/funding/legal-assistance-services-for-victims-of-crime-program-nofo-1745-0423/", name: "Legal Assistance Svcs (2026-05-05)" },
  { url: "/grants/funding/r3-nofo-service-delivery-nofo-2378-030124/", name: "R3 Service Delivery (2026-05-05)" },
  { url: "/grants/funding/r3-youth-development-violence-prevention-nofo-2378-010626-2/", name: "R3 Youth Development (2026-05-05)" },
  { url: "/grants/funding/sfs-planning-nofo-2116-2612/", name: "SFS Planning NOFO (3 occ, 2026-05-05)" },
  { url: "/grants/funding/vawa-le-services-for-underserved-areas-and-victim-groups-nofo-1744-0331/", name: "VAWA LE Underserved (2026-05-05)" },
  { url: "/grants/funding/voca-casa-nofo-1745-10233/", name: "VOCA CASA NOFO (2 occ, 2026-05-05)" },
  { url: "/grants/funding/voca-law-enforcement-prosecution-based-nofo-1745-10232/", name: "VOCA LE/Pros NOFO (2 occ, 2026-05-05)" },
  { url: "/grants/funding/voca-services-for-underserved-victims-of-violent-crime-nofo-1745-10231/", name: "VOCA Underserved Victims NOFO (3 occ, 2026-05-05)" },
  { url: "/grants/funding/voca-trc-nofo-1745-0623/", name: "VOCA TRC NOFO (2026-05-05)" },

  // 2026-05-05 batch — grants/programs
  { url: "/grants/programs/", name: "Funded Programs (2026-05-05)" },
  { url: "/grants/programs/2015-07-20-edward-byrne-memorial-justice-assistance-grant-program/", name: "Byrne JAG Program (2026-05-05)" },

  // 2026-05-05 batch — news
  { url: "/news/live-event-10-9-icjia-statewide-violence-prevention-plan-putting-the-plan-into-practice/", name: "Live Event 10/9 (2 occ, 2026-05-05)" },
  { url: "/news/watch-second-chances-navigating-reentry-and-the-journey-beyond/", name: "Watch: Second Chances (2026-05-05)" },

  // 2026-05-05 batch — researchhub landing + articles
  { url: "/researchhub/dicra/", name: "DICRA hub (3 occ, 2026-05-05)" },
  { url: "/researchhub/articles/2022-safe-from-the-start-process-evaluation", name: "2022 SFS Process Eval (2026-05-05)" },
  { url: "/researchhub/articles/adapting-work-conditions-during-the-covid-19-pandemic-a-survey-of-illinois-mental-health-court-staff/", name: "Adapting Work Conditions (2026-05-05)" },
  { url: "/researchhub/articles/addressing-opioid-use-disorders-in-corrections-a-survey-of-illinois-jails/", name: "Addressing Opioid (2026-05-05)" },
  { url: "/researchhub/articles/an-overview-of-problem-solving-courts-and-implications-for-practice/", name: "Problem-Solving Courts (8 occ, 2026-05-05)" },
  { url: "/researchhub/articles/domestic-violence-trends-in-illinois-victimization-characteristics-help-seeking-and-service-utilization", name: "DV Trends in Illinois (2026-05-05)" },
  { url: "/researchhub/articles/effective-strategies-in-community-supervision-core-correctional-practices-and-motivational-interviewing/", name: "Effective Strategies (2026-05-05)" },
  { url: "/researchhub/articles/exploring-effective-post-opioid-overdose-reversal-responses-for-law-enforcement-and-other-first-responders", name: "Post-Opioid Overdose (2026-05-05)" },
  { url: "/researchhub/articles/overdose-fatality-review-teams-literature-review", name: "Overdose Fatality Review (2026-05-05)" },
  { url: "/researchhub/articles/programs-and-practices-to-prevent-school-violence-and-improve-school-safety", name: "Prevent School Violence (2026-05-05)" },
  { url: "/researchhub/articles/protecting-participants-of-social-science-research/", name: "Protecting Participants (2026-05-05)" },
  { url: "/researchhub/articles/rethinking-law-enforcement-s-role-on-drugs-community-drug-intervention-and-diversion-efforts/", name: "Rethinking Law Enforcement (2026-05-05)" },
  { url: "/researchhub/articles/the-2021-safe-t-act-icjia-roles-and-responsibilities", name: "2021 SAFE-T Act (2 occ, 2026-05-05)" },
  { url: "/researchhub/articles/the-cost-of-justice-the-impact-of-criminal-justice-financial-obligations-on-individuals-and-families/", name: "Cost of Justice (2 occ, 2026-05-05)" },
  { url: "/researchhub/articles/the-impact-of-employment-restriction-laws-on-illinois-convicted-felons/", name: "Employment Restriction (2 occ, 2026-05-05)" },
  { url: "/researchhub/articles/understanding-intimate-partner-violence-definitions-and-risk-factors", name: "IPV Definitions (2 occ, 2026-05-05)" },
  { url: "/researchhub/articles/youth-development-an-overview-of-related-factors-and-interventions", name: "Youth Development (2026-05-05)" },
];

async function run() {
  console.log("Targeted axe-core audit: sia-r14 label in name\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let totalViolations = 0;
  let cleanPages = 0;

  for (const pageInfo of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      await page.goto(`${BASE_URL}${pageInfo.url}`, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await new Promise((r) => setTimeout(r, 4000));

      const results = await new AxePuppeteer(page)
        .options({
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
        })
        .analyze();

      if (results.violations.length === 0) {
        console.log(`  CLEAN  ${pageInfo.name}`);
        cleanPages++;
      } else {
        console.log(`  ${results.violations.length} violation(s)  ${pageInfo.name}`);
        results.violations.forEach((v) => {
          const nodes = v.nodes.length;
          console.log(`         [${v.impact}] ${v.id}: ${v.help} (${nodes} element${nodes > 1 ? "s" : ""})`);
          v.nodes.slice(0, 3).forEach((n) => {
            const html = n.html.length > 120 ? n.html.substring(0, 120) + "..." : n.html;
            console.log(`           -> ${html}`);
          });
          if (nodes > 3) console.log(`           ... and ${nodes - 3} more`);
        });
        totalViolations += results.violations.length;
      }
    } catch (err) {
      console.log(`  ERROR  ${pageInfo.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\n--- Summary ---`);
  console.log(`Pages tested: ${PAGES.length}`);
  console.log(`Clean pages: ${cleanPages}/${PAGES.length}`);
  console.log(`Total violation types: ${totalViolations}`);
}

run().catch(console.error);

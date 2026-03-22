/**
 * ICJIA Website Accessibility Audit Script
 * Uses axe-core to test WCAG 2.1 Level AA compliance
 *
 * This script:
 * 1. Starts the development server
 * 2. Crawls key pages of the website
 * 3. Runs axe-core accessibility tests
 * 4. Generates a comprehensive report
 */

const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");
const fs = require("fs-extra");
const path = require("path");

// Configuration
const BASE_URL = "http://localhost:8080";
const OUTPUT_DIR = path.join(__dirname, "..", "reports", "accessibility-audit-results");
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");

// Pages to test - comprehensive list of key pages
const PAGES_TO_TEST = [
  { url: "/", name: "Home" },
  { url: "/about/", name: "About" },
  { url: "/about/overview", name: "About - Overview" },
  { url: "/about/contact", name: "Contact" },
  { url: "/news/", name: "News Listing" },
  { url: "/funding/", name: "Funding Opportunities" },
  { url: "/meetings/", name: "Meetings" },
  { url: "/employment/", name: "Employment" },
  { url: "/researchhub/", name: "Research Hub" },
  { url: "/search/", name: "Search" },
  { url: "/datasets/", name: "Datasets" },
  { url: "/about/biographies", name: "Staff Biographies" },
];

// WCAG 2.1 Level AA tags for axe-core
const AXE_OPTIONS = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
};

// Impact levels mapping
const IMPACT_PRIORITY = {
  critical: { priority: 1, label: "Critical" },
  serious: { priority: 2, label: "Serious" },
  moderate: { priority: 3, label: "Moderate" },
  minor: { priority: 4, label: "Minor" },
};

/**
 * Main audit function
 */
async function runAccessibilityAudit() {
  console.log("🚀 Starting ICJIA Accessibility Audit");
  console.log(`📅 Timestamp: ${TIMESTAMP}`);
  console.log(`🎯 Target: WCAG 2.1 Level AA\n`);

  // Create output directory
  await fs.ensureDir(OUTPUT_DIR);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const allResults = [];
  const summary = {
    totalPages: PAGES_TO_TEST.length,
    totalViolations: 0,
    violationsBySeverity: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    },
    violationsByWCAG: {},
    commonIssues: {},
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
  };

  try {
    for (const pageInfo of PAGES_TO_TEST) {
      console.log(`\n📄 Testing: ${pageInfo.name} (${pageInfo.url})`);

      const page = await browser.newPage();

      // Set viewport to desktop size
      await page.setViewport({ width: 1920, height: 1080 });

      try {
        // Navigate to page with timeout
        await page.goto(`${BASE_URL}${pageInfo.url}`, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // Wait a bit for dynamic content to load
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Run axe-core analysis
        const results = await new AxePuppeteer(page)
          .options(AXE_OPTIONS)
          .analyze();

        // Process results
        const pageResults = {
          page: pageInfo.name,
          url: pageInfo.url,
          timestamp: new Date().toISOString(),
          violations: results.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            description: violation.description,
            help: violation.help,
            helpUrl: violation.helpUrl,
            tags: violation.tags,
            nodes: violation.nodes.map((node) => ({
              html: node.html,
              target: node.target,
              failureSummary: node.failureSummary,
              impact: node.impact,
            })),
          })),
          passes: results.passes.length,
          incomplete: results.incomplete.length,
          inapplicable: results.inapplicable.length,
        };

        allResults.push(pageResults);

        // Update summary
        summary.totalViolations += pageResults.violations.length;

        pageResults.violations.forEach((violation) => {
          // Count by severity
          if (violation.impact) {
            summary.violationsBySeverity[violation.impact] =
              (summary.violationsBySeverity[violation.impact] || 0) +
              violation.nodes.length;
          }

          // Count by WCAG criterion
          violation.tags.forEach((tag) => {
            if (tag.startsWith("wcag")) {
              summary.violationsByWCAG[tag] =
                (summary.violationsByWCAG[tag] || 0) + 1;
            }
          });

          // Track common issues
          const issueKey = violation.id;
          if (!summary.commonIssues[issueKey]) {
            summary.commonIssues[issueKey] = {
              description: violation.description,
              help: violation.help,
              impact: violation.impact,
              count: 0,
              affectedPages: [],
            };
          }
          summary.commonIssues[issueKey].count += violation.nodes.length;
          summary.commonIssues[issueKey].affectedPages.push(pageInfo.name);
        });

        console.log(
          `   ✅ Complete - ${pageResults.violations.length} violations found`
        );
      } catch (error) {
        console.error(`   ❌ Error testing ${pageInfo.name}:`, error.message);
        allResults.push({
          page: pageInfo.name,
          url: pageInfo.url,
          error: error.message,
          violations: [],
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  // Generate reports
  await generateReports(allResults, summary);

  console.log("\n✨ Audit Complete!");
  console.log(`📊 Results saved to: ${OUTPUT_DIR}/`);
}

/**
 * Generate comprehensive reports
 */
async function generateReports(allResults, summary) {
  // 1. Save raw JSON data
  await fs.writeJSON(
    path.join(OUTPUT_DIR, `raw-results-${TIMESTAMP}.json`),
    { summary, results: allResults },
    { spaces: 2 }
  );

  // 2. Generate executive summary
  const executiveSummary = generateExecutiveSummary(summary);
  await fs.writeFile(
    path.join(OUTPUT_DIR, `executive-summary-${TIMESTAMP}.md`),
    executiveSummary
  );

  // 3. Generate detailed report
  const detailedReport = generateDetailedReport(allResults, summary);
  await fs.writeFile(
    path.join(OUTPUT_DIR, `detailed-report-${TIMESTAMP}.md`),
    detailedReport
  );

  // 4. Generate triaged issues list
  const triagedIssues = generateTriagedIssuesList(summary);
  await fs.writeFile(
    path.join(OUTPUT_DIR, `triaged-issues-${TIMESTAMP}.md`),
    triagedIssues
  );

  console.log("\n📝 Reports generated:");
  console.log(`   - Executive Summary`);
  console.log(`   - Detailed Report`);
  console.log(`   - Triaged Issues List`);
  console.log(`   - Raw JSON Data`);
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(summary) {
  const totalIssues = Object.values(summary.violationsBySeverity).reduce(
    (a, b) => a + b,
    0
  );

  return `# ICJIA Website Accessibility Audit - Executive Summary

**Date:** ${new Date(summary.timestamp).toLocaleDateString()}  
**Target Compliance:** WCAG 2.1 Level AA  
**Pages Tested:** ${summary.totalPages}  
**Testing Tool:** axe-core (automated testing only)

## Overall Results

**Total Issues Found:** ${totalIssues}

### Issues by Severity

| Severity | Count | Percentage |
|----------|-------|------------|
| 🔴 Critical | ${summary.violationsBySeverity.critical || 0} | ${(
    ((summary.violationsBySeverity.critical || 0) / totalIssues) *
    100
  ).toFixed(1)}% |
| 🟠 Serious | ${summary.violationsBySeverity.serious || 0} | ${(
    ((summary.violationsBySeverity.serious || 0) / totalIssues) *
    100
  ).toFixed(1)}% |
| 🟡 Moderate | ${summary.violationsBySeverity.moderate || 0} | ${(
    ((summary.violationsBySeverity.moderate || 0) / totalIssues) *
    100
  ).toFixed(1)}% |
| 🟢 Minor | ${summary.violationsBySeverity.minor || 0} | ${(
    ((summary.violationsBySeverity.minor || 0) / totalIssues) *
    100
  ).toFixed(1)}% |

## Top 10 Most Common Issues

${generateTopIssuesTable(summary.commonIssues)}

## WCAG Success Criteria Affected

${generateWCAGTable(summary.violationsByWCAG)}

## Recommendations

1. **Immediate Action Required:** Address all Critical and Serious violations
2. **Short-term (1-2 months):** Resolve Moderate violations
3. **Medium-term (3-6 months):** Fix Minor violations
4. **Ongoing:** Implement automated accessibility testing in CI/CD pipeline

## Next Steps

1. Review the detailed triaged issues list
2. Assign issues to development team
3. Conduct manual accessibility testing (keyboard navigation, screen readers)
4. Perform SiteImprove audit for additional insights
5. Establish accessibility testing as part of development workflow

---
*Note: This is an automated audit only. Manual testing is required for complete WCAG 2.1 Level AA compliance.*
`;
}

function generateTopIssuesTable(commonIssues) {
  const sorted = Object.entries(commonIssues)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  let table = "| Issue | Impact | Count | Pages Affected |\n";
  table += "|-------|--------|-------|----------------|\n";

  sorted.forEach(([id, data]) => {
    const impactEmoji =
      {
        critical: "🔴",
        serious: "🟠",
        moderate: "🟡",
        minor: "🟢",
      }[data.impact] || "⚪";

    table += `| ${data.help} | ${impactEmoji} ${data.impact || "N/A"} | ${
      data.count
    } | ${data.affectedPages.length} |\n`;
  });

  return table;
}

function generateWCAGTable(violationsByWCAG) {
  const sorted = Object.entries(violationsByWCAG)
    .filter(([tag]) => tag.match(/wcag\d{3,4}/))
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return "*No WCAG-specific violations found.*";
  }

  let table = "| WCAG Criterion | Violations |\n";
  table += "|----------------|------------|\n";

  sorted.forEach(([tag, count]) => {
    table += `| ${tag.toUpperCase()} | ${count} |\n`;
  });

  return table;
}

/**
 * Generate detailed report with all violations
 */
function generateDetailedReport(allResults, summary) {
  let report = `# ICJIA Website Accessibility Audit - Detailed Report

**Date:** ${new Date(summary.timestamp).toLocaleDateString()}
**Testing Tool:** axe-core v4.x
**Standard:** WCAG 2.1 Level AA

---

`;

  allResults.forEach((pageResult) => {
    report += `## ${pageResult.page}\n\n`;
    report += `**URL:** \`${pageResult.url}\`  \n`;
    report += `**Violations:** ${pageResult.violations.length}  \n`;
    report += `**Passes:** ${pageResult.passes || 0}  \n`;
    report += `**Incomplete:** ${pageResult.incomplete || 0}  \n\n`;

    if (pageResult.error) {
      report += `⚠️ **Error:** ${pageResult.error}\n\n`;
    } else if (pageResult.violations.length === 0) {
      report += `✅ No violations found on this page.\n\n`;
    } else {
      pageResult.violations.forEach((violation, idx) => {
        const impactEmoji =
          {
            critical: "🔴",
            serious: "🟠",
            moderate: "🟡",
            minor: "🟢",
          }[violation.impact] || "⚪";

        report += `### ${idx + 1}. ${impactEmoji} ${violation.help}\n\n`;
        report += `**Impact:** ${violation.impact}  \n`;
        report += `**WCAG Tags:** ${violation.tags
          .filter((t) => t.startsWith("wcag"))
          .join(", ")}  \n`;
        report += `**Description:** ${violation.description}  \n`;
        report += `**Learn More:** ${violation.helpUrl}  \n\n`;
        report += `**Affected Elements:** ${violation.nodes.length}\n\n`;

        violation.nodes.slice(0, 3).forEach((node, nodeIdx) => {
          report += `**Element ${nodeIdx + 1}:**\n`;
          report += `- Target: \`${node.target.join(" ")}\`\n`;
          report += `- HTML: \`${node.html.substring(0, 100)}${
            node.html.length > 100 ? "..." : ""
          }\`\n`;
          if (node.failureSummary) {
            report += `- Issue: ${node.failureSummary.split("\n")[0]}\n`;
          }
          report += "\n";
        });

        if (violation.nodes.length > 3) {
          report += `*... and ${violation.nodes.length - 3} more elements*\n\n`;
        }

        report += "---\n\n";
      });
    }
  });

  return report;
}

/**
 * Generate triaged issues list organized by priority and WCAG criterion
 */
function generateTriagedIssuesList(summary) {
  let report = `# ICJIA Website Accessibility Issues - Triaged List

**Date:** ${new Date(summary.timestamp).toLocaleDateString()}
**Purpose:** Action plan for WCAG 2.1 Level AA compliance by April 2026

---

## Summary

This document organizes all accessibility issues by severity and provides recommended fix approaches.

`;

  // Group issues by severity
  const issuesBySeverity = {
    critical: [],
    serious: [],
    moderate: [],
    minor: [],
  };

  Object.entries(summary.commonIssues).forEach(([id, data]) => {
    const severity = data.impact || "minor";
    issuesBySeverity[severity].push({ id, ...data });
  });

  // Generate sections for each severity level
  ["critical", "serious", "moderate", "minor"].forEach((severity) => {
    const issues = issuesBySeverity[severity];
    if (issues.length === 0) return;

    const emoji = {
      critical: "🔴",
      serious: "🟠",
      moderate: "🟡",
      minor: "🟢",
    }[severity];

    const effort = {
      critical: "High - Immediate action required",
      serious: "Medium-High - Address within 1-2 months",
      moderate: "Medium - Address within 3-6 months",
      minor: "Low - Address as part of ongoing improvements",
    }[severity];

    report += `## ${emoji} ${severity.toUpperCase()} Priority Issues\n\n`;
    report += `**Estimated Effort:** ${effort}  \n`;
    report += `**Total Issues:** ${issues.length}  \n`;
    report += `**Total Instances:** ${issues.reduce(
      (sum, i) => sum + i.count,
      0
    )}  \n\n`;

    issues
      .sort((a, b) => b.count - a.count)
      .forEach((issue, idx) => {
        report += `### ${idx + 1}. ${issue.help}\n\n`;
        report += `**Issue ID:** \`${issue.id}\`  \n`;
        report += `**Instances:** ${issue.count}  \n`;
        report += `**Pages Affected:** ${
          issue.affectedPages.length
        } (${issue.affectedPages.slice(0, 3).join(", ")}${
          issue.affectedPages.length > 3 ? "..." : ""
        })  \n`;
        report += `**Description:** ${issue.description}  \n\n`;

        // Add recommended fix based on common issue types
        const recommendedFix = getRecommendedFix(issue.id, issue.description);
        report += `**Recommended Fix:**\n${recommendedFix}\n\n`;

        report += "---\n\n";
      });
  });

  // Add effort estimation summary
  report += `## Effort Estimation Summary\n\n`;
  report += `| Priority | Issues | Instances | Estimated Time |\n`;
  report += `|----------|--------|-----------|----------------|\n`;
  report += `| 🔴 Critical | ${
    issuesBySeverity.critical.length
  } | ${issuesBySeverity.critical.reduce(
    (s, i) => s + i.count,
    0
  )} | ${estimateEffort(issuesBySeverity.critical)} |\n`;
  report += `| 🟠 Serious | ${
    issuesBySeverity.serious.length
  } | ${issuesBySeverity.serious.reduce(
    (s, i) => s + i.count,
    0
  )} | ${estimateEffort(issuesBySeverity.serious)} |\n`;
  report += `| 🟡 Moderate | ${
    issuesBySeverity.moderate.length
  } | ${issuesBySeverity.moderate.reduce(
    (s, i) => s + i.count,
    0
  )} | ${estimateEffort(issuesBySeverity.moderate)} |\n`;
  report += `| 🟢 Minor | ${
    issuesBySeverity.minor.length
  } | ${issuesBySeverity.minor.reduce(
    (s, i) => s + i.count,
    0
  )} | ${estimateEffort(issuesBySeverity.minor)} |\n\n`;

  // Add systemic issues section
  report += `## Systemic Issues & Patterns\n\n`;
  report += `The following issues appear across multiple pages and may indicate systemic problems:\n\n`;

  const systemicIssues = Object.entries(summary.commonIssues)
    .filter(([_, data]) => data.affectedPages.length >= 3)
    .sort((a, b) => b[1].affectedPages.length - a[1].affectedPages.length);

  if (systemicIssues.length > 0) {
    systemicIssues.forEach(([id, data]) => {
      report += `- **${data.help}**: Affects ${data.affectedPages.length} pages (${data.count} instances)\n`;
    });
  } else {
    report += `*No systemic issues detected (issues affecting 3+ pages)*\n`;
  }

  report += `\n---\n\n`;
  report += `## Next Steps\n\n`;
  report += `1. **Immediate (Week 1-2):** Address all Critical issues\n`;
  report += `2. **Short-term (Month 1-2):** Resolve Serious issues\n`;
  report += `3. **Medium-term (Month 3-6):** Fix Moderate issues\n`;
  report += `4. **Ongoing:** Address Minor issues and maintain compliance\n`;
  report += `5. **Continuous:** Implement automated testing in CI/CD pipeline\n`;
  report += `6. **Manual Testing:** Conduct keyboard navigation and screen reader testing\n`;
  report += `7. **Validation:** Run SiteImprove audit for additional insights\n\n`;

  return report;
}

/**
 * Get recommended fix for common accessibility issues
 */
function getRecommendedFix(issueId, description) {
  const fixes = {
    "color-contrast": `
- Review all text and background color combinations
- Ensure contrast ratio of at least 4.5:1 for normal text
- Ensure contrast ratio of at least 3:1 for large text (18pt+ or 14pt+ bold)
- Use tools like WebAIM Contrast Checker to verify
- Update CSS variables/theme colors if needed
- Consider using Vuetify's built-in color system with accessible combinations`,

    "image-alt": `
- Add meaningful alt text to all images
- For decorative images, use alt="" or role="presentation"
- For complex images (charts, diagrams), provide detailed descriptions
- Review Vue components that render images dynamically
- Update image upload/management workflows to require alt text`,

    "link-name": `
- Ensure all links have descriptive text or aria-label
- Avoid generic text like "click here" or "read more"
- For icon-only links, add aria-label or sr-only text
- Review Vuetify button components for proper labeling
- Consider adding visually hidden text for context`,

    "button-name": `
- Add aria-label to icon-only buttons
- Ensure button text is descriptive
- Review the fixButtonText function in src/a11y/index.js
- Update Vuetify button components to include accessible names
- Consider using v-tooltip with aria-label for icon buttons`,

    "heading-order": `
- Ensure heading levels follow logical order (h1 → h2 → h3)
- Don't skip heading levels
- Review Vue component templates for proper heading structure
- Consider creating a heading hierarchy guide for content editors
- Use semantic HTML instead of styled divs`,

    label: `
- Add <label> elements for all form inputs
- Use for/id attributes to associate labels with inputs
- For Vuetify form components, ensure label prop is set
- Add aria-label for inputs without visible labels
- Review form validation components`,

    "aria-required-attr": `
- Add required ARIA attributes to elements with ARIA roles
- Review custom components using ARIA
- Ensure ARIA roles are used correctly
- Consider using native HTML elements instead of ARIA when possible`,

    list: `
- Ensure list items (<li>) are contained in <ul>, <ol>, or <menu>
- Don't use list styling on non-list elements
- Review navigation components
- Use semantic HTML for lists`,

    region: `
- Add ARIA landmarks or HTML5 semantic elements
- Use <main>, <nav>, <aside>, <header>, <footer>
- Ensure all content is within a landmark region
- Add aria-label to multiple instances of same landmark`,

    "duplicate-id": `
- Ensure all id attributes are unique on the page
- Review Vue components that generate dynamic IDs
- Use unique identifiers (nanoid, uuid) for dynamic content
- Check for ID conflicts in reusable components`,

    "html-has-lang": `
- Add lang attribute to <html> element
- Update public/index.html
- Ensure lang="en" or appropriate language code`,

    "landmark-one-main": `
- Ensure page has exactly one <main> landmark
- Review App.vue and layout components
- Add role="main" or <main> element to primary content area`,

    "page-has-heading-one": `
- Ensure each page has exactly one <h1> element
- Review page templates and components
- Add page title as <h1> in each view component`,

    "skip-link": `
- Verify skip link is functional and visible on focus
- Review SkipLink component implementation
- Ensure skip link is first focusable element
- Test keyboard navigation to skip link`,

    tabindex: `
- Remove positive tabindex values
- Use tabindex="0" to add elements to tab order
- Use tabindex="-1" to remove from tab order
- Let browser handle natural tab order when possible`,

    "aria-hidden-focus": `
- Don't use aria-hidden on focusable elements
- Review modal and overlay components
- Ensure hidden content is not in tab order
- Use proper focus management for dynamic content`,
  };

  // Try to match issue ID to known fixes
  for (const [key, fix] of Object.entries(fixes)) {
    if (issueId.includes(key)) {
      return fix;
    }
  }

  // Generic fix recommendation
  return `
- Review the specific violation details in the detailed report
- Consult WCAG 2.1 documentation for this criterion
- Test fix with screen readers and keyboard navigation
- Verify fix doesn't introduce new accessibility issues
- Consider consulting with accessibility specialist if needed`;
}

/**
 * Estimate effort for fixing issues
 */
function estimateEffort(issues) {
  const totalInstances = issues.reduce((sum, i) => sum + i.count, 0);

  if (totalInstances === 0) return "0 hours";
  if (totalInstances <= 10) return "2-4 hours";
  if (totalInstances <= 25) return "4-8 hours";
  if (totalInstances <= 50) return "1-2 days";
  if (totalInstances <= 100) return "2-4 days";
  return "1-2 weeks";
}

// Run the audit
runAccessibilityAudit().catch(console.error);

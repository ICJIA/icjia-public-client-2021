# ICJIA Website Accessibility Audit

This directory contains tools and results for automated accessibility testing of the ICJIA public website using axe-core.

## Overview

**Goal:** Achieve WCAG 2.1 Level AA compliance by April 2026  
**Testing Tool:** axe-core (industry-standard automated accessibility testing engine)  
**Scope:** Automated testing only - manual testing required separately

## Prerequisites

1. **Node.js 16.x** (required for this project)
2. **Dependencies installed:**
   ```bash
   npm install --save-dev puppeteer @axe-core/puppeteer
   ```

## Running the Audit

### Step 1: Install Dependencies

```bash
npm install --save-dev puppeteer @axe-core/puppeteer
```

### Step 2: Start Development Server

In one terminal window:
```bash
npm run serve
```

Wait for the server to start at `http://localhost:8080`

### Step 3: Run the Audit

In another terminal window:
```bash
node accessibility-audit.js
```

The audit will:
- Test 12+ key pages across the website
- Run axe-core WCAG 2.1 Level AA tests
- Generate comprehensive reports
- Take approximately 2-5 minutes to complete

## Generated Reports

All reports are saved to `./accessibility-audit-results/` with timestamps:

### 1. Executive Summary (`executive-summary-[timestamp].md`)
- High-level overview of findings
- Issues by severity (Critical, Serious, Moderate, Minor)
- Top 10 most common issues
- WCAG success criteria affected
- Recommendations and next steps

### 2. Triaged Issues List (`triaged-issues-[timestamp].md`)
**This is the primary action document**
- Issues organized by priority/severity
- Recommended fix approaches for each issue
- Effort estimation for each category
- Systemic issues and patterns
- Action plan with timelines

### 3. Detailed Report (`detailed-report-[timestamp].md`)
- Page-by-page breakdown
- All violations with specific elements
- WCAG tags and impact levels
- Links to remediation guidance

### 4. Raw JSON Data (`raw-results-[timestamp].json`)
- Complete machine-readable results
- Can be imported into other tools
- Useful for tracking progress over time

## Understanding Severity Levels

| Severity | Priority | Timeline | Description |
|----------|----------|----------|-------------|
| 🔴 **Critical** | P1 | Immediate | Blocks access for users with disabilities |
| 🟠 **Serious** | P2 | 1-2 months | Significant barriers to accessibility |
| 🟡 **Moderate** | P3 | 3-6 months | Noticeable issues but workarounds exist |
| 🟢 **Minor** | P4 | Ongoing | Minor improvements to user experience |

## Common Issues to Expect

Based on typical Vue.js/Vuetify applications, you may find:

1. **Color Contrast** - Text/background combinations not meeting 4.5:1 ratio
2. **Missing Alt Text** - Images without descriptive alternative text
3. **Form Labels** - Input fields without associated labels
4. **Button Names** - Icon-only buttons without accessible names
5. **Heading Order** - Skipped heading levels (h1 → h3)
6. **ARIA Attributes** - Missing or incorrect ARIA attributes
7. **Keyboard Navigation** - Elements not reachable via keyboard
8. **Focus Management** - Missing or incorrect focus indicators

## What This Audit Does NOT Cover

This is **automated testing only**. Manual testing is still required for:

- ✋ Keyboard navigation and tab order
- 🔊 Screen reader compatibility (JAWS, NVDA, VoiceOver)
- 🧠 Cognitive accessibility
- 📱 Mobile accessibility
- 🎯 Focus management in dynamic content
- 🎨 Meaningful sequence and reading order
- 📝 Content quality and readability

## Next Steps After Running Audit

1. **Review the Triaged Issues List** - Start here for action items
2. **Prioritize Critical & Serious Issues** - Address these first
3. **Assign Issues to Team Members** - Distribute work based on expertise
4. **Create Tickets/Tasks** - Track progress in your project management tool
5. **Fix and Test** - Implement fixes and verify with re-testing
6. **Manual Testing** - Conduct keyboard and screen reader testing
7. **SiteImprove Audit** - Run additional commercial tool for validation
8. **Continuous Testing** - Integrate accessibility testing into CI/CD

## Integrating into Development Workflow

### Option 1: Pre-commit Hook
Add accessibility testing to git pre-commit hooks to catch issues early.

### Option 2: CI/CD Pipeline
Run automated tests on every pull request:
```yaml
# Example GitHub Actions workflow
- name: Accessibility Test
  run: |
    npm run serve &
    sleep 10
    node accessibility-audit.js
```

### Option 3: Regular Audits
Schedule monthly or quarterly audits to track progress.

## Customizing the Audit

### Add More Pages
Edit `accessibility-audit.js` and add to `PAGES_TO_TEST` array:
```javascript
const PAGES_TO_TEST = [
  { url: '/', name: 'Home' },
  { url: '/your-page/', name: 'Your Page Name' },
  // ... more pages
];
```

### Change WCAG Level
Modify `AXE_OPTIONS` to test different standards:
```javascript
const AXE_OPTIONS = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
  }
};
```

### Test Specific Rules
Test only specific accessibility rules:
```javascript
const AXE_OPTIONS = {
  runOnly: {
    type: 'rule',
    values: ['color-contrast', 'image-alt', 'label']
  }
};
```

## Resources

### WCAG 2.1 Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Testing Tools
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Vue.js Accessibility
- [Vue.js Accessibility Guide](https://vuejs.org/guide/best-practices/accessibility.html)
- [Vuetify Accessibility](https://vuetifyjs.com/en/features/accessibility/)

### Screen Readers
- [NVDA (Windows - Free)](https://www.nvaccess.org/)
- [JAWS (Windows - Commercial)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS/iOS - Built-in)](https://www.apple.com/accessibility/voiceover/)

## Troubleshooting

### Server Not Running
```
Error: net::ERR_CONNECTION_REFUSED at http://localhost:8080
```
**Solution:** Make sure `npm run serve` is running in another terminal

### Timeout Errors
```
Error: Navigation timeout of 30000 ms exceeded
```
**Solution:** Increase timeout in `accessibility-audit.js` or check if page is loading slowly

### Puppeteer Installation Issues
```
Error: Could not find Chrome
```
**Solution:** 
```bash
# macOS
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome

# Or reinstall
npm install puppeteer --force
```

## Support

For questions or issues with the accessibility audit:
1. Check the generated reports for specific guidance
2. Review WCAG 2.1 documentation
3. Consult with accessibility specialists
4. Contact the development team

## License

This audit script is part of the ICJIA Public Client project and follows the same MIT license.


# Quick Fix Guide - ICJIA Accessibility Issues

**Last Updated:** October 7, 2025  
**Estimated Total Time:** 4-8 hours

This guide provides step-by-step instructions to fix all accessibility issues found in the automated audit.

---

## 🔴 CRITICAL FIX #1: Enable Zoom/Scaling (2-4 hours)

### Issue
The viewport meta tag prevents users from zooming the page, violating WCAG 2.1 Level AA (1.4.4 Resize Text).

### Affects
10 pages (all except Home and Research Hub)

### Fix Steps

#### Step 1: Locate the Issue
The issue is in the built HTML. Check the build process to see if something is modifying the viewport meta tag.

**File to check:** `public/index.html` (line 10)

Current:
```html
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
```

#### Step 2: Investigate Build Process
The source file looks correct, but the built version may have additional restrictions. Check:

1. `vue.config.js` - Look for any HTML minification or transformation
2. Build plugins that might modify HTML
3. Any webpack plugins that process HTML

#### Step 3: Verify Current Behavior
```bash
# Check what's actually in the built HTML
curl -s http://localhost:8080/about/ | grep viewport
```

Look for any of these problematic attributes:
- `maximum-scale=1.0`
- `user-scalable=no`
- `user-scalable=0`

#### Step 4: Apply Fix
If the issue is in the build process, you may need to:

**Option A:** Ensure the source stays clean
```html
<!-- public/index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Option B:** Explicitly allow scaling
```html
<!-- public/index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
```

**Option C:** Check for Vuetify configuration
Vuetify might be adding viewport restrictions. Check `src/plugins/vuetify.js` or similar.

#### Step 5: Rebuild and Test
```bash
# Rebuild the site
npm run build

# Serve the built version
npx http-server dist -p 8080

# Test in browser
# 1. Open http://localhost:8080/about/
# 2. Try Cmd/Ctrl + + to zoom
# 3. On mobile, try pinch-to-zoom
# 4. Verify page zooms to at least 200%
```

#### Step 6: Verify Fix
```bash
# Re-run accessibility audit
node accessibility-audit.js

# Check that meta-viewport violations are gone
```

### Testing Checklist
- [ ] Desktop browser zoom works (Cmd/Ctrl + +)
- [ ] Mobile pinch-to-zoom works
- [ ] Page zooms to at least 200%
- [ ] Layout doesn't break at high zoom
- [ ] No horizontal scrolling at 200% zoom
- [ ] All content remains accessible when zoomed

---

## 🟠 SERIOUS FIX #2: Nested Interactive Controls (1-2 hours)

### Issue
Home page splash image has focusable elements inside a `role="img"` container.

### Affects
Home page (`/`) only

### Fix Steps

#### Step 1: Locate the Component
The issue is in the home page splash image. Find the component:

```bash
# Search for the splash image component
grep -r "ICJIA home page splash image" src/
grep -r "role=\"img\"" src/views/Home/
```

Likely location: `src/views/Home/Home.vue`

#### Step 2: Identify the Problem
Look for code like:
```vue
<div 
  aria-label="ICJIA home page splash image" 
  role="img" 
  class="v-image v-responsive theme--light"
  style="height: 600px;"
>
  <!-- Focusable elements inside here -->
  <a href="...">...</a>  <!-- This is the problem -->
</div>
```

#### Step 3: Choose a Solution

**Option A:** Remove role="img" if there are interactive children
```vue
<div 
  aria-label="ICJIA home page splash image" 
  class="v-image v-responsive theme--light"
  style="height: 600px;"
>
  <!-- Interactive elements are now okay -->
</div>
```

**Option B:** Move interactive elements outside
```vue
<div 
  aria-label="ICJIA home page splash image" 
  role="img" 
  class="v-image v-responsive theme--light"
  style="height: 600px;"
>
  <!-- No interactive elements here -->
</div>
<!-- Interactive elements moved here -->
<div class="splash-actions">
  <a href="...">...</a>
</div>
```

**Option C:** Make the whole thing a link (if appropriate)
```vue
<a 
  href="/about/" 
  aria-label="ICJIA home page - Learn more about us"
  class="splash-link"
>
  <div 
    class="v-image v-responsive theme--light"
    style="height: 600px;"
  >
    <!-- No role="img" needed if it's inside a link -->
  </div>
</a>
```

#### Step 4: Test the Fix
```bash
# Start dev server
npm run serve

# Navigate to home page
# Press Tab key repeatedly
# Verify:
# 1. All interactive elements are reachable
# 2. Focus order makes sense
# 3. Screen reader announces elements correctly
```

#### Step 5: Screen Reader Testing
Test with at least one screen reader:

**macOS (VoiceOver):**
```
Cmd + F5 to start VoiceOver
Navigate to home page
Use VO + Right Arrow to navigate
Verify splash image is announced correctly
```

**Windows (NVDA - Free):**
```
Download from https://www.nvaccess.org/
Ctrl + Alt + N to start
Navigate to home page
Use Down Arrow to navigate
Verify splash image is announced correctly
```

### Testing Checklist
- [ ] No nested interactive controls warning
- [ ] Tab navigation works correctly
- [ ] Focus order is logical
- [ ] Screen reader announces correctly
- [ ] Visual appearance unchanged
- [ ] All functionality still works

---

## 🟠 SERIOUS FIX #3: Missing Lang Attribute (1-2 hours)

### Issue
Research Hub page is missing `lang` attribute on `<html>` element.

### Affects
Research Hub (`/researchhub/`) only

### Fix Steps

#### Step 1: Investigate the Source
The Research Hub appears to serve different HTML than the main app.

```bash
# Check for separate HTML files
find public/researchhub -name "*.html"
find dist/researchhub -name "*.html"

# Check what's actually served
curl -s http://localhost:8080/researchhub/ | head -10
```

#### Step 2: Locate the HTML Source
Possible locations:
- `public/researchhub/index.html`
- Separate build process for Research Hub
- Server-side rendering configuration
- Redirect to external site

#### Step 3: Add Lang Attribute
Once you find the HTML file, update it:

**Before:**
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    ...
```

**After:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    ...
```

#### Step 4: If Research Hub is a Separate App
If Research Hub is a completely separate application:

1. Check if it has its own repository
2. Update the HTML template in that repository
3. Coordinate deployment with that team

#### Step 5: If Research Hub is External
If `/researchhub/` redirects to an external site:

1. Check `public/_redirects` or `netlify.toml`
2. Contact the external site administrators
3. Request they add `lang="en"` to their HTML

#### Step 6: Test the Fix
```bash
# Rebuild if needed
npm run build

# Check the HTML
curl -s http://localhost:8080/researchhub/ | grep "<html"

# Should see: <html lang="en">
```

### Testing Checklist
- [ ] `<html lang="en">` is present in source
- [ ] Screen reader pronounces content correctly
- [ ] No html-has-lang violation in audit
- [ ] Page still loads and functions correctly

---

## 🧪 Verification & Testing

### After All Fixes: Re-run Audit

```bash
# Make sure server is running
npx http-server dist -p 8080

# In another terminal, run audit
node accessibility-audit.js

# Check results
cat accessibility-audit-results/executive-summary-*.md | tail -50
```

### Expected Results After Fixes
- ✅ 0 Critical violations
- ✅ 0 Serious violations
- ✅ 0 Moderate violations
- ✅ 0 Minor violations

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through entire home page
- [ ] Tab through a content page (e.g., /about/)
- [ ] Tab through a form page (e.g., /search/)
- [ ] Verify skip link works (Tab on page load)
- [ ] Check focus indicators are visible
- [ ] Verify no keyboard traps

#### Screen Reader Testing
- [ ] Test home page with screen reader
- [ ] Test navigation menu
- [ ] Test a form
- [ ] Test a data table (if any)
- [ ] Verify headings are announced
- [ ] Verify links are descriptive

#### Zoom Testing
- [ ] Zoom to 200% on desktop
- [ ] Verify no horizontal scrolling
- [ ] Verify all content is readable
- [ ] Test on mobile device
- [ ] Verify pinch-to-zoom works

---

## 📝 Documentation

### Update After Fixes
1. Document the changes in CHANGELOG.md
2. Update any accessibility documentation
3. Add accessibility testing to PR checklist
4. Train team on accessibility best practices

### Commit Messages
```bash
git commit -m "fix(a11y): Enable zoom/scaling on all pages - WCAG 1.4.4"
git commit -m "fix(a11y): Remove nested interactive controls from home splash - WCAG 4.1.2"
git commit -m "fix(a11y): Add lang attribute to Research Hub - WCAG 3.1.1"
```

---

## 🚀 Next Steps

After fixing these issues:

1. **Re-run automated audit** - Verify all issues are resolved
2. **Manual testing** - Keyboard and screen reader testing
3. **SiteImprove audit** - Run commercial tool for validation
4. **Integrate into CI/CD** - Add accessibility testing to pipeline
5. **Team training** - Educate developers on accessibility
6. **Ongoing monitoring** - Regular accessibility audits

---

## 📞 Need Help?

### Resources
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Articles](https://webaim.org/articles/)
- [Deque University](https://dequeuniversity.com/)
- [A11y Project](https://www.a11yproject.com/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/extension/) - Browser extension
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/) - Free for Windows
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Built into macOS
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Good luck! You're very close to full WCAG 2.1 Level AA compliance! 🎉**


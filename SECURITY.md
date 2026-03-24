# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| All   | :white_check_mark: |

## Reporting a Vulnerability

If you notice a vulnerability, please [file an issue here](https://github.com/ICJIA/icjia-public-2021/issues).

The site is scanned with [GitHub's CodeQL](https://codeql.github.com/docs/), a semantic code analysis engine, after every commit.

In addition, [dependabot updates](https://github.com/dependabot) are regularly implemented.

If a threat is discovered -- or an issue is filed about a specific threat -- expect a fix within hours.

For specific questions or additional information, please [file an issue](https://github.com/ICJIA/icjia-public-2021/issues).

## Security Audit Summary (March 24, 2026)

A red team / blue team security assessment was conducted covering 2,345 routes across 10 content types, all Vue components, deployment configuration, authentication, third-party dependencies, and API communication.

**Overall posture: MODERATE**

### Active Defenses

- **Security headers** — X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection
- **CORS** — restricted to `https://icjia.illinois.gov`
- **HTTPS** — all endpoints and CDN resources
- **CodeQL** — static analysis on every push/PR
- **DOMPurify** — HTML sanitization on form submissions
- **Console stripping** — production builds remove debug logging
- **Auth cleanup** — tokens cleared from localStorage on logout

### Known Risks Under Monitoring

| Risk | Severity | Mitigation Status |
|---|---|---|
| `v-html` XSS (85 bindings, 38 files) | HIGH | DOMPurify coverage expansion planned |
| GraphQL injection (3 views) | CRITICAL | Parameterized queries planned |
| JWT in localStorage | HIGH | HttpOnly cookies require backend change |
| No CSRF on forms | MEDIUM | Requires backend CSRF token support |
| Node 16 / Vue 2 EOL | LOW | Nuxt 4 / Strapi 5 rewrite planned |

See [CHANGELOG.md](CHANGELOG.md) for the full findings table and remediation timeline.

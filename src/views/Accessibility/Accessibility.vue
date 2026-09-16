<template>
  <div class="markdown-body page-accessibility mt-10 mb-12">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="mb-6">Accessibility Statement</h1>
          <p>
            The Illinois Criminal Justice Information Authority (ICJIA) is
            committed to making its website usable by everyone, including people
            with disabilities. We treat accessibility as an ongoing
            responsibility and work to meet or exceed the standards that apply
            to State of Illinois websites.
          </p>

          <h2>Conformance status</h2>
          <p>
            The ICJIA website is <strong>partially conformant</strong> with the
            <a
              href="https://www.w3.org/TR/WCAG21/"
              target="_blank"
              rel="noopener noreferrer"
              >Web Content Accessibility Guidelines (WCAG) 2.1</a
            >
            at <strong>Level AA</strong>. Partially conformant means that some
            parts of the content do not fully conform to the accessibility
            standard. We work to find and correct these, and our goal is full
            conformance with WCAG 2.1 Level AA.
          </p>
          <p>
            WCAG 2.1 Level AA is the standard these pages are working toward,
            and the one named by:
          </p>
          <ul>
            <li>
              the
              <strong
                ><a
                  href="https://doit.illinois.gov/initiatives/accessibility/iitaa.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Illinois Information Technology Accessibility Act (IITAA)
                  2.1</a
                ></strong
              >, the standard for State of Illinois agency websites, which is
              based on WCAG 2.1 Level AA; and
            </li>
            <li>
              <strong
                >Title II of the Americans with Disabilities Act (ADA)</strong
              >, which requires state and local government web content to meet
              WCAG 2.1 Level AA.
            </li>
          </ul>
          <p>
            This statement covers the ICJIA website at icjia.illinois.gov. Some
            ICJIA program sites and applications share this web address but are
            separate websites, such as Adult Redeploy Illinois at
            icjia.illinois.gov/adultredeploy/, and are not covered by this
            statement.
          </p>

          <h2>Measures to support accessibility</h2>
          <p>
            Accessibility is built into how this site is designed and developed.
            Among other measures, the site:
          </p>
          <ul>
            <li>
              marks each page with landmark regions (header, navigation, main
              content, and footer) so assistive technologies can navigate the
              page structure;
            </li>
            <li>
              can be navigated with a keyboard, including its drop-down menus;
            </li>
            <li>
              provides a “skip to main content” link so keyboard and
              screen-reader users can bypass repeated navigation; and
            </li>
            <li>
              automatically corrects common accessibility problems in the
              content it displays — for example, marking up table headers so
              screen readers can relate each cell to its row and column, giving
              icon-only buttons and unlabeled form fields a name that assistive
              technologies can announce, and resetting text colors set by hand
              in published content so that text keeps sufficient contrast.
            </li>
          </ul>

          <h2>How this site is tested</h2>
          <p>
            We evaluate accessibility ourselves throughout development rather
            than relying on a single point-in-time review. Testing includes:
          </p>
          <ul>
            <li>
              automated checks with <strong>axe-core</strong> and
              <strong>Lighthouse</strong> during development, including axe-core
              scans of every page listed in the site’s sitemap; and
            </li>
            <li>
              ongoing site-wide monitoring with <strong>Siteimprove</strong>.
            </li>
          </ul>
          <p>
            This is a self-evaluation and is not a third-party certification.
            Automated tools cannot catch every barrier, which is why feedback
            from people who use the site is important to us.
          </p>

          <h2>Technical specifications</h2>
          <p>
            Accessibility of this site relies on the following technologies:
            <strong>HTML</strong>, <strong>WAI-ARIA</strong>,
            <strong>CSS</strong>, and <strong>JavaScript</strong>. These are
            used in ways that conform to the standards above.
          </p>
          <p>
            This site requires JavaScript. Its pages are assembled in the web
            browser: the content of each page is loaded by JavaScript after the
            page opens, and the automatic corrections described above are
            applied by script as each page loads. If JavaScript is turned off or
            unsupported, the site’s content does not appear.
          </p>

          <h2>Feedback and contact</h2>
          <p>
            We welcome your feedback on the accessibility of the ICJIA website.
            If you encounter a barrier, or need information from this site in a
            different format — including a report or other document available
            for download — please contact us:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>&nbsp;<a
                href="mailto:cja.info@illinois.gov"
                >cja.info@illinois.gov</a
              >
            </li>
          </ul>
          <p>
            To help us respond quickly, please include the web address (URL) of
            the page, a description of the problem, and the browser or assistive
            technology you were using. We aim to respond as quickly as possible.
          </p>
          <p>
            <em>This statement was last reviewed on September 16, 2026.</em>
          </p>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  metaInfo() {
    return {
      title: "Accessibility Statement",
    };
  },
};
</script>

<template>
  <div class="markdown-body page-homicide mt-10 mb-12">
    <v-container fluid style="max-width: 90%">
      <v-row>
        <v-col>
          <h1 class="mb-6">Illinois Homicide Reporting</h1>
          <p>
            The Illinois Criminal Justice Information Act (<a
              href="https://www.ilga.gov/Legislation/ILCS/Articles?ActID=397&amp;ChapterID=5&amp;Chapter=EXECUTIVE%20BRANCH&amp;MajorTopic=GOVERNMENT"
              target="_blank"
              rel="noopener noreferrer"
              >20 ILCS 3930</a
            >) requires the Illinois Criminal Justice Information Authority
            (ICJIA) to publish data on homicides and aggravated assaults
            involving a firearm reported by Illinois law enforcement agencies.
            These data are collected by the Illinois State Police (ISP) through
            the Illinois National Incident-Based Reporting System (NIBRS) and
            provided to ICJIA for publication.
          </p>

          <h2>Dashboard Overview</h2>
          <p>
            This dashboard allows users to explore offense and clearance data
            beginning in 2023 by offense type (homicide or aggravated assault
            involving a firearm), county, law enforcement agency, and reporting
            period. Users can examine quarterly trends, compare reporting
            periods, and view offense totals and clearance outcomes by clearance
            method.
          </p>

          <div class="mb-10">
            <div class="dashboard-embed mx-auto" :style="embedWrapStyle">
              <iframe
                src="https://public.data.illinois.gov/t/Public/views/PA104-0197Clearances/CrimeClearancesinIllinoisForHomicideandAggravatedAssaultwithaFirearm?:embed=yes&amp;:showVizHome=no&amp;:tabs=no&amp;:toolbar=bottom"
                :width="embedWidth"
                :height="embedHeight"
                frameborder="0"
                style="border: 0; transform-origin: top left"
                :style="{ transform: `scale(${embedScale})` }"
                title="Crime Clearances in Illinois for Homicide and Aggravated Assault with a Firearm"
              ></iframe>
            </div>
          </div>

          <h2>Understanding Clearances</h2>
          <p>
            A clearance indicates that law enforcement has identified a person
            who allegedly committed the offense and has either made an arrest or
            met the criteria for an exceptional clearance under the FBI's
            National Incident-Based Reporting System. Exceptional clearances
            occur when law enforcement has identified a person suspected of
            committing the offense but cannot make an arrest because
            circumstances beyond law enforcement's control prevent the arrest or
            prosecution.
          </p>

          <h2>Data Updates and Reporting</h2>
          <p>
            ICJIA updates the dashboard quarterly. To reduce the risk of
            presenting incomplete data, ICJIA excludes the eight most recent
            months of data based on its assessment of NIBRS reporting lag.
            Because law enforcement agencies may submit revised or delayed data
            after initial reporting, statistics presented in the dashboard may
            change as records are updated. The dashboard begins with 2023 data
            because statewide NIBRS reporting was still stabilizing during the
            transition from the Summary Reporting System (SRS) to NIBRS.
          </p>

          <h2>Supplementary Reports and Data</h2>
          <h3>Homicide Reporting Summary Report</h3>
          <div class="mb-8">
            <v-btn
              dark
              large
              block
              color="#0d4474"
              href="/homicide/homicide-reporting-sept2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              class="download-btn"
              @click="
                trackDownload('/homicide/homicide-reporting-sept2026.pdf')
              "
            >
              View/Download PDF
            </v-btn>
          </div>

          <h3>Homicide Reporting Datasets</h3>
          <v-row class="mb-8">
            <v-col
              v-for="dataset in datasets"
              :key="dataset.file"
              cols="12"
              sm="4"
            >
              <v-btn
                dark
                large
                block
                color="#0d4474"
                :href="dataset.file"
                download
                class="download-btn"
                @click="trackDownload(dataset.file)"
              >
                {{ dataset.label }}
              </v-btn>
            </v-col>
          </v-row>

          <h2>Additional NIBRS Information</h2>
          <p>
            Additional information about Illinois NIBRS reporting is available
            at
            <a
              href="https://ilucr.nibrs.com/Home"
              target="_blank"
              rel="noopener noreferrer"
              >ilucr.nibrs.com</a
            >.
          </p>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
// The Tableau dashboard is authored at a fixed 1366×2600 (#tab-dashboard-region)
// and does not reflow. The frame gets a little extra for the bottom toolbar so
// no internal scrollbar appears and steals width; when the content column is
// narrower than the frame, the whole embed scales down proportionally instead
// of clipping on the right.
const EMBED_WIDTH = 1390;
const EMBED_HEIGHT = 2675;

export default {
  data() {
    return {
      embedWidth: EMBED_WIDTH,
      embedHeight: EMBED_HEIGHT,
      embedScale: 1,
      datasets: [
        {
          label: "Quarterly Dataset",
          file: "/homicide/homicide-reporting-quarterly_totals_sept2026.xlsx",
        },
        {
          label: "Annual Dataset",
          file: "/homicide/homicide-reporting-annual_totals_sept2026.xlsx",
        },
        {
          label: "Latest 12-Month Dataset",
          file: "/homicide/homicide-reporting-12_month_totals_sept2026.xlsx",
        },
      ],
    };
  },
  computed: {
    embedWrapStyle() {
      return {
        width: `${Math.round(this.embedWidth * this.embedScale)}px`,
        height: `${Math.round(this.embedHeight * this.embedScale)}px`,
      };
    },
  },
  mounted() {
    this.setEmbedScale();
    window.addEventListener("resize", this.setEmbedScale);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.setEmbedScale);
  },
  methods: {
    setEmbedScale() {
      const wrap = this.$el.querySelector(".dashboard-embed");
      const avail =
        wrap && wrap.parentElement ? wrap.parentElement.clientWidth : 0;
      this.embedScale = avail > 0 ? Math.min(1, avail / this.embedWidth) : 1;
    },
    trackDownload(url) {
      // Fire-and-forget analytics; do NOT block the browser's native download
      // (no preventDefault — the anchor's href triggers the download directly).
      try {
        if (typeof window.plausible === "function") {
          window.plausible("file_download", { props: { url } });
        }
      } catch (_e) {
        /* analytics failure must never block downloads */
      }
    },
  },
  metaInfo() {
    return {
      title: "Homicide Reporting",
    };
  },
};
</script>

<style lang="scss" scoped>
/* v-btn renders as an <a> when href is set, so the global `a:hover` rule in
   app.css (color: #000 !important) would repaint these labels black on the
   navy background. Darken the button and hold the label white instead — the
   same treatment as Home.vue's .news-archive-btn and HomeSplashV2's
   .splash-button. text-decoration guards against .markdown-body a:hover. */
.download-btn:hover {
  background-color: #092f51 !important;
  color: #fff !important;
  text-decoration: none !important;
}

/* Sized by embedWrapStyle to the scaled dashboard dimensions; hidden overflow
   only guards sub-pixel rounding at the scaled edge. */
.dashboard-embed {
  overflow: hidden;
}
</style>

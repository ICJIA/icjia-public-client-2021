<template>
  <div class="mt-10 mb-12">
    <v-container
      ><v-row
        ><v-col>
          <div>
            <h1 class="mb-8 pb-5">
              Illinois Criminal Justice Information Authority (ICJIA) Grant
              Programs
            </h1>
            <div class="mb-12">
              <p>
                This mapping application displays information about Illinois
                Criminal Justice Information Authority (ICJIA) grant programs.
                The data presented in the map include grants that are currently
                active. These data will be updated quarterly to capture newly
                awarded grants and remove grants that are closed. For additional
                information on the funding sources, please see
                <a
                  href="https://icjia.illinois.gov/grants/programs/"
                  target="_blank"
                  >https://icjia.illinois.gov/grants/programs/</a
                >.
              </p>
              <p>
                Users can employ this tool to examine locations where grants
                from various funding sources are awarded and what grants are
                active in their communities. Each data point contains
                information about the total amount of funding awarded to an
                organization under the grant program. The map is searchable by
                location or by organization name. Full details on the
                application’s functionality and data are available in the

                <a
                  href="https://agency.icjia-api.cloud/uploads/Online_Map_User_Guide_32a70206b8.pdf"
                  target="_blank"
                  >downloadable user guide</a
                >.
              </p>
            </div>
            <div class="text-center">
              <iframe
                style="margin: 0; padding: 0; border: 2px solid #666"
                width="1024"
                class="mb-8"
                height="700"
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                title="All Open Grants"
                src="https://illinois.maps.arcgis.com/apps/webappviewer/index.html?id=6e414edadd234db59cd14087519a10ac"
              ></iframe>
            </div>
            <div
              style="
                font-size: 12px;
                font-weight: bold;
                margin-top: -30px !important;
              "
              class="text-center"
            >
              Note: Data last updated 01-01-25
            </div>
            <div class="mt-8 text-center">
              <a
                href="https://agency.icjia-api.cloud/uploads/Online_Map_User_Guide_32a70206b8.pdf"
                target="_blank"
                >Download Online Map User's Guide (PDF)&nbsp;&raquo;</a
              >
            </div>
          </div>
        </v-col></v-row
      ></v-container
    >
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {},
  mounted() {
    console.log("Sandbox mounted.");
  },
};
</script>

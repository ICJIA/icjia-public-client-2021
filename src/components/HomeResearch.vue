<template>
  <v-card elevation="0" style="margin-top: -5px; margin-bottom: 18px">
    <!-- <WidgetBar
      title="Latest Research"
      style="margin-top: 10px"
      :menuItems="eventItems"
    ></WidgetBar> -->
    <v-tabs
      show-arrows
      v-model="eventModel"
      :vertical="
        $vuetify.breakpoint.md ||
        $vuetify.breakpoint.lg ||
        $vuetify.breakpoint.xl
      "
      ><div style="height: 15px"></div>
      <v-tab>Articles</v-tab>
      <v-tab>Web Apps </v-tab>
      <v-tab>Datasets</v-tab>

      <v-tab-item>
        <v-container fluid style="background: #fff">
          <v-row no-gutters>
            <v-col cols="12" md="4" v-for="n in 3" :key="`article-${n}`">
              <HomeResearchCard
                :item="hubArticles[n - 1]"
                type="article"
                v-if="!hubLoading"
              ></HomeResearchCard>
              <v-card height="300" class="px-3 py-3" v-else>
                <v-skeleton-loader
                  class="mx-auto"
                  type="card"
                ></v-skeleton-loader>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-tab-item>
      <v-tab-item>
        <v-container fluid style="background: #fff">
          <v-row no-gutters>
            <v-col cols="12" md="4" v-for="n in 3" :key="`app-${n}`">
              <HomeResearchCard
                :item="hubApplications[n - 1]"
                type="app"
                v-if="!hubLoading"
              ></HomeResearchCard>
              <v-card height="300" class="px-3 py-3" v-else>
                <v-skeleton-loader
                  class="mx-auto"
                  type="card"
                ></v-skeleton-loader>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-tab-item>
      <v-tab-item>
        <v-container fluid style="background: #fff">
          <v-row no-gutters>
            <v-col cols="12" md="4" v-for="n in 3" :key="`dataset-${n}`">
              <HomeResearchCard
                :item="hubDatasets[n - 1]"
                type="dataset"
                v-if="!hubLoading"
              ></HomeResearchCard>
              <v-card height="300" class="px-3 py-3" v-else>
                <v-skeleton-loader
                  class="mx-auto"
                  type="card"
                ></v-skeleton-loader>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-tab-item>
    </v-tabs>
  </v-card>
</template>

<script>
import {
  getHubApplications,
  getHubArticles,
  getHubDatasets,
} from "@/services/ResearchHub";
export default {
  data() {
    return {
      eventModel: 0,
      eventItems: ["ICJIA ResearchHub"],
      hubApplications: null,
      hubArticles: null,
      hubDatasets: null,
      hubLoading: true,
      limit: 3,
    };
  },
  watch: {
    eventModel(newValue) {
      console.log("Tab click: ", newValue);
    },
  },
  async mounted() {
    console.log("fetch here");
    this.hubApplications = await getHubApplications(3);
    this.hubArticles = await getHubArticles(3);
    this.hubDatasets = await getHubDatasets(3);
    console.log(this.hubArticles);
    this.hubLoading = false;
  },
};
</script>

<style scoped>
.v-tab {
  font-size: 24px !important;
  font-weight: 400 !important;
  color: #000 !important;
  letter-spacing: 0.01rem !important;
}
.v-tab--active {
  font-weight: 900 !important;
  background: #666 !important;
  color: #fff !important;
}
</style>

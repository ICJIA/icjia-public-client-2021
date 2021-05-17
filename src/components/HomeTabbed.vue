<template>
  <div>
    <div v-if="!loading">
      <v-tabs
        show-arrows
        v-model="fundingModel"
        grow
        class="mt-2"
        color="grey darken-1"
      >
        <v-tab>Funding </v-tab>
        <v-tab>Employment </v-tab>
        <v-tab-item
          :style="`background: #e8e8e8 !important; height: ${tabViewHeight}px !important`"
        >
          <div style="height: 10px; background: #eee !important"></div>

          <v-card
            :height="cardHeight"
            class="mb-3 px-2 py-2"
            v-for="(grant, index) in grants"
            :key="`funding-${index}`"
          >
            <h2 style="font-size: 18px">{{ grant.title }}</h2>
            <p>{{ truncate(grant.summary, 35) }}</p>
          </v-card>
        </v-tab-item>

        <v-tab-item
          :style="`background: #e8e8e8 !important; height: ${tabViewHeight}px !important`"
        >
          <div style="height: 5px; background: #eee !important"></div>
          <div v-if="employment.length > 0">
            <div
              v-for="(job, index) in employment"
              :key="`employment-${index}`"
            >
              <v-card min-height="150">
                <v-card
                  :height="cardHeight"
                  class="mb-3"
                  v-for="(job, index) in employment"
                  :key="`funding-${index}`"
                >
                  <h2>{{ job.title }}</h2>
                  <p>{{ job.summary }}</p>
                </v-card></v-card
              >
            </div>
          </div>
          <div v-else>
            <v-card style="height: 400px"
              ><v-container fill-height fluid>
                <v-row align="center" justify="center">
                  <v-col class="text-center"
                    ><h2>
                      There are no current employment opportunities
                    </h2></v-col
                  >
                </v-row>
              </v-container></v-card
            >
          </div>
        </v-tab-item>
      </v-tabs>
    </div>
    <div v-if="loading">
      <Loader
        loaderType="skeleton"
        :repeat="4"
        loaderDisplayType="list-item-avatar-three-line, list-item-three-line"
      ></Loader>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    tabViewHeight() {
      if (this.grants.length > 0) {
        return this.grants.length * (this.cardHeight + 25);
      } else {
        return 900;
      }
    },
  },
  methods: {
    truncate(string, maxWords = 20) {
      var strippedString = string.trim();
      var array = strippedString.split(" ");
      var wordCount = array.length;
      string = array.splice(0, maxWords).join(" ");

      if (wordCount > maxWords) {
        string += "...";
      }

      return string;
    },
  },
  data() {
    return {
      fundingModel: 0,
    };
  },
  props: {
    cardHeight: {
      type: Number,
      default: 200,
    },
    grants: {
      type: Array,
      default: () => [],
    },
    employment: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: true,
    },
    height: {
      type: Number,
      default: 500,
    },
  },
};
</script>

<style scoped>
.v-tab {
  font-size: 24px !important;
  font-weight: 400 !important;
  color: #000 !important;
  letter-spacing: 0.005rem !important;
}
.v-tab--active {
  font-weight: 900 !important;
  background: #666 !important;
  color: #fff !important;
}

.theme--light.v-tabs-items {
  background-color: #e8e8e8 !important;
}
</style>

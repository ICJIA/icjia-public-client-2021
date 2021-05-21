<template>
  <div>
    <div v-if="!loading">
      <v-tabs show-arrows v-model="fundingModel" grow class="mt-2">
        <v-tab>Funding </v-tab>
        <v-tab>Employment </v-tab>
        <v-tab-item :style="`background: #fff !important; `">
          <div
            style="
              height: 15px;
              background: #fff !important;
              border-top: 1px solid #e8e8e8;
            "
          ></div>

          <v-card
            min-height="150"
            class="test py-3 px-8"
            v-for="(grant, index) in grants"
            :key="`funding-${index}`"
            elevation="0"
          >
            <div class="px-2">
              <h2 style="font-size: 18px">{{ grant.title }}</h2>
              <p>{{ grant.summary }}</p>
            </div>
          </v-card>
        </v-tab-item>

        <v-tab-item :style="`background: #fff !important;`">
          <div
            style="
              height: 15px;
              background: #fff !important;
              border-top: 1px solid #e8e8e8;
            "
          ></div>
          <div v-if="employment.length > 0">
            <div
              v-for="(job, index) in employment"
              :key="`employment-${index}`"
            >
              <v-card :min-height="cardHeight" elevation="0" class="px-8">
                <div
                  class=""
                  v-for="(job, index) in employment"
                  :key="`funding-${index}`"
                >
                  <h2>{{ job.title }}</h2>
                  <p>{{ job.summary }}</p>
                </div></v-card
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
        return this.grants.length * 150;
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
  background: rgb(52, 92, 179) !important;
  color: #fff !important;
}

* >>> .theme--light.v-tabs-items {
  background-color: #e8e8e8 !important;
}
</style>

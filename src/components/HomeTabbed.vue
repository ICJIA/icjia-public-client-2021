<template>
  <div>
    <div v-if="!loading">
      <v-tabs
        show-arrows
        v-model="fundingModel"
        grow
        class="mt-2"
        style="border-top: 0px solid #d8d8d8"
      >
        <v-tab>Funding</v-tab>
        <v-tab>Meetings </v-tab>
        <v-tab>Employment </v-tab>

        <v-tab-item :style="`background: #fff !important; `">
          <div style="height: 15px; background: #fff !important"></div>

          <v-card
            min-height="150"
            class="test py-3 px-8 hover card"
            v-for="(grant, index) in grants"
            :key="`funding-${index}`"
            elevation="0"
            :class="{ 'rule-top': index > 0 }"
            @click="routeTo(grant.fullPath)"
          >
            <div class="text-right">
              <!-- <span
                style="
                  font-size: 12px;
                  color: #fff;
                  font-weight: 400;
                  padding: 3px 3px;
                  background: rgb(42, 114, 196);
                  margin-right: 1px;
                "
              >
                {{ getCategory(grant.category) }}
              </span> -->

              <!-- <span
                v-if="isItExpired(grant.end)"
                style="
                  font-size: 12px;
                  color: #fff;
                  padding: 3px 3px;
                  background: #cc2222;
                "
              >
                Expired
              </span> -->
              <!-- <span
                v-if="!isItExpired(grant.end)"
                style="
                  font-size: 12px;
                  color: #fff;
                  padding: 3px 3px;
                  background: green;
                "
              >
                Expires {{ grant.end | format }}
              </span> -->
            </div>
            <div>
              <!-- <span
                v-if="isItExpired(grant.end)"
                style="
                  font-size: 12px;
                  font-weight: 700;
                  color: #222;
                  padding: 3px;
                  background: #fff;
                  border: 1px solid #ddd;
                "
                class="mr-2"
                >EXPIRED</span
              > -->
              <v-chip
                small
                v-if="isItExpired(grant.end)"
                class="mr-1"
                color="grey lighten-2"
                style="font-weight: 700"
                >Expired</v-chip
              >
              <!-- <span
                v-if="!isItExpired(grant.end)"
                class="mr-2"
                style="
                  font-size: 12px;
                  font-weight: 700;
                  color: #fff;
                  padding: 3px;
                  background: #0e4472;
                "
                >Expires {{ grant.end | format }}</span
              > -->
              <v-chip
                small
                dark
                v-if="!isItExpired(grant.end)"
                class="mr-1"
                color="blue darken-4"
                style="font-weight: 700"
                >Expires {{ grant.end | fromNow }}</v-chip
              >
              <span style="font-weight: 700; font-size: 16px; color: #666">
                {{ getCategory(grant.category) }}
              </span>
              <h2 style="font-size: 18px" class="mt-1">{{ grant.title }}</h2>
              <p>{{ grant.summary }}</p>
            </div>
          </v-card>
        </v-tab-item>

        <v-tab-item :style="`background: #fff !important;`">
          <div style="height: 15px; background: #fff !important"></div>
          <v-sheet style="min-height: 200px !important">
            <h2>TODO: Upcoming Meetings here</h2>
          </v-sheet>
        </v-tab-item>

        <v-tab-item :style="`background: #fff !important;`">
          <div style="height: 15px; background: #fff !important"></div>
          <div v-if="employment.length > 0">
            <div
              v-for="(job, index) in employment"
              :key="`employment-${index}`"
            >
              <v-card
                :min-height="cardHeight"
                elevation="0"
                class="px-8 hover card"
                :class="{ 'rule-top': index > 0 }"
                @click="routeTo(job.fullPath)"
              >
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
            <v-card style="height: 200px"
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
    isItExpired(expiration) {
      //console.log(expiration);
      let now = new Date();
      let expired = new Date(expiration);
      if (now > expired) {
        return true;
      } else {
        return false;
      }
    },
    getCategory(cat) {
      let category = "";
      if (cat === "nofo") {
        category = "Notice of Funding Opportunity";
      }
      if (cat === "rfi") {
        category = "Request for Information";
      }
      return category;
    },
    routeTo(fullPath) {
      //console.log(fullPath);
      this.$router.push(fullPath);
    },
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
  font-size: 22px !important;
  font-weight: 400 !important;
  color: #000 !important;
  letter-spacing: 0.005rem !important;
}
.v-tab--active {
  font-weight: 900 !important;
  background: #e8e8e8;
  color: #333 !important;
  border: 1px solid #ccc;
}

* >>> .theme--light.v-tabs-items {
  background-color: #e8e8e8 !important;
}

.rule-top {
  border-top: 1px solid #ddd !important;
}
</style>

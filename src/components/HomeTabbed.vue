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
            <div class="text-right"></div>
            <div>
              <div>
                <span style="font-weight: 700; font-size: 0.9em; color: #000">
                  {{ getCategory(grant.category) }}
                </span>
                <span v-if="isItExpired(grant.end)">
                  &nbsp;|&nbsp;
                  <v-chip
                    x-small
                    class="mr-1"
                    dark
                    color="#AD2E2E"
                    style="font-weight: 700"
                    >Expired</v-chip
                  >
                </span>
                <span
                  v-if="!isItExpired(grant.end)"
                  style="font-size: 0.9em; font-weight: 400"
                  >&nbsp;|&nbsp; {{ grant.start | dateFormatAlt }} to
                  {{ grant.end | dateFormatAlt }}
                </span>
              </div>

              <h2 style="font-size: 1.1em" class="mt-2">
                <v-chip
                  v-if="isItNew(grant)"
                  label
                  small
                  color="#0D4474"
                  class="mr-2"
                >
                  <span style="color: #fff !important; font-weight: 400">
                    NEW!
                  </span>
                </v-chip>
                {{ grant.title }}
              </h2>

              <p style="font-size: 0.9em" class="mt-2">{{ grant.summary }}</p>
            </div>
          </v-card>
        </v-tab-item>

        <v-tab-item :style="`background: #fff !important;`">
          <div style="height: 15px; background: #fff !important"></div>
          <v-sheet style="min-height: 200px !important">
            <div v-for="(meeting, index) in meetings" :key="`meeting-${index}`">
              <v-card
                elevation="0"
                class="px-8 py-8 hover card"
                :class="{ 'rule-top': index > 0 }"
                @click="routeTo(meeting.fullPath)"
              >
                <span style="font-weight: 700; font-size: 0.9em; color: #000">
                  MEETING
                </span>

                <span style="font-size: 0.9em; font-weight: 400"
                  >&nbsp;|&nbsp;
                  {{ meeting.start | format }}
                </span>
                <span v-if="!isItExpired(meeting.end)">
                  &nbsp;|&nbsp;
                  <v-chip
                    x-small
                    class="mr-1"
                    color="green darken-2"
                    style="font-weight: 700"
                    >Upcoming</v-chip
                  >
                </span>
                <h2 class="mt-2" style="font-size: 1.1em">
                  {{ meeting.title }}
                </h2>

                <p style="font-size: 0.9em" class="mt-2">
                  {{ meeting.summary }}
                </p>
              </v-card>
            </div>
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
                elevation="0"
                class="px-8 py-8 hover card"
                :class="{ 'rule-top': index > 0 }"
                @click="routeTo(job.fullPath)"
              >
                <span style="font-weight: 700; font-size: 14px; color: #000">
                  Employment Opportunity
                </span>
                <span v-if="isItExpiredEmployment(job.end)">
                  &nbsp;|&nbsp;
                  <v-chip
                    x-small
                    color="red darken-2"
                    class="mr-1"
                    dark
                    style="font-weight: 700"
                    >Expired</v-chip
                  >
                </span>
                <span
                  v-if="!isItExpiredEmployment(job.end)"
                  style="font-size: 14px; font-weight: 400"
                  >&nbsp;|&nbsp; Accepting applications through
                  {{ job.end | format }}
                </span>

                <h2 class="mt-2" style="font-size: 1.1em">
                  <v-chip
                    v-if="isItNew(job)"
                    label
                    small
                    color="#0D4474"
                    class="mr-2"
                  >
                    <span style="color: #fff !important; font-weight: 400">
                      NEW!
                    </span> </v-chip
                  >{{ job.title }}
                </h2>

                <p style="font-size: 0.9em" class="mt-2">{{ job.summary }}</p>
              </v-card>
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
const addOneDayToDate = function (date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
};
import moment from "moment";
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
    isItNew(item, daysToShowNew = 7) {
      const now = moment(new Date());
      const end = moment(item.published_at); // another date
      const duration = moment.duration(now.diff(end));

      const days = duration.asDays();
      if (days <= daysToShowNew) {
        //console.log(item.title, days);
        return true;
      } else {
        return false;
      }
    },
    getColor(start, end) {
      let localStart = moment().tz(this.$myApp.config.timezone);
      let localEnd = moment(end).tz(this.$myApp.config.timezone);
      let daysBetween = moment(localEnd).diff(moment(localStart), "days") + 1;
      if (daysBetween >= 7) {
        return "green darken-4";
      } else {
        return "yellow darken-3";
      }
    },
    //TODO: Sort out these expiration dates.
    isItExpired(expiration) {
      //console.log(expiration);
      let now = new Date();
      let expired = addOneDayToDate(new Date(expiration));
      // let expired = new Date(expiration);
      // expired.setHours(24, 0, 0, 0);
      //expired.setHours(24, 0, 0, 0);
      //console.log(expired);
      // TODO: Fix this date stuff
      if (now > expired) {
        return true;
      } else {
        return false;
      }
    },
    isItExpiredEmployment(expiration) {
      //console.log(expiration);
      let now = new Date();
      let expired = addOneDayToDate(new Date(expiration));

      if (now >= expired) {
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
      addOneDayToDate,
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
    meetings: {
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

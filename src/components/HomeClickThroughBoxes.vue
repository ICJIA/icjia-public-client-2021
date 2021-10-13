<template>
  <div>
    <v-container fill-height fluid class="px-0" style="margin-top: -10px">
      <v-row no-gutters>
        <v-col
          cols="12"
          :md="getBoxSize"
          v-for="(box, index) in boxes"
          :key="`box-${index}`"
        >
          <v-card
            dark
            :height="getHeight()"
            class="elevation-0 px-8 pt-11 box text-center hover"
            style="margin-bottom: 3px"
            color="#0E4471"
            :class="{ mr1: index > -1 && index < boxes.length - 1 }"
            @click="routeToURL(box)"
          >
            <v-btn
              color="blue darken-3"
              fab
              dark
              absolute
              top
              left
              v-if="isItNew(box.datePosted)"
              aria-label="New!"
            >
              <span style="color: #fff !important"> NEW!</span>
            </v-btn>
            <v-icon style="font-size: 70px" dark v-if="box.icon">{{
              box.icon
            }}</v-icon>
            <v-icon style="font-size: 70px" dark v-else>people</v-icon>
            <h2 class="text-center box-head mt-3">{{ box.title }}</h2>

            <v-card-text
              class="px-2 mt-1 font-weight-light box-text text-center"
            >
              <span v-html="box.teaser" style="font-size: 16px"></span>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    <!-- Boxes: {{ boxes }} -->
  </div>
</template>

<script>
import moment from "moment";
export default {
  computed: {
    getBoxSize() {
      return 12 / this.boxes.length;
    },
  },
  methods: {
    getHeight() {
      if (this.$vuetify.breakpoint.smAndDown) {
        return 400;
      } else {
        return 350;
      }
    },
    isItNew(datePosted) {
      if (!datePosted) return false;
      let now = moment(new Date()); //todays date
      let end = moment(datePosted); // another date
      let duration = moment.duration(now.diff(end));
      let days = duration.asDays();
      //console.log("click through boxes duration: ", days);
      if (days <= this.$myApp.config.daysToShowNew) {
        return true;
      } else {
        return false;
      }
    },
    routeToURL(box) {
      if (!box.url) return null;
      const checkDomain = function (url) {
        if (url.indexOf("//") === 0) {
          url = location.protocol + url;
        }
        return url
          .toLowerCase()
          .replace(/([a-z])?:\/\//, "$1")
          .split("/")[0];
      };

      const isExternal = function (url) {
        return (
          (url.indexOf(":") > -1 || url.indexOf("//") > -1) &&
          checkDomain(location.href) !== checkDomain(url)
        );
      };
      if (isExternal(box.url)) {
        window.open(box.url, "noopener,resizable,scrollbars").focus();
      } else {
        this.$router.push(box.url);
      }
    },
    getFeatureBoxColor(index) {
      //TODO: Figure this out dynamically
      return this.colors[index];
    },
  },
  data() {
    return {
      // colors: ["#0E4471", "#0E4471", "#0E4471", "#0E4471"],
    };
  },
  props: {
    boxes: {
      type: Array,
      default: () => {},
    },
  },
};
</script>

<style scoped>
a {
  text-decoration: none !important;
}
.box:hover {
  background: #ccc !important;
}
.box:hover > * {
  color: #000 !important;
  cursor: pointer;
}
.box-head {
  font-size: 28px;
  text-transform: uppercase;
  color: #fff;
  font-weight: 900;
}
.box-text {
  font-size: 18px;
  margin-top: 8px;
  color: #fff;
}
.box-text:hover {
  color: #000 !important;
}
.rule {
  border-bottom: 1px solid #ccc !important;
  border-top: 1px solid #ccc !important;
}

.v-sheet.v-card {
  border-radius: 0px;
}

.mr1 {
  margin-right: 2px;
}

.ml1 {
  margin-left: 2px;
}
</style>

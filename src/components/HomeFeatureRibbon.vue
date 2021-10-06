<template>
  <div>
    <v-container fill-height fluid class="px-0" style="margin-top: -12px">
      <v-row no-gutters>
        <v-col
          cols="12"
          :md="getRibbonSize"
          v-for="(item, index) in items"
          :key="`item-${index}`"
        >
          <v-hover v-if="item && item.splash">
            <template v-slot:default="{ hover }">
              <v-img
                :src="`https://agency.icjia-api.cloud${item.splash.formats.small.url}`"
                :lazy-src="`https://agency.icjia-api.cloud${item.splash.formats.thumbnail.url}`"
                aspect-ratio="1.7"
                height="450"
                class="hover"
                :class="{ 'right-rule': index < items.length - 1 }"
                @click="
                  $router.push(item.fullPath).catch((err) => {
                    $vuetify.goTo(0);
                  })
                "
              >
                <v-container fluid>
                  <v-row align="end">
                    <v-col class="text-left" style="margin: 0; padding: 0">
                      <div
                        style="
                          color: #fff;
                          position: absolute;
                          bottom: 0px;

                          width: 100% !important;
                          height: 250px;
                        "
                        class="px-4 pt-4 pb-12"
                        :class="{ 'feature-background': !hover }"
                      >
                        <v-container fill-height fluid>
                          <v-row align="center" justify="center">
                            <v-col
                              ><v-chip
                                class="mb-4"
                                small
                                color="white"
                                style="color: #000; font-weight: 900"
                              >
                                Feature
                              </v-chip>
                              <h2>
                                {{ item.title }}
                              </h2></v-col
                            >
                          </v-row>
                        </v-container>
                      </div></v-col
                    >
                  </v-row>
                </v-container>
                <v-fade-transition>
                  <v-overlay v-if="hover" absolute color="blue darken-4">
                    <v-btn color="#0D4474" :to="item.fullPath">Read more</v-btn>
                  </v-overlay>
                </v-fade-transition>
              </v-img>
            </template>
          </v-hover>

          <v-hover v-else>
            <template v-slot:default="{ hover }">
              <v-img
                src="https://agency.icjia-api.cloud/uploads/medium_government_generic_07d231af16.jpg"
                lazy-src="https://agency.icjia-api.cloud/uploads/thumbnail_government_generic_07d231af16.jpg"
                aspect-ratio="1.7"
                height="450"
                :class="{ 'right-rule': index < items.length - 1 }"
                @click="
                  $router.push(item.fullPath).catch((err) => {
                    $vuetify.goTo(0);
                  })
                "
              >
                <v-container fluid>
                  <v-row align="end">
                    <v-col class="text-left" style="margin: 0; padding: 0">
                      <div
                        style="
                          color: #fff;
                          position: absolute;
                          bottom: 0px;

                          width: 100% !important;
                          height: 250px;
                        "
                        class="px-4 pt-4 pb-12"
                        :class="{ 'feature-background': !hover }"
                      >
                        <v-container fill-height fluid>
                          <v-row align="center" justify="center">
                            <v-col
                              ><v-chip
                                class="mb-4"
                                small
                                color="white"
                                style="color: #000; font-weight: 900"
                              >
                                Feature
                              </v-chip>
                              <h2>
                                {{ item.title }}
                              </h2></v-col
                            >
                          </v-row>
                        </v-container>
                      </div></v-col
                    >
                  </v-row>
                </v-container>
                <v-fade-transition>
                  <v-overlay v-if="hover" absolute color="blue darken-4">
                    <v-btn color="#0D4474" :to="item.fullPath">Read more</v-btn>
                  </v-overlay>
                </v-fade-transition>
              </v-img>
            </template>
          </v-hover>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import moment from "moment";
export default {
  computed: {
    getRibbonSize() {
      return 12 / this.items.length;
    },
  },
  methods: {
    getHeight() {
      if (this.$vuetify.breakpoint.smAndDown) {
        return 550;
      } else {
        return 450;
      }
    },
    isItNew(datePosted) {
      if (!datePosted) return false;
      let now = moment(new Date()); //todays date
      let end = moment(datePosted); // another date
      let duration = moment.duration(now.diff(end));
      let days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNew) {
        return true;
      } else {
        return false;
      }
    },
    routeToURL(item) {
      if (!item.url) return null;
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
      if (isExternal(item.url)) {
        window.open(item.url, "noopener,resizable,scrollbars").focus();
      } else {
        this.$router.push(item.url);
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
  mounted() {},
  props: {
    items: {
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

.right-rule {
  border-right: 1px solid #ccc !important;
}

.feature-background {
  background: rgba(100, 100, 100, 0.5);
}
</style>

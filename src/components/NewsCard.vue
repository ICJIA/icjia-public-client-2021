<template>
  <div>
    <v-card
      class="grid-item markdown-body hover news-card mt-2 mb-2 px-3 mr-1 ml-1"
      height="175px"
      elevation="0"
      color="#fff"
      v-if="
        $vuetify.breakpoint.md ||
        $vuetify.breakpoint.lg ||
        $vuetify.breakpoint.xl
      "
      style="overflow-y: auto !important"
    >
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="3">
            <v-img
              aria-label="News post image"
              :src="`https://agency.icjia-api.cloud${item.splash.formats.thumbnail.url}`"
              height="135px"
              class=""
              style="border: 0px solid #fafafa"
              alt="ICJIA Intranet image"
              v-if="item.splash"
            >
              <!-- <v-chip
                dark
                label
                style="margin-top: -1px"
                color="#333"
                class="icjia-card"
              >
                NEW! </v-chip
              > -->
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular
                    indeterminate
                    aria-label="Progress bar: Loading"
                    color="blue darken-3"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            <v-img
              aria-label="News post image"
              src="/icjia-half-splash-thumb.jpg"
              height="135px"
              class=""
              style="border: 0px solid #fafafa"
              alt="ICJIA Intranet image"
              v-else
            >
              <!-- <v-chip
                dark
                label
                style="margin-top: -1px"
                color="#333"
                class="icjia-card"
              >
                NEW! </v-chip
              > -->
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular
                    indeterminate
                    aria-label="Progress bar: Loading"
                    color="blue darken-3"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
          </v-col>
          <v-col cols="12" md="8"
            ><v-card-text
              style="
                font-size: 14px;
                margin-top: -25px;
                color: #000;
                font-weight: 400;
              "
            >
              {{ item.published_at | format }}
            </v-card-text>

            <v-card-text
              ><div
                style="
                  margin-top: -25px;
                  font-size: 18px;
                  font-weight: 700;
                  line-height: 24px;
                "
              >
                <router-link to="/" class="card-link">
                  <span style="font-weight: 900"> {{ item.title }} </span>
                </router-link>
              </div></v-card-text
            >

            <v-card-text style="margin-top: -15px"
              ><div>
                <p>
                  {{ truncate(item.summary) }}
                </p>
              </div></v-card-text
            >
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <v-card
      v-else
      class="grid-item markdown-body hover card"
      elevation="0"
      color="#fff"
      style="border: 1px solid #ccc"
    >
      <div class="px-5">
        <v-card-text style="font-size: 12px">January 22, 2022 </v-card-text>

        <v-card-text
          ><div
            style="
              margin-top: -20px;
              font-size: 22px;
              font-weight: bold;
              line-height: 28px;
            "
          >
            News Item Title here
          </div></v-card-text
        >

        <v-card-text style="margin-top: -15px"
          >Orem markdownum Oechalia tenus, bracchia concolor tum, et in tota a
          generum.</v-card-text
        >
      </div>
    </v-card>
  </div>
</template>

<script>
export default {
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
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
};
</script>

<style lang="scss" scoped></style>

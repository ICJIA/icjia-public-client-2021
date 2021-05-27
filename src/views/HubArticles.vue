<template>
  <div>
    <BaseContent :loading="hubLoading">
      <template slot="content">
        <v-container fluid>
          <v-row>
            <v-col
              v-for="(item, index) in hubArticles"
              :key="index"
              class="child"
              cols="12"
              md="4"
            >
              <HubCard :item="item"></HubCard>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import { getAllHubArticles } from "@/services/ResearchHub";
// import moment from "moment";
// import { getImageURL } from "@/services/Image";
import _ from "lodash";
export default {
  data() {
    return {
      hubArticles: null,
      hubLoading: true,
      masonry: null,
      view: "block",
      splashHeight: "250",
    };
  },
  async mounted() {
    let hubArticles = await getAllHubArticles();
    hubArticles = _.orderBy(hubArticles, ["date"], ["desc"]);
    this.hubArticles = hubArticles.map((e) => ({
      ...e,
      fullPath: `/researchhub/articles/${e.slug}/`,
      imagePath: `https://icjia.illinois.gov/researchhub/images/${e.id}-splash.jpeg`,
      contentType: "Article",
    }));
    console.log("articles: ", this.hubArticles);
    this.hubLoading = false;
  },
  methods: {
    // getImagePath(url, imgWidth = 0, imgHeight = 0, imageQuality = 5) {
    //   let imgPath;
    //   imgPath = `${url}`;
    //   const thumborImgPath = getImageURL(
    //     imgPath,
    //     imgWidth,
    //     imgHeight,
    //     imageQuality
    //   );
    //   // console.log(thumborImgPath)
    //   return thumborImgPath;
    // },
    // getSplash(item) {
    //   return `${item.imagePath}`;
    // },
    // isItNew(item) {
    //   const now = moment(new Date());
    //   const end = moment(item.published_at); // another date
    //   const duration = moment.duration(now.diff(end));
    //   const days = duration.asDays();
    //   if (days <= 14) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // },
  },
};
</script>

<style lang="scss" scoped></style>

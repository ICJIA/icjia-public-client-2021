<template>
  <div>
    <v-card class="px-5 py-5 my-1 mx-1 text-left" color="#fafafa">
      <span
        style="font-weight: 400; font-size: 12px"
        class="mb-5 px-3"
        v-if="item && item.publicationDate"
        >{{ item.publicationDate | dateFormatAlt }}</span
      >
      <div
        style="font-weight: 900; text-transform: uppercase; font-size: 26px"
        class="mb-3 mt-2 px-3"
        v-if="item && item.title"
      >
        <span
          class="item-title"
          @click.stop.prevent="
            $router.push(item.fullPath).catch((err) => {
              $vuetify.goTo(0);
            })
          "
          >{{ item.title }}</span
        >
      </div>
      <div v-if="item.summary && item.summary.length" class="px-3">
        {{ item.summary }}
      </div>
      <div v-else class="px-3">No summary available</div>

      <ul style="font-size: 14px" class="mt-5 ml-2">
        <li v-if="item.localArticlePath" class="mt-2">
          <span style="font-weight: 700">Article&nbsp;</span><br />
          <router-link :to="item.localArticlePath">{{
            item.articleURL
          }}</router-link>
        </li>

        <li v-if="item.fileURL" class="mt-2">
          <span style="font-weight: 700">Download&nbsp;</span><br />
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <a :href="item.fileURL" target="_blank" v-bind="attrs" v-on="on"
                >{{ item.title }}
              </a>
            </template>
            <span>{{ item.fileURL }}</span>
          </v-tooltip> -->
          <a
            :href="item.fileURL"
            @click="registerDownload(item.fileURL)"
            target="_blank"
            >{{ item.title }}
          </a>
          &nbsp;<v-chip x-small style="font-weight: 900">{{
            getFileType(item.fileURL)
          }}</v-chip>
        </li>
      </ul>
      <div v-if="item.tags" class="py-2 px-3">
        <BasePropChip
          v-for="(tag, index) of item.tags"
          :key="index"
          class="mt-1"
        >
          <template>{{ tag }}</template>
        </BasePropChip>
      </div>
      <div
        style="background: #fdfdfd; font-size: 12px; border: 1px solid #eee"
        class="text-center mt-10 px-3 py-3"
      >
        Individual publications, as well as old meeting agendas, minutes, and
        materials, are always available for download from the ICJIA Document
        Archive:
        <a href="https://archive.icjia.cloud" target="_blank"
          >https://archive.icjia.cloud</a
        >
      </div>
    </v-card>
  </div>
</template>

<script>
export default {
  methods: {
    // eslint-disable-next-line no-unused-vars
    registerDownload(url) {
      var domain = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
      domain = domain.split("/")[0];
      // eslint-disable-next-line no-unused-vars
      let analyticsURL = url.replace(domain, "").replace("https://", "");
      //console.log(analyticsURL);
      // window.plausible("file_download", { props: { url: analyticsURL } });
    },

    getFileType(url) {
      return url.split(/[#?]/)[0].split(".").pop().trim().toUpperCase();
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

<style scoped>
.item-title {
  cursor: pointer;
}
.item-title:hover {
  text-decoration: underline;
}
</style>

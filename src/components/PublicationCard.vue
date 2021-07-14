<template>
  <div>
    <v-card class="px-5 py-5 my-1 mx-1 text-left" color="#fafafa">
      <div
        style="font-weight: 900; text-transform: uppercase; font-size: 16px"
        class="mb-3 px-3"
      >
        {{ item.title }} |
        <span style="font-weight: 300">{{
          item.publicationDate | format
        }}</span>
      </div>
      <div v-if="item.summary && item.summary.length" class="px-3">
        {{ item.summary }}
      </div>
      <div v-else class="px-3">No summary available</div>

      <ul style="font-size: 14px" class="mt-5 ml-2">
        <li v-if="item.localArticlePath" class="mt-2">
          <span style="font-weight: 700">Article:&nbsp;</span>
          <router-link :to="item.localArticlePath">{{
            item.articleURL
          }}</router-link>
        </li>

        <li v-if="item.fileURL" class="mt-2">
          <span style="font-weight: 700">Download:&nbsp;</span>
          <a :href="item.fileURL" target="_blank">{{ item.fileURL }}</a>
        </li>
      </ul>
    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
};
</script>

<style lang="scss" scoped></style>

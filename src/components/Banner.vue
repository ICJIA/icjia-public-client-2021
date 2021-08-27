<template>
  <div v-if="item">
    <v-alert
      v-model="alert"
      close-text="Close Alert"
      :color="item.bannerColor"
      :dark="item.whiteText"
      dismissible
    >
      <span v-html="item.bannerText" class="banner-text"></span>
    </v-alert>
  </div>
</template>

<script>
import { renderToHtml } from "@/services/Markdown";
export default {
  data() {
    return {
      alert: true,
    };
  },
  methods: {
    render(content) {
      return renderToHtml(content);
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
* >>> .banner-text a {
  color: #fff;
}

* >>> .banner-text a:hover {
  color: #ccc !important;
}
</style>

<template>
  <v-app>
    <div
      role="navigation"
      style="z-index: 10000"
      aria-labelledby="skip-to-content"
    >
      <router-link
        to="#content"
        aria-label="Skip to content"
        class="skiplink"
        @click.native="scrollFix('#content')"
        title="Skip Navigation"
        style="font-size: 12px"
        id="skip-to-content"
      >
        Skip to content
      </router-link>
    </div>
    <AppNav @hook:mounted="fixA11y()"></AppNav>
    <v-main style="background: #f3f3f3">
      <transition name="fade" mode="out-in">
        <router-view :key="$route.fullPath"></router-view>
      </transition>
    </v-main>

    <ModalSearch></ModalSearch>
  </v-app>
</template>

<script>
export default {
  name: "App",
  methods: {
    fixA11y() {
      console.log("fix a11y here.");
    },
    scrollFix: function () {
      // var hash = location.hash.substr(1);
      // var el = document.getElementById(`${hash}`);
      // if (hash && el) {
      //   //console.log(hash);
      //   this.$vuetify.goTo(`#${hash}`, { offset: 12 }).catch(() => {
      //     this.$vuetify.goTo(0);
      //   });
      // }
    },
  },

  mounted() {
    console.log(this.$myApp);
  },
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition-duration: 0.2s;
  transition-property: opacity;
  transition-timing-function: ease;
}
.fade-enter,
.fade-leave-active {
  opacity: 0;
}
.container.full-width {
  width: 100%;
  padding: 0px !important;
}
</style>

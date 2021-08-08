<template>
  <div>
    <v-speed-dial
      v-model="socialSharing"
      :bottom="true"
      :right="true"
      direction="top"
      :open-on-hover="false"
      absolute
      fixed
    >
      <template v-slot:activator>
        <v-tooltip left>
          <template v-slot:activator="{ on }">
            <v-btn
              v-model="socialSharing"
              color="blue darken-4"
              dark
              fab
              v-on="on"
            >
              <v-icon v-if="socialSharing"> mdi-close </v-icon>
              <v-icon v-else>fa fa-users</v-icon>
            </v-btn>
          </template>
          <span v-if="!socialSharing">Share or translate this page</span>
          <span v-else>Close sharing and translate</span>
        </v-tooltip>
      </template>
      <v-tooltip left>
        <template v-slot:activator="{ on }">
          <v-btn fab dark small color="#3b5998" v-on="on">
            <v-icon>fab fa-facebook</v-icon>
          </v-btn>
        </template>
        <span>Share this page on Facebook</span>
      </v-tooltip>
      <v-tooltip left>
        <template v-slot:activator="{ on }">
          <v-btn fab dark small color="#1DA1F2" v-on="on">
            <v-icon>fab fa-twitter</v-icon>
          </v-btn>
        </template>
        <span>Share this page on Twitter</span>
      </v-tooltip>
      <v-tooltip left>
        <template v-slot:activator="{ on }">
          <v-btn
            fab
            dark
            small
            color="#4285F4"
            v-on="on"
            @click="openTranslationModal()"
          >
            <v-icon>fas fa-globe</v-icon>
          </v-btn>
        </template>
        <span>Translate this page on Google</span>
      </v-tooltip>
    </v-speed-dial>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  data() {
    return {
      socialSharing: false,
    };
  },
  methods: {
    openTranslationModal() {
      EventBus.$emit("translate", this.$route.fullPath);
    },
  },
};
</script>

<style lang="scss" scoped></style>

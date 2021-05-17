<template>
  <div>
    <div v-if="!loading">
      <v-tabs
        show-arrows
        v-model="fundingModel"
        grow
        class="mt-2"
        color="grey darken-1"
      >
        <v-tab>Funding </v-tab>
        <v-tab>Employment </v-tab>
        <v-tab-item
          style="background: #e8e8e8 !important; height: 900px !important"
          :style="heightObject"
        >
          <div style="height: 10px; background: #eee !important"></div>

          <v-card
            height="200"
            class="mb-3"
            v-for="(grant, index) in grants"
            :key="`funding-${index}`"
          >
            {{ grant.title }}
          </v-card>
        </v-tab-item>

        <v-tab-item
          style="background: #e8e8e8 !important; height: 900px !important"
        >
          <div style="height: 5px; background: #eee !important"></div>
          <div v-if="employment.length > 0">
            <div
              v-for="(job, index) in employment"
              :key="`employment-${index}`"
            >
              <v-card min-height="200">
                <v-card
                  height="200"
                  class="mb-3"
                  v-for="(job, index) in employment"
                  :key="`funding-${index}`"
                >
                  {{ job.title }}
                </v-card></v-card
              >
            </div>
          </div>
          <div v-else>
            <v-card style="height: 400px"
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
export default {
  computed: {},
  data() {
    return {
      fundingModel: 0,
    };
  },
  props: {
    grants: {
      type: Array,
      default: () => [],
    },
    employment: {
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
  font-size: 24px !important;
  font-weight: 400 !important;
  color: #000 !important;
  letter-spacing: 0.005rem !important;
}
.v-tab--active {
  font-weight: 900 !important;
  background: #666 !important;
  color: #fff !important;
}

.theme--light.v-tabs-items {
  background-color: #e8e8e8 !important;
}
</style>

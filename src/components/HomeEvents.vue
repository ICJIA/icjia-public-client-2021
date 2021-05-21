<template>
  <div>
    <WidgetBar title="Upcoming Events" :menuItems="eventMenuItems"></WidgetBar>
    <v-card
      elevation="0"
      style="
        margin-top: -5px;
        margin-bottom: 18px;
        border-top: 1px solid #e8e8e8;
        border-bottom: 1px solid #d8d8d8;
      "
      v-if="!loading"
    >
      <v-tabs
        show-arrows
        v-model="eventModel"
        :vertical="
          $vuetify.breakpoint.md ||
          $vuetify.breakpoint.lg ||
          $vuetify.breakpoint.xl
        "
      >
        <div style="height: 15px"></div>
        <v-tab>Community</v-tab>
        <v-tab>Meetings </v-tab>
        <v-tab>Training</v-tab>
        <v-tab>Funding</v-tab>

        <v-tab-item>
          <v-container
            fluid
            style="background: #fff"
            v-if="community.length > 0"
          >
            <v-row no-gutters>
              <v-col
                cols="12"
                :md="getCardWidth(community.length)"
                v-for="n in community.length"
                :key="`community-${n}`"
                class="rule-left"
              >
                <HomeEventCard
                  :event="community[n - 1]"
                  tag="community"
                ></HomeEventCard>
              </v-col>
            </v-row>
          </v-container>
          <v-container fluid v-else>
            <EmptyCard text="No upcoming community events"></EmptyCard>
          </v-container>
        </v-tab-item>
        <v-tab-item>
          <v-container
            fluid
            style="background: #fff"
            v-if="meetings.length > 0"
          >
            <v-row no-gutters>
              <v-col
                cols="12"
                :md="getCardWidth(meetings.length)"
                v-for="n in meetings.length"
                :key="`meeting-${n}`"
                class="rule-left"
              >
                <HomeEventCard
                  :event="meetings[n - 1]"
                  tag="meeting"
                ></HomeEventCard>
              </v-col>
            </v-row>
          </v-container>
          <v-container fluid v-else>
            <EmptyCard text="No upcoming meetings"></EmptyCard>
          </v-container>
        </v-tab-item>
        <v-tab-item>
          <v-container
            fluid
            style="background: #fff"
            v-if="training.length > 0"
          >
            <v-row no-gutters>
              <v-col
                cols="12"
                :md="getCardWidth(training.length)"
                v-for="n in training.length"
                :key="`training-${n}`"
                class="rule-left"
              >
                <HomeEventCard
                  :event="training[n - 1]"
                  tag="training"
                ></HomeEventCard>
              </v-col>
            </v-row>
          </v-container>
          <v-container fluid v-else>
            <EmptyCard text="No upcoming training opportunities"></EmptyCard>
          </v-container>
        </v-tab-item>
        <v-tab-item>
          <v-container fluid style="background: #fff" v-if="funding.length > 0">
            <v-row no-gutters>
              <v-col
                cols="12"
                :md="getCardWidth(funding.length)"
                v-for="n in funding.length"
                :key="`funding-${n}`"
                class="rule-left"
              >
                <HomeEventCard
                  :event="funding[n - 1]"
                  tag="funding"
                ></HomeEventCard>
              </v-col>
            </v-row>
          </v-container>
          <v-container fluid v-else>
            <EmptyCard text="No upcoming funding opportunities"></EmptyCard>
          </v-container>
        </v-tab-item>
      </v-tabs>
    </v-card>
    <v-card v-else>
      <Loader></Loader>
    </v-card>
  </div>
</template>

<script>
export default {
  methods: {
    getCardWidth(length) {
      let colWidth = 12 / length;

      return colWidth;
    },
  },
  props: {
    community: {
      type: Array,
      default: () => [],
    },
    meetings: {
      type: Array,
      default: () => [],
    },
    funding: {
      type: Array,
      default: () => [],
    },
    training: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      eventModel: 0,
      researchMenuItems: [
        {
          label: "ICJIA Event Calendar",
          url: "/",
        },
        {
          label: "Link 2",
          url: "/",
        },
      ],
    };
  },
  watch: {
    eventModel(newValue) {
      console.log("Tab click: ", newValue);
    },
  },
};
</script>

<style scoped>
* >>> .v-tab {
  font-size: 20px !important;
  font-weight: 400 !important;
  color: #000 !important;
  letter-spacing: 0.01rem !important;
}
* >>> .v-tab--active {
  font-weight: 900 !important;
  background: #666 !important;
  color: #fff !important;
}

.rule-left {
  border-left: 1px solid #e8e8e8 !important;
}
</style>

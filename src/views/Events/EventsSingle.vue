<template>
  <div>
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-container>
          <v-row>
            <v-col>
              <EventCard
                v-if="event"
                :item="event"
                :showClose="false"
                :showURL="false"
                :isClickable="false"
                class="mt-8"
              ></EventCard>
              <div class="mt-3 text-right" style="font-size: 12px">
                <router-link to="/events/"
                  >Event Calendar&nbsp;&raquo;</router-link
                >
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_EVENT_QUERY } from "@/graphql/events";
import { EventBus } from "@/event-bus";
import moment from "moment";
export default {
  data() {
    return {
      loading: true,
      error: null,
      event: null,
    };
  },
  computed: {},
  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    events: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_EVENT_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.events.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);

          this.event = ApolloQueryResult.data.events.map((event) => {
            event.start = moment(event.start)
              .tz(this.$myApp.config.timezone)
              .toDate();
            event.end = moment(event.end)
              .tz(this.$myApp.config.timezone)
              .toDate();

            event.color = "green darken-4";
            event.show = false;
            event.fullPath = `/events/${event.slug}`;
            event.contentType = "event";
            return event;
          });
          this.event = this.event[0];
          this.loading = false;
          NProgress.done();
          EventBus.$emit("context-label", this.event.title);
        }
      },
    },
  },
};
</script>

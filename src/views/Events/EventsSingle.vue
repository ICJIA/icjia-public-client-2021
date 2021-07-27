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
              <div class="mt-5 text-right">
                <v-btn small text to="/events/"
                  >View all events&nbsp;&raquo;</v-btn
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
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
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
          this.event.forEach((event) => {
            if (event.tags && event.tags.length > 0) {
              let tagArray = [];
              const tagValues = Object.values(event.tags);
              tagValues.forEach((t) => {
                tagArray.push(t.title);
              });
              // console.log(tagArray);
              delete event.tags;
              event.tags = tagArray;
            }
          });
          this.event = this.event[0];
          this.loading = false;
          NProgress.done();
          EventBus.$emit("context-label", this.event.title);
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>

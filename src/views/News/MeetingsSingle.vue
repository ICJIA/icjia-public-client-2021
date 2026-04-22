<template>
  <div class="markdown-body">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container v-if="meeting">
          <v-row>
            <v-col>
              <h1>ICJIA Meetings</h1>
              <MeetingCard
                :item="meeting"
                class="mx-2 my-4"
                :key="meeting.title"
              ></MeetingCard>
              <div class="mt-5 text-right">
                <v-btn small text to="/news/meetings/"
                  >View all meetings&nbsp;&raquo;</v-btn
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
import NProgress from "@/services/Progress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_MEETING_QUERY } from "@/graphql/meetings";
import { EventBus } from "@/event-bus";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
// eslint-disable-next-line no-unused-vars
import { getUnifiedTags } from "@/utils/content";
export default {
  data() {
    return {
      error: null,
      meeting: null,
    };
  },
  computed: {},
  metaInfo() {
    const meeting = this.meeting;
    if (!meeting) return {};
    const slug = meeting.slug || this.$route.params.slug;
    const url = `https://icjia.illinois.gov/news/meetings/${slug}`;
    const STRAPI_BASE = "https://agency.icjia-api.cloud";
    const EXT_TO_MIME = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      txt: "text/plain",
      zip: "application/zip",
    };
    const normalizeUrl = (u) => {
      if (typeof u !== "string" || !u) return null;
      const t = u.trim();
      if (/^https?:\/\//.test(t)) return t;
      if (t.startsWith("/")) return `${STRAPI_BASE}${t}`;
      return null;
    };
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: meeting.title,
      url,
      inLanguage: "en-US",
      eventStatus: meeting.isCancelled
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
      organizer: {
        "@type": "GovernmentOrganization",
        name: "Illinois Criminal Justice Information Authority",
        alternateName: "ICJIA",
        url: "https://icjia.illinois.gov",
      },
    };
    if (meeting.start) jsonld.startDate = meeting.start;
    if (meeting.end) jsonld.endDate = meeting.end;
    if (meeting.summary) jsonld.description = meeting.summary;
    if (Array.isArray(meeting.external) && meeting.external.length) {
      const firstLink = meeting.external.find((e) => e && normalizeUrl(e.url));
      if (firstLink) {
        jsonld.location = {
          "@type": "VirtualLocation",
          url: normalizeUrl(firstLink.url),
          ...(firstLink.title ? { name: firstLink.title } : {}),
        };
      }
    }
    if (Array.isArray(meeting.attachments) && meeting.attachments.length) {
      const normalized = meeting.attachments
        .map((a) => {
          if (!a) return null;
          const contentUrl = normalizeUrl(a.url);
          if (!contentUrl || !a.name) return null;
          const ext = (a.ext || "").replace(/^\./, "").toLowerCase();
          return {
            "@type": "MediaObject",
            name: a.name,
            contentUrl,
            ...(ext ? { encodingFormat: EXT_TO_MIME[ext] || ext } : {}),
          };
        })
        .filter(Boolean);
      if (normalized.length) jsonld.associatedMedia = normalized;
    }
    return {
      title: meeting.title,
      script: [{ type: "application/ld+json", json: jsonld }],
    };
  },
  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    meetings: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_MEETING_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);

        NProgress.done();
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.meetings.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);

          let meetings = ApolloQueryResult.data.meetings;
          console.log("meetings fetch here");
          meetings = getUnifiedTags(meetings);
          this.meeting = meetings[0];
          NProgress.done();
          EventBus.$emit("context-label", this.meeting.title);
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>

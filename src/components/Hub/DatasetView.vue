<template>
  <v-container class="markdown-body pb-10">
    <v-card class="px-5 py-10" color="#fafafa" style="border: 1px solid #ddd">
      <v-col cols="12" class="text-left">
        <h1>{{ dataset.title }}</h1>
      </v-col>
      <MarkerExternal v-if="dataset.external" />
      <MarkerProject v-else-if="dataset.project" />

      <v-col cols="12" style="margin-top: -45px">
        <h2 class="mb-4 font-weight-light">About this dataset</h2>
        <BasePropDisplay name="Final date reflected in dataset">
          <template>{{ dataset.date | format }}</template>
        </BasePropDisplay>

        <BasePropDisplay name="Sources">
          <span v-for="(source, i) in dataset.sources" :key="i">
            <template v-if="i > 0">{{
              dataset.sources.length > i + 1 ? ", " : " and "
            }}</template>

            <a
              v-if="source.url"
              :href="source.url"
              target="_blank"
              rel="noreferrer"
            >
              {{ source.title }}
            </a>
            <template v-else>{{ source.title }}</template>
          </span>
        </BasePropDisplay>

        <BasePropDisplay v-if="dataset.categories" name="Categories">
          <span
            @click.prevent.stop="categoryClick($event)"
            class="category"
            style="font-size: 14px"
            >{{ dataset.categories }}</span
          >
        </BasePropDisplay>

        <BasePropDisplay v-if="dataset.tags" name="Tags">
          <BasePropChip v-for="tag in dataset.tags" :key="tag">
            <template>{{ tag }}</template>
          </BasePropChip>
        </BasePropDisplay>

        <BasePropDisplay v-if="dataset.timeperiod" name="Time period">
          <template>{{ dataset.timeperiod }}</template>
        </BasePropDisplay>
      </v-col>

      <v-col cols="12">
        <BasePropDisplay v-if="dataset.unit" name="Unit of analysis">
          <span class="text-capitalize">{{ dataset.unit }}</span>
        </BasePropDisplay>

        <BasePropDisplay
          v-if="dataset.description"
          name="Description"
          :dense="true"
        >
          <span>{{ dataset.description }}</span>
        </BasePropDisplay>
        <div class="mt-1">&nbsp;</div>
        <BasePropDisplay v-if="dataset.notes" name="Notes">
          <ul>
            <li v-for="note in dataset.notes" :key="note">
              <template>{{ note }}</template>
            </li>
          </ul>
        </BasePropDisplay>
      </v-col>

      <div v-if="dataset.variables" class="hidden-sm-and-down py-6">
        <h2 class="mb-4 font-weight-light">Variables</h2>
        <div ref="variables" class="variables-table font-lato small"></div>
      </div>

      <BaseInfoBlock v-if="dataset.funding">
        <template #title>{{ "Funding acknowledgment" }}</template>
        <template #text>{{ dataset.funding }}</template>
      </BaseInfoBlock>

      <BaseInfoBlock v-if="dataset.citation">
        <template #title>{{ "Suggested citation" }}</template>
        <template #text>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="dataset.citation"></span>
        </template>
      </BaseInfoBlock>

      <BaseInfoBlock v-if="hasRelated">
        <template #title>{{ "Related contents" }}</template>
        <template #text>
          <ul class="font-lato">
            <li v-for="(app, i) in dataset.apps" :key="`app${i}`">
              <router-link :to="preview ? '' : `/researchhub/apps/${app.slug}`">
                <template>{{ `[APP] ${app.title}` }}</template>
              </router-link>
            </li>
            <li v-for="(article, i) in dataset.articles" :key="`article${i}`">
              <router-link
                :to="preview ? '' : `/researchhub/articles/${article.slug}`"
              >
                <template>{{ `[ARTICLE] ${article.title}` }}</template>
              </router-link>
            </li>
          </ul>
        </template>
      </BaseInfoBlock>
      <v-col class="text-center">
        <v-btn @click="downloadHelper">Download here</v-btn>
      </v-col>

      <!-- <v-col class="text-center mt-5">
        <v-dialog v-model="dialog" class="text-center" persistent width="500">
          <template #activator="{ on }">
            <v-btn :small="smAndDown" text v-on="on" elevation="2">
              <template>{{ "Download" }}</template>
              <v-icon>download</v-icon>
            </v-btn>
          </template>

          <v-sheet class="font-lato px-12 py-12" dark color="#0E4471">
            <h3 class="pa-6">Did you read the metadata?</h3>
            <p class="px-6 pb-6">{{ msgDialog }}</p>

            <v-row class="mx-0 px-3 pb-3" justify="end">
              <v-btn text @click="downloadHelper">Yes, download</v-btn>

              <v-btn text @click="dialog = false">Back</v-btn>
            </v-row>
          </v-sheet>
        </v-dialog>
      </v-col> -->
    </v-card>
  </v-container>
</template>

<script>
import { format } from "@/utils/itemFormatter";
import { EventBus } from "@/event-bus";

const arr2table = ({ arr, cols = ["name", "type", "definition", "values"] }) =>
  `<table>${getThead({ cols })}${getTbody({ cols, rows: arr })}</table>`;

const getRow = (row, cols) =>
  `<tr>${cols
    .map((col) => `<td>${row[col] ? row[col] : ""}</td>`)
    .join("")}</tr>`;

const getTbody = ({ rows, cols }) =>
  `<tbody>${rows.map((row) => getRow(row, cols)).join("")}</tbody>`;

const getThead = ({ cols }) =>
  `<thead><tr>${cols
    .map((col) => `<th>${col[0].toUpperCase()}${col.slice(1)}</th>`)
    .join("")}</tr></tbody>`;

export default {
  props: {
    item: {
      type: Object,

      default() {
        return {
          articles: null,
          apps: null,
          categories: null,
          citation: null,
          date: null,
          description: null,
          external: null,
          funding: null,
          notes: null,
          project: null,
          sources: null,
          tags: null,
          timeperiod: null,
          title: null,
          variables: null,
          unit: null,
        };
      },
    },
    downloader: {
      type: Function,
      default() {},
    },
    preview: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dialog: false,
      msgDialog:
        "Context matters. Please read and understand the metadata shown in this page before downloading and using the dataset.",
    };
  },
  computed: {
    dataset() {
      return format(this.item);
    },
    hasRelated() {
      const { apps, articles } = this.item;
      return (apps && apps.length) || (articles && articles.length);
    },
    smAndDown() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
  mounted() {
    const { variables } = this.item;
    if (variables)
      this.$refs.variables.innerHTML = arr2table({ arr: variables });
  },
  methods: {
    categoryClick(e) {
      //console.log("chip click: ", e.target.innerHTML);
      let opts = {
        query: e.target.innerText.toLowerCase(),
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
    downloadHelper() {
      //console.log("download here", this.dataset.datafile);
      const { hash, ext } = this.dataset.datafile;
      // let analyticsURL = `/uploads/${hash}${ext}`;
      // window.plausible("file_download", { props: { url: analyticsURL } });
      window.open(
        `https://researchhub.icjia-api.cloud/uploads/${hash}${ext}`,
        "_blank"
      );
      this.dialog = false;
    },
  },
};
</script>

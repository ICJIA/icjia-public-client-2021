<template>
  <v-sheet v-if="attachments">
    <div v-if="useSecondLevelHeading">
      <h2 v-if="label && label.length" id="attachments">{{ label }}</h2>
      <h2 v-else class="" id="attachments">Attachments</h2>
    </div>
    <div
      v-else
      style="
        font-weight: 700;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
      "
    >
      <span v-if="label && label.length"> {{ label }}</span
      ><span v-else class="" style="">Attachments</span>
    </div>

    <div>
      <v-simple-table dense style="width: 100% !important">
        <template v-slot:default>
          <tr>
            <th class="text-left">Filename</th>
            <th class="text-left">Type</th>
            <th class="text-left">Size</th>
            <th class="text-left">Last updated</th>
          </tr>

          <tr
            v-for="(attachment, index) in attachments"
            :key="index"
            class="hover"
            @click.stop.prevent="routeTo(attachment.url)"
          >
            <td>
              <span class="attachment">
                {{ attachment.name }}
              </span>
            </td>
            <td>
              <span
                style="
                  font-weight: 900;
                  text-transform: uppercase;
                  color: #555;
                  font-size: 12px;
                "
                v-if="attachment && attachment.ext"
                >{{ attachment.ext.replace(/\./g, "") }}</span
              >
            </td>
            <td style="width: 100px">
              <span style="font-size: 12px">{{
                formatBytes(attachment.size)
              }}</span>
            </td>
            <td>
              <span style="font-size: 12px">{{
                attachment.updated_at | dateFormatAlt
              }}</span>
            </td>
          </tr>
        </template>
      </v-simple-table>
    </div>
  </v-sheet>
</template>

<script>
function formatBytes(bytes, decimals = 0) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
import _ from "lodash";
import moment from "moment";
export default {
  data() {
    return {
      attachments: null,
      formatBytes,
    };
  },
  methods: {
    routeTo(url) {
      console.log(url);
      window.open(`https://agency.icjia-api.cloud${url}`, "_blank");
    },
    isItNew(item) {
      let targetDate;
      if (item.publicationDate) {
        targetDate = item.publicationDate;
      } else {
        targetDate = item.created_at;
      }

      const now = moment(new Date());
      const end = moment(targetDate); // another date
      const duration = moment.duration(now.diff(end));
      const days = duration.asDays();

      if (days <= 7) {
        return true;
      } else {
        return false;
      }
    },
  },
  mounted() {
    this.attachments = _.orderBy(this.items, "name", "asc");
  },
  props: {
    label: {
      type: String,
      default: null,
    },
    items: {
      type: Array,
      default: () => [],
    },
    useSecondLevelHeading: {
      type: Boolean,
      default: false,
    },
    showLastUpdated: {
      type: Boolean,
      default: false,
    },
    showAsTable: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.attachment {
  font-weight: 900;
  color: #0a3a60;
  text-decoration: underline;
  cursor: pointer;
}

.attachment:hover {
  color: #aaa;
  text-decoration: none;
}

.file-name {
  font-weight: 700;
}

.file-name:hover {
  text-decoration: underline;
  color: #555;
}
</style>

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
      ><span v-else class="">Attachments</span>
    </div>
    <div v-if="!showAsTable">
      <ul v-for="(attachment, index) in attachments" :key="index" class="mt-6">
        <li class="attachment-link">
          <a
            :href="`https://agency.icjia-api.cloud${attachment.url}`"
            target="_blank"
          >
            <!-- <v-chip
              v-if="isItNew(attachment)"
              label
              x-small
              color="#0D4474"
              class="mr-2"
              style="margin-top: 0px"
            >
              <span style="color: #fff !important; font-weight: 400">
                NEW!
              </span> </v-chip
            > -->
            {{ attachment.name }}</a
          >
          <ul v-if="showLastUpdated" style="font-size: 12px">
            <li>Last updated on {{ attachment.updated_at | format }}</li>
          </ul>
        </li>
      </ul>
    </div>
    <div v-else>
      <v-simple-table dense>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Filename</th>
              <th class="text-left">Type</th>
              <th class="text-left">Size</th>
              <th class="text-left">Last updated</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(attachment, index) in attachments"
              :key="index"
              class="hover"
            >
              <td>
                <span>
                  <!-- <v-chip
                    v-if="isItNew(attachment)"
                    label
                    x-small
                    color="#0D4474"
                    class="mr-2"
                    style="margin-top: 0px"
                  >
                    <span style="color: #fff !important; font-weight: 400">
                      NEW!
                    </span>
                  </v-chip> -->

                  <a
                    :href="`https://agency.icjia-api.cloud${attachment.url}`"
                    target="_blank"
                    >{{ attachment.name }}</a
                  ></span
                >
              </td>
              <td>
                <span
                  style="
                    font-weight: 900;
                    text-transform: uppercase;
                    color: #555;
                    font-size: 12px;
                  "
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
          </tbody>
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
.file-name {
  font-weight: 700;
}

.file-name:hover {
  text-decoration: underline;
  color: #555;
}
</style>

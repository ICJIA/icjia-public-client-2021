/* eslint-disable no-unused-vars */
const fs = require("fs");
const { createApiClient } = require("./apiClient");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
meetings {
    id
    title
    slug
    start
    end
    isCancelled
    summary
    category
    published_at
    tags {
      title
      id
      slug
    }
  }
}`;

const getUnifiedTags = function (content) {
  content.forEach((item) => {
    if (item.tagsAlt && item.tagsAlt.length) return content;
    if (item.tags && item.tags.length > 0) {
      let tagArray = [];
      const tagValues = Object.values(item.tags);
      tagValues.forEach((t) => {
        tagArray.push(t.title);
      });
      // console.log(tagArray);
      item.tagsAlt = item.tags;
      item.tags = tagArray;
    }
  });
  //console.log(content);
  return content;
};

const api = createApiClient("https://agency.icjia-api.cloud");
api.postWithRetry("/graphql", { query })
  .then((res) => {
    let meetings = res.data.data.meetings;
    meetings = getUnifiedTags(meetings);
    meetings = meetings.map((e) => ({
      ...e,
      fullPath: `/news/meetings/${e.slug}/`,
      altTitle: e.title.toLowerCase(),
      imagePath: null,
      contentType: "meeting",
    }));

    let content = [...meetings];
    content = _.orderBy(content, ["end"], ["desc"]);

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./public/api/meetings.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./public/api/meetings.json`);
    });
  })
  .catch((err) => console.error(err));

/* eslint-disable no-unused-vars */
const fs = require("fs");
const { createApiClient } = require("./apiClient");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  events(sort: "start:asc") {
      id
      created_at
      updated_at
      published_at
      title: name
      start
      end
      timed
      summary
      category
      searchMeta
      slug
      tags {
        title
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
    let events = res.data.data.events;
    events = getUnifiedTags(events);
    events = events.map((e) => {
      let imagePath;
      if (e.splash) {
        imagePath = `https://agency.icjia-api.cloud${e.splash.url}`;
      } else {
        imagePath = null;
      }
      let obj = {
        ...e,
        altTitle: e.title.toLowerCase(),
        fullPath: `/events/${e.slug}/`,
        imagePath,
        contentType: "event",
      };
      return obj;
    });

    let content = [...events];
    content = _.orderBy(content, ["date"], ["desc"]);

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./public/api/events.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./public/api/events.json`);
    });
  })
  .catch((err) => console.error(err));

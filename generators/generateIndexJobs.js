/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
 jobs {
    title
    id
    start
    end
    slug
    summary
    searchMeta
    published_at
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

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let jobs = res.data.data.jobs;
    jobs = getUnifiedTags(jobs);
    jobs = jobs.map((e) => ({
      ...e,
      fullPath: `/about/employment/${e.slug}/`,
      altTitle: e.title.toLowerCase(),
      imagePath: null,
      contentType: "employment",
    }));

    let content = [...jobs];
    content = _.orderBy(content, ["end"], ["desc"]);

    jsonfile.writeFile(`./src/config/jobs.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/jobs.json`);
    });
  })
  .catch((err) => console.error(err));

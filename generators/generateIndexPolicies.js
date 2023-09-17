/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { get } = require("cheerio/lib/api/traversing");
// const { apiBaseURL } = require("./src/config");

const query = `query {
 policies{
      id
      created_at
      updated_at
      published_at
      title
      slug
      summary
      searchMeta
      body
      category
      attachments {
        id
        created_at
        updated_at
        size
        name
        ext
        url
      }
      tags {
        id
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
    let policies = res.data.data.policies;
    policies = getUnifiedTags(policies);
    policies = policies.map((e) => ({
      ...e,
      fullPath: `/grants/policies/${e.slug}/`,
      altTitle: e.title.toLowerCase(),
      imagePath: null,
      contentType: "policy",
    }));

    let content = [...policies];
    content = _.orderBy(content, ["published_at"], ["desc"]);

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./public/api/policies.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./public/api/policies.json`);
    });
  })
  .catch((err) => console.error(err));

/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
 units {
    title
    id
    title
    slug
    summary
    shortName
    searchMeta
    url
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
    let units = res.data.data.units;
    units = getUnifiedTags(units);
    units = units.map((u) => ({
      ...u,
      fullPath: `/about/units/${u.slug}/`,
      altTitle: u.title.toLowerCase(),
      imagePath: null,
      contentType: "unit",
      searchMeta:
        u.searchMeta && u.searchMeta.length
          ? " " + u.searchMeta + " " + u.shortName + " "
          : " " + u.shortName + " ",
    }));

    let content = [...units];
    content = _.orderBy(content, ["title"], ["asc"]);

    jsonfile.writeFile(`./src/config/units.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/units.json`);
    });
  })
  .catch((err) => console.error(err));

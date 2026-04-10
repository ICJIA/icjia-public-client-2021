/* eslint-disable no-unused-vars */
const fs = require("fs");
const { createApiClient } = require("./apiClient");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  biographies (
    sort: "lastName:asc"
  ) {
     id
    firstName
    lastName
    fullName
    title: fullName
    position: title
    suffix
    summary: bio
    tags {
      title
      slug
    }
    unit {
      title
      shortName
      slug
    }
    slug
    updated_at
    published_at
    
    affiliation
    sortField
    sortModifier
    searchMeta
    
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
    let biographies = res.data.data.biographies;
    biographies = getUnifiedTags(biographies);
    biographies = biographies.map((b) => {
      let additionalSearchMeta;
      if (b.unit && b.unit.shortName && b.unit.title) {
        additionalSearchMeta =
          " " + b.unit.shortName + " " + b.unit.title + " ";
      } else {
        additionalSearchMeta = "";
      }

      let obj = {
        ...b,
        altTitle: b.title.toLowerCase(),
        contentType: "biography",
        fullPath: `/about/biographies/${b.slug}/`,
        imagePath: null,
        searchMeta:
          b.searchMeta && b.searchMeta.length
            ? b.searchMeta + additionalSearchMeta
            : additionalSearchMeta,
      };

      return obj;
    });

    let content = [...biographies];

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(
      `./public/api/biographies.json`,
      content,
      function (err) {
        if (err) console.error(err);
        console.log(`Created: ./public/api/biographies.json`);
      }
    );
  })
  .catch((err) => console.error(err));

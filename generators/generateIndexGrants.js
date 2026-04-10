/* eslint-disable no-unused-vars */
const fs = require("fs");
const { createApiClient } = require("./apiClient");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
  grants {
    id
    updated_at
    title
    slug
    summary
    start
    category
    end
    published_at
    searchMeta
    tags {
      title
      slug
    }
  }

   programs {
    id
    updated_at
    title
    slug
    status
    category
    summary
    published_at
    searchMeta
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
    let grants = res.data.data.grants;
    let programs = res.data.data.programs;
    grants = getUnifiedTags(grants);
    programs = getUnifiedTags(programs);
    grants = grants.map((e) => ({
      ...e,
      fullPath: `/grants/funding/${e.slug}/`,
      imagePath: null,
      altTitle: e.title.toLowerCase(),
      contentType: "funding",
      category: "funding",
      searchMeta:
        e.searchMeta && e.searchMeta.length
          ? e.searchMeta + " nofo notice funding "
          : " nofo notice funding ",
    }));

    programs = programs.map((e) => ({
      ...e,
      fullPath: `/grants/programs/${e.slug}/`,
      imagePath: null,
      altTitle: e.title.toLowerCase(),
      contentType: "program",
      searchMeta:
        e.searchMeta && e.searchMeta.length
          ? e.searchMeta + " grant program "
          : " grant program ",
    }));

    let content = [...grants, ...programs];
    content = _.orderBy(content, ["date"], ["desc"]);

    const dirpath = "./public/api";
    if (!fs.existsSync(dirpath)) fs.mkdirSync(dirpath);

    jsonfile.writeFile(`./public/api/grants.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./public/api/grants.json`);
    });
  })
  .catch((err) => console.error(err));

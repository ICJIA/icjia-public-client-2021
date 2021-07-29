/* eslint-disable no-unused-vars */
const fs = require("fs");
const axios = require("axios");
const jsonfile = require("jsonfile");
const _ = require("lodash");
// const { apiBaseURL } = require("./src/config");

const query = `query {
 posts {
    id
    title
    created_at
    updated_at
    slug
    summary
    category
    searchMeta
    published_at
    tags {
      title
      slug
    }
    
    splash {
      name
      caption
      alternativeText
      url
      formats
    }
  }
}`;

axios
  .create({ baseURL: "https://agency.icjia-api.cloud" })
  .post("/graphql", { query, validateStatus: (status) => status === 200 })
  .then((res) => {
    let posts = res.data.data.posts;

    posts.forEach((post) => {
      // if (post.category === "informationSystems") {
      //   post.category = "information-systems";
      // }
      if (post.tags && post.tags.length > 0) {
        let tagArray = [];
        const tagValues = Object.values(post.tags);
        tagValues.forEach((t) => {
          tagArray.push(t.title);
        });
        // console.log(tagArray);
        post.tagsAlt = post.tags;
        post.tags = tagArray;
      }
    });
    posts = posts.map((p) => {
      let imagePath;
      if (p.splash) {
        imagePath = `https://agency.icjia-api.cloud${p.splash.url}`;
      } else {
        imagePath = null;
      }
      let obj = {
        ...p,
        altTitle: p.title.toLowerCase(),
        fullPath: `/news/${p.slug}`,
        imagePath,
        displayCategory: p.category,
        contentType: "news",
      };
      return obj;
    });

    let content = [...posts];
    content = _.orderBy(content, ["date"], ["desc"]);

    jsonfile.writeFile(`./src/config/posts.json`, content, function (err) {
      if (err) console.error(err);
      console.log(`Created: ./src/config/posts.json`);
    });
  })
  .catch((err) => console.error(err));

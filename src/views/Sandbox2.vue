<template>
  <div>
    {{ article }}
  </div>
</template>

<script>
const axios = require("axios");
export default {
  data() {
    return {
      article: null,
      slug: "examining-the-experiences-of-women-police-leaders-in-illinois",
    };
  },
  mounted() {
    const query = `query {
  articles (where: { status: "published", slug: "${this.slug}" }) {
     id
      title
      status
      slug
      date
      external
      categories
      tags
      authors
      images
      apps {
        title
        slug
     }
      datasets {
        title
       slug
     }
      abstract
      markdown
      mainfile {
        name
        url
      }
      extrafile {
        name
        url
      }
   
  }
 
}`;
    axios
      .create({ baseURL: "https://researchhub.icjia-api.cloud" })
      .post("/graphql", { query, validateStatus: (status) => status === 200 })
      .then((res) => {
        console.log(res);
        this.article = res.data.data.articles[0];
      })
      .catch((err) => console.error(err));
  },
};
</script>

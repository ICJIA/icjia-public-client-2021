<template>
  <div class="markdown-body">
    <v-container
      ><v-row
        ><v-col cols="12">
          <h1>Site Information</h1>
          <div>
            <h2>Internal Admin</h2>
            <ul>
              <li>
                <router-link to="/admin/colors/">
                  Google Material Design Colors</router-link
                >
              </li>
              <li>
                <router-link to="/admin/publications/">
                  ICJIA Publication List Checker</router-link
                >
              </li>
              <!-- <li>
                <router-link to="/admin/inventory/">
                  Site inventory</router-link
                >
              </li> -->
            </ul>

            <h2>Icons</h2>
            <ul>
              <li>
                <a
                  href="https://fontawesome.com/v5.15/icons?d=gallery&p=2&m=free"
                  target="_blank"
                  >Font Awesome 5.x</a
                >
              </li>
              <li>
                <a href="https://fonts.google.com/icons" target="_blank"
                  >Google Material Design Icons</a
                >
              </li>
              <li>
                <a href="https://materialdesignicons.com/" target="_blank"
                  >Material Design Icons</a
                >
              </li>
            </ul>
            <h2>External Info</h2>
            <ul>
              <li>
                <a href="https://analytics.google.com" target="_blank"
                  >Google Analytics</a
                >
              </li>

              <li>
                <a href="https://material.io/design" target="_blank"
                  >Google Material Design Specifications</a
                >
              </li>
              <li>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  >Google Search Console</a
                >
              </li>
              <li>
                <a href="https://jamstack.org/" target="_blank"
                  >Jamstack (site architecture)</a
                >
              </li>
              <li>
                <a href="https://strapi.io/" target="_blank"
                  >Strapi (Headless CMS)</a
                >
              </li>
              <li>
                <a href="https://vuejs.org/" target="_blank"
                  >Vue.js (JS Framework)</a
                >
              </li>
              <li>
                <a href="https://vuejs.org/" target="_blank"
                  >Vuetify (UI Framework)</a
                >
              </li>
            </ul>
          </div>
        </v-col></v-row
      ></v-container
    >
  </div>
</template>

<script>
export default {};
</script>

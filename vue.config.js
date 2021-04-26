module.exports = {
  publicPath: "/",
  configureWebpack: (config) => {
    config.entry.app = "./src/entry.js";
  },

  devServer: {
    proxy: {
      "/.netlify/functions": {
        target: "http://localhost:9000",
        pathRewrite: {
          "^/\\.netlify/functions": "",
        },
      },
    },
  },
  pluginOptions: {
    moment: {
      locales: ["en"],
    },
  },
  transpileDependencies: ["vuetify", "nanoid"],
};

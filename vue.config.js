const zlib = require("zlib");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  publicPath: "/",
  productionSourceMap: false,
  chainWebpack(config) {
    config.plugin("CompressionPlugin").use(CompressionPlugin);
  },

  pluginOptions: {
    lodash: {
      provide: false,
    },
    compression: {
      brotli: {
        filename: "[file].br[query]",
        algorithm: "brotliCompress",
        include: /\.(js|css|html|svg|json)(\?.*)?$/i,
        compressionOptions: {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
          },
        },
        minRatio: 0.8,
      },
      gzip: {
        filename: "[file].gz[query]",
        algorithm: "gzip",
        include: /\.(js|css|html|svg|json)(\?.*)?$/i,
        minRatio: 0.8,
      },
    },
  },
  transpileDependencies: ["vuetify", "nanoid", "fuse.js"],
};

const zlib = require("zlib");
const CompressionPlugin = require("compression-webpack-plugin");
const MomentTimezoneDataPlugin = require("moment-timezone-data-webpack-plugin");

// The site only needs America/Chicago (Illinois). Without this plugin,
// moment-timezone ships the full IANA database (~900 KiB of zone data).
// The regex is anchored to the full zone name; data for unused zones is
// stripped from the moment-timezone-data JSON at bundle time.
const MATCHED_ZONES = /^America\/Chicago$/;

module.exports = {
  publicPath: "/",
  productionSourceMap: false,
  chainWebpack(config) {
    config.plugin("CompressionPlugin").use(CompressionPlugin);
    config
      .plugin("MomentTimezoneDataPlugin")
      .use(MomentTimezoneDataPlugin, [{ matchZones: MATCHED_ZONES }]);
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
    moment: {
      locales: ["en"],
    },
    apollo: {
      enableEngine: true,
    },
  },
  transpileDependencies: ["vuetify", "nanoid", "fuse.js"],
};

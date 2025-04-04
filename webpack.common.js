const path = require("path");
const webpack = require("webpack");
const pkg = require("./package.json");
const ESLintPlugin = require('eslint-webpack-plugin');
const banner = `${pkg.name} v${pkg.version}
${pkg.description}
Author: ${pkg.author}`;
module.exports = {
  target: "web",
  entry: {
    'DeMol': [
      "./src/index.ts",
      "./src/SurfaceWorker.js",
      "./src/exporter.js"
    ],
    'DeMol.ui': [
      "./src/ui/ui.js",
      "./src/ui/state.js",
      "./src/ui/icon.js",
      "./src/ui/form.js",
      "./src/ui/defaultValues.js"
    ]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    library: '[name]',
    libraryTarget: "umd",
    globalObject: "this"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" },
      { test: /\.frag$/, loader: "raw-loader" },
      { test: /\.vert$/, loader: "raw-loader" }
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      MMTF: path.resolve(__dirname, "./src/vendor/mmtf.js"),
      $: "jquery"
    }),
    new webpack.BannerPlugin({ banner }),
    new ESLintPlugin()
  ],
  stats: {
    errorDetails: true,
  }
};

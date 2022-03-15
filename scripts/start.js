"use strict";

const path = require("path");
const fs = require("fs");
const { merge } = require("lodash");
const appDirectory = fs.realpathSync(process.cwd());

const http = require("http");
const esbuild = require("esbuild");

const util = require("util");
const { log } = require("console");

const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath);

const res = resolveApp("app.config.json");
const { default: basic, [process.env.APP_ENV]: app_env } = require(res);
const { env } = merge(basic, app_env);

for (const name in env) {
  if (/^(REACT_APP_).*/.test(name)) {
    process.env[name] = env[name];
  }
}

const starter = async () => {
  let config = [
    {
      port: 8000,
      servedir: resolveApp("public"),
      onRequest: (val) => {
        console.log("val >>>", val);
      },
    },
    {
      entryPoints: [resolveApp("src/index.js")],
      target: ["es2018"],
      loader: { ".js": "jsx" },
      bundle: true,
    },
  ];

  const configFileDir = resolveApp("esbuild.override.js");
  let configFile;

  try {
    configFile = await util.promisify(fs.stat)(configFileDir);
  } catch (error) {}

  if (configFile && configFile.isFile()) {
    config = require(configFileDir)(...config);
  }

  esbuild.serve(...config).then((result) => {
    // console.log("refresh >>>", result);

    chokidar
      .watch(`${resolveApp("public")}/**/*.{js,css}`, {
        interval: 0, // No delay
      })
      // Rebuilds esbuild (incrementally -- see `build.incremental`).
      .on("all", () => {
        // builder.rebuild();
        console.log("rebuilding...");
      });
  });
};

starter();

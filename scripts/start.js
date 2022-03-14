"use strict";

const path = require("path");
const fs = require("fs");
const { merge } = require("lodash");
const appDirectory = fs.realpathSync(process.cwd());

const util = require("util");

const esbuildServe = require("esbuild-serve");

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
  let config = [{}, {}];

  const configFileDir = resolveApp("esbuild.override.js");
  let configFile;

  try {
    configFile = await util.promisify(fs.stat)(configFileDir);
  } catch (error) {}

  if (configFile && configFile.isFile()) {
    config = require(configFileDir)(...config);
  }

  esbuildServe(
    {
      logLevel: "info",
      entryPoints: ["src/index.js"],
      bundle: true,
      outfile: "www/main.js",
    },
    { root: "www" }
  );
};

starter();

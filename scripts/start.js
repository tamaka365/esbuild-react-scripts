"use strict";

const path = require("path");
const fs = require("fs");
const { merge } = require("lodash");
const appDirectory = fs.realpathSync(process.cwd());

const sockjs = require("sockjs");

const http = require("http");
const esbuild = require("esbuild");

const util = require("util");

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

  const echo = sockjs.createServer({ prefix: "/echo" });
  echo.on("connection", function (conn) {
    conn.on("data", function (message) {
      conn.write(message);
    });
    conn.on("close", function () {});
  });

  esbuild.serve(...config).then((result) => {
    // console.log("refresh >>>", result);

    echo.attach(result);
  });
};

starter();

"use strict";

const path = require("path");
const fs = require("fs");
const { merge } = require("lodash");
const appDirectory = fs.realpathSync(process.cwd());

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

console.log("entry point >>>", resolveApp("src/index.js"));

const starter = async () => {
  let config = [
    { port: 8000 },
    { entryPoints: [resolveApp("public/index.js")], loader: { ".js": "jsx" } },
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
    // The result tells us where esbuild's local server is
    const { host, port } = result;

    http
      .createServer((req, res) => {
        const options = {
          hostname: host,
          port: port,
          path: req.url,
          method: req.method,
          headers: req.headers,
        };

        // Forward each incoming request to esbuild
        const proxyReq = http.request(options, (proxyRes) => {
          // If esbuild returns "not found", send a custom 404 page
          if (proxyRes.statusCode === 404) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`<!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Document</title>
          </head>
          <body>
              <div id="root"></div>
          
              <script src="index.js"></script>
          </body>
          </html>`);
            return;
          }

          // Otherwise, forward the response from esbuild to the client
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });

        // Forward the body of the request to esbuild
        req.pipe(proxyReq, { end: true });
      })
      .listen(3000);
  });
};

starter();

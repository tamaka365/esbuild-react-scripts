'use strict';

const path = require('path');
const fs = require('fs');
const {merge} = require('lodash')
const appDirectory = fs.realpathSync(process.cwd());

const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const res = resolveApp('app.config.json')

const {default: basic, [process.env.APP_ENV]: app_env} = require(res)

const {env} = merge(basic, app_env)

process.env = {...process.env, ...env};

console.log('process.env.REACT_APP_SERVER >>>', process.env.REACT_APP_SERVER);

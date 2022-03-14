'use strict';

const path = require('path');
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());

const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const res = resolveApp('app.config.json')

const name = 'dev'

const {default: basic, [name]: me} = require(res)

const {env} = Object.assign(basic, me)

process.env = {...process.env, ...env};

console.log('process.env.REACT_APP_SERVER >>>', process.env.REACT_APP_SERVER);

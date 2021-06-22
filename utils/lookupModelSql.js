'use strict';

const winext = require('winext');
const lodash = winext.require('lodash');
const { sequelize } = require('../lib/sequelizeStore');
const { models } = sequelize;
const { includes } = lodash;

function LookupModelSql(schemaModels, type) {
  let model = null;
  if (includes(schemaModels), models[type]) {
    return model = models[type];
  }
  console.log("AAAA", model);
  throw new Error('InvalidNameModel');
};

module.exports = LookupModelSql;
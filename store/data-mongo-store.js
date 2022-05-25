'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const mongoose = winext.require('mongoose');
const errorManager = winext.require('winext-error-manager');
const lookupModelMongo = require('../utils/lookup-model-mongo-util');
const errorCodes = require('../config/errorCodes');
const { get, isEmpty, map, isNil } = lodash;

function DataMongoStore(params = {}) {
  const loggerTracer = get(params, 'loggerTracer');
  const modelDescriptor = get(params, 'modelDescriptor', []);

  let schemaModels;

  if (!isEmpty(modelDescriptor)) {
    schemaModels = map(modelDescriptor, (doc) => {
      return mongoose.model(doc.name, doc.attributes, doc.options.collection);
    });
  } else {
    schemaModels = [];
  }

  /**
   * FIND ONE
   * @param {*} type
   * @param {*} filter
   * @param {*} projection
   * @param {*} populates
   * @example
   * const data = await dataMongoStore.findOne({
   *    type: 'UserModel',
   *    filter : { deleted: false },
   *    projection: { __v: 0 },
   *    populates: [
   *      {
   *        path: 'roles',
   *        select: 'name'
   *     }
   *   ]
   * })
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.findOne
   * @returns {Object} data
   */
  this.findOne = function ({ type, filter = {}, projection = {}, populates = [] }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    if (!isEmpty(populates)) {
      return model
        .findOne(filter, projection)
        .then((docs) => model.populate(docs, populates))
        .then((result) => result)
        .catch((err) => {
          loggerTracer.error(`FindOne with populates has error`, {
            args: err,
          });
          return Promise.reject(err);
        });
    }
    return model
      .findOne(filter, projection)
      .then((docs) => docs)
      .catch((err) => {
        loggerTracer.error(`FindOne with populates has error`, {
          args: err,
        });
        return Promise.reject(err);
      });
  };
  /**
   * COUNT
   * @param {*} type
   * @param {*} filter
   * @example
   * const data = await dataMongoStore.count({
   *    type: 'UserModel',
   *    filter : { deleted: false },
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.countDocuments
   * @returns {Number} total
   */
  this.count = function ({ type, filter = {} }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    return model.countDocuments(filter).exec();
  };
  /**
   * CREATE
   * @param {*} type
   * @param {*} data
   * @example
   * const data = await dataMongoStore.create({
   *    type: 'UserModel',
   *    data : { name: 'John Doe },
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.create
   * @returns {Object} data
   */
  this.create = function ({ type, data }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    const doc = new model(data);
    return model
      .create(doc)
      .then((result) => result)
      .catch((err) => {
        loggerTracer.error(`Create has error`, {
          args: err,
        });
        return Promise.reject(err);
      });
  };
  /**
   * FIND
   * @param {*} type
   * @param {*} filter
   * @param {*} projection
   * @param {*} options
   * @param {*} populates
   * @example
   * const data = await dataMongoStore.find({
   *    type: 'UserModel',
   *    filter : { deleted: false },
   *    projection: { __v: 0 },
   *    options: {
   *      sort: sort,
   *      skip: 0,
   *      limit: 1000
   *    },
   *    populates: [
   *      {
   *        path: 'roles',
   *        select: 'name'
   *     }
   *   ]
   * })
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.find
   * @returns {Array} data
   */
  this.find = function ({ type, filter = {}, projection = {}, options = {}, populates = [] }) {
    if (!isEmpty(options)) {
      if (!isNil(options.limit)) {
        if (options.limit === 0) {
          throw errorManager.newError('InvalidLimitOptions', errorCodes);
        }
      }
    }

    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    if (!isEmpty(populates)) {
      return model
        .find(filter, projection, options)
        .then((docs) => model.populate(docs, populates))
        .catch((err) => {
          loggerTracer.error(`Find has error`, {
            args: err,
          });
          return Promise.reject(err);
        });
    }
    return model.find(filter, projection, options).exec();
  };
  /**
   * GET
   * @param {*} type
   * @param {*} id
   * @param {*} projection
   * @param {*} populates
   * @example
   * const data = await dataMongoStore.get({
   *    type: 'UserModel',
   *    id: '123'
   *    projection: { __v: 0 },
   *    populates: [
   *      {
   *        path: 'roles',
   *        select: 'name'
   *     }
   *   ]
   * })
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.findById
   * @returns {Object} data
   */
  this.get = function ({ type, id, projection = {}, populates }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    if (isEmpty(id)) {
      throw errorManager.newError('IdNotFound', errorCodes);
    }
    if (!isEmpty(populates)) {
      return model
        .findById(id, projection)
        .then((docs) => model.populate(docs, populates))
        .catch((err) => {
          loggerTracer.error(`Get has error`, {
            args: err,
          });
          return Promise.reject(err);
        });
    }
    return model.findById(id, projection).exec();
  };
  /**
   * UPDATE
   * @param {*} type
   * @param {*} id
   * @param {*} data
   * @param {*} options
   * @example
   * const data = await dataMongoStore.update({
   *    type: 'UserModel',
   *    id: '123'
   *    data: { name: 'John Doe },
   * })
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.findByIdAndUpdate
   * @returns {Object} data
   */
  this.update = function ({ type, id, data, options = { new: true } }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    if (isEmpty(id)) {
      throw errorManager.newError('IdNotFound', errorCodes);
    }
    return model
      .findByIdAndUpdate(id, data, options)
      .exec()
      .then((docs) => docs)
      .catch((err) => {
        loggerTracer.error(`Update has error`, {
          args: err,
        });
        return Promise.reject(err);
      });
  };
  /**
   * UPDATE ONE
   * @param {*} type
   * @param {*} id
   * @param {*} data
   * @example
   * const data = await dataMongoStore.updateOne({
   *    type: 'UserModel',
   *    id: '123'
   *    data: { name: 'John Doe' },
   * })
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.updateOne
   * @returns {Object} data
   */
  this.updateOne = function ({ type, id, data }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    if (isEmpty(id)) {
      throw errorManager.newError('IdNotFound', errorCodes);
    }
    return model
      .updateOne({ _id: id }, data)
      .exec()
      .then((docs) => docs)
      .catch((err) => {
        loggerTracer.error(`UpdateOne has error`, {
          args: err,
        });
        return Promise.reject(err);
      });
  };
  /**
   * UPDATE MANY
   * @param {*} type
   * @param {*} filter
   * @param {*} data
   * @example
   * const data = await dataMongoStore.updateMany({
   *    type: 'UserModel',
   *    filter: { deleted: false },
   *    data: { deleted: true },
   * })
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.updateMany
   * @returns {Object} data
   */
  this.updateMany = function ({ type, filter, data = {} }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    return model.updateMany(filter, data).exec();
  };
  /**
   * AGGREGATE
   * @param {*} type
   * @param {*} pipeline
   * @example
   * const data = await dataMongoStore.aggregate({
   *    type: 'UserModel',
   *    pipeline: [
   *      { $group: { _id: null, maxBalance: { $max: '$balance' }}},
   *      { $project: { _id: 0, maxBalance: 1 }}
   *    ],
   * })
   * @see https://mongoosejs.com/docs/api/aggregate.html#aggregate_Aggregate
   * @returns {Array} data
   */
  // aggregate
  this.aggregate = function ({ type, pipeline = [] }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    return model
      .aggregate(pipeline)
      .exec()
      .then((docs) => docs)
      .catch((err) => {
        loggerTracer.error(`Aggregate has error`, {
          args: err,
        });
        return Promise.reject(err);
      });
  };
  /**
   * DELETED
   * @param {*} type
   * @param {*} id
   * @example
   * const data = await dataMongoStore.deleted({
   *    type: 'UserModel',
   *    id: '123'
   * })
   * @see https://mongoosejs.com/docs/api/model.html#model_Model.findByIdAndRemove
   * @returns {Array} data
   */
  this.deleted = function ({ type, id }) {
    loggerTracer.warn(`Model name`, {
      args: [type],
    });
    const model = lookupModelMongo(schemaModels, type);
    if (isEmpty(id)) {
      throw errorManager.newError('IdNotFound', errorCodes);
    }
    return model
      .findByIdAndRemove(id)
      .exec()
      .then((docs) => docs)
      .catch((err) => {
        loggerTracer.error(`deleted has error`, {
          args: err,
        });
        return Promise.reject(err);
      });
  };
}

exports = module.exports = new DataMongoStore();
exports.register = DataMongoStore;

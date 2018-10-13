const Gateway = require('./mysql-gateway');
const PMService = require('@conform/pm');
const { pmApiUrl, application, token,
  db: { port, options, host, password, schema, user }
} = require('config');

class Db {
  constructor(redis) {
    this.gateway = new Gateway();
    this.redis = redis;
    this.connections = {};
  }

  async setupConnection (divisionId) {
    let connection = await this._getConnection(divisionId);
    if (!connection) {
      return await this._createConnection(divisionId);
    }

    this.gateway.connection = connection;
    return connection;
  }

  async _getConnection (divisionId) {
    let key = Db.getKey(divisionId);
    let cachedConfig = await this.redis.getAsync(key);
    if (cachedConfig && this.connections[divisionId]) {
      return this.connections[divisionId];
    } else {
      delete this.connections[divisionId];
    }
  }

  async _createConnection (divisionId) {
    let key = Db.getKey(divisionId);
    let cachedConfig = await this.redis.getAsync(key);
    if (!cachedConfig) {
      const pmService = new PMService(pmApiUrl, application, { config: { token: 'Bearer ' + token } });

      const divisionDatabase = await pmService.getDivisionDB(divisionId);
      if (!divisionDatabase.dbHostname || !divisionDatabase.dbUsername || !divisionDatabase.dbSchema) {
        throw new Error('No information about division DB');
      }
      cachedConfig = divisionDatabase;
      await this.redis.setAsync(key, JSON.stringify(cachedConfig));
    } else {
      cachedConfig = JSON.parse(cachedConfig);
    }

    let dbHost = cachedConfig.dbHostname;
    let dbUser = cachedConfig.dbUsername;
    let dbPassword = cachedConfig.dbPassword;
    let dbSchema = cachedConfig.dbSchema;
    let dbPort = cachedConfig.dbPort;

    // for local tests
    if (process.env.NODE_ENV === 'test') {
      dbHost = host;
      dbUser = user;
      dbPassword = password;
      dbSchema = schema;
      dbPort = port;
    }
    this.connections[divisionId] = this.gateway.createConnection(dbHost, dbPort, dbSchema, dbUser, dbPassword, options);
    return this.connections[divisionId];
  }

  static getKey (divisionId) {
    return 'PmGetAppConfiguration:' + application + ':' + divisionId;
  }

  executeQuery (query) {
    return this.gateway.executeQuery(query);
  }

  get (table, id) {
    return this.gateway.get(table, id);
  }

  add (table, fields) {
    return this.gateway.add(table, fields);
  }

  async getBy (table, where, limit) {
    return this.gateway.getBy(table, where, limit);
  }

  async delete (table, id) {
    return this.gateway.delete(table, id);
  }

  async transaction (fields) {
    return await this.gateway.transaction(fields);
  }

  async commit () {
    return await this.gateway.commit();
  }

  async rollback () {
    return await this.gateway.rollback();
  }

  async upsert (table, fields, fieldsToUpdate) {
    return await this.gateway.upsert(table, fields, fieldsToUpdate);
  }

  getStreamBy (table, where) {
    return this.gateway.getStreamBy(table, where);
  }
}

module.exports = Db;

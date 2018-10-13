'use strict';

const mysql = require('mysql');
const debug = require('debug')('mysql-gateway');

class MysqlGateway {
  constructor () {
    this.connection = null;
  }

  createConnection (host, port, database, user, password, options) {
    // TODO: move default values to config
    let connectionInfo = {
      connectionLimit: options.connectionLimit || 500,
      acquireTimeout: options.connectTimeout || 10000,
      connectTimeout: options.connectTimeout || 10000,
      timeout: options.requestTimeout || 40000,
      host,
      port,
      database,
      user: user,
      password,
      multipleStatements: true,
      dateStrings: true
    };
    return this.connection = mysql.createPool(connectionInfo);
  }

  executeQuery (query) {
    return new Promise((resolve, reject) => {
      if (this.connection === null) {
        let error = new Error('Connection is null');
        error.code = 500;
        return reject(error);
      }
      this.connection.query(query, (err, res) => {
        if (err && err.code === 'ER_LOCK_DEADLOCK') {
          debug('ER_LOCK_DEADLOCK occurred');
          this.executeQuery(query)
            .then(response => resolve(parseResult(response)))
            .catch(reject);
        } else if (err) {
          reject(err);
        } else {
          resolve(parseResult(res));
        }
      });
    });
  }

  async transaction () {
    return await this.executeQuery('START TRANSACTION;');
  }

  async add (table, fields) {
    let into = '';
    let values = '';
    for (let name in fields) {
      into += prepareName(name) + ',';
      values += prepareValue(fields[name]) + ',';
    }
    into = into.slice(0, -1);
    values = values.slice(0, -1);
    const query = `INSERT INTO ${table} (${into}) VALUES (${values});`;

    return await this.executeQuery(query);
  }

  async upsert (table, fields, fieldsToUpdate) {
    let into = '';
    let values = '';
    for (let name in fields) {
      into += prepareName(name) + ',';
      values += prepareValue(fields[name]) + ',';
    }
    into = into.slice(0, -1);
    values = values.slice(0, -1);

    let updateNames = '';
    for (let fieldToUpdateName in fieldsToUpdate) {
      updateNames += prepareName(fieldToUpdateName) + ' = ' + prepareValue(fields[fieldToUpdateName]) + ',';
    }
    updateNames = updateNames.slice(0, -1);

    let query = `INSERT INTO ${table} (${into}) VALUES (${values}) ON DUPLICATE KEY UPDATE ${updateNames};`;
    debug(query);

    return await this.executeQuery(query);
  }

  async addMany (table, rows) {
    let into = '';
    let fields = rows[0];
    for (let name in fields) into += prepareName(name) + ',';
    into = into.slice(0, -1);

    let values = '';
    for (let i = 0; i < rows.length; ++i) {
      values += '(';
      for (let name in rows[i]) values += prepareValue(rows[i][name]) + ',';
      values = values.slice(0, -1);
      values += '),';
    }
    values = values.slice(0, -1);

    let query = `INSERT INTO ${table} (${into}) VALUES ${values};`;
    debug(query);

    return await this.executeQuery(query);
  }

  update (table, fields) {
    let set = '';
    for (let name in fields) set += `${prepareName(name)}=${prepareValue(fields[name])},`;
    set = set.slice(0, -1);
    return `UPDATE ${table} SET ${set} WHERE id=${mysql.escape(fields.id)};`;
  }

  updateBy (table, fields, where) {
    let query = `UPDATE ${table} set `;
    for (let name in fields) query += `${prepareName(name)}=${prepareValue(fields[name])},`;
    query = query.slice(0, -1);
    query += ' WHERE ';
    for (let i = 0; i < where.length; ++i) {
      query += '(';
      let fields = where[i];
      for (let name in fields) query += `${prepareName(name)}=${prepareValue(fields[name])} AND`;
      query = query.slice(0, -4);
      query += ') OR ';
    }
    query = query.slice(0, -4);
    return query;
  }

  get (table, id) {
    return `SELECT * FROM ${table} where id=${mysql.escape(id)};`;
  }

  getAll (table) {
    return `SELECT * FROM ${table};`;
  }

  async getBy (table, where, limit) {
    return await this.executeQuery(createGetByQuery(table, where, limit));
  }

  getStreamBy (table, where) {
    let query = createGetByQuery(table, where);
    debug(query);
    query = this.connection.query(query);

    return query;
  }

  async delete (table, id) {
    const query = `DELETE FROM ${table} where id=${mysql.escape(id)};`

    debug(query);
    return await this.executeQuery(query);
  }

  deleteBy (table, where) {
    let query = `DELETE FROM ${table} WHERE `;
    for (let i = 0; i < where.length; ++i) {
      query += '(';
      let fields = where[i];
      for (let name in fields) query += `${prepareName(name)}=${prepareValue(fields[name])} AND`;
      query = query.slice(0, -4);
      query += ') OR ';
    }
    query = query.slice(0, -4);
    return query;
  }

  async commit () {
    debug('COMMIT TRANSACTION');
    return await this.executeQuery(`COMMIT;`);
  }

  async rollback () {
    debug('ROLLBACK TRANSACTION');
    return await this.executeQuery(`ROLLBACK;`);
  }

  destructor () {
    return new Promise((resolve) => {
      if (this.connection !== null) this.connection.destroy();
      resolve('success');
    });
  }
}

function createGetByQuery (table, where, limit) {
  let query = `SELECT * FROM ${table} WHERE `;
  for (let i = 0; i < where.length; ++i) {
    query += '(';
    let fields = where[i];
    for (let name in fields) query += `${prepareName(name)}=${prepareValue(fields[name])} AND `;
    query = query.slice(0, -4);
    query += ') OR ';
  }
  query = query.slice(0, -4);

  if (limit) query += ` LIMIT ${limit.offset},${limit.count}`;
  debug(query);

  return query;
}

function prepareName (name) {
  return mysql.escapeId(name);
}

function prepareValue (value) {
  if (value === null || value === undefined) return value;
  if (Number.isInteger(value) && value > Date.now() - 100000) {
    return mysql.escape(new Date(value).toISOString());
  } else {
    return mysql.escape(value);
  }
}

function parseResult (res) {
  res = JSON.parse(JSON.stringify(res));
  if (Array.isArray(res)) {
    for (let i = 0; i < res.length; ++i) res[i] = createResponse(res[i]);
  } else {
    res = createResponse(res);
  }

  return res;
};

function createResponse (mysqlRes) {
  if (mysqlRes.insertId) {
    return mysqlRes.insertId;
  } else if (mysqlRes.affectedRows) {
    return true;
  } else {
    let fields = mysqlRes;
    for (let name in fields) {
      if (name.includes('date')) fields[name] = Date.parse(fields[name] + 'Z');
    }

    return mysqlRes;
  }
}

module.exports = MysqlGateway;

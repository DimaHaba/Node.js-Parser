const { assert } = require('chai');
const request = require('request');
const {
  apiUrl,
  test: { divisionId },
  token
} = require('config');

describe('Version api', function () {
  this.timeout(10000);
  const url = `${apiUrl}/version`;
  it('GET /api/version', function (done) {
    request.get(url,
      {
        json: true,
        qs: { divisionId },
        headers: {
          Authorization: token
        }
      },
      (err, res, body) => {
        assert.isNull(err);
        assert.isObject(body);
        assert.hasAllKeys(body, 'version');
        assert.isString(body.version);
        assert.isNotEmpty(body.version);
        done();
      }
    );
  });
});

const assert = require('assert');
const sinon = require('sinon');

/**
 * timestamp testing
 */
describe('timestamp', function() {
  it('should return correct format of timestamp', function() {
    const timestamp = require('../lib/timestamp');
    const now = new Date(2015, 5, 3, 2, 1, 2);
    global.Date = function() { return now; };
    assert.equal(timestamp().substr(0, 20), '2015.06.03 02:01:02 ');
  });
});

/**
 * personal data loader testing
 */
describe('personal data loader', function() {
  const load = require('../lib/loader');
  const req = require('request-promise');
  it('should call correct GET request', function() {
    const spy = sinon.spy(req, 'get');

    load({
      uri: 'test_uri',
      accessToken: 'test_access_token'
    }).catch(() => {});

    sinon.assert.calledWith(spy, {
      uri: 'test_uri',
      headers: {
        'Authorization': 'Bearer test_access_token',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  });
});

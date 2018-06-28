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

/**
 * pkcs7 signing message testing
 */
describe('pkcs7 signer ', function() {
  const {certificate, key} = require('./certs.json');
  const sign = require('../lib/signer')({certificate, key});

  it('should generate correct decoded message', function() {
    assert.equal(
      sign('test_message'),
      'MIIF_QYJKoZIhvcNAQcCoIIF7jCCBeoCAQExDzANBglghkgBZQMEAgEFADAbBgkqhkiG9w0BBwGgDgQMdGVzdF9tZXNzYWdloIID7TCCA-kwggLRoAMCAQICCQD28u09OTtKFzANBgkqhkiG9w0BAQsFADCBijELMAkGA1UEBhMCUlUxDTALBgNVBAgMBHRlc3QxDDAKBgNVBAcMA3NwYjESMBAGA1UECgwJdGVzdCBlc2lhMRIwEAYDVQQLDAl0ZXN0IGVzaWExEjAQBgNVBAMMCXRlc3QgZXNpYTEiMCAGCSqGSIb3DQEJARYTeWV0aWJyYWluQHlhbmRleC5ydTAeFw0xODA2MjcxODUyMTdaFw0xOTA2MjcxODUyMTdaMIGKMQswCQYDVQQGEwJSVTENMAsGA1UECAwEdGVzdDEMMAoGA1UEBwwDc3BiMRIwEAYDVQQKDAl0ZXN0IGVzaWExEjAQBgNVBAsMCXRlc3QgZXNpYTESMBAGA1UEAwwJdGVzdCBlc2lhMSIwIAYJKoZIhvcNAQkBFhN5ZXRpYnJhaW5AeWFuZGV4LnJ1MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApWELlpEBulWQSl-kCfbVXmlYycyi_-ZBs1Su3n2vh5EEBNtNklwvzUvhCKTpi524QBgpF5PxwDfEAe0EXnNnZPeOCVm0zl0KASCQk0IeJYGsYhVQFximgdYBFNfZx8GCm6G_SQ2qpauAq-Ym_tvIm5ZUrGFA-WQDWjBmbu0p9e_qJ-Eo_2HDh90pJVcJT5xkI6OuUSosH9j4-zQn18B4UfX9dKzF2tLq4ezIFgmJaOeaDwQFFGFTlkOICTB30fgbQ-YbnxQJohvHqlfrCwkG7NsQe_E_MOReulVMjBiaaU0wqHyXVIB9wKGv3O_AYEzbZIbFl1eJE-FGU2REzIqCzQIDAQABo1AwTjAdBgNVHQ4EFgQUeDansSY3khkREKOBY23TsAIslTQwHwYDVR0jBBgwFoAUeDansSY3khkREKOBY23TsAIslTQwDAYDVR0TBAUwAwEB_zANBgkqhkiG9w0BAQsFAAOCAQEATwo5FPtiiAar7OzqzO52yGBmgxUxCsQJYQDtrsi-1XhhFBCpzqlj3VCeHLa6Dxg1dHIb4aQj7bVbbA3pF8OhURVwr7zneA1Dl_39dijL2gjwYOVcQpeC9fHdu4iS73AJTuioDvrnEtY652TcoDZOnXLG2z_bclEM9aRINZnv4WTZ3e66FZHlndULSlOv2uqP4no5ar6nk6KXWOWn8ZCaABKmCLflAO6P9FYtDxVkF8BhvcLCds8Y0thNschaq-HHnVKqaddrWLEvR1IKIjFKuOVJuGKklTxLrXwB0kIE_JG6tffhPaaBrixGHB42-5k-DOAkclpV3Cr1fAgPrK6EbDGCAcQwggHAAgEBMIGYMIGKMQswCQYDVQQGEwJSVTENMAsGA1UECAwEdGVzdDEMMAoGA1UEBwwDc3BiMRIwEAYDVQQKDAl0ZXN0IGVzaWExEjAQBgNVBAsMCXRlc3QgZXNpYTESMBAGA1UEAwwJdGVzdCBlc2lhMSIwIAYJKoZIhvcNAQkBFhN5ZXRpYnJhaW5AeWFuZGV4LnJ1AgkA9vLtPTk7ShcwDQYJYIZIAWUDBAIBBQAwDQYJKoZIhvcNAQEBBQAEggEAk0kEfCSoAbg_AGFw9sUVLtaOCFewkVC-_NHcYoQJX_PpklKG7iZMl9N8yHuBT759D-9Fv35tPHTdkxAW-z8ZoxJv1IOE102BA_DN_MtC2u0fhT20fPs8sZWLmx_mppXgjMAVwjOUXmelpXNqmdaL9Pmy3qQYNzsGjMj8ZzIMwAwP0NjurxJL6XMsU1mdAnx10bVg1kFdDpCI0Fc4E467DCExYB3O4EYOXfDtUWN0bm46P84p7CGxilerJwOrB23EgKAVo37G49UPgL9OzYySDoRQDsd0Ul_hVTX5MZF0FidAkrZ1LaM--QiaePPccI03L1EhX500514QaF-ZSoj4wA'
    );
  });

  it('should generate error with incorrect values', function() {
    assert.throws(function() {
      sign(null);
    }, Error);
  });

  it('should be ok with empty message', function() {
    assert.doesNotThrow(() => sign(''));
    assert.doesNotThrow(() => sign());
  });
});

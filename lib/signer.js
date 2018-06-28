const forge = require('node-forge');
const urlSafeEscape = require('base64-url').escape;

/**
 * @param {Object} Объект с сертификатом и приватным ключом.
 * @prop {String} certificate Содержимое файла сертификата.
 * @prop {String} key Содержимое файла ключа.
 *
 * @return {Function} Подписывает message в формат pkcs#7
 * и кодирует в base64 url safe.
 */
module.exports = ({certificate, key}) => {
  if (!certificate || !key) {
    throw new Error('Certificate and key are required to signing data.');
  }

  return (message) => {
    if (message === undefined) {
      message = '';
    }

    if (typeof message !== 'string') {
      if (message.toString) {
        message = message.toString();
      } else {
        throw new Error('The message value can`t be converted to string');
      }
    }

    const p7 = forge.pkcs7.createSignedData();

    p7.content = forge.util.createBuffer(message);
    p7.addCertificate(certificate);
    p7.addSigner({
      key,
      certificate,
      digestAlgorithm: forge.pki.oids.sha256,
    });
    p7.sign();

    const bytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const base64 = Buffer.from(bytes, 'binary').toString('base64');

    return urlSafeEscape(base64);
  };
};

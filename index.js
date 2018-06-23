
const {URL, URLSearchParams} = require('url');
const getTimestamp = require('./lib/timestamp');
const getSigner = require('./lib/signer');
const uuid = require('uuid/v4');

const defaultConfig = {
  esiaUrl: 'https://esia.gosuslugi.ru',
  authPath: '/aas/oauth2/ac',
  markerPath: '/aas/oauth2/te',
  scope: 'openid',
};

const requiredFields = [
  'esiaUrl',
  'authPath',
  'markerPath',
  'scope',
  'clientId',
  'redirectUri',
  'certificate',
  'key',
];

/**
 * @param {Object} config Конфиг подключения к ЕСИА.
 * @prop {String} esiaUrl Урл портала ЕСИА.
 * (по умолчанию 'https://esia.gosuslugi.ru')
 *
 * @prop {String} authPath Путь страницы авторизации.
 * (по умолчанию '/aas/oauth2/ac')
 *
 * @prop {String} markerPath Путь страницы получения маркера.
 * доступа. (по умолчанию '/aas/oauth2/te')
 *
 * @prop {String} scope Области доступов.
 * (по умолчанию 'openid')
 *
 * @prop {String|Number} clientId Идентификатор системы клиента.
 *
 * @prop {redirectUri} redirectUri Ссылка, по которой должен
 * быть направлен пользователь после того, как даст
 * разрешение на доступ к ресурсу.
 *
 * @prop {String} certificate Содержимое файла сертификата.
 *
 * @prop {String} key Содержимое файла приватного ключа.
 *
 *
 * @return {Object} Экземпляр для работы с ЕСИА.
 * @prop {Function} createAuth Формирует url для перехода в ЕСИА.
 */
module.exports = (config) => {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Config is required.');
  }

  const _conf = Object.assign(
    {},
    defaultConfig,
    config
  );

  for (let field of requiredFields) {
    let value = _conf[field];
    if (value === null || value === undefined) {
      throw new Error(`Field '${field}' is required to config.`);
    }
  }

  const {
    clientId,
    redirectUri,
    scope,
    authPath,
    esiaUrl,
    certificate,
    key,
  } = _conf;

  const authUrl = new URL(authPath, esiaUrl);
  const sign = getSigner({certificate, key});

  return {
    /**
     * Метод возвращает данные для
     * авторизации через портал ЕСИА
     *
     * @return {Object}
     * @prop {String} url Ссылка для авторизации в ЕСИА.
     * @prop {Object} params Параметры, использованные при построении ссылки.
     */
    createAuth() {
      const timestamp = getTimestamp();
      const state = uuid();
      const clientSecret = sign([scope, timestamp, clientId, state].join(''));
      const params = {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        scope,
        state,
        timestamp,
        response_type: 'code',
        access_type: 'offline',
      };
      const authQuery = new URLSearchParams(params);

      return {
        url: `${authUrl}?${authQuery}`,
        params,
      };
    },
  };
};

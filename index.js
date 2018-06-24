
const {URL, URLSearchParams} = require('url');
const getTimestamp = require('./lib/timestamp');
const getSigner = require('./lib/signer');
const uuid = require('uuid/v4');
const querystring = require('querystring');
const request = require('request-promise');
const jwtDecode = require('jwt-decode');
const prns = require('./lib/loader');

const defaultConfig = {
  esiaUrl: 'https://esia.gosuslugi.ru',
  authPath: '/aas/oauth2/ac',
  markerPath: '/aas/oauth2/te',
  dataPath: '/rs/prns',
  scope: 'openid',
};

const requiredFields = [
  'esiaUrl',
  'authPath',
  'markerPath',
  'dataPath',
  'scope',
  'clientId',
  'redirectUri',
  'certificate',
  'key',
];

/**
 * @function
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
    markerPath,
    dataPath,
    esiaUrl,
    certificate,
    key,
  } = _conf;

  const authUrl = new URL(authPath, esiaUrl);
  const markerUrl = new URL(markerPath, esiaUrl);
  const dataUrl = new URL(dataPath, esiaUrl);
  const sign = getSigner({certificate, key});

  return {
    /**
     * Метод возвращает данные для авторизации.
     * @function getAuth
     * @return {Object}
     * @prop {String} url Ссылка для авторизации в ЕСИА.
     * @prop {Object} params Параметры, использованные при построении ссылки.
     */
    getAuth() {
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

    /**
     * Метод получения маркера доступа и информации о пользователе
     * @function getAccess
     * @param {String} code Авторизационны код, возвращаемый на redirect_uri.
     * @param {String[]} dataPathList Массив путей для получения информации
     * о пользователе. Например ['/', '/docs'].
     * (по умлолчанию используется ['/'] - корневой путь.
     * В итоге, будет загружена информиация по пути 'https://esia.gosuslugi.ru/rs/prns/100321/')
     * Если передать null, то информация о пользователе запрашиваться не будет.
     *
     * @return {Promise<Object>} Возвращает промис, который резолвится в объект
     * с ответом на запрос маркера.
     * @prop {Object} marker Объект маркера доступа. Содержит два поля:
     * 1. response - ответ от есиа при получении маркера
     * 2. decodedAccessToken - jwt декодированное поле access_token из response
     *
     * @prop {Object} data Данные о пользователе есиа в том же порядке что и
     * пути для запроса данных, переданные в dataPathList
     */
    getAccess(code, dataPathList) {
      const timestamp = getTimestamp();
      const state = uuid();
      const clientSecret = sign([scope, timestamp, clientId, state].join(''));

      if (!code) {
        return Promise.reject(
          new Error('Code is required to get access marker')
        );
      }

      return request({
        method: 'POST',
        uri: markerUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
          state,
          scope,
          timestamp,
          grant_type: 'authorization_code',
          token_type: 'Bearer',
        }),
      })
        .then((stringlyResponse) => {
          const response = JSON.parse(stringlyResponse);
          const decodedAT = jwtDecode(response.access_token);

          if (!Array.isArray(dataPathList)) {
            dataPathList = dataPathList === undefined ? ['/'] : [];
          }

          return Promise.all(
            dataPathList.map((path) => {
              return prns({
                uri: `${dataUrl}/${decodedAT['urn:esia:sbj_id']}${path}`,
                accessToken: response.access_token,
              });
            })
          )
            .then((data) => ({
              marker: {
                response,
                decodedAccessToken: decodedAT,
              },
              data,
            }));
        })
        .catch((err) => {
          throw new Error(
            'Error while getting marker or handling response. ' + err.message
          );
        });
    },
  };
};

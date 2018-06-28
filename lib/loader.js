const req = require('request-promise');

/**
 * Загружает данные по урлу с использованием токена доступа.
 *
 * @function
 * @param {Object} config Объект с параметрами загрузки данных пользователя.
 * @prop {String} uri Адрес данных
 * @prop {String} accessToken Токен доступа
 *
 * @return {Promise<Object>} Данные
 */
module.exports = ({accessToken, uri}) => {
  if (!accessToken) {
    return Promise.reject(
      new Error('\'accessToken\' is required to get data.')
    );
  }

  return req.get({
    uri,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
    .then((info) => JSON.parse(info));
};

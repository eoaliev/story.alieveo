// Подключим зависимости
const axios = require('axios');
const config = require('config');
const redis = require('redis');
const { promisify } = require('util');

// Проверяет наличие файла на яндекс диске
const existsToYandexDisk = async function (path) {
  try {
    const response = await axios.get(
      'https://cloud-api.yandex.net/v1/disk/resources',
      {
        params: {
          path,
          fields: 'path',
          limit: 1,
          offset: 0,
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth ${config.get('YANDEX.API_TOKEN')}`,
        }
      }
    );

    return true;
  } catch (ex) {
    return false;
  }
};

const run = async () => {
   const {
    APP_NAME,
    ENTITY_ARTICLES,
  } = config.get('REDIS');

  // Инициализируем клиент redis
  const redisClient = redis.createClient();

  redisClient.on("error", function(error) {
    console.error(error);
  });

  // Получим ключи записей в Redis для опубликованных статей
  const keys = await promisify(redisClient.keys).call(
    redisClient,
    `${APP_NAME}:h:${ENTITY_ARTICLES}:*`
  );

  if (!Array.isArray(keys) || !keys.length) {
    console.warn('Нет опубликованных статей');
    process.exit();
  }

  // Сформируем multi запрос в Redis на получение информации о статьях
  let queue = redisClient.multi();
  for (const key of keys) {
    queue.hgetall(key);
  }

  const rows = await promisify(queue.exec).call(queue);

  queue = null;

  if (!Array.isArray(rows) || !rows.length) {
    console.warn('Данные о документах не удалось получить');
    process.exit();
  }

  // Откроем транзакцию в Redis
  queue = redisClient.multi();

  for (const row of rows) {
    // Проверяем наличие на яндекс диске
    // Если документ не найден удаляем статью
    if (!(await existsToYandexDisk(row.path))) {
      queue.del(
        `${APP_NAME}:h:${ENTITY_ARTICLES}:${row.external_id}`
      );
    }
  }

  // Запушим изменения в Redis
  await promisify(queue.exec).call(queue);

  process.exit();
};

run();

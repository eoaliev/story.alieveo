// Подключим зависимости
const axios = require('axios');
const config = require('config');
const redis = require('redis');
const {promisify} = require('util');

const run = async () => {
  const {
    APP_NAME,
    ENTITY_MODIFIED_ARTICLES,
    ENTITY_DOWNLOADED_ARTICLES,
  } = config.get('REDIS');

  // Инициализируем клиент redis
  const redisClient = redis.createClient();

  redisClient.on("error", function(error) {
    console.error(error);
  });

  // Получим ключи записей в Redis для документов которые нужно скачать
  const keys = await promisify(redisClient.keys).call(
    redisClient,
    `${APP_NAME}:h:${ENTITY_MODIFIED_ARTICLES}:*`
  );

  if (!Array.isArray(keys) || !keys.length) {
    console.warn('Нет документов для скачивания');
    process.exit();
  }

  // Сформируем multi запрос в Redis на получение информации о документах
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
    try {
      // Скачаем контент и преобразуем его в base64
      const response = await axios.get(
        row.file,
        {responseType: 'arraybuffer'}
      );

      row.content = Buffer.from(
        response.data,
        'binary'
      ).toString('base64');

      // Сформируем запрос на добавление обработанных данных в Redis
      queue.hmset(
        `${APP_NAME}:h:${ENTITY_DOWNLOADED_ARTICLES}:${row.external_id}`,
        row
      );
    } catch (ex) {
      console.error(ex.message);
    }

    // Сформируем запрос на удаление из Redis для документов которые нужно скачать
    queue.del(
      `${APP_NAME}:h:${ENTITY_MODIFIED_ARTICLES}:${row.external_id}`
    );
  }

  // Запушим изменения в Redis
  await promisify(queue.exec).call(queue);

  process.exit();
};

run();

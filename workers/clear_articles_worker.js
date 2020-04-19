// Подключим зависимости
const config = require('config');
const redis = require('redis');
const { promisify } = require('util');

const run = async () => {
   const {
    APP_NAME,
    ARTICLE_LAST_MODIFIED_TIME,
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

  // Откроем транзакцию в Redis
  const queue = redisClient.multi();

  // Удалим опубликованные статьи
  if (Array.isArray(keys) && keys.length) {
    for (const key of keys) {
      queue.del(key);
    }
  }

  // Удалим время последней измененной статьи
  queue.del(
    `${APP_NAME}:s:${ARTICLE_LAST_MODIFIED_TIME}`
  );

  // Запушим изменения в Redis
  await promisify(queue.exec).call(queue);

  process.exit();
};

run();

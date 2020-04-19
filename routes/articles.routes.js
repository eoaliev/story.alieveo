const {Router} = require('express');
const config = require('config');
const redis = require('redis');
const { promisify } = require('util');

router = new Router();

// Получить список статей
router.get('/articles', async (request, response) => {
  // Проверим наличие параметров limit и offset
  const params = request.body || {};

  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const {
    APP_NAME,
    ENTITY_ARTICLES,
  } = config.get('REDIS');

  // Инициализируем клиент redis
  const redisClient = redis.createClient();

  redisClient.on("error", function(error) {
    console.error(error);
  });

  // Получим список ключей опубликованных статей
  const keys = await promisify(redisClient.keys).call(
    redisClient,
    `${APP_NAME}:h:${ENTITY_ARTICLES}:*`
  );

  if (!Array.isArray(keys) || !keys.length) {
    return response.status(200).json({
      total: 0,
      items: [],
    });
  }

  const total = keys.length;

  // Выберем из них те которые соответствуют limit и offset
  const currentKeys = keys.slice(offset, offset + limit);

  if (!currentKeys.length) {
    return response.status(200).json({
      total: total,
      items: [],
    });
  }

  // Сформируем multi запрос на получение информации о опубликованных статьях
  // Выберем только те параметры которые нужны в списке
  // "created", "modified", "external_id", "name", "preview"
  const fields = ["created", "modified", "external_id", "name", "preview"];

  const queue = redisClient.multi();
  for (const key of currentKeys) {
    queue.hmget(key, ...fields);
  }

  const rows = await promisify(queue.exec).call(queue);
  if (!Array.isArray(rows) || !rows.length) {
    return response.status(200).json({
      total: 0,
      items: [],
    });
  }

  const items = [];
  for (const row of rows) {
    const item = {};

    for (const key in fields) {
      item[fields[key]] = row[key];
    }

    items.push(item);
  }

  // Вернем список статей и общее количество статей
  return response.status(200).json({
    total,
    items,
  });
});

// Получить информацию о конкретной статье
router.get('/articles/:id', async (request, response) => {
  // Проверим наличие параметра external_id
  const EXTERNAL_ID = request.params.id;
  if (!EXTERNAL_ID) {
    return response.status(400).json({
      errors: [
        {
          code: 'VALIDATION_ERROR',
          message: 'Не передан идентификатор статьи',
        },
      ],
    });
  }

  const {
    APP_NAME,
    ENTITY_ARTICLES,
  } = config.get('REDIS');

  // Инициализируем клиент redis
  const redisClient = redis.createClient();

  redisClient.on("error", function(error) {
    console.error(error);
  });

  // Получим информацию о статье из redis
  const row = await promisify(redisClient.hgetall).call(
    redisClient,
    `${APP_NAME}:h:${ENTITY_ARTICLES}:${EXTERNAL_ID}`
  );

  if (!row) {
    return response.status(404).json({
      errors: [
        {
          code: 'NOT_FOUND',
          message: 'Статья не найдена',
        },
      ],
    });
  }

  // Вернем информацию о статье
  response.status(200).json(row);
});

module.exports = router;

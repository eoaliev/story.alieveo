// Подключим зависимости
const config = require('config');
const mammoth = require("mammoth");
const redis = require('redis');
const {promisify} = require('util');

const run = async () => {
  const {
    APP_NAME,
    ENTITY_DOWNLOADED_ARTICLES,
    ENTITY_ARTICLES,
  } = config.get('REDIS');

  // Инициализируем клиент redis
  const redisClient = redis.createClient();

  redisClient.on("error", function(error) {
    console.error(error);
  });

  // Получим ключи записей в Redis для документов которые нужно конвертировать
  const keys = await promisify(redisClient.keys).call(
    redisClient,
    `${APP_NAME}:h:${ENTITY_DOWNLOADED_ARTICLES}:*`
  );

  if (!Array.isArray(keys) || !keys.length) {
    console.warn('Нет документов для конвертации');
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
      if (!row.content) {
        throw new Error(
          `Документ "${row.path}" не имеет контента`
        );
      }

      // Конвертируем контент в html
      const result = await mammoth.convertToHtml(
        Buffer.from(
          row.content,
          'base64'
        )
      );

      if (!result || !result.value) {
        if (result && result.message) {
          console.warn(result.message);
        }

        throw new Error(
          `Документ "${row.path}" не удалось конвертировать`
        );
      }

      row.content = result.value;

      // Сформируем запрос на добавление обработанных данных в Redis
      queue.hmset(
        `${APP_NAME}:h:${ENTITY_ARTICLES}:${row.external_id}`,
        row
      );
    } catch (ex) {
      console.error(ex.message);
    }

    // Сформируем запрос на удаление из Redis для документов которые нужно конвертировать
    queue.del(
      `${APP_NAME}:h:${ENTITY_DOWNLOADED_ARTICLES}:${row.external_id}`
    );
  }

  // Запушим изменения в Redis
  await promisify(queue.exec).call(queue);

  process.exit();
};

run();

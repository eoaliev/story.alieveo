// Подключаем нужные нам библиотеки
const axios = require('axios');
const config = require('config');
const md5 = require('md5');
const redis = require('redis');
const { promisify } = require('util');

const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Получим из redis информацию о максимальной дате последнего изменения статьи
const getLastModifiedTime = async (redisClient) => {
  const {APP_NAME, ARTICLE_LAST_MODIFIED_TIME} = config.get('REDIS');

  // Получим дату из редиса
  let lastModifiedTime = await promisify(redisClient.get).call(
    redisClient,
    `${APP_NAME}:s:${ARTICLE_LAST_MODIFIED_TIME}`
  );

  // Если дата последнего изменения отсутствует присвоим значение 0
  lastModifiedTime = parseInt(lastModifiedTime, 10);
  if (isNaN(lastModifiedTime) || 0 >= lastModifiedTime) {
    return 0;
  }

  return lastModifiedTime;
};

// Обертка для запросов к REST API Яндекс Диска
const queryYandexDiskDocuments = async (offset, limit) => {
  limit = limit || config.get('YANDEX.DEFAULT_LIMIT');
  offset = offset || 0;

  // Для работы нам понадобятся только эти поля
  // Описание полей можно посмотреть в документации к API
  const fields = [
    '_embedded.items.name',
    '_embedded.items.created',
    '_embedded.items.modified',
    '_embedded.items.mime_type',
    '_embedded.items.file',
    '_embedded.items.preview',
    '_embedded.items.path',
    '_embedded.total',
  ].join(',');

  try {
    const response = await axios.get(
      'https://cloud-api.yandex.net/v1/disk/resources',
      {
        params: {
          path: 'app:/', // Ищем файлы в папке приложения
          sort: '-modified', // Сортируем по убыванию даты изменения
          fields,
          limit,
          offset,
          preview_crop: true, // Обрезаем превью
          preview_size: config.get('YANDEX.PREVIEW_SIZE'), // Размер берем из конфига
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth ${config.get('YANDEX.API_TOKEN')}`,
        }
      }
    );

    return response.data;
  } catch (ex) {
    console.error(ex.message);
  }

  return false;
};

// С помощью итератора будем получать информацию о нужных нам документах
const getNextModifiedRow = async function *getNextModifiedRow(redisClient) {
  // Получим из redis информацию о максимальной дате последнего изменения статьи
  const lastModifiedTime = await getLastModifiedTime(redisClient);

  let offset = 0;
  let total = 0;
  const limit = config.get('YANDEX.DEFAULT_LIMIT');

  // Будем обращаться к API пока не закончатся файлы
  do {
    // Запросим первую партию информации о файлах
    const response = await queryYandexDiskDocuments(
      offset,
      limit
    );

    // Если пришел не корректный ответ прервем выполнение
    if (!response || !response._embedded || !response._embedded.items) {
      return;
    }

    total = response.total;

    // Переберем полученные элементы
    for (const row of response._embedded.items) {
      const modifiedTime = (new Date(row.modified)).getTime();

      // Если дата последнего изменения меньше или равна максимальной
      // прервем выполнение
      if (lastModifiedTime >= modifiedTime) {
        return;
      }

      // Если файл не docx пропустим
      if (DOCX_MIME_TYPE !== row.mime_type) {
        continue;
      }

      yield row;
    }

    // Увеличим отступ
    offset += limit;
  } while (total > offset - limit);

  return;
};

// Чтобы использовать функционал async/await
const run = async () => {
  const {
    APP_NAME,
    ENTITY_MODIFIED_ARTICLES,
    ARTICLE_LAST_MODIFIED_TIME,
  } = config.get('REDIS');

  // Инициализируем клиент redis
  const redisClient = redis.createClient();

  redisClient.on("error", function(error) {
    console.error(error);
  });

  // Откроем транзакцию с redis
  const queue = redisClient.multi();

  let maxModifiedTime = 0;

  // Переберем все найденные документы
  for await (const row of getNextModifiedRow(redisClient)) {
    const modifiedTime = (new Date(row.modified)).getTime();
    if (maxModifiedTime < modifiedTime) {
      maxModifiedTime = modifiedTime;
    }

    row.external_id = md5(row.path);

    // Информацию о каждой найденной записи запишем в redis
    queue.hmset(
      `${APP_NAME}:h:${ENTITY_MODIFIED_ARTICLES}:${row.external_id}`,
      row
    );
  }

  // Обновим дату последнего изменения статьи
  if (0 < maxModifiedTime) {
    queue.set(
      `${APP_NAME}:s:${ARTICLE_LAST_MODIFIED_TIME}`,
      maxModifiedTime
    );
  }

  // Закоммитим изменения в redis
  await promisify(queue.exec).call(queue);

  // Завершим выполнение скрипта.
  process.exit();
};

run();

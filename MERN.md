# Full Stack разработка на JavaScript. Разрабатываем SPA приложение для чтения статей.

**Цели:** прокачать скилл в следующих техноголиях Node.js, Express, React, Redux, MongoDB, REST API, REST API Яндекс Диска, Redis.

**Задача:** создать сайт статей. На главной странице вывести список опубликованных статей. Список статей имеет постраничную навигацию по 20 элементов. При нажатии на заголовок статьи открывается карточка статьи. В картичке статьи можно прочитать весь текст статьи. В списке статей и в карточке статьи отображать количество просмотров и лайки. Добавление, редактирование и удаление статей должно происходить через яндекс диск.

## Детализация задачи

Зарегистрируем наше приложение на сервере яндекса. Получим токен для работы с API. По API будем забирать все документы .docx размещенные в папке приложения на яндекс диске. Это и есть наши опубликованные статьи.

На сервере создадим воркер, задачей которого будет получать из папки приложения на яндекс диске все измененные документы и сохранять информацию о них в Redis.

На сервере создадим воркер, задачей которого будет получить из Redis информацию о измененных документах, скачать их и записать в Redis.

На сервере создадим воркер, задачей которого будет преобразовать скаченные документы в html и сохранить в Redis преобразованные данные.

На сервере создадим воркер, задачей которого будет найти все статьи которые были удалены и удалить их.

На сервере создадим воркер, задачей которого будет обновить информацию о всех статьях.

На сервере с помощью Express реализовать REST API. REST API будет иметь два метода: получение списка статей и получения информации о конкретной статье.

Реализовать клиента с использованием React. На клиенте есть список статей и детальная страница статьи.

Подключить MongoDB для хранения информации о просмотрах и лайках. *P.S.: На самом деле это все можно было бы хранить в Redis, но у нас цель прокачать навык работы с MongoDB*

Расширить REST API. Добавить методы: получение количества лайков статьи, получение количества просмотров статьи, изменение количества лайков статьи, изменение количества просмотров статьи.

Доработать клиента. Настроить получение информации о просмотрах и лайках статей. Добавить возможность лайкать статьи. Добавить сохранение информации о просмотре статьи.

Арендовать и настроить облачный сервер.

Перенести работу приложения на облачный сервер.

## Приступим к выполнению задач

Дальнейшие пункты предполагают что вы пользователь ОС Linux и у вас уже установлен Node.js и Redis Server.

### Инициализация приложения

Перед началом работы сформируем скелет нашего приложения. Создадим Git репозиторий, для этого будем использовать https://github.com/. Как создать новый репозиторий разберетесь сами. Вот ссылка на созданный мной репозиторий https://github.com/eoaliev/story.alieveo.

На компьютере создаем папку в которой будет храниться исходный код приложения и переходим в нее.

В папке проекта инициализируем npm проект командой `npm init`. Отвечаем на вопросы в командной строке и подтверждаем. Будет создан package.json файл. В нем добавляем параметр `"private": true` чтобы наш проект не был случайно опубликован. И в качетсве точки входа указываем файл app.js `"main": "app.js"`. Получаем примерно такой package.json
```json
{
  "name": "story.alieveo",
  "version": "1.0.0",
  "description": "Story Alieveo",
  "main": "app.js",
  "scripts": {
    "up": "node app.js"
  },
  "author": "Emil Aliev <aliev.e.o@gmail.com>",
  "license": "ISC",
  "private": true
}
```

Создаем пустой файл app.js.

Создадим файл .editorconfig
```
root = true

[*]
charset = utf8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.yml]
indent_size = 2

[Makefile]
indent_style = tab
```

Ставим пакет config https://www.npmjs.com/package/config выполнив команду
```bash
npm i config
```

Создаем папку config и в ней пустой файл .gitkeep

Создаем файл .gitignore
```
/node_modules/
/config/*
!/config/default.json
```

Инициализируем git репозиторий командой
```bash
git init

# Добавляем файлы к коммиту
git add .

# Делаем первый коммит
git commit -m "Initial commit"

# Указываем ссылку на удаленный репозиторий, у вас ссылка будет другой
git remote add origin git@github.com:eoaliev/story.alieveo.git

# Пушип изменения в удаленный репозиторий
git push -u origin master
```

### Получение токена для работы с REST API Яндекс Диска

Идем на страницу описания REST API Яндекс Диска https://yandex.ru/dev/disk/rest/. Переходим к получению токена для приложения https://yandex.ru/dev/oauth/. Тут нас попросят зарегистрировать приложение, слушаемся и переходим https://oauth.yandex.ru/client/new.

Заполняем форму. Заполняем название. Ставим галочку "Веб-сервисы" в выборе платформы и нажимаем на ссылку "Подставить URL для разработки". В доступах выбираем "Яндекс.Диск REST API" и разрешаем "Доступ к папке приложения на Диске". Остальные поля заполняем по желанию. Нажимаем кнопку "Создать приложение". Приложение создано.

Теперь необходимо получить токен для авторизации в REST API. Для наших целей подойдет отладочный токен (подробнее тут https://yandex.ru/dev/oauth/doc/dg/tasks/get-oauth-token-docpage/). Авторизовываемся в яндексе от имени того пользователя который будет публиковать статьи. Переходим по адресу https://oauth.yandex.ru/authorize?response_type=token&client_id=<идентификатор приложения>, где <идентификатор приложения> нужно поменять на тот который мы получили при регистрации приложения. У нас запросят доступ к папке приложения на диске, разрешаем доступ. На экране будет выведен токен для авторизации. Копируем токен и сохраняем его в файле /config/default.json, который надо будет создать.
```json
{
  "YANDEX": {
    "API_TOKEN": "0c4181a7c2cf4521964a72ff57a34a07",
    "DEFAULT_LIMIT": 100,
    "PREVIEW_SIZE": "M"
  }
}
```
Туда же запишем параметры "DEFAULT_LIMIT" и "PREVIEW_SIZE" они нам понадобятся в дальнейшем.

Переходим в яндекс диск ищем папку "Приложения", а в ней папку с именем нашего приложения. Если нет хотя бы одной папки идем в полигон REST API Диска https://yandex.ru/dev/disk/poligon/. Вводим наш авторизационный токен в поле для токена. Нажимаем на ссылку "/v1/disk/resources" и в открывшемся блоке нажимаем на API "Получить метаинформацию о файле или каталоге". Проматываем описание и в параметре "path" пишем "app:/". Таким образом мы обращаемся к папке приложения на диске. Нажимаем кнопку попробовать чтобы выполнить запрос. Яндекс создаст папку приложения на диске и вернет информацию о ней.

### Воркер получения измененных статей

Для работы воркера нужно будет поставить несколько библиотек. Библиотека для работы с Redis https://www.npmjs.com/package/redis
```bash
npm i redis
```

Библиотека для работы с http запросами https://www.npmjs.com/package/axios.
```bash
npm i axios
```

Библиотека для работы с md5 https://www.npmjs.com/package/md5
```bash
npm i md5
```

Ключи редиса для хештаблиц будем строить по следующему шаблону "app_name:h:entity_name:entity_id". Для данных типа строка по шаблону "app_name:s:key_name".

Добавим директорию workers и создадим в ней пустой файл fetch_modified_article_worker.js. В package.json добавим команду запуска воркера, в директиве "scripts"
```json
"fetch_modified_article": "node workers/fetch_modified_article_worker.js"
```

Опишем что нужно сделать чтобы воркер заработал
```js
// Подключаем redis, axios и config

// Инициализируем клиент redis

// Получим из redis информацию о максимальной дате последнего изменения статьи

// Если дата последнего изменения отсутствует присвоим значение 0

// В цикле будем выбирать по 100 документов,
// отсортированных в порядке убывания даты изменения,
// из папки приложения на яндекс диске
// до тех пор пока записи не закончатся
// либо не найдется запись у которой дата изменения меньше
// той что мы получили из redis

// Информацию о каждой найденной записи,
// дата изменения которой больше чем полученная из redis,
// и тип которой документ docx,
// запишем в redis

// Обновим дату последнего изменения статьи

// Завершим выполнение скрипта.
```

В редисе нам понадобится хранить следующие данные. Дата последнего изменения - строка с таймстампом, ключ "app_name:s:article_last_modified_time". Данные о измененных файлах - хеш таблица, ключ "app_name:h:modified_articles:external_id" где "external_id" md5 от пути к файлу на диске.

Так как нам может понадобится использовать вышеуказанные ключи где-то еще добавим их в /config/default.json
```json
{
  "YANDEX": {
    "API_TOKEN": "0c4181a7c2cf4521964a72ff57a34a07",
    "DEFAULT_LIMIT": 100,
    "PREVIEW_SIZE": "M"
  },
  "REDIS": {
    "APP_NAME": "story_alieveo",
    "ENTITY_MODIFIED_ARTICLES": "modified_articles",
    "ARTICLE_LAST_MODIFIED_TIME": "article_last_modified_time"
  }
}
```

Напишем код воркера
```js
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
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add fetch modified articles worker'
git push origin HEAD
```

### Воркер скачивания измененных статей

Данный воркер будет забирать из redis информацию о документах которые нужно загрузить, по ключу "app_name:h:modified_articles:external_id". Для каждого документа он будет скачивать контент файла и преобразовывать его в base64. Полученные данные будет сохраняться в redis по ключу "app_name:h:downloaded_articles:external_id". Данные по ключу "app_name:h:modified_articles:external_id" будут удаляться после обработки.

В /config/default.json добавим запись для директивы "REDIS"
```json
"ENTITY_DOWNLOADED_ARTICLES": "downloaded_articles"
```

В директории workers создадим пустой файл download_articles_worker.js. В package.json добавим команду запуска воркера, в директиве "scripts"
```json
"download_articles_worker": "node workers/download_articles_worker.js"
```

Опишем что нужно сделать чтобы воркер заработал
```js
// Подключим зависимости

// Получим ключи записей в Redis для документов которые нужно скачать

// Сформируем multi запрос в Redis на получение информации о документах

// Откроем транзакцию в Redis

// Для каждого документа
  // Скачаем контент и преобразуем его в base64
  // Сформируем запрос на добавление обработанных данных в Redis
  // Сформируем запрос на удаление из Redis для документов которые нужно скачать

// Запушим изменения в Redis
```

Напишем код воркера
```js
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
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add download articles worker'
git push origin HEAD
```

### Воркер преобразования измененных статей в HTML

Для работы воркера нужно будет поставить библиотеку, для конвертации docx в html, Mammoth https://www.npmjs.com/package/mammoth
```bash
npm i mammoth
```

Данный воркер будет забирать из redis информацию о документах которые нужно конвертировать, по ключу "app_name:h:downloaded_articles:external_id". Для каждого документа он будет преобразовывать контент в html. Полученные данные будет сохраняться в redis по ключу "app_name:h:articles:external_id". Данные по ключу "app_name:h:downloaded_articles:external_id" будут удаляться после конвертации.

В /config/default.json добавим запись для директивы "REDIS"
```json
"ENTITY_ARTICLES": "articles"
```

В директории workers создадим пустой файл convert_articles_content_worker.js. В package.json добавим команду запуска воркера, в директиве "scripts"
```json
"convert_articles_content_worker": "node workers/convert_articles_content_worker.js"
```

Опишем что нужно сделать чтобы воркер заработал
```js
// Подключим зависимости

// Получим ключи записей в Redis для документов которые нужно конвертировать

// Сформируем multi запрос в Redis на получение информации о документах

// Откроем транзакцию в Redis

// Для каждого документа
  // Конвертируем контент в html
  // Сформируем запрос на добавление обработанных данных в Redis
  // Сформируем запрос на удаление из Redis для документов которые нужно конвертировать

// Запушим изменения в Redis
```

Напишем код воркера
```js
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
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add convert articles content worker'
git push origin HEAD
```

### Воркер удаления статей

Данный воркер будет забирать из redis информацию о опубликованных статьях, по ключу "app_name:h:articles:external_id". Для каждой статьи он будет существование файла на Яндекс Диске. Если файл отсутствует статья удаляется из redis.

В директории workers создадим пустой файл remove_removed_articles_worker.js. В package.json добавим команду запуска воркера, в директиве "scripts"
```json
"remove_removed_articles_worker": "node workers/remove_removed_articles_worker.js"
```

Опишем что нужно сделать чтобы воркер заработал
```js
// Подключим зависимости

// Получим ключи записей в Redis для опубликованных статей

// Сформируем multi запрос в Redis на получение информации о статьях

// Откроем транзакцию в Redis

// Для каждой статьи
  // Проверяем наличие на яндекс диске
  // Если документ не найден удаляем статью

// Запушим изменения в Redis
```

Напишем код воркера
```js
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
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add remove removed articles worker'
git push origin HEAD
```

### Воркер обновления всех статей

Данный воркер будет удалять из redis все опубликованные статьи, а так же удалять таймстамп последней измененной статьи. Таким образом при запуске всех предыдущих воркеров информация о статьях обновится.

Для того чтобы не ждать пока все необходимые воркеры выполнятся, напишем команду которая последовательно запустит все необходимые нам воркеры.

В директории workers создадим пустой файл clear_articles_worker.js. В package.json добавим команды, в директиве "scripts"
```json
"clear_articles_worker": "node workers/clear_articles_worker.js",
"clear_articles": "npm run clear_articles_worker && npm run fetch_modified_article && npm run download_articles_worker && npm run convert_articles_content_worker"
```

Опишем что нужно сделать чтобы воркер заработал
```js
// Подключим зависимости

// Получим ключи записей в Redis для опубликованных статей

// Откроем транзакцию в Redis

// Удалим опубликованные статьи

// Удалим время последней измененной статьи

// Запушим изменения в Redis
```

Напишем код воркера
```js
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
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add clear articles worker'
git push origin HEAD
```

### Первичное REST API

Серверная часть нашего приложения будет строиться с помощью фреймворка Express https://www.npmjs.com/package/express. Установим данную зависимость
```bash
npm i express
```

Для того чтобы было удобнее разрабатывать серверную часть установим пакет nodemon https://www.npmjs.com/package/nodemon. Он будет автоматически перезапускать сервер приложения при изменениях в коде. Ставим в зависимости dev.
```bash
npm i -D nodemon
```

В файл package.json добавим команду для запуска сервера в режиме разработки, в директиву "scripts"
```json
"watch": "nodemon app.js"
```

В файле config/default.json добавляем параметры которые нам понадобятся для настройки сервера
```json
"SERVER": {
  "PORT": 5000
}
```

В файле app.js инициализируем Express
```js
const config = require('config');
const express = require('express');

const app = express();

// Добавим обработку роута для REST API
app.use('/api', require('routes/api.routes'))

const SERVER_PORT = config.get('SERVER.PORT') || 5000;

app.listen(
  SERVER_PORT,
  () => console.log(`Server started on port ${SERVER_PORT}`)
);
```

Создадим файл routes/api.routes.js. В нем будем описывать роты для REST API
```js
const {Router} = require('express');

router = new Router();

router.use('/articles', require('./articles.routes.js'));

module.exports = router
```

Создадим файл routes/articles.routes.js. В нем опишем роты для REST API статей
```js
const {Router} = require('express');

router = new Router();

// Получить список статей
router.get('/articles', async (request, response) => {

});

// Получить информацию о конкретной статье
router.get('/articles/:id', async (request, response) => {

});

module.exports = router;
```

Опишем что нам надо сделать чтобы REST API статей заработало
```js
const {Router} = require('express');

router = new Router();

// Получить список статей
router.get('/articles', async (request, response) => {
  // Проверим наличие параметров limit и offset

  // Получим список ключей опубликованных статей

  // Выберем из них те которые соответствуют limit и offset

  // Сформируем multi запрос на получение информации о опубликованных статьях
  // Выберем только те параметры которые нужны в списке
  // "created", "modified", "external_id", "name", "preview"

  // Вернем список статей и общее количество статей
});

// Получить информацию о конкретной статье
router.get('/articles/:id', async (request, response) => {
  // Проверим наличие параметра external_id

  // Получим информацию о статье из redis

  // Вернем информацию о статье
});

module.exports = router;
```

Реализуем логику REST API
```js
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
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add articles rest api'
git push origin HEAD
```

### Клиентская часть приложения

#### Инициализируем react приложение
Клиент будем создавать на React поэтому развернем новый реакт проек в папке client командой
```bash
npx create-react-app client
```

По завершении выполнения команды появится папка client. Удаляем файлы которые нам не пригодятся: client/README.md, client/src/setupTests.js, client/src/App.test.js, client/src/logo.svg, client/src/App.css.

В файле client/src/index.css удаляем все.

В файле client/src/App.js удаляем все что мы не будем использовать
```jsx
import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Client</h1>
    </div>
  );
}

export default App;
```

Для построения визуальной части клиента будем использовать materializecss https://materializecss.com/.
```bash
cd client && npm install materialize-css@next && cd ..
```

В файле client/src/index.css подключим css стили materialize.
```css
@import "~materialize-css/dist/css/materialize.min.css";
```

Для того чтобы одновременно локально запустить серверную часть и клиентскую будем использовать пакет Concurrently https://www.npmjs.com/package/concurrently
```bash
npm i -D concurrently
```

После этого добавляем команды в packaje.json в директиву scripts
```json
"client_watch": "npm run start --prefix client",
"dev": "concurrently \"npm run watch\" \"npm run client_watch\""
```

Добавим хедер и футер в файле client/src/App.js
```jsx
import React from 'react';

function App() {
  return (
    <div className="app-container">
      <nav>
        <div className="nav-wrapper main-navigation">
          <div className="container">
            <a href="/" className="brand-logo">Client logo</a>
          </div>
        </div>
      </nav>
      <main className="container">
        <h1>Client</h1>
      </main>
      <footer className="page-footer">
        <div className="footer-copyright">
          <div className="container">
            <span>© 2020 Copyright Text</span>
            <span className="grey-text text-lighten-4 right">Additional text or link</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
```

И немного стилей в client/src/style.css
```css
.app-container{
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

main {
  flex: 1 0 auto;
}

.page-footer{
  padding-top: 0;
}
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Initialize react app'
git push origin HEAD
```

#### Настраиваем роутинг

Работу будем вести относительно папки client.

Для работы клиента нам понадобится библиотека react-router-dom https://www.npmjs.com/package/react-router-dom. По умолчанию ставится версия 5.1.2, но у меня она отказалась работать.

```
./node_modules/react-router-dom/modules/BrowserRouter.js
SyntaxError: /home/eoaliev/workspace/story.alieveo/client/node_modules/react-router-dom/modules/BrowserRouter.js: Support for the experimental syntax 'classProperties' isn't currently enabled (11:11):

   9 |  */
  10 | class BrowserRouter extends React.Component {
> 11 |   history = createHistory(this.props);
     |           ^
  12 |
  13 |   render() {
  14 |     return <Router history={this.history} children={this.props.children} />;

Add @babel/plugin-proposal-class-properties (https://git.io/vb4SL) to the 'plugins' section of your Babel config to enable transformation.
```
Пробовал поставить "@babel/plugin-proposal-class-properties" но у меня этого так и не вышло в итоге поставил вот эту версию библиотеки https://github.com/ReactTraining/react-router/releases/tag/v6.0.0-alpha.3
```bash
npm i react-router@next react-router-dom@next
```

В папке src создадим папку View. В этой папке будем хранить компоненты которые подключаются из роутера. Создадим первый такой компонент IndexView.js со следующим содержимым:
```jsx
import React from 'react';

export const IndexView = () => {
  return (
    <div>
      <h1>Is index page</h1>
    </div>
  );
}
```

В папке src создадим файл routes.js в нем будем описывать роутинг.
```jsx
import React from 'react';
import {Routes, Route} from 'react-router-dom';
import {IndexView} from "./View/IndexView";

export const useRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<IndexView />} />
    </Routes>
  )
}
```

В фвйле src/App.js настроим работу с роутером
```jsx
import React from 'react';
// Импортируем зависимости
import {BrowserRouter} from 'react-router-dom'
import {useRoutes} from "./routes";

function App() {
  // Получим роутинг
  const routes = useRoutes();

  return (
    <div className="app-container">
      <nav>
        <div className="nav-wrapper main-navigation">
          <div className="container">
            <a href="/" className="brand-logo">Story.Alieveo</a>
          </div>
        </div>
      </nav>
      <main className="container">
        <!-- Подключим роутинг -->
        <BrowserRouter>
          {routes}
        </BrowserRouter>
      </main>
      <footer className="page-footer">
        <div className="footer-copyright">
          <div className="container">
            <span>© 2019 Emil Aliev</span>
            <span className="grey-text text-lighten-4 right">
              Копирование материалов сайта, без указания источника, запрещено!
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add routing'
git push origin HEAD
```

#### Делаем страницу списка

Для дальнейшей работы нам понадобится установить библиотеки Redux (https://www.npmjs.com/package/redux), React Redux (https://www.npmjs.com/package/react-redux) и Redux Thunk (https://www.npmjs.com/package/redux-thunk) для работы с асинхронными запросами.
```bash
npm i redux react-redux redux-thunk
```

Для загрузки списка статей нам понадобится установить библиотеку для работы с http запросами https://www.npmjs.com/package/axios.
```bash
npm i axios
```

Для того чтобы корректно работали запросы на сервер в файле package.json добавим директиву proxy
```json
"proxy": "http://localhost:5000"
```


В папке src создадим папку Component и в ней папку Article. В папке Article создадим два файла List.js и ListItem.js это будут компоненты отображения списка статей и одного элемента в списке соответственно. Опишем данные компоненты
```jsx
// Файл src/Component/Article/List.js
import React from 'react';
import ListItem from './ListItem';
import './List.css';

class List extends React.Component {
  componentDidMount(){
    this.props.fetchArticles();
  }

  render(){
    // Получим статьи которые нужно отобразить
    const articles = this.props.articles;

    const template = [];

    // Разобъем статьи на чанки по 3 статьи
    // У нас в строке будет ровна по столько
    for (let i = 0; i < articles.length; i += 3) {
      const list = articles.slice(i, i + 3).map(
        (article) => (<ListItem article={article} key={article.external_id} />)
      );

      // Шаблон для одной строки статей
      template.push(
        (<div className="article-list" key={`article-row-${i}`}>{list}</div>)
      );
    }

    return template;
  }
}

export default List;
```

```jsx
import React from 'react';
import {Link} from 'react-router-dom';
import './ListItem.css';

class ListItem extends React.Component {
  render(){
    // Получим статью которую нужно отобразить
    const article = this.props.article;

    // Отформатируем дату создания
    let created = article.created;
    if (created) {
      created = (new Date(created)).toLocaleDateString();
    }

    // Отформатируем имя
    const name = article.name.replace(/\.docx$/, '');

    return (
      <div className="card">
        <div className="card-image">
          <span className="card-date">{created}</span>
        </div>
        <div className="card-content">
          <Link to={`/articles/${article.external_id}`}>{name}</Link>
        </div>
      </div>
    );
  }
}

export default ListItem;
```

Для файла src/Component/Article/List.js создадим css файл со стилями src/Component/Article/List.css
```css
.article-list {
  display: grid;
  grid-template-columns: 33.33% 33.33% 33.33%;
  gap: 0.75rem;
}
```

Для файла src/Component/Article/ListItem.js создадим css файл со стилями src/Component/Article/ListItem.css
```css
.card .card-image .card-date {
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 0.25rem 1rem;
}

.card .card-content {
  padding: 1rem;
}
```

Для удобного подключения компонентов в папке src создаем файл jsconfig.json со следующим содержимым
```json
{
  "compilerOptions": {
    "baseUrl": "src"
  },
  "include": ["src"]
}
```

В файле src/View/IndexView.js подключим компонент src/Component/Article/List.js
```jsx
import React from 'react';
import ArticleList from 'Component/Article/List';

export const IndexView = () => {
  return (<ArticleList />);
}
```

Для дельнейшей работы нам понадобится создать store и настроить его работу с компонентами реакт.

Для начала в папке src создадим папку Reducer. В этой папке создадим файл Articles.js в нем опишем редуктор который будет отвечать за состояние списка статей
```js
// Состояние по умолчанию
const defaultState = {
  articles: [], // Статьи
  limit: 21, // Ограничение на количество
  offset: 0, // Отступ
};

export default (state = defaultState, action) => {
  return state;
}
```

Создадим файл src/Reducer/index.js который будет объединять все редукторы приложения
```js
import {combineReducers} from 'redux';
import Articles from './Articles'

export default combineReducers({
  articles: Articles,
});
```

Теперь в файле src/index.js необходимо создать store и настроить его работу с компонентами реакт.
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {createStore, applyMiddleware} from 'redux';
import Reducers from './Reducer';
import {Provider} from 'react-redux';
import thunk from 'redux-thunk';

const store = createStore(
  Reducers,
  applyMiddleware(thunk)
);

ReactDOM.render(
  (
    <Provider store={store}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>
  ),
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
```

В папке src/Reducer создадим папку Action в которой будем хранить колбеки для изменения стора. В папке Action создадим папку Type в которой будут храниться типы действий.

В папке src/Reducer/Action/Type создадим файл Articles.js
```js
export const FETCH_ARTICLES = 'ARTICLES/FETCH';
```

В папке src/Reducer/Action создадим файл Articles.js
```js
import {FETCH_ARTICLES} from './Type/Articles';
import axios from 'axios';

export function fetchArticles() {
  return async (dispatch, getState) => {
    const {limit, offset} = getState().articles;

    const response = await axios.get(
      '/api/articles',
      {
        params: {limit, offset},
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    dispatch({
      type: FETCH_ARTICLES,
      payload: response.data.items,
    });
  }
}
```

В редукторе src/Reducer/Articles.js добавим обработку действия FETCH_ARTICLES
```js
import {FETCH_ARTICLES} from "./Action/Type/Articles";

// Состояние по умолчанию
const defaultState = {
  articles: [],
  limit: 21,
  offset: 0,
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case FETCH_ARTICLES:
      return {...state, articles: action.payload};
    default:
      return state;
  }
}
```

Теперь в компоненте src/Component/Article/List.js необходимо настроить работу компонента с store.
```jsx
import React from 'react';
import ListItem from './ListItem';
import {connect} from 'react-redux';
import {fetchArticles} from 'Reducer/Action/Articles'
import './List.css';

class List extends React.Component {
  // После загрузки компонента загрузим статьи
  componentDidMount(){
    this.props.fetchArticles();
  }

  render(){
    // Получим статьи которые нужно отобразить
    const articles = this.props.articles;

    const template = [];

    // Разобъем статьи на чанки по 3 статьи
    // У нас в строке будет ровна по столько
    for (let i = 0; i < articles.length; i += 3) {
      const list = articles.slice(i, i + 3).map(
        (article) => (<ListItem article={article} key={article.external_id} />)
      );

      // Шаблон для одной строки статей
      template.push(
        (<div className="article-list" key={`article-row-${i}`}>{list}</div>)
      );
    }

    return template;
  }
}

// Настраиваем зависимость от стора
export default connect(
  (state) => ({
    articles: state.articles.articles,
  }),
  {
    fetchArticles
  }
)(List);
```

Добавляем изменения к комиту и пушим его
```bash
git add .
git commit -m 'Add articles list'
git push origin HEAD
```

#### Настваиваем отображение лоадера при загрузке данных

#### Добавляем постраничную навигацию

#### Делаем детальную страницу

### Подключение MongoDB

### Расширяем REST API

### Дорабатываем клиента

### Арендуем и настраиваем облачный сервер

### Перенос приложения на облачный сервер

## Выводы

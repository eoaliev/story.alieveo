const config = require('config');
const express = require('express');

const app = express();

// Добавим обработку роута для REST API
app.use('/api', require('./routes/api.routes.js'))

const SERVER_PORT = config.get('SERVER.PORT') || 5000;

app.listen(
  SERVER_PORT,
  () => console.log(`Server started on port ${SERVER_PORT}`)
);

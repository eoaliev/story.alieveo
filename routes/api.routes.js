const {Router} = require('express');

router = new Router();

router.use('/articles', require('./articles.routes.js'));

module.exports = router

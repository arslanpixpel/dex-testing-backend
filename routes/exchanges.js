const router = require('express').Router();
const { getExchanges } = require('../controllers/exchangesController');

router.get('/', getExchanges);

module.exports = router;

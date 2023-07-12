const express = require('express');

const router = express.Router();

const chartData = require('./chartData');
const exchanges = require('./exchanges');
const tokens = require('./tokens');
const metadata = require('./metadata');
const images = require('./images');

router.use('/image', images);
router.use('/lp-image', express.static('image'));
router.use('/chart-data', chartData);
router.use('/exchanges', exchanges);
router.use('/tokens', tokens);
router.use('/metadata', metadata);

module.exports = router;

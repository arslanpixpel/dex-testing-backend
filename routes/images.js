const router = require('express').Router();
const { getImage } = require('../controllers/imageController');

router.get('/:imageName', getImage);

module.exports = router;

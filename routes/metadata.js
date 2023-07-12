const router = require('express').Router();
const {
  getTestTokenMetadata,
  getLpTokenMetadata,
} = require('../controllers/metadataController');

router.get('/test-tokens', getTestTokenMetadata);
router.get('/swap/lp-tokens', getLpTokenMetadata);

module.exports = router;

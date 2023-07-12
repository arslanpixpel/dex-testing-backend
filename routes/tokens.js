const router = require('express').Router();
const { getTokens, postToken } = require('../controllers/tokensController');

router.get('/list', getTokens);
router.post('/add', postToken);

module.exports = router;

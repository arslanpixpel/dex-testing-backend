const router = require('express').Router();
const { postChartData } = require('../controllers/chartDataController');

router.get('/', (req, res) => res.status(404).end());
router.post('/', postChartData);

module.exports = router;

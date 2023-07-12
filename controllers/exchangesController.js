const ChartData = require('../models/chartDataModel');

exports.getExchanges = async (req, res, next) => {
  try {
    const exchanges = await ChartData.find();

    return res.status(200).json({ exchanges });
  } catch (error) {
    next(error);
  }
};

const mongoose = require('mongoose');

const { Schema } = mongoose;
const chartDataSchema = new Schema({
  ccdBalance: {
    type: String,
    required: true,
  },
  tokenIndex: {
    type: String,
    required: true,
  },
  tokenSubindex: {
    type: String,
    required: true,
  },
  tokenId: {
    type: String,
  },
  tokenBalance: {
    type: String,
    required: true,
  },
  createdAt: {
    type: String,
  },
});
const ChartData = mongoose.model('chartData', chartDataSchema);
module.exports = ChartData;

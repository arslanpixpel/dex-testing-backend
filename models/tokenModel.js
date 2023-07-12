const mongoose = require('mongoose');

const { Schema } = mongoose;
const tokenSchema = new Schema({
  contractIndex: {
    type: Number,
    required: true,
  },
  contractSubindex: {
    type: Number,
    required: true,
  },
  tokenId: {
    type: String,
  },
  contractName: {
    type: String,
  },
  metadata: {
    type: Object,
    required: true,
  },
});
const Token = mongoose.model('token', tokenSchema);
module.exports = Token;

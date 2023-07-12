const _ = require('lodash');
const transform = require('transform-keys');

exports.snakeCaseToCamelCase = data =>
  data ? transform(data, _.camelCase) : data;

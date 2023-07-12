const moment = require('moment');
const _ = require('lodash');
const chartDataController = require('../controllers/chartDataController');
const {
  getAllTokensFromDB,
  updateToken,
} = require('../controllers/tokensController');
const transform = require('../utils/transform');

const sendExchangesToDb = exchanges => {
  const currentTime = moment().format();
  exchanges.forEach(echangeItem => {
    const exchange = transform.snakeCaseToCamelCase(echangeItem);
    exchange.currentTime = currentTime;
    chartDataController.addChartData(exchange);
  });
};

const updateTokensMetadataInDb = async (exchanges, from = '') => {
  const exchangesContracts = exchanges.map(echangeItem => {
    const exchange = transform.snakeCaseToCamelCase(echangeItem);
    const {
      token: {
        address: { index, subindex },
        id,
      },
    } = exchange;

    return {
      index,
      subindex: subindex || 0,
      tokenId: id.toUpperCase(),
    };
  });
  const tokensData = (await getAllTokensFromDB()).map(
    ({ contractIndex, contractSubindex, tokenId }) => {
      return { index: contractIndex, subindex: contractSubindex, tokenId };
    },
  );
  const difference = _.differenceBy(
    tokensData,
    exchangesContracts,
    obj => obj.index + obj.subindex + obj.tokenId,
  );

  const toUpdateContracts = [...exchangesContracts, ...difference];
  toUpdateContracts.forEach(async contract => {
    await updateToken(contract, from);
  });
};

module.exports = {
  sendExchangesToDb,
  updateTokensMetadataInDb,
};

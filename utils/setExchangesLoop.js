const { ToadScheduler, AsyncTask, CronJob } = require('toad-scheduler');
const moment = require('moment');
const { invokeContract } = require('../helpers/helpers');
const transform = require('./transform');
const chartDataController = require('../controllers/chartDataController');

const sendExchangesToDb = exchanges => {
  const currentTime = moment().format();
  exchanges.forEach(echangeItem => {
    const exchange = transform.snakeCaseToCamelCase(echangeItem);
    exchange.currentTime = currentTime;
    chartDataController.addChartData(exchange);
  });
};

const setExchangesLoop = async (
  contract,
  method,
  params,
  cronOptions,
  verbose = false,
  silent = true,
) => {
  const scheduler = new ToadScheduler();
  const task = new AsyncTask('getExchanges', () =>
    invokeContract(contract, method, params, verbose, silent).then(
      ({ exchanges }) => sendExchangesToDb(exchanges),
    ),
  );
  const job = new CronJob(
    {
      cronExpression: cronOptions,
    },
    task,
    {
      preventOverrun: true,
    },
  );
  scheduler.addCronJob(job);
};

module.exports = {
  setExchangesLoop,
};

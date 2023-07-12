const { ToadScheduler, AsyncTask, CronJob } = require('toad-scheduler');
const { invokeContract } = require('./helpers');
const { updateTokensMetadataInDb, sendExchangesToDb } = require('./utils');

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
      ({ exchanges }) => {
        sendExchangesToDb(exchanges);
        updateTokensMetadataInDb(exchanges, 'Exchanges list every 1 hour');
      },
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

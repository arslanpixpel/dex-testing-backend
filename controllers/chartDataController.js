const moment = require('moment');
const ChartData = require('../models/chartDataModel');

const findChartData = async (dateFrom, dateTo, pair) => {
  const startDate = moment(dateFrom).format();
  const finishDate = moment(dateTo).format();

  if (!pair) {
    const result = await ChartData.find({
      createdAt: {
        $gt: startDate,
        $lte: finishDate,
      },
    }).exec();

    return result;
  }

  const result = await ChartData.find({
    createdAt: {
      $gt: startDate,
      $lte: finishDate,
    },
    tokenIndex: pair.tokenIndex,
    tokenSubindex: pair.tokenSubindex,
    tokenId: pair.tokenId,
  }).exec();

  return result;
};

exports.addChartData = async exchange => {
  const {
    ccdBalance,
    token: {
      address: { index, subindex },
      id,
    },
    tokenBalance,
    currentTime,
  } = exchange;
  await ChartData.create({
    ccdBalance,
    tokenBalance,
    tokenIndex: index,
    tokenSubindex: subindex,
    tokenId: id.toUpperCase(),
    createdAt: currentTime,
  });
};

exports.postChartData = async (req, res) => {
  const { dateFrom, dateTo, pairFrom, pairTo } = req.body;

  if ((!pairFrom || !pairTo) && dateFrom && dateTo) {
    try {
      const exchanges = await findChartData(dateFrom, dateTo);

      return res.json({ chartData: exchanges });
    } catch (error) {
      return res.status(400).json({
        message: `Error happened on server: "${error}" `,
      });
    }
  }

  if (typeof pairFrom === 'object' && typeof pairTo === 'object') {
    if (pairFrom.tokenIndex === pairTo.tokenIndex) {
      return res.status(400).json({
        message: "tokenIndex 'From' should'n be the same as tokenIndex 'To'",
      });
    }

    try {
      const exchangesFrom = await findChartData(dateFrom, dateTo, pairFrom);
      const exchangesTo = await findChartData(dateFrom, dateTo, pairTo);

      if (exchangesFrom.length && exchangesTo.length) {
        const chartData = exchangesFrom
          .map(exchangeFrom => {
            const exchangeRateFrom = +exchangeFrom.ccdBalance
              ? exchangeFrom.tokenBalance / exchangeFrom.ccdBalance
              : 0;
            const exchangeTo = exchangesTo.find(
              exchange => exchange.createdAt === exchangeFrom.createdAt,
            );

            if (!exchangeTo) {
              return;
            }

            const exchangeRateTo = +exchangeTo.ccdBalance
              ? exchangeTo.tokenBalance / exchangeTo.ccdBalance
              : 0;
            const exchangeRate = exchangeRateTo
              ? (exchangeRateFrom / exchangeRateTo).toFixed(6)
              : 0;

            return { createdAt: exchangeFrom.createdAt, exchangeRate };
          })
          .filter(data => data !== undefined);

        return res.status(200).json({ chartData });
      }

      return res.json({ chartData: [] });
    } catch (error) {
      res.status(400).json({
        message: `Error happened on server: "${error}" `,
      });
    }
  }

  if (pairFrom === 'CCD' && typeof pairTo === 'object') {
    try {
      const exchanges = await findChartData(dateFrom, dateTo, pairTo);

      if (exchanges.length) {
        const chartData = exchanges.map(exchange => {
          const exchangeRate = +exchange.tokenBalance
            ? (exchange.ccdBalance / exchange.tokenBalance).toFixed(6)
            : 0;

          return { createdAt: exchange.createdAt, exchangeRate };
        });

        return res.status(200).json({ chartData });
      }

      return res.json({ chartData: exchanges });
    } catch (error) {
      res.status(400).json({
        message: `Error happened on server: "${error}" `,
      });
    }
  }

  if (typeof pairFrom === 'object' && pairTo === 'CCD') {
    try {
      const exchanges = await findChartData(dateFrom, dateTo, pairFrom);

      if (exchanges.length) {
        const chartData = exchanges.map(exchange => {
          const exchangeRate = +exchange.ccdBalance
            ? (exchange.tokenBalance / exchange.ccdBalance).toFixed(6)
            : 0;

          return { createdAt: exchange.createdAt, exchangeRate };
        });

        return res.status(200).json({ chartData });
      }

      return res.json({ chartData: exchanges });
    } catch (error) {
      res.status(400).json({
        message: `Error happened on server: "${error}" `,
      });
    }
  }

  res.status(400).json({
    message: 'Not valid data',
  });
};

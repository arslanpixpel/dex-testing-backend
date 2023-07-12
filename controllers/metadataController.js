const { findTokenData } = require('./tokensController');

/* eslint-disable camelcase */
const createJson = (name, token_id, isLpToken, decimals) => {
  const imageName = name
    ?.toLowerCase()
    .split('')
    .map(char => (char === ' ' ? '-' : char))
    .join('');

  const url = `https://${process.env.HOST}/api/v1/${
    isLpToken
      ? 'lp-image/pixp.png'
      : `image/${imageName}${token_id ? `-${token_id}` : ''}.png`
  }`;

  return {
    name: `${
      isLpToken
        ? `Pixpel Swap LP: ${name}`
        : `${name}${token_id ? ` / ${token_id}` : ''}`
    }`,
    symbol: `${
      isLpToken
        ? `Pixpel Swap LP: ${name}`
        : `${name}${token_id ? ` / ${token_id}` : ''}`
    }`,
    description: '',
    decimals: `${isLpToken ? '6' : decimals || ''}`,
    thumbnail: {
      url: url || '',
    },
    display: {
      url: url || '',
    },
    artifact: {
      url: url || '',
    },
  };
};

exports.getTestTokenMetadata = async (req, res, next) => {
  const { query } = req;
  const { name, decimals, token_id } = query;
  const isLpToken = false;
  try {
    res
      .status(200)
      .json({ ...createJson(name, token_id, isLpToken, decimals) });
  } catch (error) {
    next(error);
  }
};

exports.getLpTokenMetadata = async (req, res, next) => {
  const { query } = req;
  const { contract_index, token_id, token_subindex } = query;
  const isLpToken = true;
  const contract = {
    index: contract_index,
    subindex: token_subindex || 0,
    tokenId: token_id,
  };
  try {
    const token = await findTokenData(contract);
    const {
      metadata: { symbol },
    } = token;
    res.status(200).json({ ...createJson(symbol, token_id, isLpToken) });
  } catch (error) {
    next(error);
  }
};

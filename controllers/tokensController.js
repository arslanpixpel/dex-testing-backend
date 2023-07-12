/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const { getMetadataLink, consoleHeader } = require('../concordium/helpers');
const Token = require('../models/tokenModel');

const findTokenData = async contract => {
  const { index, subindex, tokenId } = contract;
  const result = await Token.findOne({
    contractIndex: index,
    contractSubindex: subindex,
    tokenId: tokenId,
  }).exec();

  return result;
};

const createJson = token => {
  const {
    _id,
    contractIndex,
    contractSubindex,
    tokenId,
    contractName,
    metadata: { symbol, thumbnail, display, artifact, decimals },
  } = token;

  return {
    id: _id,
    symbol: symbol || '',
    images: {
      thumbnail: thumbnail || '',
      display: display || '',
      artifact: artifact || '',
    },
    address: {
      index: contractIndex,
      subindex: contractSubindex,
    },
    tokenId: tokenId || '',
    contractName: contractName || '',
    decimals: +decimals || '',
  };
};

const isHEX = string => /^[0-9A-F]+$/i.test(string);

const validateContract = contract => {
  const { index, tokenId } = contract;

  switch (true) {
    case !index:
      return {
        isValid: false,
        message: 'Contract Index is required',
      };
    case tokenId === undefined:
      return {
        isValid: false,
        message: 'Token Id is required',
      };
    case tokenId !== '' && !isHEX(tokenId):
      return {
        isValid: false,
        message: 'Token Id must be in HEX',
      };
    default:
      return {
        isValid: true,
        message: '',
      };
  }
};

const isContractExistsInDB = async contract => {
  const result = await findTokenData(contract);

  if (result) {
    return true;
  }

  return false;
};

const isLinkMatchTokenId = (link, tokenId) => link.includes(tokenId);

const updateToken = async (contract, from = '') => {
  const metadataResult = await getMetadataLink(contract);

  if (!metadataResult.isValid) {
    return null;
  }

  const { link, contractName } = metadataResult;

  if (!isLinkMatchTokenId(link, contract.tokenId)) {
    return null;
  }

  try {
    const data = await fetch(link);
    const metadata = await data.json();

    if (metadata.unique) {
      return null;
    }

    const isTokenExists = await isContractExistsInDB(contract);

    if (!isTokenExists) {
      consoleHeader(`Add contract!!! From: ${from}:`);
      console.dir(contract, { depth: null });
      await Token.create({
        contractIndex: contract.index,
        contractSubindex: contract.subindex,
        tokenId: contract.tokenId.toUpperCase(),
        contractName,
        metadata,
      });
    } else {
      consoleHeader(`Update contract!!! From: ${from}:`);
      console.dir(contract, { depth: null });
      await Token.replaceOne(
        {
          contractIndex: contract.index,
          contractSubindex: contract.subindex,
          tokenId: contract.tokenId.toUpperCase(),
        },
        {
          contractIndex: contract.index,
          contractSubindex: contract.subindex,
          tokenId: contract.tokenId.toUpperCase(),
          contractName,
          metadata,
        },
      );
    }
  } catch (error) {
    // error
  }
};

const getAllTokensFromDB = async () => {
  const tokenData = await Token.find();

  return tokenData;
};

const getTokens = async (req, res) => {
  try {
    const tokensData = await Token.find();
    const response = tokensData.map(token => createJson(token));
    res.status(200).json({
      response,
    });
  } catch (error) {
    return res.status(400).json({
      message: `Error happened on server: "${error}" `,
    });
  }
};

const postToken = async (req, res) => {
  const { tokenId, tokenIndex, tokenSubindex } = req.body;
  const contract = {
    index: tokenIndex,
    subindex: tokenSubindex || 0,
    tokenId,
  };

  const contractValidation = validateContract(contract);

  if (!contractValidation.isValid) {
    return res.status(400).json({
      message: contractValidation.message,
    });
  }

  const metadataResult = await getMetadataLink(contract);

  if (!metadataResult.isValid) {
    return res.status(400).json({
      message: metadataResult.message,
    });
  }

  const { link, contractName } = metadataResult;

  // if (!isLinkMatchTokenId(link, contract.tokenId)) {
  //   return res.status(400).json({
  //     message: 'Not correct Token Id',
  //   });
  // }

  try {
    const data = await fetch(link);
    const metadata = await data.json();

    if (metadata.unique) {
      return res.status(400).json({
        message: 'This is nft',
      });
    }

    const isTokenExists = await isContractExistsInDB(contract);

    if (!isTokenExists) {
      consoleHeader(
        `Add contract!!! From: User is request to add new contract in DB`,
      );
      console.dir(contract, { depth: null });
      await Token.create({
        contractIndex: contract.index,
        contractSubindex: contract.subindex,
        tokenId: contract.tokenId.toUpperCase(),
        contractName,
        metadata,
      });
    } else {
      consoleHeader(
        `Update contract!!! From: User is request exist contract in DB`,
      );
      console.dir(contract, { depth: null });
      await Token.replaceOne(
        {
          contractIndex: contract.index,
          contractSubindex: contract.subindex,
          tokenId: contract.tokenId.toUpperCase(),
        },
        {
          contractIndex: contract.index,
          contractSubindex: contract.subindex,
          tokenId: contract.tokenId.toUpperCase(),
          contractName,
          metadata,
        },
      );

      return res.status(400).json({
        message: 'Contract is already exists in list',
      });
    }

    const token = await findTokenData(contract);
    const response = createJson(token);

    return res.status(200).json({
      response,
    });
  } catch (error) {
    return res.status(400).json({
      message: `The link in metadata is not valid ${error}`,
    });
  }
};

module.exports = {
  updateToken,
  getAllTokensFromDB,
  postToken,
  getTokens,
  findTokenData,
};

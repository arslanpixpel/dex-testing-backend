/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const {
  SchemaVersion,
  createConcordiumClient,
  serializeUpdateContractParameters,
  deserializeReceiveReturnValue,
  deserializeReceiveError,
} = require('@concordium/node-sdk/lib');
const { credentials } = require('@grpc/grpc-js');
const fs = require('fs');

const getClient = async () =>
  createConcordiumClient(
    process.env.CONCORDIUM_NODE,
    process.env.CONCORDIUM_PORT,
    credentials.createInsecure(),
  );

const consoleHeader = str => {
  console.log('');
  console.log(`\x1b[38;5;37m--> ${str}`);
  console.log(
    '\x1b[38;5;37m---------------------------------------------------------------------------------------',
  );
};

const invokeContract = async (
  contract,
  method,
  params = null,
  verbose = false,
  silent = false,
) => {
  if (!silent) {
    consoleHeader(`Invoke contract: ${contract.name} / ${method}`);
    console.log('Params: ');
    console.dir(params, { depth: null });
  }

  const client = await getClient();
  const message = params
    ? serializeUpdateContractParameters(
        contract.contract_name,
        method,
        params,
        Buffer.from(fs.readFileSync(contract.schema_path)),
        SchemaVersion.V2,
      )
    : null;

  if (verbose && params) {
    console.log('\nMessage: ');
    console.log(message ? message.toJSON() : null);
  }

  const result = await client.invokeContract(
    {
      contract: {
        index: BigInt(contract.index),
        subindex: BigInt(contract.subindex),
      },
      method: `${contract.contract_name}.${method}`,
      parameter: message,
      energy: 30000n,
    },
    (
      await client.getConsensusStatus()
    ).bestBlock,
  );

  if (verbose) {
    console.log('\nResult: ');
    console.dir(result, { depth: null });
  }

  try {
    if (result.tag === 'success' && result.returnValue) {
      const returnValue = deserializeReceiveReturnValue(
        Buffer.from(result.returnValue, 'hex'),
        Buffer.from(fs.readFileSync(contract.schema_path)),
        contract.contract_name,
        method,
      );

      if (!silent) {
        console.log('\nResult: ');
        console.dir(returnValue, { depth: null });
      }

      return returnValue;
    }

    if (result.tag === 'failure' && result.returnValue) {
      const returnValue = deserializeReceiveError(
        Buffer.from(result.returnValue, 'hex'),
        Buffer.from(fs.readFileSync(contract.schema_path)),
        contract.contract_name,
        method,
      );
      console.log('\nFailure: ');
      console.dir(returnValue, { depth: null });

      return returnValue;
    }
  } catch (e) {
    console.log('\nError: ');
    console.error(e);
  }
};

const getMetadataLink = async (contract, method = 'tokenMetadata') => {
  const client = await getClient();
  const contractAddress = {
    index: BigInt(contract.index),
    subindex: BigInt(contract.subindex),
  };
  let instanceInfo = '';
  try {
    instanceInfo = await client.getInstanceInfo(contractAddress);
  } catch (error) {
    return {
      isValid: false,
      message: 'Contract Index not found',
    };
  }
  const instanceInfoMethod = instanceInfo.methods.find(instanceMethod =>
    instanceMethod.includes(method),
  );

  if (!instanceInfoMethod) {
    return {
      isValid: false,
      message: 'No tokenMetadata method in contract',
    };
  }

  const instanceInfoContractName = instanceInfoMethod.split('.')[0];
  const numberOfQueriesBuffer = Buffer.from('0100', 'hex');
  const constractIdBuffer = Buffer.from(contract.tokenId, 'hex');
  const contractIdLengthBuffer = Buffer.from(
    `0${String(constractIdBuffer.length)}`,
    'hex',
  );
  const totalBufferLength =
    numberOfQueriesBuffer.length +
    constractIdBuffer.length +
    contractIdLengthBuffer.length;
  const totalBuffer = Buffer.concat(
    [numberOfQueriesBuffer, contractIdLengthBuffer, constractIdBuffer],
    totalBufferLength,
  );

  const result = await client.invokeContract(
    {
      contract: {
        index: contractAddress.index,
        subindex: contractAddress.subindex,
      },
      method: `${instanceInfoContractName}.${method}`,
      parameter: totalBuffer,
      energy: 30000n,
    },
    (
      await client.getConsensusStatus()
    ).bestBlock,
  );

  if (result.tag === 'success' && result.returnValue) {
    const returnValueBuffer = Buffer.from(result.returnValue, 'hex');

    return {
      isValid: true,
      link: Uint8Array.prototype.slice
        .call(returnValueBuffer, 4, returnValueBuffer.length - 1)
        .toString(),
      contractName: instanceInfoContractName,
    };
  }

  if (result.tag === 'failure') {
    return {
      isValid: false,
      message: 'Not correct Token Id',
    };
  }
};

module.exports = {
  invokeContract,
  getMetadataLink,
  getClient,
  consoleHeader,
};

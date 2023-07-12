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

module.exports = {
  invokeContract,
};

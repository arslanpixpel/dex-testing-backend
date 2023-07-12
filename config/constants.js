const PIXPEL_SWAP = {
  name: 'Pixpel Swap',
  index: process.env.SMARTCONTRACT_INDEX,
  subindex: process.env.SMARTCONTRACT_SUBINDEX,
  contract_name: process.env.SMARTCONTRACT_NAME,
  schema_path: './schemas/schema-pixpel-swap.bin',
};

module.exports = {
  PIXPEL_SWAP,
};

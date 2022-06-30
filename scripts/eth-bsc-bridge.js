const myJson = require('../process.json')
const Web3 = require('web3');
const BridgeEth = require('../build/contracts/BridgeEth.json');
const BridgeAva = require('../build/contracts/BridgeAva.json');
const ALCHEMY_API_KEY = myJson.ALCHEMY_API_KEY
const web3Eth = new Web3(new Web3.providers.HttpProvider('https://eth-ropsten.alchemyapi.io/v2/' + ALCHEMY_API_KEY));
const web3Ava = new Web3(new Web3.providers.HttpProvider('https://api.avax-test.network/ext/bc/C/rpc'));
const FUJI_PRIVATE_KEY = myJson.FUJI_PRIVATE_KEY;
const { address: admin } = web3Ava.eth.accounts.wallet.add(FUJI_PRIVATE_KEY);

const bridgeEth = new web3Eth.eth.Contract(
  BridgeEth.abi,
  BridgeEth.networks['3'].address
);

const bridgeAva = new web3Ava.eth.Contract(
  BridgeAva.abi,
  BridgeAva.networks['43113'].address
);

bridgeEth.events.Transfer(
  {fromBlock: 0, step: 0}
)
.on('data', async event => {
  const { from, to, amount, date, nonce, signature } = event.returnValues;

  const tx = bridgeAva.methods.mint(from, to, amount, nonce, signature);
  const [gasPrice, gasCost] = await Promise.all([
    web3Ava.eth.getGasPrice(),
    tx.estimateGas({from: admin}),
  ]);
  const data = tx.encodeABI();
  const txData = {
    from: admin,
    to: bridgeAva.options.address,
    data,
    gas: gasCost,
    gasPrice
  };
  const receipt = await web3Ava.eth.sendTransaction(txData);
  console.log(`Transaction hash: ${receipt.transactionHash}`);
  console.log(`
    Processed transfer:
    - from ${from} 
    - to ${to} 
    - amount ${amount} tokens
    - date ${date}
    - nonce ${nonce}
  `);
});

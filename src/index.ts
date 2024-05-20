import type { ContractRunner } from 'ethers';
import {
  BrowserProvider,
  Contract,
  type Eip1193Provider,
  MaxUint256,
} from 'ethers';
import {
  RangoClient,
  type SwapRequest,
  TransactionType,
} from 'rango-sdk-basic';

const target = process.env.TARGET;
if (!target) {
  throw new Error('process.env.TARGET is not defined');
}

if (
  !('xfi' in window) ||
  typeof window.xfi !== 'object' ||
  !window.xfi ||
  !('ethereum' in window.xfi)
) {
  throw new Error('Missing window.xfi or window.xfi.ethereum');
}
const provider = new BrowserProvider(window.xfi.ethereum as Eip1193Provider);

const rangoClient = new RangoClient('', false, process.env.RANGO_API_URL);
const token = process.env.TOKEN;
if (!token) {
  throw new Error('process.env.TOKEN is not defined');
}

const fromSymbol = `${token}--${target}`;
const blockchain = `ETH`;
const fromAddress = process.env.FROM_ADDRESS;
if (!fromAddress) {
  throw new Error('process.env.FROM_ADDRESS is not defined');
}
const toSymbol = 'ETH';
const toAddress = process.env.TO_ADDRESS;
if (!toAddress) {
  throw new Error('process.env.TO_ADDRESS is not defined');
}

const txTo = process.env.TX_TO;
if (!txTo) {
  throw new Error('process.env.TX_TO is not defined');
}

const performSwap = async () => {
  const swapRequest = {
    amount: '10000000000000000000',
    from: {
      blockchain,
      symbol: fromSymbol,
      address: fromAddress,
    },
    to: {
      blockchain,
      symbol: toSymbol,
      address: toAddress,
    },
    fromAddress,
    toAddress,
    slippage: '4.9',
    disableEstimate: false,
    enableCentralizedSwappers: true,
  } satisfies SwapRequest;
  const swapResponse = await rangoClient.swap(swapRequest);

  if (!swapResponse.tx) {
    throw new Error('Missing swapResponse.tx');
  }
  if (swapResponse.tx.type !== TransactionType.EVM) {
    throw new Error('TransactionType must be EVM');
  }

  const signer = await provider.getSigner();
  const runner: ContractRunner = signer;
  const contract = new Contract(
    target.toLowerCase(),
    [
      'function decimals() view returns (uint8)',
      'function allowance(address owner, address spender) view returns (uint)',
      'function approve(address spender, uint value)',
    ],
    runner,
  );

  if (!contract.approve) {
    throw new Error('Missing contract.approve');
  }

  await (await contract.approve(swapResponse.tx.txTo, MaxUint256)).wait();
};

const button = document.querySelector('button');
if (!button) {
  throw new Error('button not found');
}
button.addEventListener('click', performSwap);

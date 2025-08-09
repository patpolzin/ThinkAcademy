// Contract addresses
export const THINK_TOKEN_ADDRESS = "0xF9ff95468cb9A0cD57b8542bbc4c148e290Ff465";
export const THINK_NFT_ADDRESS = "0x11b3efbf04f0ba505f380ac20444b6952970ada6";

// ERC-20 ABI (minimal - just what we need)
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// ERC-721 ABI (minimal - just what we need)
export const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)"
];

// RPC endpoint - using a free public RPC
export const RPC_URL = "https://ethereum-rpc.publicnode.com";

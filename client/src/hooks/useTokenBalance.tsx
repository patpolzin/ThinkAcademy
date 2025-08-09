import { THINK_TOKEN_ADDRESS, THINK_NFT_ADDRESS, ERC20_ABI, ERC721_ABI } from "@/lib/constants";

export function useTokenBalance() {
  const queryTokenBalances = async (address: string, provider: any) => {
    try {
      if (!(window as any).ethers) {
        throw new Error('Ethers not loaded');
      }

      // Create contract instances
      const thinkTokenContract = new (window as any).ethers.Contract(THINK_TOKEN_ADDRESS, ERC20_ABI, provider);
      const thinkNFTContract = new (window as any).ethers.Contract(THINK_NFT_ADDRESS, ERC721_ABI, provider);

      // Query THINK token balance
      const [thinkBalance, thinkDecimals] = await Promise.all([
        thinkTokenContract.balanceOf(address),
        thinkTokenContract.decimals()
      ]);

      // Query THINK Agent Bundle NFT balance
      const nftBalance = await thinkNFTContract.balanceOf(address);

      // Format the balances
      const formattedThinkBalance = (window as any).ethers.formatUnits(thinkBalance, thinkDecimals);
      const formattedNFTBalance = nftBalance.toString();

      console.log('Token Balances:', {
        THINK: formattedThinkBalance,
        NFT: formattedNFTBalance
      });

      return {
        'THINK': formattedThinkBalance,
        'THINK_AGENT_BUNDLE': formattedNFTBalance,
      };
    } catch (error) {
      console.error('Error querying token balances:', error);
      
      // Return mock data for demo purposes
      return {
        'THINK': '2500.0',
        'THINK_AGENT_BUNDLE': '1',
      };
    }
  };

  return { queryTokenBalances };
}

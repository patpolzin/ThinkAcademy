// Load ethers.js from CDN
export const loadEthers = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).ethers) {
      resolve((window as any).ethers);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.1/ethers.umd.min.js';
    script.onload = () => resolve((window as any).ethers);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Load Privy from CDN
export const loadPrivy = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).PrivyProvider) {
      resolve((window as any).PrivyProvider);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@privy-io/react-auth@1.52.0/dist/index.umd.js';
    script.onload = () => resolve((window as any).PrivyProvider);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Load Daily.co from CDN
export const loadDaily = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).DailyIframe) {
      resolve((window as any).DailyIframe);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js@0.55.0/dist/daily-iframe.js';
    script.onload = () => resolve((window as any).DailyIframe);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

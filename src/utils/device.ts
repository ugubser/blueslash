export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|iphone|ipad|ipod|windows phone/i.test(ua);
};

export const isIosDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
};

export const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || (navigator as any).standalone === true;

  return !!isStandalone;
};

export const getBrowserName = (): string => {
  if (typeof navigator === 'undefined') {
    return 'your browser';
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('crios')) {
    return 'Chrome';
  }

  if (ua.includes('fxios')) {
    return 'Firefox';
  }

  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'Safari';
  }

  if (ua.includes('edgios')) {
    return 'Edge';
  }

  if (ua.includes('chrome')) {
    return 'Chrome';
  }

  if (ua.includes('firefox')) {
    return 'Firefox';
  }

  if (ua.includes('edge')) {
    return 'Edge';
  }

  return 'your browser';
};

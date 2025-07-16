/**
 * Utility functions for device detection
 */

/**
 * Detects if the current device is a mobile device
 */
export const isMobileDevice = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    (typeof window.orientation !== 'undefined' ||
      navigator.userAgent.indexOf('IEMobile') !== -1 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  )
}

/**
 * Detects if the user has MetaMask or similar wallet installed
 */
export const hasEthereumProvider = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
}
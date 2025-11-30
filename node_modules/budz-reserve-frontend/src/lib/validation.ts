export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/`~]).{8,}$/

export const CONTACT_NUMBER_REGEX = /^\+?\d{10,15}$/

export const OTP_REGEX = /^\d{6}$/

/**
 * Formats a phone number for Philippines (PH) format
 * Accepts: 09123456789, +639123456789, 639123456789, 9123456789
 * Returns: +63 9XX XXX XXXX
 */
export function formatPHPhoneNumber(value: string): string {
  // Remove all non-digit characters except +
  let cleaned = value.replace(/[^\d+]/g, '')
  
  // Remove leading + if present for processing
  const hasPlus = cleaned.startsWith('+')
  if (hasPlus) {
    cleaned = cleaned.slice(1)
  }
  
  // Handle different input formats
  if (cleaned.startsWith('63')) {
    // Already has country code
    cleaned = cleaned.slice(2)
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0
    cleaned = cleaned.slice(1)
  }
  
  // Limit to 10 digits (PH mobile numbers are 10 digits after country code)
  cleaned = cleaned.slice(0, 10)
  
  // Format as +63 9XX XXX XXXX
  if (cleaned.length === 0) {
    return hasPlus ? '+' : ''
  }
  
  if (cleaned.length <= 3) {
    return `+63 ${cleaned}`
  } else if (cleaned.length <= 6) {
    return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  } else {
    return `+63 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
}

/**
 * Normalizes a PH phone number to +63XXXXXXXXXX format for storage
 */
export function normalizePHPhoneNumber(value: string): string {
  let cleaned = value.replace(/\D/g, '')
  
  if (cleaned.startsWith('63')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+63${cleaned.slice(1)}`
  } else if (cleaned.length === 10) {
    return `+63${cleaned}`
  }
  
  return cleaned ? `+${cleaned}` : ''
}


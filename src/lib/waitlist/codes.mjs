// Random waitlist referral codes.
// crypto.getRandomValues, 8 characters, URL-safe, no look-alikes.
// Never sequential, never an account id, never derived from an address.

export const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const REF_LENGTH = 8;

const ACCEPTABLE = REF_ALPHABET.length * Math.floor(256 / REF_ALPHABET.length);

function defaultRandom(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * @param {(size: number) => Uint8Array} [random]
 * @returns {string}
 */
export function generateRefCode(random = defaultRandom) {
  let out = '';
  while (out.length < REF_LENGTH) {
    const bytes = random(16);
    for (let i = 0; i < bytes.length && out.length < REF_LENGTH; i++) {
      const value = bytes[i];
      if (value < ACCEPTABLE) {
        out += REF_ALPHABET[value % REF_ALPHABET.length];
      }
    }
  }
  return out;
}

/** @param {string} code */
export function isValidRefCode(code) {
  if (typeof code !== 'string' || code.length !== REF_LENGTH) return false;
  for (let i = 0; i < code.length; i++) {
    if (!REF_ALPHABET.includes(code[i])) return false;
  }
  return true;
}

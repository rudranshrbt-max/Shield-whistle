// ShieldWhistle — application-layer encryption.
// Every sensitive report field (description, location, contact, notes) is
// encrypted with AES-256-GCM using a per-organization key before it ever
// touches the database. This gives us "encryption at rest" that survives a
// raw DB dump — only an officer with the org key can read plaintext.

import crypto from "crypto"

const ALGO = "aes-256-gcm"
const IV_LEN = 12 // GCM recommended 12-byte IV

function decodeKey(keyB64: string): Buffer {
  const buf = Buffer.from(keyB64, "base64")
  if (buf.length !== 32) {
    throw new Error(`Invalid org key length: expected 32 bytes, got ${buf.length}`)
  }
  return buf
}

export function generateOrgKey(): string {
  return crypto.randomBytes(32).toString("base64")
}

/**
 * Encrypt a UTF-8 string. Output is a single base64 blob:
 *   iv(12) || ciphertext || authTag(16)
 * joined and base64-encoded so it stores cleanly in a TEXT column.
 */
export function encrypt(plaintext: string, keyB64: string): string {
  if (plaintext === null || plaintext === undefined) return ""
  const key = decodeKey(keyB64)
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ct, tag]).toString("base64")
}

export function decrypt(blob: string, keyB64: string): string {
  if (!blob) return ""
  const key = decodeKey(keyB64)
  const data = Buffer.from(blob, "base64")
  if (data.length < IV_LEN + 16) throw new Error("Ciphertext too short / corrupted")
  const iv = data.subarray(0, IV_LEN)
  const tag = data.subarray(data.length - 16)
  const ct = data.subarray(IV_LEN, data.length - 16)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const pt = Buffer.concat([decipher.update(ct), decipher.final()])
  return pt.toString("utf8")
}

/** Safe decrypt — returns a placeholder if the key/ciphertext don't match. */
export function tryDecrypt(blob: string, keyB64: string): string {
  try {
    return decrypt(blob, keyB64)
  } catch {
    return "[decryption error — tampered or wrong key]"
  }
}

/** SHA-256 fingerprint used for duplicate signatures & phone hashing. */
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex")
}

export function hashPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "")
  return sha256(`sw::phone::${normalized}`)
}

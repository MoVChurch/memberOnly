// assets/js/crypto.js
// --- Key Derivation ---
async function getKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("mov-directory-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// --- Encrypt ---
async function encryptData(password, data) {
  const key = await getKey(password);
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = enc.encode(JSON.stringify(data));
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    iv: Array.from(iv),
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };
}

// --- Decrypt ---
async function decryptData(password, stored) {
  const key = await getKey(password);
  const enc = new TextDecoder();
  const iv = new Uint8Array(stored.iv);
  const bytes = Uint8Array.from(atob(stored.data), c => c.charCodeAt(0));
  const plaintext = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bytes);
  return JSON.parse(enc.decode(plaintext));
}

// --- Save Encrypted ---
async function saveEncrypted(key, data) {
  const encrypted = await encryptData(key, data);
  localStorage.setItem("familiesDataEnc", JSON.stringify(encrypted));
}

// --- Load Decrypted ---
async function loadDecrypted(key) {
  const encryptedData = localStorage.getItem("familiesDataEnc");
  if (!encryptedData) return null;
  try {
    return await decryptData(key, JSON.parse(encryptedData));
  } catch (err) {
    console.error("Decryption failed:", err);
    return null;
  }
}

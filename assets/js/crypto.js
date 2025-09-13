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
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function encryptData(password, data) {
  try {
    //console.log("🔐 encryptData called with:", password, data);
    const jsonStr = JSON.stringify(data);
    //console.log(`📦 Original JSON size: ${jsonStr.length} characters ≈ ${(jsonStr.length / 1024).toFixed(2)} KB`);

    const key = await getKey(password);
    console.log("Key derived");

    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = enc.encode(jsonStr);
    //console.log(`📦 Encoded data size (bytes): ${encoded.byteLength} ≈ ${(encoded.byteLength / 1024).toFixed(2)} KB`);

    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    //console.log(`🔐 Ciphertext size: ${ciphertext.byteLength} bytes ≈ ${(ciphertext.byteLength / 1024).toFixed(2)} KB`);

    const base64 = arrayBufferToBase64(ciphertext);
    //console.log(`📡 Base64 size: ${base64.length} characters ≈ ${(base64.length / 1024).toFixed(2)} KB`);

    const encrypted = {
      iv: Array.from(iv),
      data: base64
    };

    const finalStr = JSON.stringify(encrypted);
    //console.log(`🗄️ Final localStorage size: ${finalStr.length} characters ≈ ${(finalStr.length / 1024).toFixed(2)} KB`);

    return encrypted;

  } catch (err) {
    console.error("encryptData failed:", err);
    throw err;
  }
}

// --- Decrypt ---
function atobToUint8Array(base64) {
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

async function decryptData(password, stored) {
  try {
    const key = await getKey(password);
    const enc = new TextDecoder();
    const iv = new Uint8Array(stored.iv);
    const bytes = atobToUint8Array(stored.data);
    const plaintext = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, bytes);
    return JSON.parse(enc.decode(plaintext));
  } catch (err) {
    console.error("Decryption failed:", err);
    throw err;
  }
}

// --- Save Encrypted ---
async function saveEncrypted(key, data) {
  try {
    const encrypted = await encryptData(key, data);
    localStorage.setItem(key, JSON.stringify(encrypted));
  } catch (err) {
    console.error("Failed to encrypt or save data:", err);
    //alert("Error saving encrypted data. See console for details.");
  }
}
// --- Load Decrypted ---
async function loadDecrypted(key) {
  const encryptedData = localStorage.getItem(key);
  if (!encryptedData) return null;
  try {
    return await decryptData(key, JSON.parse(encryptedData));
  } catch (err) {
    console.error("Decryption failed:", err);
    return null;
  }
}
// utils/decrypt.js
// import crypto from "crypto";
// import fs from "fs";
// import path from "path";

// const RSA_PRIVATE_KEY_PATH = path.resolve("keys/private.pem");
// const iv = Buffer.alloc(16, 0); // static IV

// export function decryptAESKey(encryptedKeyBase64) {
//   const privateKey = fs.readFileSync(RSA_PRIVATE_KEY_PATH, "utf8");
//   const encryptedBuffer = Buffer.from(encryptedKeyBase64, "base64");

//   const decryptedKey = crypto.privateDecrypt(
//     {
//       key: privateKey,
//       padding: crypto.constants.RSA_PKCS1_PADDING,
//     },
//     encryptedBuffer
//   );
//   return decryptedKey;
// }

// export function decryptDataAES(encryptedDataBase64, aesKeyBuffer) {
//   const encryptedData = Buffer.from(encryptedDataBase64, "base64");
//   const decipher = crypto.createDecipheriv("aes-256-cbc", aesKeyBuffer, iv);
//   let decrypted = decipher.update(encryptedData, "base64", "utf8");
//   decrypted += decipher.final("utf8");

//   return JSON.parse(decrypted);
// }





import path from "path";
import crypto from "crypto";
import fs from "fs";

const RSA_PRIVATE_KEY_PATH = path.resolve("keys/private.pem");
const iv = Buffer.alloc(16, 0);



export function decryptAESKey(encryptedKeyBase64) {
  // const privateKey = fs.readFileSync(RSA_PRIVATE_KEY_PATH, "utf8");


  const privateKey =
    process.env.PRIVATE_KEY?.replace(/\\n/g, '\n') ||
    fs.readFileSync(RSA_PRIVATE_KEY_PATH, "utf8");
  const encryptedBuffer = Buffer.from(encryptedKeyBase64, "base64");
  console.log("encryptedBuffer length:", encryptedBuffer.length); // 256 for 2048-bit RSA
  try {
    const decryptedHex = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      encryptedBuffer
    ).toString('utf8');

    console.log("decryptedHex (aes key hex):", decryptedHex);
    return Buffer.from(decryptedHex, 'hex');
  } catch (e) {
    console.error("privateDecrypt error:", e);
    throw e;
  }
}


 export function decryptDataAES(encryptedDataBase64, aesKeyBuffer) {
  const encryptedData = Buffer.from(encryptedDataBase64, "base64");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    aesKeyBuffer,
    iv
  );
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}
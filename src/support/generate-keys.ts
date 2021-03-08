import fs from "fs";
import path from "path";
// import generate_key_pair from "jose/util/generate_key_pair";
// import fromKeyLike from "jose/jwk/from_key_like";
import jose from "jose";

const keystore = new jose.JWKS.KeyStore();

Promise.all([
  keystore.generate("RSA", 2048, { use: "sig" }),
  keystore.generate("EC", "P-256", { use: "sig", alg: "ES256" }),
  keystore.generate("OKP", "Ed25519", { use: "sig", alg: "EdDSA" }),
]).then(() => {
  fs.writeFileSync(
    path.resolve("src/jwks.json"),
    JSON.stringify(keystore.toJWKS(true), null, 2)
  );
});

// (async () => {
//   // generate key pair
//   const keyPair = await generate_key_pair("PS256");
//   // generate key object in JSON
//   const privateKeyObject = await fromKeyLike(keyPair.privateKey);
//   const publicKeyObject = await fromKeyLike(keyPair.publicKey);
//   // stringify it
//   const data = JSON.stringify([privateKeyObject, publicKeyObject]);
//   // write data to jwks.json
//   fs.writeFile(path.resolve("src/jwks.json"), data, (err) => {
//     if (err) {
//       throw err;
//     }
//     console.log("done");
//   });
// })();

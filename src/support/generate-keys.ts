import fs from "fs";
import path from "path";
import generate_key_pair from "jose/util/generate_key_pair";
import fromKeyLike from "jose/jwk/from_key_like";

(async () => {
  // generate key pair
  const keyPair = await generate_key_pair("PS256");
  // generate key object in JSON
  const privateKeyObject = await fromKeyLike(keyPair.privateKey);
  const publicKeyObject = await fromKeyLike(keyPair.publicKey);
  // stringify it
  const data = JSON.stringify([privateKeyObject, publicKeyObject]);
  // write data to jwks.json
  fs.writeFile(path.resolve("src/jwks.json"), data, (err) => {
    if (err) {
      throw err;
    }
    console.log("done");
  });
})();

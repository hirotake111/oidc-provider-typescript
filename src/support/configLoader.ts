import fs from "fs";
import { ClientMetadata } from "oidc-provider";

export const clientFactory = (): Promise<ClientMetadata[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(__dirname + "/../.env.json", "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(JSON.parse(data) as ClientMetadata[]);
    });
  });
};

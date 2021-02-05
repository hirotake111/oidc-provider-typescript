import path from "path";
import url from "url";

import express from "express";
import helmet from "helmet";
import { Provider } from "oidc-provider";

import Account from "./support/account";
import configration from "./support/configuration";
import configuration from "./support/configuration";

const PORT = process.env.PORT || 3000; // Port number

const app = express();

// Use body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// helmet
app.use(helmet());

// View settings
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// let server;
// async () => {
//   let adapter;
//   if (process.env.MONGODB_URI) {
//   }
// };

app.get("/", (req, res) => res.json({ msg: "express + typescript" }));

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

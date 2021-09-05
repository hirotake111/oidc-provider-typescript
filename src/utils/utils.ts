/** utility functions */
import path from "path";
import { Express, Response } from "express";
import express from "express";
import morgan from "morgan";

import { User } from "../models/User.model";
import { InteractionResults } from "oidc-provider";
import { ConfigType } from "../config";
import session from "express-session";
import connectRedis from "connect-redis";

const RedisStoreConstructor = connectRedis(session);

export const isUUIDv4 = (id?: string): boolean => {
  if (!id) {
    return false;
  }
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/g;
  const matched = id.match(regex);
  return matched && matched.length === 1 ? true : false;
};

export const useSetting = (app: Express) => {
  // Proxy setting
  // Set the following if this app has web server in front of itself
  app.set("trust proxy", true);
  // View settings
  app.set("views", path.join(__dirname, "../views"));
  app.set("view engine", "ejs");
  // static files
  app.use(express.static(path.join(__dirname, "../public")));
  // logger
  app.use(morgan("common"));
};

export const addTestUser = async () => {
  await User.destroy({ where: { username: "test" }, force: true });
  await User.create({
    id: "83440b66-11a4-497f-83c4-beaf1eaef9c2",
    username: "test",
    password: "$2b$05$nJTc3d1Y1RnUSiboeNEyau2dAlNGACy/ryghOcq4rwLa/pA4eVj6i",
    displayName: "Test User",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

export interface IRenderProps {
  view: string;
  client: any;
  details: InteractionResults;
  title: string;
  flash?: string;
  csrfToken?: string;
  signupAllowed?: boolean;
}

export const renderPage = (res: Response, props: IRenderProps) => {
  const { view, client, details, title, flash, signupAllowed } = props;
  res.render(view, {
    client,
    uid: details.uid,
    params: details.params,
    details: details.prompt.details,
    flash,
    title,
    session: details.session ? details.session : undefined,
    csrfToken: props.csrfToken,
    dbg: { params: details.params, prompt: details.prompt },
    signupAllowed,
  });
};

export const getRounds = (env: string | undefined) => {
  const n = parseInt(env || "5", 10);
  return n;
};

export const getSession = (config: ConfigType) => {
  const store = config.redisClient
    ? new RedisStoreConstructor({ client: config.redisClient })
    : undefined;
  if (!store)
    console.log("config.redisClient is undefined - use in-memory store");
  return session({
    secret: config.SECRETKEY,
    name: "authSessionId",
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 1, // 1 minute(s)
      sameSite: "lax",
      secure: config.PROD ? true : false,
    },
  });
};

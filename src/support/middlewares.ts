import url from "url";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import { urlencoded, json } from "express";
import redis from "redis";
import connectRedis from "connect-redis";

import { SECRETKEY, PROD, REDIS_URL } from "../config";
import helmet from "helmet";

const redisClient = redis.createClient({ url: REDIS_URL });
const redisStore = connectRedis(session);

export const csrfProtection = csrf({ cookie: true });

// sample function
export const messageMiddleware = (message: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(message);
    next();
  };
};

export const setNoCache = (req: Request, res: Response, next: NextFunction) => {
  res.set("Pragma", "no-cache");
  res.set("Cache-Control", "no-cache, no-store");
  next();
};

export const redirectToHTTPS = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Below is a shorthand for req.protocol === 'https'
  // meaning if it's http, redirect to https
  if (req.secure) {
    next();
  } else if (req.method === "GET" || req.method === "HEAD") {
    res.redirect(
      url.format({
        protocol: "https",
        host: req.get("host"),
        pathname: req.originalUrl,
      })
    );
  } else {
    res.status(400).json({
      error: "invalid_request",
      error_description: "do yourself a favor and only use https",
    });
  }
};

export const useMiddleware = (app: Express) => {
  // body-parser
  app.use(urlencoded({ extended: false }));
  app.use(json());
  // helmet
  app.use(helmet());
  // session
  app.use(
    session({
      secret: SECRETKEY,
      name: "authSessionId",
      store: new redisStore({ client: redisClient }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 2, // 2 minutes
        sameSite: "lax",
        secure: PROD ? true : false,
      },
    })
  );
  // cookie-parser
  app.use(cookieParser());
};

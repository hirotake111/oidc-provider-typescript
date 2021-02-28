import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import csrf from "csurf";
import cookieParser from "cookie-parser";

import { SECRETKEY } from "./configuration";

export const useMiddleware = (app: Express) => {
  // session
  app.use(
    session({
      secret: SECRETKEY,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 2, // 2 minutes
        sameSite: "lax",
      },
    })
  );
  // cookie-parser
  app.use(cookieParser());
  // // csrf
  // app.use(csrf({ cookie: true }));
};

export const csrfProtection = csrf({ cookie: true });

export const messageMiddleware = (message: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(message);
    next();
  };
};

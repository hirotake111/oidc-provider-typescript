import url from "url";

import { NextFunction, Request, Response } from "express";

// sample function
export function get(req: Request, res: Response) {
  if (req.query.id) {
    return res.status(200).send(`Hey ${req.query.id}`);
  }
  res.status(404).send("NOT FOUND");
}

export function setNoCache(req: Request, res: Response, next: NextFunction) {
  res.set("Pragma", "no-cache");
  res.set("Cache-Control", "no-cache, no-store");
  next();
}

export function redirectToHTTPS(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
}

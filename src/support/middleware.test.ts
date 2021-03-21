import { Request, Response, NextFunction, Express } from "express";

import {
  messageMiddleware,
  redirectToHTTPS,
  setNoCache,
  useMiddleware,
} from "./middlewares";

let req: Request;
let res: Response;
const next = jest.fn() as NextFunction;
let getMock: jest.Mock;
let setMock: jest.Mock;
let redirectMock: jest.Mock;

describe("middlewares", () => {
  beforeEach(() => {
    req = {} as Request;
    res = {} as Response;
    req.get = jest.fn();
    res.set = jest.fn();
    res.redirect = jest.fn();
    getMock = req.get as jest.Mock;
    setMock = res.set as jest.Mock;
    redirectMock = res.redirect as jest.Mock;
  });
  describe("messageMddleware() function", () => {
    test("It should call console.log and next function", () => {
      expect.assertions(3);
      console.log = jest.fn();
      const logMock = console.log as jest.Mock;
      const msg = "test message";
      try {
        const mw = messageMiddleware(msg);
        mw(req, res, next);
        expect(logMock).toHaveBeenCalledTimes(1);
        expect(logMock.mock.calls[0][0]).toEqual(msg);
        expect(next).toHaveBeenCalledTimes(1);
      } catch (e) {
        throw e;
      }
    });
  });

  describe("setNoCache() function", () => {
    test("It should set response header and call next()", () => {
      expect.assertions(4);
      try {
        setNoCache(req, res, next);
        expect(setMock).toHaveBeenCalledTimes(2);
        expect(setMock.mock.calls[0]).toEqual(["Pragma", "no-cache"]);
        expect(setMock.mock.calls[1]).toEqual([
          "Cache-Control",
          "no-cache, no-store",
        ]);
        expect(next).toHaveBeenCalledTimes(1);
      } catch (e) {
        throw e;
      }
    });
  });

  describe("redirectToHTTPS() function", () => {
    test("It should call next()", () => {
      expect.assertions(1);
      try {
        req.secure = true;
        redirectToHTTPS(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
      } catch (e) {
        throw e;
      }
    });

    test("It should redirect to HTTPS", () => {
      expect.assertions(2);
      try {
        req.method = "GET";
        redirectToHTTPS(req, res, next);
        expect(res.redirect).toHaveBeenCalledTimes(1);
        req.method = "HEAD";
        redirectToHTTPS(req, res, next);
        expect(redirectMock).toHaveBeenCalledTimes(2);
      } catch (e) {
        throw e;
      }
    });

    test("It should respond 400 error", () => {
      expect.assertions(4);
      try {
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
        const statusMock = res.status as jest.Mock;
        const jsonMock = res.json as jest.Mock;
        redirectToHTTPS(req, res, next);
        expect(res.status).toHaveBeenCalledTimes(1);
        expect(statusMock.mock.calls[0][0]).toEqual(400);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(jsonMock.mock.calls[0][0]).toEqual({
          error: "invalid_request",
          error_description: "do yourself a favor and only use https",
        });
      } catch (e) {
        throw e;
      }
    });
  });

  describe("useMiddleware() function", () => {
    test("It should call app.use 5 times", () => {
      expect.assertions(1);
      const app = {} as Express;
      app.use = jest.fn();
      const useMock = app.use as jest.Mock;
      try {
        useMiddleware(app);
        expect(useMock).toHaveBeenCalledTimes(5);
      } catch (e) {
        throw e;
      }
    });
  });
});

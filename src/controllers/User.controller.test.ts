import { Request, Response, NextFunction } from "express";

import { setNoCache, get } from "./User.controller";

describe("setNoCache() function", () => {
  beforeEach(() => {});

  test("It should set Pragma and Cache-Control header", () => {
    expect.assertions(3);
    const res: any = {
      header: {},
      set: jest.fn((key: string, value: string) => {}),
      get: jest.fn((key: string): string => {
        if (key === "Pragma") return "no-cache";
        if (key === "Cache-Control") return "no-cache, no-store";
        return "";
      }),
    };
    const next: NextFunction = () => {};
    setNoCache({} as Request, res, next);
    expect(res.set.mock.calls.length).toEqual(2);
    expect(res.set.mock.calls[0]).toEqual(["Pragma", "no-cache"]);
    expect(res.set.mock.calls[1]).toEqual([
      "Cache-Control",
      "no-cache, no-store",
    ]);
  });
});

describe("[test] get function", () => {
  test("It should return 200 with id", () => {
    const req: any = { query: { id: "bob" } };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    get(req, res);
    expect(res.status.mock.calls[0][0]).toBe(200);
    expect(res.send.mock.calls[0][0]).toBe(`Hey ${req.query.id}`);
  });
  test("It hould return 404 without id", () => {
    const req: any = { query: {} };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    get(req, res);
    expect(res.status.mock.calls[0][0]).toBe(404);
  });
});

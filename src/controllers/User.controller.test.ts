import { Request, Response, NextFunction } from "express";
import { IRenderProps, renderPage } from "../utils/utils";

import { getUserController, UserController } from "./User.controller";

describe("renderPage", () => {
  let res: Response;
  let props: IRenderProps;

  beforeEach(() => {
    res = {
      render: jest.fn(),
    } as any;
    props = {
      view: "login",
      client: {},
      details: { prompt: { details: "deitals" } },
      title: "title",
    };
  });

  it("should render page", () => {
    expect.assertions(1);
    renderPage(res, props);
    expect(res.render).toHaveBeenCalledTimes(1);
  });
});

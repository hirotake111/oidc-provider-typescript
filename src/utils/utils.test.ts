import { v4 as uuid } from "uuid";
import { User } from "../models/User.model";
import { Response } from "express";

import {
  addTestUser,
  IRenderProps,
  isUUIDv4,
  renderPage,
  useSetting,
} from "./utils";

jest.mock("../models/User.model");

describe("isUUIDv4()", () => {
  it("should return true if given string is UUIDv4", () => {
    expect.assertions(1);
    expect(isUUIDv4(uuid())).toEqual(true);
  });

  it("should return false if given string is not UUIDv4", () => {
    expect.assertions(1);
    expect(isUUIDv4("abcdabcd-abcabc-abcabc-abcdabcd")).toEqual(false);
  });

  it("should return false if given string is undefined", () => {
    expect.assertions(1);
    expect(isUUIDv4(undefined)).toEqual(false);
  });
});

describe("addTestuser", () => {
  it("should add test user to db", async () => {
    expect.assertions(2);
    try {
      await addTestUser();
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(User.destroy).toHaveBeenCalledTimes(1);
    } catch (e) {
      throw e;
    }
  });
});

describe("useSetting()", () => {
  it("should call app.set and app.use method", () => {
    expect.assertions(2);
    const app = { set: jest.fn(), use: jest.fn() };
    useSetting(app as any);
    expect(app.set).toHaveBeenCalledTimes(3);
    expect(app.use).toHaveBeenCalledTimes(2);
  });
});

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
      details: { prompt: { details: "deitals" }, session: "session" },
      title: "title",
    };
  });

  it("should render page", () => {
    expect.assertions(1);
    renderPage(res, props);
    expect(res.render).toHaveBeenCalledTimes(1);
  });

  it("should render page with props.details.session undefined", () => {
    props.details.session = undefined;
    renderPage(res, props);
    expect(res.render).toHaveBeenCalledTimes(1);
  });
});

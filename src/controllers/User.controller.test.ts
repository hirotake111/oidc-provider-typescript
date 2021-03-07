import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService";
import { UserController } from "./User.controller";
import { nanoid } from "nanoid";

const authenticatedUsername = "authenticatedusername";
let authMethodMock = jest.fn().mockReturnValue(authenticatedUsername);

let provider: any;
let uc: UserController;
let req: Request;
let res: Response;
let next: NextFunction;
// res.status and res.send mock
let statusMock: jest.Mock;
let sendMock: jest.Mock;
let renderMock: jest.Mock;
let redirectMock: jest.Mock;
let interactionFinishedMock: jest.Mock;

const props = {
  view: "view",
  client: "client",
  details: {
    uid: "xxxx-xxxx-xxxx-xxxx",
    params: "params",
    session: "session",
    prompt: { details: "details" },
  },
  flash: "flash",
  title: "title",
  csrfToken: "token",
};

const getDetailMock = (id: string, PromptName: string) => {
  return jest.fn().mockReturnValue({
    prompt: { name: PromptName },
    params: { client_id: id },
  });
};

describe("User.controller", () => {
  beforeEach(() => {
    // initialize provider mock
    provider = {};
    provider.Client = {
      find: jest.fn().mockReturnValue("client"),
    };
    provider.interactionDetails = getDetailMock(nanoid(), "login");
    provider.interactionFinished = jest.fn();
    interactionFinishedMock = provider.interactionFinished as jest.Mock;

    // initialize userController mock
    uc = new UserController(provider, authMethodMock);
    // initialize request mock
    req = { body: { username: nanoid(), password: nanoid() } } as Request;
    req.csrfToken = jest.fn();
    // initialize response mock
    res = {} as Response;
    res.render = jest.fn();
    res.status = jest.fn().mockReturnThis();
    res.send = jest.fn();
    res.redirect = jest.fn();
    next = {} as NextFunction;
    res.render = jest.fn();
    // res.status and res.send mock
    statusMock = res.status as jest.Mock;
    sendMock = res.send as jest.Mock;
    renderMock = res.render as jest.Mock;
    redirectMock = res.redirect as jest.Mock;
  });

  describe("oidcCallback()", () => {
    test("It should call this.provider.callback()", async () => {
      expect.assertions(1);
      try {
        provider.callback = jest.fn();
        await uc.oidcCallback(req, res);
        expect(provider.callback).toHaveBeenCalledTimes(1);
      } catch (e) {
        throw e;
      }
    });

    test("It should raise error", async () => {
      expect.assertions(1);
      try {
        provider.callback = jest.fn().mockRejectedValue(new Error("error!!!"));
        await uc.oidcCallback(req, res);
      } catch (e) {
        expect(e.message).toEqual("error!!!");
      }
    });
  });

  describe("renderPage()", () => {
    test("It should render a page", async () => {
      expect.assertions(2);
      await uc.renderPage(res, props);
      expect(res.render).toBeCalledTimes(1);
      expect(res.render).toBeCalledWith("view", {
        client: props.client,
        uid: props.details.uid,
        params: props.details.params,
        details: props.details.prompt.details,
        flash: props.flash,
        title: props.title,
        session: props.details.session,
        csrfToken: props.csrfToken,
        dbg: { params: props.details.params, prompt: props.details.prompt },
      });
    });

    test("It should raise an error", () => {
      expect.assertions(1);
      const res = {} as Response;
      res.render = jest.fn().mockImplementation(() => {
        throw new Error("res.render throwed an error");
      });
      try {
        uc.renderPage(res, props);
      } catch (e) {
        expect(e.message).toEqual("res.render throwed an error");
      }
    });
  });

  describe("getInteractionWithNoPrompt", () => {
    test("It should render login page if prompt is 'login'", async () => {
      expect.assertions(3);
      uc.renderPage = jest.fn();
      // below needed in order to check passed params
      let renderPageMock = uc.renderPage as jest.Mock;
      try {
        await uc.getInteractionWithNoPrompt(req, res, next);
        expect(provider.interactionDetails).toBeCalledTimes(1);
        expect(uc.renderPage).toBeCalledTimes(1);
        expect(renderPageMock.mock.calls[0][1]).toEqual(
          expect.objectContaining({ view: "login" })
        );
      } catch (e) {
        throw e;
      }
    });

    test("It should render consent page if prompt is 'consent'", async () => {
      expect.assertions(3);
      // set mock for getting interaction detail
      provider.interactionDetails = getDetailMock("1234", "consent");
      uc.renderPage = jest.fn();
      const renderPageMock = uc.renderPage as jest.Mock;
      try {
        await uc.getInteractionWithNoPrompt(req, res, next);
        expect(provider.interactionDetails).toBeCalledTimes(1);
        expect(uc.renderPage).toBeCalledTimes(1);
        expect(renderPageMock.mock.calls[0][1]).toEqual(
          expect.objectContaining({ view: "interaction" })
        );
      } catch (e) {
        throw e;
      }
    });

    test("It should respond 404 if prompt is other value", async () => {
      expect.assertions(2);
      // set mock for getting interaction detail
      provider.interactionDetails = getDetailMock("3333", "xxxx");
      try {
        await uc.getInteractionWithNoPrompt(req, res, next);
        expect(statusMock.mock.calls[0][0]).toEqual(404);
        expect(sendMock.mock.calls[0][0]).toEqual("PROMPT NAME xxxx NOT FOUND");
      } catch (e) {
        throw e;
      }
    });

    test("It should respond 500 error", async () => {
      expect.assertions(2);
      // set interaction details mock
      provider.interactionDetails = jest
        .fn()
        .mockRejectedValue(
          new Error("ERROR WHILE PARSING INTERACTION DETAILS")
        );
      // set response mock
      const res = {} as Response;
      res.status = jest.fn().mockReturnThis();
      res.send = jest.fn();
      const statusMock = res.status as jest.Mock;
      const sendMock = res.send as jest.Mock;
      try {
        await uc.getInteractionWithNoPrompt(req, res, next);
        expect(statusMock.mock.calls[0][0]).toEqual(500);
        expect(sendMock.mock.calls[0][0]).toEqual("INTERNAL SERVER ERROR");
      } catch (e) {
        throw e;
      }
    });
  });

  describe("postInteractionLogin", () => {
    test("It should finish interation if authenticated", async () => {
      expect.assertions(1);
      const intResult = { login: { account: authenticatedUsername } };
      try {
        await uc.postInteractionLogin(req, res, next);
        expect(interactionFinishedMock.mock.calls[0][2]).toEqual(intResult);
      } catch (e) {
        throw e;
      }
    });

    test("It should render login page if not authenticated", async () => {
      expect.assertions(2);
      const uc = new UserController(provider, jest.fn().mockReturnValue(null));
      try {
        await uc.postInteractionLogin(req, res, next);
        expect(renderMock).toBeCalledTimes(1);
        expect(renderMock.mock.calls[0][0]).toEqual("login");
      } catch (e) {
        throw e;
      }
    });

    test("It should render login page if credentials are invalid", async () => {
      expect.assertions(5);
      try {
        // username is short
        req.body = { username: nanoid(1), password: nanoid() };
        await uc.postInteractionLogin(req, res, next);
        expect(renderMock.mock.calls[0][0]).toEqual("login");
        // password is short
        req.body = { username: nanoid(), password: nanoid(1) };
        await uc.postInteractionLogin(req, res, next);
        expect(renderMock.mock.calls[0][0]).toEqual("login");
        // username is not string
        req.body = { username: 123456, password: nanoid() };
        await uc.postInteractionLogin(req, res, next);
        expect(renderMock.mock.calls[0][0]).toEqual("login");
        // password is not string
        req.body = { username: nanoid(), password: 234567 };
        await uc.postInteractionLogin(req, res, next);
        expect(renderMock.mock.calls[0][0]).toEqual("login");
        expect(renderMock).toBeCalledTimes(4);
      } catch (e) {
        throw e;
      }
    });

    test("It should respond 500 with an error", async () => {
      expect.assertions(4);
      // provider mock
      provider.interactionDetails = jest.fn().mockImplementation(() => {
        throw new Error("ERROR WHILE GETTING DETAILS");
      });
      try {
        await uc.postInteractionLogin(req, res, next);
        expect(statusMock).toBeCalledTimes(1);
        expect(statusMock.mock.calls[0][0]).toEqual(500);
        expect(sendMock).toBeCalledTimes(1);
        expect(sendMock.mock.calls[0][0]).toEqual("INTERNAL SERVER ERROR");
      } catch (e) {
        throw e;
      }
    });
  });

  describe("getInteractionAbort", () => {
    test("It should redirect to redirectUri", async () => {
      expect.assertions(3);
      try {
        const params = { redirect_uri: "https://somewhere" };
        provider.interactionDetails = jest.fn().mockReturnValue({ params });
        await uc.getInteractionAbort(req, res, next);
        expect(provider.interactionDetails).toBeCalledTimes(1);
        expect(redirectMock).toBeCalledTimes(1);
        expect(redirectMock.mock.calls[0][0]).toEqual(params.redirect_uri);
      } catch (e) {
        throw e;
      }
    });
    test("It should respond 404 if redirectUri is not found", async () => {
      expect.assertions(4);
      try {
        const params = { redirect_uri: null };
        provider.interactionDetails = jest.fn().mockReturnValue({ params });
        await uc.getInteractionAbort(req, res, next);
        expect(statusMock).toBeCalledTimes(1);
        expect(statusMock.mock.calls[0][0]).toEqual(404);
        expect(sendMock).toBeCalledTimes(1);
        expect(sendMock.mock.calls[0][0]).toEqual("NOT FOUND");
      } catch (e) {
        throw e;
      }
    });

    test("It should respond 500 if an error is raised", async () => {
      expect.assertions(4);
      try {
        provider.interactionDetails = jest.fn().mockImplementation(() => {
          throw new Error("UNKNOWN ERROR");
        });
        await uc.getInteractionAbort(req, res, next);
        expect(statusMock).toBeCalledTimes(1);
        expect(statusMock.mock.calls[0][0]).toEqual(500);
        expect(sendMock).toBeCalledTimes(1);
        expect(sendMock.mock.calls[0][0]).toEqual("INTERNAL SERVER ERROR");
      } catch (e) {
        throw e;
      }
    });
  });

  describe("postInteractionConfirm", () => {
    test("It should invoke interactionFinished method", async () => {
      expect.assertions(5);
      try {
        await uc.postInteractionConfirm(req, res, next);
        expect(interactionFinishedMock).toBeCalledTimes(1);
        expect(interactionFinishedMock.mock.calls[0][0]).toEqual(req);
        expect(interactionFinishedMock.mock.calls[0][1]).toEqual(res);
        expect(interactionFinishedMock.mock.calls[0][2]).toEqual({
          consent: {},
        });
        expect(interactionFinishedMock.mock.calls[0][3]).toEqual({
          mergeWithLastSubmission: true,
        });
      } catch (e) {
        throw e;
      }
    });

    test("It should respond 500 if an error is raised", async () => {
      expect.assertions(4);
      try {
        provider.interactionFinished = jest.fn().mockImplementation(() => {
          throw new Error("UNKNOWN ERROR");
        });
        await uc.postInteractionConfirm(req, res, next);
        expect(statusMock).toBeCalledTimes(1);
        expect(statusMock.mock.calls[0][0]).toEqual(500);
        expect(sendMock).toBeCalledTimes(1);
        expect(sendMock.mock.calls[0][0]).toEqual("INTERNAL SERVER ERROR");
      } catch (e) {
        throw e;
      }
    });
  });
});

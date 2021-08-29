import { Request, Response, NextFunction } from "express";
import {
  AuthServiceConstructor,
  getAuthService,
} from "../services/authService";
import {
  getUserController,
  UserController,
  renderPage,
} from "./User.controller";
import { nanoid } from "nanoid";

// const authenticatedUsername = "authenticatedusername";
// const authMethodMock = jest.fn().mockReturnValue(authenticatedUsername);

// let provider: any;
// let uc: UserController;
// let req: Request;
// let res: Response;
// let next: NextFunction;
// // res.status and res.send mock
// let statusMock: jest.Mock;
// let sendMock: jest.Mock;
// let renderMock: jest.Mock;
// let redirectMock: jest.Mock;
// let interactionFinishedMock: jest.Mock;

// const props = {
//   view: "view",
//   client: "client",
//   details: {
//     uid: "xxxx-xxxx-xxxx-xxxx",
//     params: "params",
//     session: "session",
//     prompt: { details: "details" },
//   },
//   flash: "flash",
//   title: "title",
//   csrfToken: "token",
// };

const getDetailMock = (id: string, PromptName: string) => {
  return jest.fn().mockReturnValue({
    prompt: { name: PromptName },
    params: { client_id: id },
  });
};

describe("User.controller", () => {
  let auth: AuthServiceConstructor;
  let config: any;
  let interactionFinishedMock: any;
  let uc: UserController;
  let req: Request;
  let res: Response;
  let next: NextFunction;
  beforeEach(() => {
    // initialize provider mock
    config = {
      provider: {
        callback: jest.fn(),
        Client: { find: jest.fn().mockReturnValue("client") },
        interactionDetails(request: Request, response: Response) {
          return {
            prompt: {
              name: nanoid(),
            },
            params: { client_id: nanoid() },
          };
        },
        interactionFinished: jest.fn(),
      },
      getProvider() {
        return { proxy: true, callback: jest.fn() };
      },
    };
    interactionFinishedMock = config.provider.interactionFinished as jest.Mock;

    auth = getAuthService(config);

    // initialize userController mock
    uc = getUserController(config, auth);
    // initialize request mock
    req = { body: { username: nanoid(), password: nanoid() } } as Request;
    req.csrfToken = jest.fn().mockReturnValue("token");
    // initialize response mock
    res = {} as Response;
    res.render = jest.fn();
    res.status = jest.fn().mockReturnThis();
    res.send = jest.fn();
    res.redirect = jest.fn();
    res.render = jest.fn();
    next = jest.fn();
    // res.status and res.send mock
    // statusMock = res.status as jest.Mock;
    // sendMock = res.send as jest.Mock;
    // renderMock = res.render as jest.Mock;
    // redirectMock = res.redirect as jest.Mock;
  });
  describe("oidcCallback()", () => {
    test("It should call this.provider.callback()", async () => {
      expect.assertions(1);
      try {
        const controller = getUserController(config, auth);
        await controller.oidcCallback(req, res, next);
        expect(config.provider.callback).toHaveBeenCalledTimes(1);
      } catch (e) {
        throw e;
      }
    });

    test("It should raise error", async () => {
      expect.assertions(1);
      const msg = "err";
      try {
        config.getProvider = () => ({
          callback() {
            throw new Error(msg);
          },
        });
        const controller = getUserController(config, auth);
        await controller.oidcCallback(req, res, next);
      } catch (e) {
        expect(e.message).toEqual(msg);
      }
    });
  });

  describe("renderPage()", () => {
    let props: any;
    beforeEach(() => {
      props = {
        view: "view",
        client: {},
        details: { uid: "uid", prompt: { details: "details" } },
        title: "title",
        flash: "flash",
        singnupAllowed: true,
      };
    });

    test("It should render a page", async () => {
      expect.assertions(2);
      try {
        await renderPage(res, props);
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
      } catch (e) {
        throw e;
      }
    });

    test("It should raise an error", () => {
      expect.assertions(1);
      const response = {} as Response;
      response.render = jest.fn().mockImplementation(() => {
        throw new Error("res.render throwed an error");
      });
      try {
        renderPage(response, props);
      } catch (e) {
        expect(e.message).toEqual("res.render throwed an error");
      }
    });

    // describe("getInteractionWithNoPrompt", () => {
    //   test("It should render login page if prompt is 'login'", async () => {
    //     expect.assertions(3);
    //     renderPage = jest.fn();
    //     // below needed in order to check passed params
    //     const renderPageMock = renderPage as jest.Mock;
    //     try {
    //       await uc.getInteractionWithNoPrompt(req, res, next);
    //       expect(provider.interactionDetails).toBeCalledTimes(1);
    //       expect(renderPage).toBeCalledTimes(1);
    //       expect(renderPageMock.mock.calls[0][1]).toEqual(
    //         expect.objectContaining({ view: "login" })
    //       );
    //     } catch (e) {
    //       throw e;
    //     }
    //   });

    //   test("It should render consent page if prompt is 'consent'", async () => {
    //     expect.assertions(3);
    //     // set mock for getting interaction detail
    //     provider.interactionDetails = getDetailMock("1234", "consent");
    //     renderPage = jest.fn();
    //     const renderPageMock = renderPage as jest.Mock;
    //     try {
    //       await uc.getInteractionWithNoPrompt(req, res, next);
    //       expect(provider.interactionDetails).toBeCalledTimes(1);
    //       expect(renderPage).toBeCalledTimes(1);
    //       expect(renderPageMock.mock.calls[0][1]).toEqual(
    //         expect.objectContaining({ view: "interaction" })
    //       );
    //     } catch (e) {
    //       throw e;
    //     }
    //   });

    //   test("It should respond 404 if prompt is other value", async () => {
    //     expect.assertions(2);
    //     // set mock for getting interaction detail
    //     provider.interactionDetails = getDetailMock("3333", "xxxx");
    //     try {
    //       await uc.getInteractionWithNoPrompt(req, res, next);
    //       expect(statusMock.mock.calls[0][0]).toEqual(404);
    //       expect(sendMock.mock.calls[0][0]).toEqual("PROMPT NAME xxxx NOT FOUND");
    //     } catch (e) {
    //       throw e;
    //     }
    //   });

    //   test("It should respond 500 error", async () => {
    //     expect.assertions(2);
    //     // set interaction details mock
    //     provider.interactionDetails = jest
    //       .fn()
    //       .mockRejectedValue(
    //         new Error("ERROR WHILE PARSING INTERACTION DETAILS")
    //       );
    //     // set response mock
    //     const response = {} as Response;
    //     response.status = jest.fn().mockReturnThis();
    //     response.send = jest.fn();
    //     const mockStatus = response.status as jest.Mock;
    //     const mockSend = response.send as jest.Mock;
    //     try {
    //       await uc.getInteractionWithNoPrompt(req, response, next);
    //       expect(mockStatus.mock.calls[0][0]).toEqual(500);
    //       expect(mockSend.mock.calls[0][0].title).toEqual(
    //         "INTERNAL SERVER ERROR"
    //       );
    //     } catch (e) {
    //       throw e;
    //     }
    //   });
  });

  // describe("postInteractionLogin", () => {
  //   let config: any;
  //   let AuthService: AuthServiceConstructor;

  //   beforeEach(() => {
  //     config = {};
  //     AuthService = getAuthService(config);
  //   });

  //   test("It should finish interation if authenticated", async () => {
  //     expect.assertions(1);
  //     const intResult = { login: { account: authenticatedUsername } };
  //     try {
  //       await uc.postInteractionLogin(req, res, next);
  //       expect(interactionFinishedMock.mock.calls[0][2]).toEqual(intResult);
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should render login page if not authenticated", async () => {
  //     expect.assertions(2);
  //     const userController = new UserController(provider, AuthService);
  //     try {
  //       await userController.postInteractionLogin(req, res, next);
  //       expect(renderMock).toBeCalledTimes(1);
  //       expect(renderMock.mock.calls[0][0]).toEqual("login");
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should render login page if credentials are invalid", async () => {
  //     expect.assertions(5);
  //     try {
  //       // username is short
  //       req.body = { username: nanoid(1), password: nanoid() };
  //       await uc.postInteractionLogin(req, res, next);
  //       expect(renderMock.mock.calls[0][0]).toEqual("login");
  //       // password is short
  //       req.body = { username: nanoid(), password: nanoid(1) };
  //       await uc.postInteractionLogin(req, res, next);
  //       expect(renderMock.mock.calls[0][0]).toEqual("login");
  //       // username is not string
  //       req.body = { username: 123456, password: nanoid() };
  //       await uc.postInteractionLogin(req, res, next);
  //       expect(renderMock.mock.calls[0][0]).toEqual("login");
  //       // password is not string
  //       req.body = { username: nanoid(), password: 234567 };
  //       await uc.postInteractionLogin(req, res, next);
  //       expect(renderMock.mock.calls[0][0]).toEqual("login");
  //       expect(renderMock).toBeCalledTimes(4);
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should respond 500 with an error", async () => {
  //     expect.assertions(4);
  //     // provider mock
  //     provider.interactionDetails = jest.fn().mockImplementation(() => {
  //       throw new Error("ERROR WHILE GETTING DETAILS");
  //     });
  //     try {
  //       await uc.postInteractionLogin(req, res, next);
  //       expect(statusMock).toBeCalledTimes(1);
  //       expect(statusMock.mock.calls[0][0]).toEqual(500);
  //       expect(sendMock).toBeCalledTimes(1);
  //       expect(sendMock.mock.calls[0][0].title).toEqual(
  //         "INTERNAL SERVER ERROR"
  //       );
  //     } catch (e) {
  //       throw e;
  //     }
  //   });
  // });

  // describe("getInteractionAbort", () => {
  //   test("It should redirect to redirectUri", async () => {
  //     expect.assertions(3);
  //     try {
  //       const params = { redirect_uri: "https://somewhere" };
  //       provider.interactionDetails = jest.fn().mockReturnValue({ params });
  //       await uc.getInteractionAbort(req, res, next);
  //       expect(provider.interactionDetails).toBeCalledTimes(1);
  //       expect(redirectMock).toBeCalledTimes(1);
  //       expect(redirectMock.mock.calls[0][0]).toEqual(params.redirect_uri);
  //     } catch (e) {
  //       throw e;
  //     }
  //   });
  //   test("It should respond 404 if redirectUri is not found", async () => {
  //     expect.assertions(4);
  //     try {
  //       const params = { redirect_uri: null };
  //       provider.interactionDetails = jest.fn().mockReturnValue({ params });
  //       await uc.getInteractionAbort(req, res, next);
  //       expect(statusMock).toBeCalledTimes(1);
  //       expect(statusMock.mock.calls[0][0]).toEqual(404);
  //       expect(sendMock).toBeCalledTimes(1);
  //       expect(sendMock.mock.calls[0][0]).toEqual("NOT FOUND");
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should respond 500 if an error is raised", async () => {
  //     expect.assertions(4);
  //     try {
  //       provider.interactionDetails = jest.fn().mockImplementation(() => {
  //         throw new Error("UNKNOWN ERROR");
  //       });
  //       await uc.getInteractionAbort(req, res, next);
  //       expect(statusMock).toBeCalledTimes(1);
  //       expect(statusMock.mock.calls[0][0]).toEqual(500);
  //       expect(sendMock).toBeCalledTimes(1);
  //       expect(sendMock.mock.calls[0][0].title).toEqual(
  //         "INTERNAL SERVER ERROR"
  //       );
  //     } catch (e) {
  //       throw e;
  //     }
  //   });
  // });

  // describe("postInteractionConfirm", () => {
  //   test("It should invoke interactionFinished method", async () => {
  //     expect.assertions(4);
  //     try {
  //       await uc.postInteractionConfirm(req, res, next);
  //       expect(interactionFinishedMock).toBeCalledTimes(1);
  //       expect(interactionFinishedMock.mock.calls[0][0]).toEqual(req);
  //       expect(interactionFinishedMock.mock.calls[0][1]).toEqual(res);
  //       expect(interactionFinishedMock.mock.calls[0][2]).toEqual({
  //         consent: {},
  //       });
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should respond 500 if an error is raised", async () => {
  //     expect.assertions(4);
  //     try {
  //       provider.interactionFinished = jest.fn().mockImplementation(() => {
  //         throw new Error("UNKNOWN ERROR");
  //       });
  //       await uc.postInteractionConfirm(req, res, next);
  //       expect(statusMock).toBeCalledTimes(1);
  //       expect(statusMock.mock.calls[0][0]).toEqual(500);
  //       expect(sendMock).toBeCalledTimes(1);
  //       expect(sendMock.mock.calls[0][0].title).toEqual(
  //         "INTERNAL SERVER ERROR"
  //       );
  //     } catch (e) {
  //       throw e;
  //     }
  //   });
  // });

  // describe("getInteractionSignup", () => {
  //   test("It should render page", async () => {
  //     expect.assertions(1);
  //     try {
  //       await uc.getInteractionSignup(req, res, next);
  //       expect(renderMock).toBeCalledTimes(1);
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should respond 500 if an error is raised", async () => {
  //     expect.assertions(5);
  //     try {
  //       provider.interactionDetails = jest.fn().mockImplementation(() => {
  //         throw new Error("UNKNOWN ERROR");
  //       });
  //       uc.getInteractionSignup(req, res, next);
  //       expect(provider.interactionDetails).toBeCalledTimes(1);
  //       expect(statusMock).toBeCalledTimes(1);
  //       expect(statusMock.mock.calls[0][0]).toEqual(500);
  //       expect(sendMock).toBeCalledTimes(1);
  //       expect(sendMock.mock.calls[0][0].title).toEqual(
  //         "INTERNAL SERVER ERROR"
  //       );
  //     } catch (e) {
  //       throw e;
  //     }
  //   });
  // });

  // describe("postInteractionSignup", () => {
  //   let config: any;
  //   let AuthService: AuthServiceConstructor;
  //   beforeEach(() => {
  //     config = {};
  //     AuthService = getAuthService(config);
  //   });
  //   test("It should invoke interactionFinished() method", async () => {
  //     expect.assertions(6);
  //     try {
  //       const user = { id: nanoid() };
  //       AuthService.signUp = jest.fn().mockReturnValue(user);
  //       const signUpMock = AuthService.signUp as jest.Mock;
  //       await uc.postInteractionSignup(req, res, next);
  //       expect(signUpMock).toBeCalledTimes(1);
  //       expect(signUpMock.mock.calls[0][0]).toEqual({ ...req.body });
  //       expect(interactionFinishedMock).toBeCalledTimes(1);
  //       expect(interactionFinishedMock.mock.calls[0][0]).toEqual(req);
  //       expect(interactionFinishedMock.mock.calls[0][1]).toEqual(res);
  //       expect(interactionFinishedMock.mock.calls[0][2]).toEqual({
  //         login: { account: user.id },
  //       });
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should render page if creating user failed", async () => {
  //     expect.assertions(3);
  //     try {
  //       const user = null;
  //       AuthService.signUp = jest.fn().mockReturnValue(user);
  //       const signUpMock = AuthService.signUp as jest.Mock;
  //       await uc.postInteractionSignup(req, res, next);
  //       expect(signUpMock).toBeCalledTimes(1);
  //       expect(signUpMock.mock.calls[0][0]).toEqual({ ...req.body });
  //       expect(renderMock).toBeCalledTimes(1);
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should render signup page if user already exists", async () => {
  //     expect.assertions(5);
  //     try {
  //       const csrfToken = req.csrfToken();
  //       AuthService.signUp = jest.fn().mockImplementation(() => {
  //         throw new Error("user already exists");
  //       });
  //       const signUpMock = AuthService.signUp as jest.Mock;
  //       await uc.postInteractionSignup(req, res, next);
  //       expect(signUpMock).toHaveBeenCalledTimes(1);
  //       expect(renderMock).toHaveBeenCalledTimes(1);
  //       expect(renderMock.mock.calls[0][0]).toEqual("signup");
  //       expect(renderMock.mock.calls[0][1].title).toEqual("Sign-up");
  //       expect(renderMock.mock.calls[0][1].csrfToken).toEqual(csrfToken);
  //     } catch (e) {
  //       throw e;
  //     }
  //   });

  //   test("It should respond 500 if an error is raised", async () => {
  //     expect.assertions(5);
  //     try {
  //       AuthService.signUp = jest.fn().mockImplementation(() => {
  //         throw new Error("DATABASE ERROR");
  //       });
  //       const signUpMock = AuthService.signUp as jest.Mock;
  //       await uc.postInteractionSignup(req, res, next);
  //       expect(signUpMock).toBeCalledTimes(1);
  //       expect(statusMock).toBeCalledTimes(1);
  //       expect(statusMock.mock.calls[0][0]).toEqual(500);
  //       expect(sendMock).toBeCalledTimes(1);
  //       expect(sendMock.mock.calls[0][0].title).toEqual(
  //         "INTERNAL SERVER ERROR"
  //       );
  //     } catch (e) {
  //       throw e;
  //     }
  //   });
  // });

  // describe("getRoot", () => {
  //   let config: any;
  //   let AuthService: AuthServiceConstructor;

  //   beforeEach(() => {
  //     config = {
  //       getProvider: (param: any) =>
  //         jest.fn().mockReturnValue({
  //           status: statusMock,
  //           send: sendMock,
  //         }),
  //     };
  //     AuthService = getAuthService(config);
  //   });

  //   test("It should response OK", async () => {
  //     // expect.assertions(4);
  //     console.log(res);
  //     console.log("getProvider", config.getProvider);
  //     // const controller = new UserController(config, AuthService);
  //     // controller.getRoot(req, res);
  //     // expect(statusMock).toHaveBeenCalledTimes(1);
  //     // expect(statusMock.mock.calls[0][0]).toEqual(200);
  //     // expect(sendMock).toHaveBeenCalledTimes(1);
  //     // expect(sendMock.mock.calls[0][0]).toEqual("OK");
  //   });
  // });
});

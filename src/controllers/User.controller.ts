import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { NextFunction, Request, RequestHandler, Response } from "express";
import Provider, { FindAccount, InteractionResults } from "oidc-provider";
import { AuthServiceConstructor } from "../services/authService";
import { ConfigType } from "../config";
// import { AuthService } from "../services/authService";

interface IRenderProps {
  view: string;
  client: any;
  details: any;
  title: string;
  flash?: string;
  csrfToken?: string;
  signupAllowed?: boolean;
}

interface PostRequestBody {
  username: string;
  password: string;
  password2: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

export interface UserController {
  oidcCallback: RequestHandler;
  getInteractionWithNoPrompt: RequestHandler;
  postInteractionLogin: RequestHandler;
  getInteractionAbort: RequestHandler;
  postInteractionConfirm: RequestHandler;
  getInteractionSignup: RequestHandler;
  postInteractionSignup: RequestHandler;
  getRoot: RequestHandler;
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

export const getUserController = (
  config: ConfigType,
  AuthService: AuthServiceConstructor
): UserController => {
  // private provider: Provider;
  // // private authenticate: asyncAuthMethod;
  // private authService: AuthServiceConstructor;
  // private signupAllowed: boolean;

  const authService = AuthService;
  const signupAllowed = config.USER_CREATION_ALLOWED;
  const provider = config.getProvider(AuthService.findAccount);
  config.provider = provider;
  config.provider.proxy = true;

  return {
    async oidcCallback(req: Request, res: Response) {
      return provider.callback(req, res);
    },

    async getInteractionWithNoPrompt(req: Request, res: Response) {
      try {
        const details = await provider.interactionDetails(req, res);
        const client = await provider.Client.find(details.params.client_id);
        // generate csrf token
        const csrfToken = req.csrfToken();

        switch (details.prompt.name) {
          case "login": {
            return renderPage(res, {
              view: "login",
              client,
              details,
              title: "Sign-in",
              csrfToken,
              signupAllowed,
            });
          }

          case "consent": {
            return renderPage(res, {
              view: "interaction",
              client,
              details,
              title: "Authorize",
              csrfToken,
            });
          }

          default:
            return res
              .status(404)
              .send(`PROMPT NAME ${details.prompt.name} NOT FOUND`);
        }
      } catch (e) {
        // console.error("INTERNAL SERVER ERROR: ", e);
        return res.status(500).send({
          title: "INTERNAL SERVER ERROR",
          details: e.message,
        });
      }
    },

    async postInteractionLogin(req: Request, res: Response) {
      try {
        // get interaction details and client data
        const details = await provider.interactionDetails(req, res);
        const client = await provider.Client.find(details.params.client_id);
        const { username, password } = req.body;
        // If body has CSRF token fetch it
        const csrfToken = req.body._csrf ? req.body._csrf : null;

        // validate credentials
        if (
          typeof username !== "string" ||
          typeof password !== "string" ||
          username.length <= 3 ||
          password.length <= 3
        ) {
          // invalid usrname or password -> back to login page
          details.params.login_hint = username;
          return renderPage(res, {
            view: "login",
            client,
            details,
            title: "Sign-in",
            flash: "invalid credentials",
            csrfToken,
            signupAllowed,
          });
        }
        const accountId = await authService.authenticate(username, password);
        if (accountId) {
          // successfully signed in -> finish interaction
          const result: InteractionResults = { login: { account: accountId } };
          return await provider.interactionFinished(req, res, result, {
            // mergeWithLastSubmission: false,
          });
        }
        // invalid usrname or password -> back to login page
        details.params.login_hint = username;
        return renderPage(res, {
          view: "login",
          client,
          details,
          title: "Sign-in",
          flash: "invalid credentials",
          csrfToken,
          signupAllowed,
        });
      } catch (e) {
        return res.status(500).send({
          title: "INTERNAL SERVER ERROR",
          details: e.message,
        });
      }
    },

    async getInteractionAbort(req: Request, res: Response) {
      try {
        // redirect to client/callback
        const { params } = await provider.interactionDetails(req, res);
        if (params?.redirect_uri) {
          return res.redirect(params.redirect_uri);
        }

        return res.status(404).send("NOT FOUND");
      } catch (e) {
        return res.status(500).send({
          title: "INTERNAL SERVER ERROR",
          details: e.message,
        });
      }
    },

    async postInteractionConfirm(
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      try {
        const result = {
          consent: {
            // rejectedScopes: [], // < uncomment and add rejections here
            // rejectedClaims: [], // < uncomment and add rejections here
          },
        };
        const options = {
          // mergeWithLastSubmission: true,
        };
        await provider.interactionFinished(req, res, result, options);
        next();
      } catch (e) {
        return res.status(500).send({
          title: "INTERNAL SERVER ERROR",
          details: e.message,
        });
      }
    },

    async getInteractionSignup(req: Request, res: Response) {
      try {
        // get interaction details and client data
        const details = await provider.interactionDetails(req, res);
        const client = await provider.Client.find(details.params.client_id);
        // generate CSRF token
        const csrfToken = req.csrfToken();

        return renderPage(res, {
          view: "signup",
          client,
          details,
          title: "SIGN UP PAGE",
          csrfToken,
        });
      } catch (e) {
        return res.status(500).send({
          title: "INTERNAL SERVER ERROR",
          details: e.message,
        });
      }
    },

    async postInteractionSignup(req: Request, res: Response) {
      let details: any;
      let client: any;
      // get credentials from request body
      const props = req.body as PostRequestBody;
      try {
        // get details and client information
        details = await provider.interactionDetails(req, res);
        client = await provider.Client.find(details.params.client_id);

        // if two passwords are not identical, back to signup page
        if (props.password !== props.password2) {
          details.params.login_hint = props.username;
          return renderPage(res, {
            view: "signup",
            client,
            details,
            title: "Sign-up",
            flash: "password is not identical",
            csrfToken: req.csrfToken(),
          });
        }

        // create a new user
        const user = await authService.signUp({ ...props });
        if (!user) {
          // something is invalid -> back to singup page
          details.params.login_hint = props.username;
          return renderPage(res, {
            view: "signup",
            client,
            details,
            title: "Sign-up",
            flash: "invalid credentials",
            csrfToken: req.csrfToken(),
          });
        }

        // successfully signed up -> finish interaction
        const result: InteractionResults = { login: { account: user.id } };
        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: false,
        });
      } catch (e) {
        if (e.message === "user already exists") {
          // render signup page again
          details.params.login_hint = props.username;
          return renderPage(res, {
            view: "signup",
            client,
            details,
            title: "Sign-up",
            flash: e.message,
            csrfToken: req.csrfToken(),
          });
        }
        return res.status(500).send({
          title: "INTERNAL SERVER ERROR",
          details: e.message,
        });
      }
    },

    async getRoot(_: Request, res: Response) {
      res.status(200).send("OK");
    },
  };
};

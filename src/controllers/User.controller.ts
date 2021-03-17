import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { NextFunction, Request, Response } from "express";
import Provider, { InteractionResults } from "oidc-provider";
import { AuthService, IcreateUserProps } from "../services/authService";

interface IRenderProps {
  view: string;
  client: any;
  details: any;
  title: string;
  flash?: string;
  csrfToken?: string;
}

type asyncAuthMethod = (
  username: string,
  password: string
) => Promise<string | null>;

export class UserController {
  private provider: Provider;
  private authenticate: asyncAuthMethod;

  constructor(provider: Provider, authenticate: asyncAuthMethod) {
    this.provider = provider;
    this.authenticate = authenticate;
  }

  public renderPage = (res: Response, props: IRenderProps) => {
    const { view, client, details, title, flash } = props;
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
    });
  };

  public oidcCallback = async (
    req: IncomingMessage | Http2ServerRequest,
    res: ServerResponse | Http2ServerResponse
  ) => this.provider.callback(req, res);

  public getInteractionWithNoPrompt = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const details = await this.provider.interactionDetails(req, res);
      const client = await this.provider.Client.find(details.params.client_id);
      // generate csrf token
      const csrfToken = req.csrfToken();

      switch (details.prompt.name) {
        case "login": {
          return this.renderPage(res, {
            view: "login",
            client,
            details,
            title: "Sign-in",
            csrfToken,
          });
        }

        case "consent": {
          return this.renderPage(res, {
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
      return res.status(500).send("INTERNAL SERVER ERROR");
    }
  };

  public postInteractionLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // get interaction details and client data
      const details = await this.provider.interactionDetails(req, res);
      const client = await this.provider.Client.find(details.params.client_id);
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
        return this.renderPage(res, {
          view: "login",
          client,
          details,
          title: "Sign-in",
          flash: "invalid credentials",
          csrfToken,
        });
      }
      const accountId = await this.authenticate(username, password);
      if (accountId) {
        // successfully signed in -> finish interaction
        const result: InteractionResults = { login: { account: accountId } };
        return await this.provider.interactionFinished(req, res, result, {
          // mergeWithLastSubmission: false,
        });
      }
      // invalid usrname or password -> back to login page
      details.params.login_hint = username;
      return this.renderPage(res, {
        view: "login",
        client,
        details,
        title: "Sign-in",
        flash: "invalid credentials",
      });
    } catch (e) {
      return res.status(500).send("INTERNAL SERVER ERROR");
    }
  };

  getInteractionAbort = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // redirect to client/callback
      const { params } = await this.provider.interactionDetails(req, res);
      if (params?.redirect_uri) {
        return res.redirect(params.redirect_uri);
      }

      return res.status(404).send("NOT FOUND");
    } catch (e) {
      return res.status(500).send("INTERNAL SERVER ERROR");
    }
  };

  postInteractionConfirm = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
      await this.provider.interactionFinished(req, res, result, options);
      next();
    } catch (e) {
      return res.status(500).send("INTERNAL SERVER ERROR");
    }
  };

  public getInteractionSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // get interaction details and client data
      const details = await this.provider.interactionDetails(req, res);
      const client = await this.provider.Client.find(details.params.client_id);
      // generate CSRF token
      const csrfToken = req.csrfToken();

      return this.renderPage(res, {
        view: "signup",
        client,
        details,
        title: "SIGN UP PAGE",
        csrfToken,
      });
    } catch (e) {
      // console.error("ERROR: ", e);
      return res.status(500).send("INTERNAL SERVER ERROR");
    }
  };

  public postInteractionSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let details: any;
    let client: any;
    const props = req.body as IcreateUserProps;
    try {
      // get details and client information
      details = await this.provider.interactionDetails(req, res);
      client = await this.provider.Client.find(details.params.client_id);
      // get credentials from request body
      const user = await AuthService.signUp({ ...props });
      if (!user) {
        // something is invalid -> back to singup page
        details.params.login_hint = props.username;
        return this.renderPage(res, {
          view: "signup",
          client,
          details,
          title: "Sign-up",
          flash: "invalid credentials",
        });
      }
      // successfully signed up -> finish interaction
      const result: InteractionResults = { login: { account: user.id } };
      await this.provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (e) {
      if (e.message === "user already exists") {
        // render signup page again
        const csrfToken = req.csrfToken();
        details.params.login_hint = props.username;
        return this.renderPage(res, {
          view: "signup",
          client,
          details,
          title: "Sign-up",
          flash: e.message,
          csrfToken,
        });
      }
      res.status(500).send("INTERNAL SERVER ERROR");
    }
  };
}

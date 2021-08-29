import { IncomingMessage, ServerResponse } from "http";
import { Http2ServerRequest, Http2ServerResponse } from "http2";
import { NextFunction, Request, Response } from "express";
import Provider, { InteractionResults } from "oidc-provider";
import { AuthServiceConstructor } from "../services/authService";
// import { AuthService } from "../services/authService";

interface IRenderProps {
  view: string;
  client: any;
  details: any;
  title: string;
  flash?: string;
  csrfToken?: string;
}

interface PostRequestBody {
  username: string;
  password: string;
  password2: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

type asyncAuthMethod = (
  username: string,
  password: string
) => Promise<string | null>;

export class UserController {
  private provider: Provider;
  // private authenticate: asyncAuthMethod;
  private authService: AuthServiceConstructor;

  constructor(provider: Provider, AuthService: AuthServiceConstructor) {
    this.provider = provider;
    this.authService = AuthService;
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
      return res.status(500).send({
        title: "INTERNAL SERVER ERROR",
        details: e.message,
      });
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
      const accountId = await this.authService.authenticate(username, password);
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
        csrfToken,
      });
    } catch (e) {
      return res.status(500).send({
        title: "INTERNAL SERVER ERROR",
        details: e.message,
      });
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
      return res.status(500).send({
        title: "INTERNAL SERVER ERROR",
        details: e.message,
      });
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
      return res.status(500).send({
        title: "INTERNAL SERVER ERROR",
        details: e.message,
      });
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
      return res.status(500).send({
        title: "INTERNAL SERVER ERROR",
        details: e.message,
      });
    }
  };

  public postInteractionSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let details: any;
    let client: any;
    // get credentials from request body
    const props = req.body as PostRequestBody;
    try {
      // get details and client information
      details = await this.provider.interactionDetails(req, res);
      client = await this.provider.Client.find(details.params.client_id);

      // if two passwords are not identical, back to signup page
      if (props.password !== props.password2) {
        details.params.login_hint = props.username;
        return this.renderPage(res, {
          view: "signup",
          client,
          details,
          title: "Sign-up",
          flash: "password is not identical",
          csrfToken: req.csrfToken(),
        });
      }

      // create a new user
      const user = await this.authService.signUp({ ...props });
      if (!user) {
        // something is invalid -> back to singup page
        details.params.login_hint = props.username;
        return this.renderPage(res, {
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
      await this.provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (e) {
      if (e.message === "user already exists") {
        // render signup page again
        details.params.login_hint = props.username;
        return this.renderPage(res, {
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
  };

  getRoot = (_: Request, res: Response) => {
    res.status(200).send("OK");
  };
}

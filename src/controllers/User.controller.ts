import { NextFunction, Request, Response } from "express";
import { InteractionResults } from "oidc-provider";

import { AuthService } from "../services/authService";
import { provider } from "../support/oidcProviderFactory";

interface IRenderProps {
  view: string;
  client: any;
  details: any;
  title: string;
  flash?: string;
  csrfToken?: string;
}

const renderPage = (res: Response, props: IRenderProps) => {
  const { view, client, details, title, flash } = props;
  return res.render(view, {
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

export const getInteractionWithNoPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const details = await provider.interactionDetails(req, res);
    const client = await provider.Client.find(details.params.client_id);
    const csrfToken = req.csrfToken();
    console.log("body: ", req.body);
    console.log("toekn: ", csrfToken);

    switch (details.prompt.name) {
      case "login": {
        return renderPage(res, {
          view: "login",
          client,
          details,
          title: "Sign-in",
          csrfToken,
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
    console.error("INTERNAL SERVER ERROR: ", e);
    return res.status(500).send("INTERNAL SERVER ERROR");
  }
};

export const postInteractionLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      });
    }

    const accountId = await AuthService.authenticate(username, password);
    // console.log("accountId: ", accountId);
    if (accountId) {
      // successfully signed in -> finish interaction
      const result: InteractionResults = { login: { account: accountId } };
      return await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
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
    });
  } catch (e) {
    console.error("INTERNAL SERVER ERROR: ", e);
    return res.status(500).send("INTERNAL SERVER ERROR");
  }
};

export const getInteractionAbort = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("interaction: abort invoked");
  try {
    // redirect to client/callback
    const { params } = await provider.interactionDetails(req, res);
    const redirectUri = params?.redirect_uri;
    if (redirectUri) {
      res.redirect(params.redirect_uri);
      return;
    }

    return res.status(404).send("NOT FOUND");
  } catch (e) {
    console.error("INTERNAL SERVER ERROR: ", e);
    return res.status(500).send("INTERNAL SERVER ERROR");
  }
};

export const postInteractionConfirm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("interactin: confirmation invoked");
  try {
    const result = {
      consent: {
        // rejectedScopes: [], // < uncomment and add rejections here
        // rejectedClaims: [], // < uncomment and add rejections here
      },
    };
    await provider.interactionFinished(req, res, result, {
      mergeWithLastSubmission: true,
    });
  } catch (e) {
    console.error("INTERNAL SERVER ERROR: ", e);
    return res.status(500).send("INTERNAL SERVER ERROR");
  }
};

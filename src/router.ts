import { Express, Response } from "express";
import { urlencoded } from "express";
import { InteractionResults, Provider } from "oidc-provider";

import { User } from "./models/User.model";
import { setNoCache } from "./controllers/User.controller";

const parse = urlencoded({ extended: false });

interface IRenderProps {
  view: string;
  client: any;
  details: any;
  title: string;
  flash?: string;
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
    dbg: { params: details.params, prompt: details.prompt },
  });
};

export function useRoute(app: Express, provider: Provider): void {
  app.get("/interaction/:uid", setNoCache, async (req, res) => {
    try {
      const details = await provider.interactionDetails(req, res);
      const client = await provider.Client.find(details.params.client_id);

      switch (details.prompt.name) {
        case "login": {
          return renderPage(res, {
            view: "login",
            client,
            details,
            title: "Sign-in",
          });
        }

        case "consent": {
          return renderPage(res, {
            view: "interaction",
            client,
            details,
            title: "Authorize",
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
  });

  app.post("/interaction/:uid/login", async (req, res, next) => {
    try {
      console.log("post login");
      // get interaction details and client data
      const details = await provider.interactionDetails(req, res);
      const client = await provider.Client.find(details.params.client_id);
      const { username, password } = req.body;

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
        });
      }

      const accountId = await User.authenticate(username, password);
      console.log("accountId: ", accountId);
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
  });

  app.get("/interaction/:uid/abort", async (req, res) => {
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
  });

  app.post("/interaction/:uid/confirm", setNoCache, parse, async (req, res) => {
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
  });
}

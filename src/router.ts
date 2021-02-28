import { Express } from "express";

import { provider } from "./support/oidcProviderFactory";
import {
  csrfProtection,
  setNoCache,
  redirectToHTTPS,
  useMiddleware,
} from "./support/middlewares";
import {
  postInteractionLogin,
  getInteractionWithNoPrompt,
  getInteractionAbort,
  postInteractionConfirm,
} from "./controllers/User.controller";
import { PROD } from "./support/configuration";

export function useRoute(app: Express): void {
  if (PROD) {
    // Set the following setting if this app has web server in front of itself
    app.enable("trust proxy");
    provider.proxy = true;
    // if HTTP redirect to HTTPS
    app.use(redirectToHTTPS);
  }

  useMiddleware(app);

  app.get(
    "/interaction/:uid",
    setNoCache,
    csrfProtection,
    getInteractionWithNoPrompt
  );

  app.post("/interaction/:uid/login", csrfProtection, postInteractionLogin);

  app.get("/interaction/:uid/abort", getInteractionAbort);

  app.post("/interaction/:uid/confirm", setNoCache, postInteractionConfirm);

  // OIDC provider callbacks
  app.use(provider.callback);
}

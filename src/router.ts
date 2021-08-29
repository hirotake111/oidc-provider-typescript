import { Express } from "express";

import {
  csrfProtection,
  setNoCache,
  redirectToHTTPS,
  useMiddleware,
} from "./support/middlewares";
import { UserController } from "./controllers/User.controller";
import { ConfigType } from "./config";

export function useRoute(
  app: Express,
  userController: UserController,
  config: ConfigType
): void {
  if (config.PROD) {
    // if HTTP redirect to HTTPS
    app.use(redirectToHTTPS);
  }

  useMiddleware(app, config);

  // root access
  app.get("/", userController.getRoot);

  app.get(
    "/interaction/:uid",
    setNoCache,
    csrfProtection,
    userController.getInteractionWithNoPrompt
  );

  app.post(
    "/interaction/:uid/login",
    csrfProtection,
    userController.postInteractionLogin
  );

  app.get("/interaction/:uid/abort", userController.getInteractionAbort);

  app.post(
    "/interaction/:uid/confirm",
    setNoCache,
    userController.postInteractionConfirm
  );

  app.get(
    "/interaction/:uid/signup",
    csrfProtection,
    userController.getInteractionSignup
  );
  app.post(
    "/interaction/:uid/signup",
    csrfProtection,
    userController.postInteractionSignup
  );

  // OIDC provider callbacks
  app.use(userController.oidcCallback);
}

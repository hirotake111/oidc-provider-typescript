import { Express } from "express";

import {
  csrfProtection,
  setNoCache,
  redirectToHTTPS,
  useMiddleware,
} from "./support/middlewares";
import { ConfigType } from "./config";
import { Controller } from "./controllers/controllers";

export function useRoute(
  app: Express,
  controller: Controller,
  config: ConfigType
): void {
  // if production environment all HTTP request should be redirected to HTTPS
  if (config.PROD) app.use(redirectToHTTPS);

  useMiddleware(app, config);

  // root access
  app.get("/", controller.user.getRoot);

  app.get(
    "/interaction/:uid",
    setNoCache,
    csrfProtection,
    controller.user.getInteractionWithNoPrompt
  );

  app.post(
    "/interaction/:uid/login",
    csrfProtection,
    controller.user.postInteractionLogin
  );

  app.get("/interaction/:uid/abort", controller.user.getInteractionAbort);

  app.post(
    "/interaction/:uid/confirm",
    setNoCache,
    controller.user.postInteractionConfirm
  );

  app.get(
    "/interaction/:uid/signup",
    csrfProtection,
    config.USER_CREATION_ALLOWED
      ? controller.user.getInteractionSignup
      : controller.common.notAllowed
  );
  app.post(
    "/interaction/:uid/signup",
    csrfProtection,
    config.USER_CREATION_ALLOWED
      ? controller.user.postInteractionSignup
      : controller.common.notAllowed
  );

  // OIDC provider callbacks
  app.use(controller.user.oidcCallback);
}

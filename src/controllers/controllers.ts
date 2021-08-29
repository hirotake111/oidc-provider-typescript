import { UserController } from "./User.controller";
import { CommonController, getCommonController } from "./common.Controller";
import { ConfigType } from "../config";
import { AuthServiceConstructor } from "../services/authService";

export type Controller = { user: UserController; common: CommonController };
export const getController = (
  config: ConfigType,
  authService: AuthServiceConstructor
) => {
  return {
    user: new UserController(config, authService),
    common: getCommonController(),
  };
};

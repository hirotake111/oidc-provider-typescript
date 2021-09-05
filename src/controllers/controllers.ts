import { getUserController, UserController } from "./User.controller";
import { CommonController, getCommonController } from "./common.Controller";
import { ConfigType } from "../config";
import { AuthService } from "../services/authService";

export type Controller = { user: UserController; common: CommonController };
export const getController = (config: ConfigType, authService: AuthService) => {
  return {
    user: getUserController(config, authService),
    common: getCommonController(),
  };
};

import { Provider } from "oidc-provider";

import { AuthService } from "../services/authService";
import { ISSUER, configuration } from "./configuration";

// Create a new provider
export const provider = new Provider(ISSUER, {
  adapter: undefined, // use default in-memory adapter
  ...configuration,
  findAccount: AuthService.findAccount,
});

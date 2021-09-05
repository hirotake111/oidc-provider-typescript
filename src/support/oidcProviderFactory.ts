import {
  AdapterConstructor,
  AdapterFactory,
  Provider,
  FindAccount,
} from "oidc-provider";
import { ConfigType } from "../config";

export const GetOidcProvider =
  (
    config: ConfigType,
    adapter: AdapterConstructor | AdapterFactory | undefined
  ) =>
  (findAccount: FindAccount) => {
    return new Provider(config.ISSUER, {
      adapter, // use default in-memory adapter if undefined
      ...config.configuration,
      findAccount,
    });
  };

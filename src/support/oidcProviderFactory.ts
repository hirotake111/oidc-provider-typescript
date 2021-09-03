import {
  AdapterConstructor,
  AdapterFactory,
  Configuration,
  Provider,
  FindAccount,
} from "oidc-provider";

export const GetOidcProvider =
  (
    issuer: string,
    configuration: Configuration,
    adapter: AdapterConstructor | AdapterFactory | undefined
  ) =>
  (findAccount: FindAccount) => {
    return new Provider(issuer, {
      adapter, // use default in-memory adapter if undefined
      ...configuration,
      findAccount,
    });
  };

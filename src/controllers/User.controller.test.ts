import { Request, Response, NextFunction } from "express";
import { Provider, interactionPolicy } from "oidc-provider";

jest.mock("oidc-provider", () => ({
  interactionDetails: jest.fn().mockReturnValue({ data: "details" }),
  interactionPolicy: {
    base: jest.fn().mockReturnValue({
      add: () => {},
    }),
    Prompt: jest.fn().mockImplementation(() => {
      return { someFunc: () => {} };
    }),
  },
}));

interactionPolicy.Prompt = jest.fn();
describe("User.controller", () => {
  describe("getInteractionWithNoPrompt()", () => {
    test("It should render login page", async () => {
      console.log("before");
      const req = {} as Request;
      const res = {} as Response;
      const next = {} as NextFunction;
      const provider = new Provider("issuer");
      await getInteractionWithNoPrompt(req, res, next);
    });
  });
});
// describe("setNoCache() function", () => {
//   beforeEach(() => {});

//   test("It should set Pragma and Cache-Control header", () => {
//     expect.assertions(3);
//     const res: any = {
//       header: {},
//       set: jest.fn((key: string, value: string) => {}),
//       get: jest.fn((key: string): string => {
//         if (key === "Pragma") return "no-cache";
//         if (key === "Cache-Control") return "no-cache, no-store";
//         return "";
//       }),
//     };
//     const next: NextFunction = () => {};
//     setNoCache({} as Request, res, next);
//     expect(res.set.mock.calls.length).toEqual(2);
//     expect(res.set.mock.calls[0]).toEqual(["Pragma", "no-cache"]);
//     expect(res.set.mock.calls[1]).toEqual([
//       "Cache-Control",
//       "no-cache, no-store",
//     ]);
//   });
// });

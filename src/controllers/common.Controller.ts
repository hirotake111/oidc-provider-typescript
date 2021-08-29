import { RequestHandler } from "express";

export type CommonController = {
  notAllowed: RequestHandler;
};

export const getCommonController = (): CommonController => {
  return {
    notAllowed(req, res) {
      return res.status(405).send({ detail: "User creation is not allowed" });
    },
  };
};

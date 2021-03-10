import fs from "fs";
import { ConfigLoader } from "./configLoader";

describe("ConfigLoader", () => {
  describe("constructor() method", () => {
    test("It should raise error if reading data from file fails", () => {
      expect.assertions(1);
      // create fs mock
      fs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error("ERROR READING FILE DATA");
      });
      try {
        new ConfigLoader();
      } catch (e) {
        expect(e.message).toEqual("ERROR READING FILE DATA");
      }
    });
  });

  describe("getClients() method", () => {
    test("It should return test object", async () => {
      expect.assertions(1);
      // create fs mock
      const data = { clients: [{ key: "value" }] };
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(data));
      try {
        const cl = new ConfigLoader();
        expect(cl.getClients()).toEqual(data.clients);
      } catch (e) {
        throw e;
      }
    });

    test("It should raise an error if no clients found", async () => {
      expect.assertions(1);
      // create mock
      const data = { key: "value" };
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(data));
      try {
        const cl = new ConfigLoader();
        cl.getClients();
      } catch (e) {
        expect(e.message).toEqual("NO CLIENTS FOUND IN DATA");
      }
    });
  });
});

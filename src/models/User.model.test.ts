import { Sequelize } from "sequelize-typescript";

import { User } from "./User.model";

let sequelize: Sequelize;
describe("Test User model", () => {
  beforeEach(async () => {
    // Initialize database
    try {
      sequelize = new Sequelize({
        dialect: "sqlite",
        database: "movies",
        storage: ":memory:",
        // models: [__dirname + "/**/*.model.ts"], // needs to be default export
        models: [User],
      });
      await sequelize.sync({ force: true });
    } catch (err) {
      console.error(err);
    }
  });

  test("It should fetch user", async () => {
    try {
      // Add 2 users
      const alice = ["1", "alice", new Date(), new Date()];
      const bob = ["2", "bob", new Date(), new Date()];
      await sequelize.query(
        "INSERT INTO Users (id, username, createdAt, updatedAt) VALUES (?, ?, ?, ?), (?, ?, ?, ?)",
        { replacements: [...alice, ...bob] }
      );
      // fetch user
      let user: User | null;
      user = await User.findOne({ where: { username: "alice" } });
      expect(user?.id).toBe(alice[0]);
      user = await User.findOne({ where: { username: "bob" } });
      expect(user?.id).toBe(bob[0]);
    } catch (err) {
      console.error(err);
    }
  });
});

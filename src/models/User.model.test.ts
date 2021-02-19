import { nanoid } from "nanoid";
import { Sequelize } from "sequelize-typescript";
import bcrypt from "bcrypt";

import { User, IcreateUserProps } from "./User.model";

class UserClass {
  public id?: string;
  public username?: string;
  public password?: string;
  public displayName?: string;
  public firstName?: string;
  public lastName?: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(
    username: string,
    displayName: string,
    firstName: string,
    lastName: string
  ) {
    this.id = nanoid();
    this.username = username;
    this.password = nanoid();
    this.displayName = displayName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

function createAlice(): UserClass {
  return new UserClass("alice", "Alice Newman", "Alice", "Newman");
}

async function addUsersToDB(user: UserClass) {
  try {
    const hashed = await bcrypt.hash(user.password, 5);
    await sequelize.query(
      "INSERT INTO Users (id, username, password, displayName, firstName, lastname, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      {
        replacements: [
          user.id,
          user.username,
          hashed,
          user.displayName,
          user.firstName,
          user.lastName,
          user.createdAt,
          user.updatedAt,
        ],
      }
    );
  } catch (e) {
    // console.log("error: ", e);
    throw new Error("Validation Error");
  }
}

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
        logging: false,
      });
      await sequelize.sync({ force: true });
    } catch (err) {
      console.error(err);
    }
  });

  test("User model should allow to ommit firstName and lastName", async () => {
    // Add user with no firstName, lastName
    expect.assertions(1);
    const alice = createAlice();
    alice.firstName = undefined;
    alice.lastName = undefined;
    await addUsersToDB(alice);
    // fetch the user
    const user = await User.findOne({
      where: { username: alice.username },
    });
    // validate it
    expect(user?.id).toBe(alice.id);
  });

  test("User model should raise error if either id, username, displayname, createdAt, or updatedAt is ommited", async () => {
    expect.assertions(6);
    // let id be null
    let alice = createAlice();
    alice.id = undefined;
    await expect(addUsersToDB(alice)).rejects.toThrow();
    // let username be null
    alice = createAlice();
    alice.username = undefined;
    await expect(addUsersToDB(alice)).rejects.toThrow();
    // let password be null
    alice = createAlice();
    alice.password = undefined;
    await expect(addUsersToDB(alice)).rejects.toThrow();
    // let displayname be null
    alice = createAlice();
    alice.displayName = undefined;
    await expect(addUsersToDB(alice)).rejects.toThrow();
    // let createdAt be null
    alice = createAlice();
    alice.createdAt = undefined;
    await expect(addUsersToDB(alice)).rejects.toThrow();
    // let updatedAt be null
    alice = createAlice();
    alice.updatedAt = undefined;
    await expect(addUsersToDB(alice)).rejects.toThrow();
  });

  test(".findOne() should fetch a user", async () => {
    // Add 2 users
    const alice = createAlice();
    const bob = new UserClass("bob", "Bob Marley", "Bob", "Marley");
    await addUsersToDB(alice);
    await addUsersToDB(bob);
    // fetch user
    let user: User | null;
    user = await User.findOne({ where: { username: "alice" } });
    expect(user?.id).toBe(alice.id);
    user = await User.findOne({ where: { username: "bob" } });
    expect(user?.id).toBe(bob.id);
  });

  test(".createUser() should create a new user", async () => {
    expect.assertions(3);
    // create a new user using .create() method
    const user: IcreateUserProps = {
      username: "Adele",
      password: "mypassword",
      displayName: "Adele Vance",
      firstName: "Adele",
      lastName: "Vance",
    };
    try {
      await User.createUser(user);
      // fetch user
      const fetched = await User.findOne({
        where: { username: user.username },
      });
      // it should have user id and createdAt, updatedAt
      if (!fetched) throw new Error("no user found");
      expect(fetched.username).toEqual(user.username);
      expect(fetched.id).toHaveLength(36);
      // check if the password is different as given one.
      expect(fetched.password === user.password).toBeFalsy();
    } catch (e) {
      console.error(e);
    }
  });

  test(".createUser() should raise an error if password is too long", () => {
    expect.assertions(1);
    // create a new user using .create() method
    const user: IcreateUserProps = {
      username: "Adele",
      password: "abcdabcdabcdabcdabcdabcdabcdabcd",
      displayName: "Adele Vance",
    };
    expect(User.createUser(user)).rejects.toThrow();
  });

  test(".authenticate() should return true if authenticated", async () => {
    expect.assertions(1);
    // create a new user
    const alice = createAlice();
    await addUsersToDB(alice);
    if (alice.username && alice.password) {
      expect(
        await User.authenticate(alice.username, alice.password)
      ).toBeTruthy();
    }
  });

  test(".authenticate() should return false if credentials is invald", async () => {
    expect.assertions(2);
    // create a new user
    const alice = createAlice();
    await addUsersToDB(alice);
    if (alice.username && alice.password) {
      // password is incorrect
      expect(await User.authenticate(alice.username, "aaaa")).toBeFalsy();
      // username is incorrect
      expect(await User.authenticate("other user", alice.username)).toBeFalsy();
    }
  });

  test(".destroy() should delete one account", async () => {
    expect.assertions(3);
    try {
      // add a new user
      const alice = createAlice();
      await addUsersToDB(alice);
      // fetch the user
      let fetched = await User.findOne({ where: { username: alice.username } });
      expect(fetched).toBeInstanceOf(User);
      // delete the user
      await User.destroy({
        where: { username: alice.username },
        // logging: true,
      });
      // fetch the user
      fetched = await User.findOne({ where: { username: alice.username } });
      expect(fetched).toBeNull();

      // .destory() should not raise error even no user matched
      expect(await User.destroy({ where: { username: "otheruser" } })).toEqual(
        0
      );
    } catch (error) {
      console.error(error);
    }
  });
});

import { MongoClient, Db, Collection } from "mongodb";
import { Adapter, AdapterPayload } from "oidc-provider";
// import { Adapter, OIDCProviderModel } from "./Adapter";
const snakeCase = require("lodash/snakeCase");

let DB: Db;

const grantable = new Set<string>([
  "access_token",
  "authoriztion_code",
  "refresh_token",
  "device_code",
]);

// class CollectionSet extends Set<string> {
//   add(value: string): this {
//     const nu = this.has(value);
//     super.add(value);
//     if (!nu) {
//       DB.collection(value)
//         .createIndexes([
//           ...(grantable.has(value)
//             ? [
//                 {
//                   key: { "payload.grantId": 1 },
//                 },
//               ]
//             : []),
//           ...(value === "device_code"
//             ? [
//                 {
//                   key: { "payload.userCode": 1 },
//                   unique: true,
//                 },
//               ]
//             : []),
//           ...(value === "session"
//             ? [
//                 {
//                   key: { "payload.uid": 1 },
//                   unique: true,
//                 },
//               ]
//             : []),
//           {
//             key: { expiresAt: 1 },
//             expireAfterSeconds: 0,
//           },
//         ])
//         .catch(console.error); // eslint-disable-line no-console
//     }
//     return this;
//   }
// }

// const collections = new CollectionSet();

export class MongoAdapter implements Adapter {
  public name: string;
  constructor(name: string) {
    this.name = snakeCase(name);

    // NOTE: you should never be creating indexes at runtime in production, the following is in
    //   place just for demonstration purposes of the indexes required
    // collections.add(this.name);
  }

  // NOTE: the payload for Session model may contain client_id as keys, make sure you do not use
  //   dots (".") in your client_id value charset.
  async upsert(
    _id: string,
    payload: AdapterPayload,
    expiresIn: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    this.coll().updateOne(
      { _id },
      { $set: { payload, ...(expiresAt ? { expiresAt } : undefined) } },
      { upsert: true }
    );
  }

  async find(_id: string): Promise<any> {
    const result = await this.coll().find({ _id }).limit(1).next();

    if (!result) return undefined;
    return result.payload;
  }

  async findByUserCode(userCode: string): Promise<any> {
    const result = await this.coll()
      .find({ "payload.userCode": userCode })
      .limit(1)
      .next();

    if (!result) return undefined;
    return result.payload;
  }

  async findByUid(uid: string): Promise<any> {
    const result = await this.coll()
      .find({ "payload.uid": uid })
      .limit(1)
      .next();

    if (!result) return undefined;
    return result.payload;
  }

  async destroy(_id: string): Promise<void> {
    this.coll().deleteOne({ _id });
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    this.coll().deleteMany({ "payload.grantId": grantId });
  }

  async consume(_id: string): Promise<void> {
    this.coll().findOneAndUpdate(
      { _id },
      { $set: { "payload.consumed": Math.floor(Date.now() / 1000) } }
    );
  }

  coll(name?: string): Collection<any> {
    return this.coll(name || this.name);
  }

  static coll(name: string): Collection<any> {
    return DB.collection(name);
  }

  // // This is not part of the required or supported API, all initialization should happen before
  // you pass the adapter to `new Provider`
  static async connect(uri: string) {
    const connection = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

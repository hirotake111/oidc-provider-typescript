// import { resolve } from "path";
// import pg from "pg";

// import { Adapter, OIDCProviderModel } from "./Adapter";

// class PGAdapter extends Adapter {
//   public name: OIDCProviderModel;

//   constructor(name: OIDCProviderModel) {
//     super(name);
//   }

//   upsert(id: string, payload: string, expiresIn: number): Promise<any> {
//     return new Promise((resolve, rejected) => resolve("upsert()"));
//   }

//   find(id: string): Promise<string> {
//     return new Promise((resolve, rejected) => resolve("find()"));
//   }

//   findByUserCode(userCode: string): Promise<string> {
//     return new Promise((resolve, reject) => resolve("findByUserCode()"));
//   }

//   findByUid(uid: string): Promise<string> {
//     return new Promise((resolve, reject) => resolve("findByUid()"));
//   }

//   consume(id: string): Promise<string> {
//     return new Promise((resolve, reject) => resolve("consume()"));
//   }

//   destroy(id: string): Promise<string> {
//     return new Promise((resolve, reject) => resolve("destroy()"));
//   }

//   revokeByGrantId(grantId: string): Promise<string> {
//     return new Promise((resolve, reject) => resolve("revokeByGrantId()"));
//   }
// }

// export default PGAdapter;

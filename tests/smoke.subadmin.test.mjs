import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { createDbConnection, resetDatabaseForTests } from "../backend/db.mjs";
import { createApp, seedAdminAccount } from "../backend/server.mjs";

test("smoke: sub-admin only balance; super creates sub", async () => {
  process.env.DB_PATH = "backend/data/test-subadmin.db";
  process.env.ADMIN_USERNAME = "super_adm";
  process.env.ADMIN_PASSWORD = "SuperPass789";
  delete process.env.ADMIN_PHONE;

  const db = createDbConnection();
  resetDatabaseForTests(db);
  await seedAdminAccount(db);
  const app = createApp(db);
  const request = supertest(app);

  const superLogin = await request.post("/api/auth/login").send({
    username: "super_adm",
    password: "SuperPass789"
  });
  assert.equal(superLogin.statusCode, 200);
  const superToken = superLogin.body.token;

  const subCreate = await request
    .post("/api/admin/sub-admins")
    .set("Authorization", `Bearer ${superToken}`)
    .send({
      username: "sub_adm",
      password: "SubPass456",
      phone: "+84903333444"
    });
  assert.equal(subCreate.statusCode, 201);
  assert.ok(subCreate.body.loginUrl?.includes("?admin=1"));

  const subLogin = await request.post("/api/auth/login").send({
    username: "sub_adm",
    password: "SubPass456"
  });
  assert.equal(subLogin.statusCode, 200);
  assert.equal(subLogin.body.user.adminRole, "sub");
  const subToken = subLogin.body.token;

  const forbiddenCreate = await request
    .post("/api/admin/users")
    .set("Authorization", `Bearer ${subToken}`)
    .send({
      username: "u_x",
      phone: "+84904444555",
      password: "Pass123456"
    });
  assert.equal(forbiddenCreate.statusCode, 403);

  const reg = await request.post("/api/auth/register").send({
    username: "member_one",
    phone: "+84905555666",
    password: "MemberPass1"
  });
  assert.equal(reg.statusCode, 200);
  const memberId = reg.body.user.id;

  const adjust = await request
    .post(`/api/admin/users/${memberId}/balance-adjust`)
    .set("Authorization", `Bearer ${subToken}`)
    .send({ delta: 50, reason: "sub topup" });
  assert.equal(adjust.statusCode, 200);
  assert.equal(adjust.body.newBalance, 50);

  db.close();
});

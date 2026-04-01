import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { createDbConnection, resetDatabaseForTests } from "../backend/db.mjs";
import { createApp, seedAdminAccount } from "../backend/server.mjs";

test("smoke: admin forbidden for normal user; admin CRUD + balance logs", async () => {
  process.env.DB_PATH = "backend/data/test-admin.db";
  process.env.ADMIN_USERNAME = "admin_smoke";
  process.env.ADMIN_PASSWORD = "AdminPass456";
  delete process.env.ADMIN_PHONE;

  const db = createDbConnection();
  resetDatabaseForTests(db);
  await seedAdminAccount(db);
  const app = createApp(db);
  const request = supertest(app);

  const reg = await request.post("/api/auth/register").send({
    username: "normal_user",
    phone: "+84901111222",
    password: "NormalPass123"
  });
  assert.equal(reg.statusCode, 200);
  const userToken = reg.body.token;

  const forbidden = await request.get("/api/admin/users").set("Authorization", `Bearer ${userToken}`);
  assert.equal(forbidden.statusCode, 403);
  assert.equal(forbidden.body.reason, "FORBIDDEN_NOT_ADMIN");

  const adminLogin = await request.post("/api/auth/login").send({
    username: "admin_smoke",
    password: "AdminPass456"
  });
  assert.equal(adminLogin.statusCode, 200);
  const adminToken = adminLogin.body.token;
  assert.equal(adminLogin.body.user.isAdmin, true);

  const list = await request.get("/api/admin/users").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(list.statusCode, 200);
  assert.equal(list.body.ok, true);
  assert.ok(Array.isArray(list.body.users));

  const created = await request.post("/api/admin/users").set("Authorization", `Bearer ${adminToken}`).send({
    username: "managed_user",
    phone: "+84902222333",
    password: "ManagedPass123"
  });
  assert.equal(created.statusCode, 201);
  const managedId = created.body.user.id;

  const adjust = await request
    .post(`/api/admin/users/${managedId}/balance-adjust`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ delta: 100, reason: "smoke test" });
  assert.equal(adjust.statusCode, 200);
  assert.equal(adjust.body.newBalance, 1300);

  const logs = await request
    .get(`/api/admin/balance-logs?userId=${managedId}`)
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(logs.statusCode, 200);
  assert.equal(logs.body.logs.length >= 1, true);
  assert.equal(logs.body.logs[0].delta, 100);

  const lock = await request
    .post(`/api/admin/users/${managedId}/lock`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({});
  assert.equal(lock.statusCode, 200);

  const lockedLogin = await request.post("/api/auth/login").send({
    username: "managed_user",
    password: "ManagedPass123"
  });
  assert.equal(lockedLogin.statusCode, 423);

  const unlock = await request
    .post(`/api/admin/users/${managedId}/unlock`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({});
  assert.equal(unlock.statusCode, 200);

  const okLogin = await request.post("/api/auth/login").send({
    username: "managed_user",
    password: "ManagedPass123"
  });
  assert.equal(okLogin.statusCode, 200);

  db.close();
});

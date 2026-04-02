import test from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import { createDbConnection, resetDatabaseForTests } from "../backend/db.mjs";
import { createApp } from "../backend/server.mjs";

test("smoke: register -> login -> refresh -> analyze(deduct) -> logout", async () => {
  process.env.DB_PATH = "backend/data/test.db";
  const db = createDbConnection();
  resetDatabaseForTests(db);
  const app = createApp(db);
  const request = supertest(app);

  const register = await request.post("/api/auth/register").send({
    username: "smoke_user",
    phone: "+84901234567",
    password: "StrongPass123"
  });
  assert.equal(register.statusCode, 200);
  assert.equal(register.body.ok, true);
  assert.equal(register.body.user.phone, "+84901234567");
  assert.equal(register.body.user.balance, 0);

  db.prepare("UPDATE users SET balance = 100, updated_at = ? WHERE lower(username) = lower(?)").run(
    new Date().toISOString(),
    "smoke_user"
  );

  const login = await request.post("/api/auth/login").send({
    username: "smoke_user",
    password: "StrongPass123"
  });
  assert.equal(login.statusCode, 200);
  const token = login.body.token;
  const cookies = login.headers["set-cookie"];
  assert.ok(token);
  assert.ok(Array.isArray(cookies));

  const me = await request.get("/api/auth/me").set("Authorization", `Bearer ${token}`);
  assert.equal(me.statusCode, 200);
  assert.equal(me.body.user.username, "smoke_user");

  const refresh = await request.post("/api/auth/refresh").set("Cookie", cookies).send({});
  assert.equal(refresh.statusCode, 200);
  assert.equal(refresh.body.ok, true);
  assert.ok(refresh.body.token);

  const deduct = await request
    .post("/api/user/deduct-xu")
    .set("Authorization", `Bearer ${refresh.body.token}`)
    .send({ amount: 10 });
  assert.equal(deduct.statusCode, 200);
  assert.equal(deduct.body.newBalance, 90);

  const logout = await request
    .post("/api/auth/logout")
    .set("Authorization", `Bearer ${refresh.body.token}`)
    .set("Cookie", refresh.headers["set-cookie"] || cookies);
  assert.equal(logout.statusCode, 200);
  assert.equal(logout.body.ok, true);

  db.close();
});

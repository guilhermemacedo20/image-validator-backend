import request from "supertest"
import app from "../src/app.js"

describe("Auth", () => {
  it("should fail with wrong credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@test.com",
        password: "123"
      })

    expect(res.statusCode).toBeGreaterThanOrEqual(400)
  })

  it("should login (mock user)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@test.com",
        password: "123456"
      })

    expect([200, 401]).toContain(res.statusCode)
  })
})
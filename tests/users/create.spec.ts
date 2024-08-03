import { DataSource } from "typeorm";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import createJWKSMock from "mock-jwks";
import { Roles } from "../../src/constants";
import { User } from "../../src/entity/User";

describe("POST /users", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;
  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    jwks.start();
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterEach(async () => {
    jwks.stop();
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe("Given all fields", () => {
    it("Should persist the user in the database", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      //Register user
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
        tenantId: 1,
      };

      await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);
      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(userData.email);
    });
    it("Should create a manager user", async () => {
      const adminToken = jwks.token({
        sub: "1",
        role: Roles.ADMIN,
      });

      //Register user
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
        tenantId: 1,
      };

      await request(app)
        .post("/users")
        .set("Cookie", [`accessToken=${adminToken}`])
        .send(userData);
      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      expect(users).toHaveLength(1);
      expect(users[0].role).toBe(Roles.MANAGER);
      expect(users[0].email).toBe(userData.email);
    });
    it.todo("should return 403 if not admin users tries to create users");
  });
});

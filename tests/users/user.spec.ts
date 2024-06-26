import { Roles } from "./../../src/constants/index";
import { DataSource } from "typeorm";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import createJWKSMock from "mock-jwks";
import { User } from "../../src/entity/User";

describe("GET /auth/self", () => {
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
    it("should return the 200 status code", async () => {
      const accessToken = jwks.token({
        sub: "1",
        role: Roles.CUSTOMER,
      });
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();
      expect(response.statusCode).toBe(200);
    });
    it("should return the user Data", async () => {
      //Register user
      const userRepository = connection.getRepository(User);
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };
      const createdUser = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      });
      //Generate token
      const accessToken = jwks.token({
        sub: String(createdUser.id),
        role: createdUser.role,
      });
      //Add token to cookie

      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();
      //Assert
      //Check if userid matches with the registered user
      expect((response.body as Record<string, string>).id).toBe(createdUser.id);
    });
    it("Should not return the password field", async () => {
      //Register user
      const userRepository = connection.getRepository(User);
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };
      const createdUser = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      });
      //Generate token
      const accessToken = jwks.token({
        sub: String(createdUser.id),
        role: createdUser.role,
      });
      //Add token to cookie

      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();
      //Assert
      //Check if userid matches with the registered user
      console.log(response.body);
      expect(response.body as Record<string, string>).not.toHaveProperty(
        "password",
      );
    });

    it("Should return 401 statuscode if token not exist", async () => {
      //Register user
      const userRepository = connection.getRepository(User);
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };
      await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      });

      const response = await request(app).get("/auth/self").send();
      //Assert
      expect(response.statusCode).toBe(401);
    });
  });
});

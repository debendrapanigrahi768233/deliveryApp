import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
// import { truncateTables } from "../utils";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";

describe("POST /auth/register", () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    //Database truncate
    await connection.dropDatabase();
    await connection.synchronize();
    // await truncateTables(connection);
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe("Happy path: Given all fields", () => {
    it("should return 201 status code", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.statusCode).toBe(201);
    });

    it("checking for json", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      expect(response.headers["content-type"]).toEqual(
        expect.stringContaining("json"),
      );
    });

    it("should persist the user in database", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };

      //Act
      await request(app).post("/auth/register").send(userData);

      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].firstName).toBe(userData.firstName);
    });

    it("should assign a customer role", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };

      //Act
      await request(app).post("/auth/register").send(userData);

      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users[0]).toHaveProperty("role");
      expect(users[0].role).toBe(Roles.CUSTOMER);
    });

    it("should store the hashed password", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };

      //Act
      await request(app).post("/auth/register").send(userData);

      //Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find({ select: ["password"] });
      console.log(users[0].password);
      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
    });

    it("should return 400 status code if email already exist", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "debendra.panigrahi@gmail.com",
        password: "secret",
      };

      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: Roles.CUSTOMER });

      //Act
      const response = await request(app).post("/auth/register").send(userData);
      const users = await userRepository.find();
      console.log(users);

      //Assert
      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });

    it("should return the access and refresh token inside the cookie", async () => {
      // Arrange
      const userData = {
        firstName: "Rakesh",
        lastName: "K",
        email: "rakesh@mern.space",
        password: "password",
      };

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert

      interface Headers {
        ["set-cookie"]: string[];
      }

      let accessToken = null;
      let refreshToken = null;

      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      // const cookies = (response.headers as { [index: string]: string })["set-cookie"] || [];

      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessToken = cookie.split(";")[0].split("=")[1];
        }

        if (cookie.startsWith("refreshToken=")) {
          refreshToken = cookie.split(";")[0].split("=")[1];
        }
      });

      console.log(accessToken, refreshToken);
      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();

      expect(isJwt(accessToken)).toBe(true);
      expect(isJwt(refreshToken)).toBeTruthy();
    });

    it("should store the refresh token in the database", async () => {
      // Arrange
      const userData = {
        firstName: "Rakesh",
        lastName: "K",
        email: "rakesh@mern.space",
        password: "password",
      };

      // Act
      const response = await request(app).post("/auth/register").send(userData);

      //Assert
      const refreshRepository = connection.getRepository(RefreshToken);
      const refreshTokensRecords = await refreshRepository
        .createQueryBuilder("refreshToken")
        .where("refreshToken.userId = :userId", {
          userId: (response.body as Record<string, string>).id,
        })
        .getMany();

      expect(refreshTokensRecords).toHaveLength(1);
    });
  });

  describe("Sad path: Missing fields", () => {
    it("should return 400 status code if email field is missing", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "",
        password: "secret",
      };

      //Act
      const response = await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      console.log(response.body);

      //Assert
      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });
  });

  describe("Field are not in proper format", () => {
    it("should trim the meail field", async () => {
      //Arrange
      const userData = {
        firstName: "Debendra",
        lastName: "Panigrahi",
        email: "    deb@gmail.com    ",
        password: "secret",
      };

      //Act
      await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();

      //Assert
      expect(users[0].email).toBe("deb@gmail.com");
    });
  });
});

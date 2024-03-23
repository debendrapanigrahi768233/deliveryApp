import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
// import { truncateTables } from "../utils";
import { Roles } from "../../src/constants";

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
      const users = await userRepository.find();
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
});

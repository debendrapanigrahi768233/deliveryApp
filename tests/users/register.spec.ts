import request from "supertest";
import app from "../../src/app";

describe("POST /auth/register", () => {
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
    });
  });
  //   describe("Sad path: Missing fields", () => {});
});

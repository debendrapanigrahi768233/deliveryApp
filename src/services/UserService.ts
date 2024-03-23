import { Repository } from "typeorm";
import { User } from "../entity/User";
import { UserData } from "../types";
import createHttpError from "http-errors";

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ firstName, lastName, email, password }: UserData) {
    // const userRepository = AppDataSource.getRepository(User);
    try {
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password,
      });
    } catch (err) {
      const error = createHttpError(
        500,
        "Error while pushing data to database",
      );
      throw error;
    }
  }
}

import { Repository } from "typeorm";
import { User } from "../entity/User";
import { UserData } from "../types";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({ firstName, lastName, email, password, role }: UserData) {
    //Checking for user with email already exist
    const user = await this.userRepository.findOne({ where: { email: email } });
    if (user) {
      const error = createHttpError(400, "User with this email already exist");
      throw error;
    }

    //Password Hashing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // const userRepository = AppDataSource.getRepository(User);
    try {
      return await this.userRepository.save({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role,
      });
    } catch (err) {
      const error = createHttpError(
        500,
        "Error while pushing data to database",
      );
      throw error;
    }
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    return user;
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    return user;
  }
}

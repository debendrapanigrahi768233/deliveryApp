import { Brackets, Repository } from "typeorm";
import { User } from "../entity/User";
import { LimitedUserData, UserData, UserQueryParams } from "../types";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async create({
    firstName,
    lastName,
    email,
    password,
    role,
    tenantId,
  }: UserData) {
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
        tenant: tenantId ? { id: tenantId } : undefined,
      });
    } catch (err) {
      console.log("error---------------------------->", err);
      const error = createHttpError(
        500,
        "Error while pushing data to database",
      );
      throw error;
    }
  }

  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
      },
      select: ["id", "firstName", "lastName", "email", "role", "password"],
    });
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        tenant: true,
      },
    });
    return user;
  }

  async update(
    userId: number,
    { firstName, lastName, role, email, tenantId }: LimitedUserData,
  ) {
    try {
      return await this.userRepository.update(userId, {
        firstName,
        lastName,
        role,
        email,
        tenant: tenantId ? { id: tenantId } : null,
      });
    } catch (err) {
      const error = createHttpError(
        500,
        "Failed to update the user in the database",
      );
      throw error;
    }
  }

  async getAll(validateQuery: UserQueryParams) {
    const queryBuilder = this.userRepository.createQueryBuilder("user");

    if (validateQuery?.q) {
      const searchTerm = `%${validateQuery.q}%`;
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where("CONCAT(user.firstName, ' ', user.lastName) ILike :q", {
            q: searchTerm,
          }).orWhere("user.email ILike :q", { q: searchTerm });
        }),
      );
    }

    if (validateQuery?.role && validateQuery?.role !== "") {
      queryBuilder.andWhere("user.role = :role", { role: validateQuery.role });
    }

    const result = await queryBuilder
      .leftJoinAndSelect("user.tenant", "tenant")
      .skip((validateQuery.currentPage - 1) * validateQuery.perPage)
      .take(validateQuery.perPage)
      .orderBy("user.id", "DESC")
      .getManyAndCount();

    console.log(queryBuilder.getSql());

    return result;
    // return await this.userRepository.find();
  }

  async deleteById(userId: number) {
    return await this.userRepository.delete(userId);
  }
}

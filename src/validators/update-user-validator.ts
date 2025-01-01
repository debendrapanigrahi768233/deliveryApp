/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { checkSchema } from "express-validator";
import { UpdateUserRequest } from "../types";

export default checkSchema({
  firstName: {
    errorMessage: "First name is required!",
    notEmpty: true,
    trim: true,
  },
  lastName: {
    errorMessage: "Last name is required!",
    notEmpty: true,
    trim: true,
  },
  role: {
    errorMessage: "Role is required!",
    notEmpty: true,
    trim: true,
  },
  email: {
    isEmail: {
      errorMessage: "Email not valid",
    },
    notEmpty: true,
    errorMessage: "Email is required!",
    trim: true,
  },
  tenantId: {
    errorMessage: "TenantId is required!",
    trim: true,
    custom: {
      options: async (value: string, { req }) => {
        const role = (req as UpdateUserRequest).body.role;
        return role === "admin" ? true : !!value;
      },
    },
  },
});

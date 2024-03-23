// import { body } from "express-validator";
// export default [body("email").notEmpty().withMessage("Email is required")];

import { checkSchema } from "express-validator";

export default checkSchema({
  email: {
    errorMessage: "Email is required",
    notEmpty: true,
  },
});

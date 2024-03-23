//as const : so that we can freeze this object from getting change and it will become read only

export const Roles = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  MANAGER: "manager",
} as const;

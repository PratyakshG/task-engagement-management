import { Router } from "express";
import { login } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
// import { requireRole } from "../middleware/role.js";
// import { Role } from "../generated/prisma/enums.js";

export const authRouter = Router();

authRouter.post("/login", login);

// Authentication Testing Route
authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: req.user,
  });
});

// Authorization Testing Route
// authRouter.get(
//   "/admin-test",
//   requireAuth,
//   requireRole(Role.ADMIN),
//   (req, res) => {
//     return res.json({
//       message: "You are an admin.",
//       user: req.user,
//     });
//   },
// );

import { Router } from "express";
import { currentUser, login } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.get("/current-user", requireAuth, currentUser);

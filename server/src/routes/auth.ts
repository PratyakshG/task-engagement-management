import { Router } from "express";
import { login, registerUser } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", login);

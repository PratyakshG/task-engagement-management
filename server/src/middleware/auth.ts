import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { Role } from "../generated/prisma/client.js";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required.");
}

interface JwtPayload {
  sub: string;
  role: Role;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Invalid authorization header.",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.sub !== "string" ||
      !Object.values(Role).includes(payload.role as Role)
    ) {
      return res.status(401).json({
        error: "Invalid authentication token.",
      });
    }

    const jwtPayload: JwtPayload = {
      sub: payload.sub,
      role: payload.role as Role,
    };

    req.user = {
      id: jwtPayload.sub,
      role: jwtPayload.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired authentication token.",
    });
  }
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


export const userAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
     res.status(401).json({ error: "Unauthorized: No token provided." });
     return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // Attach the decoded information to the request for use in protected routes
    (req as any).user = decoded;
    return next();
  } catch {
     res.status(401).json({ error: "Unauthorized: Invalid token." });
  }
};

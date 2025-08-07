import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.status(401).json({ error: 'Unauthorized: No token provided.' });
      return;
  }

  const token = authHeader.split(' ')[1];

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (req as any).user = decoded; 
      next();
  } catch (error) {
      res.status(401).json({ error: 'Unauthorized: Invalid token.' });
      return;
  }
};


export default authMiddleware;

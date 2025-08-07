import { Request, Response, NextFunction } from 'express';
import logger from '../common/logger'; 

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next(); 
};

export default loggerMiddleware;

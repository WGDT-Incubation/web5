import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user_routes';
import adminRoutes from './routes/admin_routes';
import superAdminRoutes from './routes/superAdmin_routes';
import verifierRoutes from "./routes/verifier_routes";
import certificateRoutes from './routes/certificate_routes'; 

import cors from 'cors';
import commonMiddleware from './middleware/commonMiddleware';
import logger from './common/logger';
import morgan from 'morgan';


dotenv.config();

const app = express();

app.use(cors());
app.use(
  express.json({
    limit: "10mb",     
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);


app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

app.use(commonMiddleware);

const BASE_URL = process.env.BASE_URL || '';


app.use(`${BASE_URL}/superAdmin`,superAdminRoutes);
app.use(`${BASE_URL}/admin`, adminRoutes);   
app.use(`${BASE_URL}/user`, userRoutes);
app.use(`${BASE_URL}/verifier`, verifierRoutes);
app.use(`${BASE_URL}/certificate`, certificateRoutes);

export default app;



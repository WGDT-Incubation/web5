import app from './app';
import dotenv from 'dotenv';
import logger from './common/logger';
import { getClient } from './connections/connection';
import cron from 'node-cron';
import { fetchAndStoreEDistrictData } from './cron/fetchEDistrictData';

dotenv.config();

const PORT = process.env.PORT || '';



cron.schedule('*/20 * * * * *', async () => {
  console.log('🔁 Running cron every 20 seconds...');
  await fetchAndStoreEDistrictData();
});


async function startServer() {
  try {
    await getClient();
    logger.info('✅ Successfully connected to the database');

    
    app.listen(PORT, () => {
      logger.info(`✅ Server is running on http://localhost:${PORT}`);
    });
  
  } catch (error) {
    logger.error('❌ Failed to connect to the database. Server not started.', { error });
    process.exit(1);
  }
}

startServer();

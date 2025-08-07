import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import logger from '../common/logger';
dotenv.config();


const uri = process.env.MONGO_URI || '';


let client: MongoClient | null = null;

// Function to get MongoDB client with retry logic
export const getClient = async (): Promise<MongoClient> =>{
  if (client) return client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    return client;
  } catch (error) {
    logger.error(' Database connection error', { error });
    throw new Error('Database connection error');
  }
};

export default {getClient};

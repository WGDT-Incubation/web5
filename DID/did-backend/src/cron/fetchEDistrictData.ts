import axios from 'axios';
import { getClient } from '../connections/connection';
import { getEDistrictDataCronCollection } from '../models/models';


const FETCH_URL =String(process.env.FETCH_URL);

export const fetchAndStoreEDistrictData = async () => {
  try {
    const res = await axios.get(FETCH_URL);
    const records: any[] = res.data?.data;

    if (!Array.isArray(records)) {
      console.warn("⚠️ Unexpected response structure from API");
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCronCollection(db);
    const now = new Date();

    for (const record of records) {
      const { _id, ...dataToCheck } = record; // Ignore _id from comparison

      const duplicate = await collection.findOne(dataToCheck);

      if (!duplicate) {
        await collection.insertOne({
          ...dataToCheck,
          status: 'pending',
          insertedAt: now,
        });
      }
    }

    console.log(`✅ Synced ${records.length} records from port 3003`);
  } catch (error) {
    console.error("❌ Error syncing eDistrict data:", error);
  }
};

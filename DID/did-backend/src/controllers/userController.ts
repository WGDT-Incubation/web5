import { Request, Response } from 'express';
import logger from '../common/logger';
import { getClient } from '../connections/connection';
import { validateSignUp, generateUniqueID, validatePassword } from '../helpers/helper';
import { User, VerifierAccess, getVerifierAccessCollection, getUserCollection } from '../models/models';
import axios from "axios";
import dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { sendOTPVerificationEmail, sendGenerateUserLoginOtp } from '../helpers/email.helper';
import { sendOTPUserLogin } from '../helpers/sms.helper';
dotenv.config();


const generateUserLoginOtp = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({
        status: 400,
        error: true,
        message: "Missing required fields"
      });
      return;
    }
    const otp = Math.floor(100_000 + Math.random() * 900_000);
    const sms = await sendOTPUserLogin(id, otp)
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    if (sms == 1) {
      const usersModel = await getUserCollection(db);
      const data = await usersModel.findOne({
        userPhone: id,
      });
      const now = Date.now()
      if (data && data.otp && now - data.otpExpiry < 0) {
        res.status(400).json({
          status: 400,
          error: true,
          message: "User has already been sent an otp via sms.(valid for 10 mins.)"
        });
      }
      else {

        const salt: string = await bcrypt.genSalt(10);
        const hash: any = await bcrypt.hash(String(otp), salt);
        const newOtpData = await usersModel.findOneAndUpdate(
          { userPhone: id },            // filter
          {
            $set: {                     // <-- atomic operator wrapper
              otp: hash,
              otpExpiry: now + 600_000   // 10 min from now
            },
            $setOnInsert: {             // fields only for NEW docs
              userPhone: id,
              createdAt: new Date()
            }
          },
          { upsert: true }   // return the updated doc
        );
      }
    }
    else {
      res.status(400).json({
        status: 400,
        error: true,
        message: "Error in sending otp sms to user phone number"
      });
      return;
    }

    res.status(200).json({
      status: 200,
      error: false,
      message: "User Login otp sent successfully"
    });

  } catch (error) {
    console.log(error);

    logger.error("Error in userLogin API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const userLogin = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "Phone and OTP are required.",
      });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const usersCol = getUserCollection(db);

    const user = await usersCol.findOne<User>({ userPhone: phone });
    if (!user || !user.otp || !user.otpExpiry) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "User not found or OTP not generated",
      });
      return;
    }

    // check if OTP has expired
    if (Date.now() > user.otpExpiry) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "OTP expired, please generate a new one",
      });
      return;
    }

    // verify OTP
    const isMatched = await bcrypt.compare(otp, user.otp);
    if (!isMatched) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "Invalid OTP",
      });
      return;
    }

    // Call third-party enroll API
    const apiUrl = process.env.USER_ENROLL_API_URL!;
    const payload = {
      id: process.env.USER_ID!,
      secret: process.env.USER_SECRET!,
    };
    const hypeLedgerResponse = await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
    });

    if (!hypeLedgerResponse.data?.token) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "Failed to fetch DID token from third-party",
      });
      return;
    }

    const blockchainToken = hypeLedgerResponse.data.token;

    // Clear OTP fields in the DB
    await usersCol.updateOne(
      { userPhone: phone },
      { $set: { otp: "none", otpExpiry: 0 } }
    );

    // Generate your own AuthToken for the user
    const authToken = jwt.sign(
      { phone },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    // Return both tokens
     res.status(200).json({
      status: 200,
      error: false,
      message: "User logged in successfully",
      authToken,        // your JWT
      blockchainToken,    // third-party token
    });
  } catch (error) {
    console.error("Error in userLogin API", error);
    if (axios.isAxiosError(error) && error.response) {
       res.status(error.response.status).json(error.response.data);
       return;
    }
     res.status(500).json({
      status: 500,
      error: true,
      message: "Internal Server Error",
    });
  }
};

const getIdentity = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!phoneNumber || !token) {
      res.status(400).json({ error: "Missing required fields" });
      return
    }

    const apiUrl = process.env.CHAINCODE_INVOKE_API_URL || '';

    const payload = {
      method: "getIdentity",
      args: [phoneNumber],
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    res.json(response.data);

  } catch (error) {
    logger.error("Error in getIdentity API", { error });


    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ error: error.response.data });
      return;
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};


const queryDID = async (req: Request, res: Response) => {
  try {

    const { phoneNumber, did } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!phoneNumber || !did || !token) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const apiUrl = process.env.CHAINCODE_INVOKE_API_URL || '';

    const payload = {
      method: "queryDID",
      args: [phoneNumber, did],
    };


    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    res.json(response.data);

  } catch (error) {
    logger.error("Error in queryDID API", { error });


    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ error: error.response.data });
      return;
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllVerifierEmails = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);

    // Use $nin to filter for records where `status` is neither "pending" nor "rejected"
    const allVerifiers = await verifierAccessCollection
      .find({ status: { $nin: ["pending", "rejected"] } }, { projection: { verifierEmail: 1 } })
      .toArray();

    // Extract only the verifier emails
    const verifierEmails = allVerifiers.map(verifier => verifier.verifierEmail);

    // Return the filtered emails
    res.status(200).json({ verifierEmails });
  } catch (error) {
    logger.error("Error in getAllVerifierEmails API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const grantAccesstoVerifier = async (req: Request, res: Response) => {
  try {
    const { did, verifierEmail } = req.body;

    if (!did || !verifierEmail) {
      res.status(400).json({ error: "Missing DID or verifierEmail in request body" });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);

    const existingVerifierAccess = await verifierAccessCollection.findOne({ verifierEmail });
    if (!existingVerifierAccess) {
      res.status(404).json({ error: "Verifier email not found" });
      return;
    }

    if (existingVerifierAccess.did.includes(did)) {
      res.status(400).json({ message: `DID '${did}' is already granted to this verifier` });
      return;
    }

    existingVerifierAccess.did.push(did);


    await verifierAccessCollection.updateOne(
      { verifierEmail },
      { $set: { did: existingVerifierAccess.did } }
    );

    res.status(200).json({ message: `DID '${did}' granted access to verifier '${verifierEmail}'` });

  } catch (error) {
    logger.error("Error in grantAccesstoVerifier API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }

}

const grantAccessToMultipleVerifiers = async (req: Request, res: Response) => {
  try {
    const { did, verifierEmails } = req.body;

    if (!did || !Array.isArray(verifierEmails) || verifierEmails.length === 0) {
      res.status(400).json({ error: "Missing DID or verifierEmails array in request body" });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);

    for (const verifierEmail of verifierEmails) {
      const existingVerifierAccess = await verifierAccessCollection.findOne({ verifierEmail });

      if (!existingVerifierAccess) {
        res.status(404).json({ error: `Verifier email '${verifierEmail}' not found` });
        return;
      }


      if (existingVerifierAccess.did.includes(did)) {
        continue;
      }


      existingVerifierAccess.did.push(did);


      await verifierAccessCollection.updateOne(
        { verifierEmail },
        { $set: { did: existingVerifierAccess.did } }
      );
    }

    res.status(200).json({ message: `DID '${did}' granted access to the provided verifiers` });
  } catch (error) {
    logger.error("Error in grantAccessToMultipleVerifiers API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const grantMultipleDIDAccesstoMultipleVerifier = async (req: Request, res: Response) => {
  try {
    const { dids, verifierEmails } = req.body;

    if (!Array.isArray(dids) || dids.length === 0 || !Array.isArray(verifierEmails) || verifierEmails.length === 0) {
      res.status(400).json({ error: "Both dids and verifierEmails must be non-empty arrays" });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);


    for (const verifierEmail of verifierEmails) {
      const existingVerifierAccess = await verifierAccessCollection.findOne({ verifierEmail });

      if (!existingVerifierAccess) {
        res.status(404).json({ error: `Verifier email '${verifierEmail}' not found` });
        return;
      }

      // Loop through each DID and add it to the verifier's list if not already added
      for (const did of dids) {
        // Check if the DID is already in the list, if not, add it
        if (!existingVerifierAccess.did.includes(did)) {
          existingVerifierAccess.did.push(did);
        }
      }

      // Update the verifier's document with the new DID list
      await verifierAccessCollection.updateOne(
        { verifierEmail },
        { $set: { did: existingVerifierAccess.did } }
      );
    }

    res.status(200).json({ message: "Multiple DIDs granted access to multiple verifiers" });
  } catch (error) {
    logger.error("Error in grantMultipleDIDAccesstoMultipleVerifier API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const removeAccessForDID = async (req: Request, res: Response) => {
  try {
    const { verifierEmail, did } = req.body;

    if (!verifierEmail || !did) {
      res.status(400).json({ error: "Both verifierEmail and did must be provided" });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);

    // Check if the verifierEmail exists in the collection
    const existingVerifierAccess = await verifierAccessCollection.findOne({ verifierEmail });

    if (!existingVerifierAccess) {
      res.status(404).json({ error: `Verifier email '${verifierEmail}' not found` });
      return;
    }

    const didIndex = existingVerifierAccess.did.indexOf(did);
    if (didIndex === -1) {
      res.status(404).json({ error: `DID '${did}' not found for verifier email '${verifierEmail}'` });
      return;
    }

    existingVerifierAccess.did.splice(didIndex, 1);

    await verifierAccessCollection.updateOne(
      { verifierEmail },
      { $set: { did: existingVerifierAccess.did } }
    );

    res.status(200).json({ message: `DID '${did}' access removed for verifier '${verifierEmail}'` });
  } catch (error) {
    logger.error("Error in removeAccessForDID API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getVerifiersForDID = async (req: Request, res: Response) => {
  try {
    // 1. Extract the DID from the route parameter
    const { did } = req.body;
    if (!did) {
       res
        .status(400)
        .json({ error: "A DID must be provided in the URL path" });
        return;
    }

    // 2. Connect to Mongo and get the collection
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);

    // 3. Find all docs where the `did` array includes this DID
    const docs: VerifierAccess[] = await verifierAccessCollection
      .find({ did })          // Mongo will match array-membership by default
      .toArray();

    // 4. If none found, 404
    if (docs.length === 0) {
       res
        .status(404)
        .json({ error: `No verifiers found for DID '${did}'` });
        return;
    }

    // 5. Map to just the emails
    const verifiers = docs.map(doc => doc.verifierEmail);

    // 6. Return the list
     res.status(200).json({ did, verifiers });

  } catch (error) {
     res.status(500).json({ error: "Internal Server Error" });
  }
};


export default {
  generateUserLoginOtp,
  userLogin,
  getIdentity,
  queryDID,
  getAllVerifierEmails,
  grantAccesstoVerifier,
  grantAccessToMultipleVerifiers,
  grantMultipleDIDAccesstoMultipleVerifier,
  removeAccessForDID,
  getVerifiersForDID
};

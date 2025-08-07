
import { Request, Response } from 'express';
import { getClient } from '../connections/connection';
import{generateUniqueDID,generateUniqueID, generateOTP,validateSignUp,validatePassword} from '../helpers/helper';
import {sendRevokeVerifierEmail,sendAddVerifierApprovalEmail,
sendOTPResetPassword,sendAddIssuerApprovalEmail,sendRevokeIssuerEmail} from '../helpers/email.helper';
import {getSuperAdminUserCollection,SuperAdminUser,getDepartmentDataCollection,
        getEDistrictDataCollection,getIssuerAdminCollection,IssuerAdmin,EDistrictData,
      getVerifierAccessCollection,VerifierAccess,DepartmentData,
    getCertificateDataCollection,CertificateData} from '../models/models';
import logger from '../common/logger';
import axios from "axios";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { error } from 'console';
dotenv.config();


const signUp = async (req: Request, res: Response) => {
  try {
    const { Email, password } = req.body;

    try {
      validateSignUp({ Email, password });
    } catch (validationError) {
      const error = validationError as Error;
      res.status(400).json({ error: error.message });
      return;
    }
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const superAdminCollection = getSuperAdminUserCollection(db);


    const existingUser = await superAdminCollection.findOne({ email: Email });
    if (existingUser) {
      res.status(400).json({ error: 'Admin already exists.' });
      return;
    }



    const uniqueID = generateUniqueID();
    const hashedPassword = await bcrypt.hash(password, 10);

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption Error ');
    }

    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: SuperAdminUser = {
      uniqueID,
      email: Email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false
    };

    await superAdminCollection.insertOne(newUser);

    // const emailResponse = await sendOTPVerificationEmail(Email, otp);
    // if (emailResponse !== 1) {
    //   res.status(500).json({ message: 'Failed to send OTP email' });
    //   return;
    // }

    res.status(200).json({
      message: 'Sign up successful!',
    });
  } catch (error) {
    logger.error('Error in SignUp API', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const login = async (req: Request, res: Response) => {
  try {

    const { Email, password } = req.body;

    if (!Email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const userCollection = getSuperAdminUserCollection(db);

    const adminUser = await userCollection.findOne({ email: Email });
    if (!adminUser) {
      res.status(404).json({ error: 'SuperAdmin not found.' });
      return;
    }

    // if (!adminUser.isVerified) {
    //   res.status(403).json({ error: 'Please verify your email before logging in.'});
    //   return;
    // }
    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    console.log("Before Token");
    const token = jwt.sign(
      { email: adminUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    console.log("Jwt Token", token);

    res.status(200).json({
      message: 'Login successful!',
      AuthToken: token
    });
  } catch (error) {
    logger.error('Error in login API', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const forgotPassword = async (req: Request, res: Response) => {
  try {
    const {email} = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const adminCollection = getSuperAdminUserCollection(db);


    const admin = await adminCollection.findOne({email});
    if (!admin) {
      res.status(404).json({ error: 'Issuer Not Found' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    
    await adminCollection.updateOne(
      { email },
      { $set: { 
                recentOTP:otp, 
                otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
                updatedAt: new Date()
              }
      } 
    );

    const emailResponse = await sendOTPResetPassword(email,otp);
    if (emailResponse === 1) {
      res.status(200).json({
        message: "OTP sent to Issuer email.",
      });
    } else {
      res.status(500).json({
        message: "Failed to send email",
      });
    }
    
  } catch (error) {
    logger.error('Error in forgotPassword API', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({error: 'Email, OTP, and new password are required.'});
      return;
    }
    try {
      validatePassword(newPassword);
     }catch (validationError) {
       const error = validationError as Error;
       res.status(400).json({ error: error.message});
       return;
     }

     const client = await getClient();
     const db = client.db(process.env.DB_NAME);
     const adminCollection = getSuperAdminUserCollection(db);

    const admin = await adminCollection.findOne({ email,recentOTP:otp });
    if (!admin || !admin.otpExpiresAt || new Date() > new Date(admin.otpExpiresAt)) {
      res.status(400).json({ error: 'Invalid or expired OTP.' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await adminCollection.updateOne(
      { email },
      { 
        $set: { 
          password: hashedPassword, 
          updatedAt: new Date(), 
          recentOTP: null, 
          otpExpiresAt: undefined 
        } 
      }
    );
    res.status(200).json({ message: 'Password reset successfully.'});
  } catch (error) {
    logger.error('Error in resetPassword API', { error });
    res.status(500).json({ message: 'Internal Server Error'});
  }
}




const insertEDistrictData = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data || typeof data !== "object") {
      res.status(400).json({ error: "Invalid or missing 'data' field" });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCollection(db);

    const result = await collection.insertOne({
      ...data,
      status: "pending",
      insertedAt: new Date()
    });

    res.status(200).json({
      message: "Document inserted successfully",
      insertedId: result.insertedId,
    });

  } catch (error) {
    logger.error("Error inserting random data", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
}


export const insertEDistrictDataBulk = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    // 1) Validate that `data` is an array of objects
    if (!Array.isArray(data) || data.some(item => typeof item !== "object" || item === null)) {
      res.status(400).json({ error: "Request body must contain an array of objects in `data`." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCollection(db);

    // 2) Prepare each document: spread the incoming fields, then add status & insertedAt
    const now = new Date();
    const docsToInsert: EDistrictData[] = data.map((item) => ({
      ...item,
      status: "pending",
      insertedAt: now,
    }));

    // 3) Perform a bulk insert
    const result = await collection.insertMany(docsToInsert);

    res.status(200).json({
      message: "Bulk insert successful",
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    });
  } catch (error) {
    logger.error("Error inserting bulk eDistrict data", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getEDistrictData = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCollection(db);

    const documents = await collection.find({}).sort({ insertedAt: -1 }).toArray();

    res.status(200).json({
      message: "Data fetched successfully",
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    logger.error("Error fetching eDistrict data", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const rejectEDistrictData = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      res.status(400).json({ error: "Missing phoneNumber in request body" });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCollection(db);

    const result = await collection.deleteOne({ phoneNumber });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: "No document found with the provided phoneNumber" });
      return;
    }

    res.status(200).json({
      message: "Document deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error("Error deleting eDistrict data", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addIssuer = async (req: Request, res: Response) => {
  try {
    const { issuerEmail } = req.body;
    if (!Array.isArray(issuerEmail) || issuerEmail.some((e) => typeof e !== "string")) {
      res.status(400).json({ error: "issuerEmail must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getIssuerAdminCollection(db);
    const now = new Date();

    // 2️⃣ Track which emails got approved or skipped
    const approved: string[] = [];
    const alreadyApproved: string[] = [];
    const notFound: string[] = [];

    for (const email of issuerEmail) {
      const existing = await collection.findOne<IssuerAdmin>({ issuerEmail: email });

      if (!existing) {
        notFound.push(email);
        continue;
      }
      if (existing.status == 'approved') {
        alreadyApproved.push(email);
        continue;
      }
 
      await collection.updateOne(
        { issuerEmail: email },
        { $set: { status: 'approved', updatedAt: now } }
      );
      approved.push(email);
      const emailResponse= await sendAddIssuerApprovalEmail(email);
      if (emailResponse === 1) {
      continue;
      } else {
      res.status(500).json({
        message: "Failed to send email",
      });
    }
    }

    res.status(200).json({
      message: "Issuer approval processing complete.",
      approved,
      alreadyApproved,
      notFound,
    });

  } catch (error) {
    logger.error("Error adding issuer", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const rejectIssuers = async (req: Request, res: Response) => {
  try {
    // 1) Validate payload: must be an array of strings
    const { issuerEmail } = req.body;
    if (!Array.isArray(issuerEmail) || issuerEmail.some((e) => typeof e !== "string")) {
      res.status(400).json({ error: "issuerEmail must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getIssuerAdminCollection(db);
    const now = new Date();

    // 2) Track outcomes
    const rejected: string[] = [];
    const alreadyRejected: string[] = [];
    const notFound: string[] = [];

    // 3) Loop through each email and update status to “rejected” if applicable
    for (const email of issuerEmail) {
      const existing = await collection.findOne<IssuerAdmin>({ issuerEmail: email });

      if (!existing) {
        notFound.push(email);
        continue;
      }
      if (existing.status === "rejected") {
        alreadyRejected.push(email);
        continue;
      }
      // If status is “pending” (or any other), set to “rejected”
      await collection.updateOne(
        { issuerEmail: email },
        { $set: { status: "rejected", updatedAt: now } }
      );
      rejected.push(email);
      await sendRevokeIssuerEmail(email)
    }

    // 4) Return a summary
    res.status(200).json({
      message: "Issuer rejection processing complete.",
      rejected,
      alreadyRejected,
      notFound,
    });
  } catch (error) {
    logger.error("Error rejecting issuers", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const undoIssuers = async (req: Request, res: Response) => {
  try {
    // 1) Validate payload: must be an array of strings
    const { issuerEmail } = req.body;
    if (!Array.isArray(issuerEmail) || issuerEmail.some((e) => typeof e !== "string")) {
      res.status(400).json({ error: "issuerEmail must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getIssuerAdminCollection(db);
    const now = new Date();

    // 2) Track outcomes
    const pendingIssuers: string[] = [];
    const alreadyPendingIssuers: string[] = [];
    const notFound: string[] = [];

    // 3) Loop through each email and update status to “rejected” if applicable
    for (const email of issuerEmail) {
      const existing = await collection.findOne<IssuerAdmin>({ issuerEmail: email });

      if (!existing) {
        notFound.push(email);
        continue;
      }
      if (existing.status === "pending") {
        alreadyPendingIssuers.push(email);
        continue;
      }
      // If status is “pending” (or any other), set to “rejected”
      await collection.updateOne(
        { issuerEmail: email },
        { $set: { status: "pending", updatedAt: now } }
      );
        pendingIssuers.push(email);
    }

    // 4) Return a summary
    res.status(200).json({
      message: "Issuer pending process complete.",
      pendingIssuers,
      alreadyPendingIssuers,
      notFound,
    });
  } catch (error) {
    logger.error("Error rejecting issuers", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addVerifier = async (req: Request, res: Response) => {
  try {
    const { verifierEmail } = req.body;
    
    // Validate that `verifierEmail` is an array of strings
    if (!Array.isArray(verifierEmail) || verifierEmail.some((e) => typeof e !== "string")) {
      res.status(400).json({ error: "verifierEmail must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getVerifierAccessCollection(db);
    const now = new Date();

    // Track which emails got approved or skipped
    const approved: string[] = [];
    const alreadyApproved: string[] = [];
    const notFound: string[] = [];

    // Iterate through each verifier email
    for (const email of verifierEmail) {
      const existing = await collection.findOne<VerifierAccess>({ verifierEmail: email });

      if (!existing) {
        notFound.push(email);
        continue;
      }
      if (existing.status == 'approved') {
        alreadyApproved.push(email);
        continue;
      }

      // Update status to 'approved' and set the updatedAt field
      await collection.updateOne(
        { verifierEmail: email },
        { $set: { status: 'approved', updatedAt: now } }
      );

      approved.push(email);
      
      // Call the function to send an email to the approved verifier (You can implement this function)
      await sendAddVerifierApprovalEmail(email);
    }

    // Return response with results
    res.status(200).json({
      message: "Verifier approval processing complete.",
      approved,
      alreadyApproved,
      notFound,
    });

  } catch (error) {
    logger.error("Error adding verifier", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const rejectVerifiers = async (req: Request, res: Response) => {
  try {
    // 1) Validate payload: must be an array of strings
    const { verifierEmail } = req.body;
    if (!Array.isArray(verifierEmail) || verifierEmail.some((e) => typeof e !== "string")) {
      res.status(400).json({ error: "verifierEmail must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getVerifierAccessCollection(db);
    const now = new Date();

    // 2) Track outcomes
    const rejected: string[] = [];
    const alreadyRejected: string[] = [];
    const notFound: string[] = [];

    // 3) Loop through each email and update status to "rejected" if applicable
    for (const email of verifierEmail) {
      const existing = await collection.findOne<VerifierAccess>({ verifierEmail: email });

      if (!existing) {
        notFound.push(email);
        continue;
      }
      if (existing.status === "rejected") {
        alreadyRejected.push(email);
        continue;
      }
      // If status is "pending" (or any other), set to "rejected"
      await collection.updateOne(
        { verifierEmail: email },
        { $set: { status: "rejected", updatedAt: now } }
      );
      rejected.push(email);

      // Send an email to the verifier indicating the rejection (You need to implement sendRevokeVerifierEmail function)
      await sendRevokeVerifierEmail(email);
    }

    // 4) Return a summary
    res.status(200).json({
      message: "Verifier rejection processing complete.",
      rejected,
      alreadyRejected,
      notFound,
    });
  } catch (error) {
    logger.error("Error rejecting verifiers", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const undoVerifiers = async (req: Request, res: Response) => {
  try {
    // 1) Validate payload: must be an array of strings
    const { verifierEmail } = req.body;
    if (!Array.isArray(verifierEmail) || verifierEmail.some((e) => typeof e !== "string")) {
      res.status(400).json({ error: "verifierEmail must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getVerifierAccessCollection(db);
    const now = new Date();

    // 2) Track outcomes
    const pending: string[] = [];
    const alreadyPending: string[] = [];
    const notFound: string[] = [];

    // 3) Loop through each email and update status to "rejected" if applicable
    for (const email of verifierEmail) {
      const existing = await collection.findOne<VerifierAccess>({ verifierEmail: email });

      if (!existing) {
        notFound.push(email);
        continue;
      }
      if (existing.status === "pending") {
        alreadyPending.push(email);
        continue;
      }
      // If status is "pending" (or any other), set to "rejected"
      await collection.updateOne(
        { verifierEmail: email },
        { $set: { status: "pending", updatedAt: now } }
      );
      pending.push(email);

    }

    // 4) Return a summary
    res.status(200).json({
      message: "Verifier pending process complete.",
      pending,
      alreadyPending,
      notFound,
    });
  } catch (error) {
    logger.error("Error undo verifiers", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};




const getPendingIssuerList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const issuerAdminCol = getIssuerAdminCollection(db);

    // Find all documents where isApprovedbySuperAdmin is false
    const pendingList = await issuerAdminCol.find<IssuerAdmin>({ status: 'pending' }).toArray();
    res.status(200).json({ pendingIssuers: pendingList });

  } catch (error) {
    logger.error("Error in getPendingIssuerList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getIssuerApprovedList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const issuerAdminCol = getIssuerAdminCollection(db);

    const approvedList = await issuerAdminCol.find<IssuerAdmin>({ status: 'approved' }).toArray();

    res.status(200).json({ approvedIssuers: approvedList });

  } catch (error) {
    logger.error("Error in getIssuerApprovedList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getIssuerRejectedList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const issuerAdminCol = getIssuerAdminCollection(db);

    const approvedList = await issuerAdminCol.find<IssuerAdmin>({ status: 'rejected' }).toArray();

    res.status(200).json({ approvedIssuers: approvedList });

  } catch (error) {
    logger.error("Error in getIssuerApprovedList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getAllIssuerList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const issuerAdminCol = getIssuerAdminCollection(db);

    const allIssuers = await issuerAdminCol.find<IssuerAdmin>({}).toArray();

    res.status(200).json({ allIssuers });
  } catch (error) {
    logger.error("Error in getAllIssuerList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};



const getPendingVerifierList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);

    // Find all documents where status is "pending"
    const pendingVerifiers = await verifierAccessCollection.find<VerifierAccess>({ status: 'pending' }).toArray();

    res.status(200).json({ pendingVerifiers });
  } catch (error) {
    logger.error("Error in getPendingVerifierList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getVerifierApprovedList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);

    // Find all documents where status is "approved"
    const approvedVerifiers = await verifierAccessCollection.find<VerifierAccess>({ status: 'approved' }).toArray();

    res.status(200).json({ approvedVerifiers });
  } catch (error) {
    logger.error("Error in getVerifierApprovedList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getVerifierRejectedList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);
    // Find all documents where status is "rejected"
    const rejectedVerifiers = await verifierAccessCollection.find<VerifierAccess>({ status: 'rejected' }).toArray();
    res.status(200).json({ rejectedVerifiers });
  } catch (error) {
    logger.error("Error in getVerifierRejectedList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllVerifierList = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierAccessCollection = getVerifierAccessCollection(db);
    
    const allVerifiers = await verifierAccessCollection.find<VerifierAccess>({}).toArray();
    res.status(200).json({ allVerifiers });
  } catch (error) {
    logger.error("Error in getAllVerifierList API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const addCertificateTypesToDepartment = async (req: Request, res: Response) => {
  try {
    const { department, certificateTypes } = req.body;

    // Validate that department and certificateTypes are provided
    if (!department || !Array.isArray(certificateTypes)) {
      res.status(400).json({
        status: 400,
        error: true,
        message: "Both 'department' and 'certificateTypes' array are required."
      });
      return;
    }

    // Validate that each item in certificateTypes is a string
    if (certificateTypes.some((type) => typeof type !== "string")) {
      res.status(400).json({
        status: 400,
        error: true,
        message: "'certificateTypes' must be an array of strings."
      });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const departmentDataCollection = getDepartmentDataCollection(db);

    // Check if the department already exists
    const existingDepartment = await departmentDataCollection.findOne<DepartmentData>({ department });

    if (!existingDepartment) {
      // If the department doesn't exist, create a new document
      const newDepartmentData: DepartmentData = {
        department,
        certificateType: certificateTypes,
      };

      // Insert the new department with the provided certificate types
      await departmentDataCollection.insertOne(newDepartmentData);

      // Return success message for new department creation
       res.status(201).json({
        status: 201,
        error: false,
        message: `Department '${department}' created successfully with certificate types.`,
        updatedCertificateTypes: certificateTypes,
      });
      return;
    }

    // If the department exists, update its certificateTypes array
    const updatedCertificateTypes = [
      ...new Set([...existingDepartment.certificateType, ...certificateTypes]) // Combine and remove duplicates
    ];

    // Update the department's certificateType array
    await departmentDataCollection.updateOne(
      { department },
      { $set: { certificateType: updatedCertificateTypes } }
    );

    // Return success message with the updated certificateTypes
    res.status(200).json({
      status: 200,
      error: false,
      message: `Certificate types successfully added to department '${department}'.`,
      updatedCertificateTypes
    });

  } catch (error) {
    logger.error("Error in addCertificateTypesToDepartment API", { error });
    res.status(500).json({
      status: 500,
      error: true,
      message: "Internal Server Error"
    });
  }
};


const removeCertificateTypesFromDepartment = async (req: Request, res: Response) => {
  try {
    const { department, certificateTypes } = req.body;
    
    // Validate that both department and certificateTypes are provided
    if (!department || !Array.isArray(certificateTypes) || certificateTypes.length === 0) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "Both 'department' and 'certificateTypes' array are required."
      });
      return;
    }

    // Validate that each item in certificateTypes is a string
    if (certificateTypes.some((type) => typeof type !== "string")) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "'certificateTypes' must be an array of strings."
      });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const departmentDataCollection = getDepartmentDataCollection(db);

    // Check if the department exists
    const existingDepartment = await departmentDataCollection.findOne<DepartmentData>({ department });

    if (!existingDepartment) {
       res.status(404).json({
        status: 404,
        error: true,
        message: `Department '${department}' not found.`
      });
      return;
    }

    // Filter out the certificateTypes that need to be removed
    const updatedCertificateTypes = existingDepartment.certificateType.filter((type) => 
      !certificateTypes.includes(type)
    );

    // Check if any certificate types were removed
    if (updatedCertificateTypes.length === existingDepartment.certificateType.length) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "None of the specified certificate types were found in the department."
      });
      return;
    }

    // Update the department's certificateType array by removing the specified certificateTypes
    await departmentDataCollection.updateOne(
      { department },
      { $set: { certificateType: updatedCertificateTypes } }
    );

    // Return success message with the updated certificateTypes
    res.status(200).json({
      status: 200,
      error: false,
      message: `Certificate types successfully removed from department '${department}'.`,
      updatedCertificateTypes
    });

  } catch (error) {
    logger.error("Error in removeCertificateTypesFromDepartment API", { error });
    res.status(500).json({
      status: 500,
      error: true,
      message: "Internal Server Error"
    });
  }
};

const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const departmentDataCollection = getDepartmentDataCollection(db);

    // Fetch all departments and their certificate types
    const departments = await departmentDataCollection.find<DepartmentData>({}).toArray();

    // Map through the departments to count the number of certificate types for each department
    const departmentSummary = departments.map((department) => ({
      department: department.department,
      certificateCount: department.certificateType.length, // Count the number of certificate types
      certificateTypes: department.certificateType, // List of certificate types (optional, can be removed if not needed)
    }));

    // Return the department summary
    res.status(200).json({
      status: 200,
      error: false,
      departments: departmentSummary,
    });
  } catch (error) {
    logger.error("Error in getAllDepartmentsWithCertificates API", { error });
    res.status(500).json({
      status: 500,
      error: true,
      message: "Internal Server Error",
    });
  }
};


 const getCertificates = async (req: Request, res: Response) => {
  try {
    
    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const certificatesCol = getCertificateDataCollection(db);

    const docs = await certificatesCol
      .find<CertificateData>({}, { projection: { _id: 0, id: 1, name: 1 } })
      .toArray();

    res.status(200).json({ certificates: docs });
  } catch (err) {
    console.error("Error in getCertificates:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


 const approveCertificateTemplate = async( req: Request, res: Response) => {
  try{
    const { names } = req.body;

    if (!Array.isArray(names) || names.some((n) => typeof n !== "string")) {
      res.status(400).json({ error: "`names` must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getCertificateDataCollection(db);

    const approved: string[] = [];
    const alreadyApproved: string[] = [];
    const notFound: string[] = [];

    for (const name of names) {
      const existing = await collection.findOne<CertificateData>({ name });

      if (!existing) {
        notFound.push(name);
        continue;
      }

      if (existing.approvedStats === "approved") {
        alreadyApproved.push(name);
        continue;
      }

      await collection.updateOne(
        { name },
        { $set: { approvedStats: "approved" } }
      );

      approved.push(name);
    }

    res.status(200).json({
      message: "Certificate template approval processing complete.",
      approved,
      alreadyApproved,
      notFound,
    });


  }catch (error) {
    logger.error("Error in approveCertificateTemplate API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
 }

 const rejectCertificateTemplate= async(req:Request,res:Response) => {
  try{
       const { names } = req.body;

    if (!Array.isArray(names) || names.some((n) => typeof n !== "string")) {
      res.status(400).json({ error: "`names` must be an array of strings." });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getCertificateDataCollection(db);

    const rejected: string[] = [];
    const alreadyRejected: string[] = [];
    const notFound: string[] = [];

    for (const name of names) {
      const existing = await collection.findOne<CertificateData>({ name });

      if (!existing) {
        notFound.push(name);
        continue;
      }

      if (existing.approvedStats === "rejected") {
        alreadyRejected.push(name);
        continue;
      }

      await collection.updateOne(
        { name },
        { $set: { approvedStats: "rejected" } }
      );

      rejected.push(name);
    }

    res.status(200).json({
      message: "Certificate template rejection processing complete.",
      rejected,
      alreadyRejected,
      notFound,
    });

  }catch (error) {
    logger.error("Error in rejectCertificateTemplate API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
 }



export default {
         login,
         signUp,
         resetPassword,
         forgotPassword,
         addIssuer,
         addVerifier,
         rejectIssuers,
         undoIssuers,
         rejectVerifiers,
         undoVerifiers,
         insertEDistrictData,
         insertEDistrictDataBulk,
         getEDistrictData,
         rejectEDistrictData,
         getPendingIssuerList,
         getIssuerApprovedList,
         getIssuerRejectedList,
         getAllIssuerList,
         getPendingVerifierList,
         getVerifierApprovedList,
         getVerifierRejectedList,
         getAllVerifierList,
         getAllDepartments,
         getCertificates,
         addCertificateTypesToDepartment,
         removeCertificateTypesFromDepartment,
         rejectCertificateTemplate,
         approveCertificateTemplate
      };


import { Request, Response } from 'express';
import { getClient } from '../connections/connection';
import{generateUniqueDID,generateUniqueID, generateOTP,validateSignUp,validatePassword} from '../helpers/helper';
import {sendOTPRemoveCertificate,sendOTPVerificationEmail,sendOTPResetPassword} from '../helpers/email.helper';
import {getAdminUserCollection,AdminUser,getEDistrictDataCollection,getIssuerAdminCollection,
        IssuerAdmin,getIssuedDIDcollection,RevokedDIDs,
        getDepartmentDataCollection,DepartmentData,
        getRevokedDIDcollection,EDistrictData,IssuedDIDs,getEDistrictDataCronCollection} from '../models/models';
import logger from '../common/logger';
import axios from "axios";
import jwt from 'jsonwebtoken';
import { Db, UpdateResult } from "mongodb";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();


const signUp = async (req: Request, res: Response) => {
  try {
    const {Email,department,password} = req.body;

    if( !Email || !department || !password) {
      res.status(400).json({ error: 'Email, department, and password are required.'});
      return;
    }

      try {
        validateSignUp({Email, password });
      }catch (validationError) {
        const error = validationError as Error;
        res.status(400).json({ error: error.message});
        return;
       }
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const userCollection = getAdminUserCollection(db);
    const issuerAdminCol = getIssuerAdminCollection(db);
    
    const existingUser = await userCollection.findOne({email:Email});
    if (existingUser) {
      res.status(400).json({ error: 'Admin already exists.'});
      return;
    }

    const now = new Date();

    const existingIssuer = await issuerAdminCol.findOne({
      issuerEmail: Email,
    });
    if (!existingIssuer) {
      const newIssuerAdmin: IssuerAdmin = {
        issuerEmail: Email,
        status: 'pending',
        prevStatus:'pending',
        department: department,
        updatedAt: now,
      };
      await issuerAdminCol.insertOne(newIssuerAdmin);
    }
    const uniqueID = generateUniqueID();
    const hashedPassword = await bcrypt.hash(password, 10);

    const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('Encryption Error ');
      }
  
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: AdminUser = {
      uniqueID,
      email: Email,
      password: hashedPassword,
      createdAt: new Date(), 
      updatedAt: new Date(),
      isVerified: false 
    };

    await userCollection.insertOne(newUser);

    

    res.status(200).json({ 
      message: 'Your request sent for approval', 
    });
  } catch (error) {
    logger.error('Error in SignUp API',{error});
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



const login = async (req: Request, res: Response)=>{
  try {
    const {Email,password } = req.body;

    if (!Email || !password) {
      res.status(400).json({ error:'Email and password are required.'});
      return;
    }
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const userCollection = getAdminUserCollection(db);

    const adminUser = await userCollection.findOne({email:Email});
    if (!adminUser) {
      res.status(404).json({ error: 'adminUser not found.' });
      return;
    }

     const issuerAdminCol = getIssuerAdminCollection(db);
     const issuerRecord = await issuerAdminCol.findOne< IssuerAdmin >({issuerEmail: Email,});
     if (!issuerRecord) {
       res.status(403).json({ error: "Issuer Record Not Found" });
        return;
    }
    if (issuerRecord.status!=='approved') {
     res.status(403).json({ error: "Your approval is pending"});
      return;
     }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
       res.status(401).json({ error: 'Invalid credentials' });
       return;
    }
        
        const token = jwt.sign(
        {email: adminUser.email}, 
        process.env.JWT_SECRET as string,        
        {expiresIn: '1h' }                        
    );

    res.status(200).json({ message: 'Login successful!',
                           AuthToken:token,
                           IssuerDepartment: issuerRecord.department,
                          });
  } catch (error) {
    logger.error('Error in login API',{error});
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
    const adminCollection = getAdminUserCollection(db);


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
     const adminCollection = getAdminUserCollection(db);

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


const adminLogin = async (req: Request, res: Response) => {
         try {

          const email = (req as any).user?.email;
   
          if (!email) {
             res.status(400).json({ error: "Email is required" });
             return;
          }
      
          const client = await getClient();
          const db = client.db(process.env.DB_NAME);
          const userCollection = getAdminUserCollection(db);
      
          const admin = await userCollection.findOne({ email });
      
          if (!admin) {
             res.status(404).json({ error: "Admin not found" });
             return;
          }
           const apiUrl = process.env.ADMIN_ENROLL_API_URL||'';
           const adminSecret = process.env.ADMIN_SECRET||'';
           const payload = {
             id: "admin",
             secret:adminSecret
           };
       
           // Make the HTTP request using axios
           const response = await axios.post(apiUrl, payload, {
             headers: { "Content-Type": "application/json" },
           });
       
           const { token } = response.data;
       
           logger.info("Admin login successful", { token });
           res.json({ token });
       
         } catch (error) {
           logger.error("Error in adminLogin API", {error});
       
           if (axios.isAxiosError(error) && error.response) {
             res.status(error.response.status).json({ error: error.response.data });
             return;
           }
       
           res.status(500).json({ error: "Internal Server Error" });
         }
};


const registerUser = async (req: Request, res: Response) => {
         try {
           
           const token = req.headers.authorization?.split("Bearer ")[1];
       
           if (!token) {
             res.status(400).json({ error: "Missing required fields" });
             return;
           }

           const secret= process.env.USER_SECRET||'';
           const id = process.env.USER_ID||'';
           const apiUrl = process.env.USER_REGISTER_API_URL||'';
           const payload = { id, secret };
       
           const response = await axios.post(apiUrl, payload, {
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`, 
             },
           });
           res.json(response.data);
       
         } catch (error) {
           logger.error("Error in registerUser API", {error});
           if (axios.isAxiosError(error) && error.response) {
             res.status(error.response.status).json({ error: error.response.data });
             return;
           }
           res.status(500).json({ error: "Internal Server Error" });
         }
};



const registerSingleDID = async(req: Request, res: Response)=>{
         try {
          
           const {email,phoneNumber, data} = req.body;
        
           const token = req.headers.authorization?.split("Bearer ")[1];
           if (!email|| !phoneNumber || !data || !token) {
             res.status(400).json({ error: "Missing required fields" });
             return;
           }

          const client = await getClient();
           const db = client.db(process.env.DB_NAME);
           const adminCollection = getAdminUserCollection(db);
       
           const admin = await adminCollection.findOne({ email });
       
           if (!admin) {
              res.status(404).json({ error: "Issuer not found" });
              return;
           }
           const did = await generateUniqueDID();
           const jsonData = JSON.stringify(data);
       
           const apiUrl = process.env.CHAINCODE_INVOKE_API_URL||'';
       
           const payload = {
             method: "registerSingleDID",
             args: [email,phoneNumber, did, jsonData],
           };

          
           const response = await axios.post(apiUrl, payload, {
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`, 
             },
           });


           const didColl = getIssuedDIDcollection(db);
           const existingEntry = await didColl.findOne({ email });

           if (existingEntry) {
             // Check if DID already exists in array
             if (existingEntry.DIDs.includes(did)) {
              res.status(409).json({ error: "DID already exists for this email" });
              return;
            }

           // Update the document to push new DID
          await didColl.updateOne(
                  { email },
                  { $addToSet: { DIDs: did } } // `$addToSet` avoids duplicates automatically
           );
          } else {
          // Create new document for the email
          await didColl.insertOne({
           email,
            DIDs: [did],
          });
        }
    
    
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(did)}&size=150x150`;

          res.json({
            ...response.data,
            qrCodeUrl,
          });
       
         } catch (error) {
           logger.error("Error in registerSingleDID API", {error});
           if (axios.isAxiosError(error) && error.response) {
             res.status(error.response.status).json({ error: error.response.data });
             return;
           }
       
           res.status(500).json({ error: "Internal Server Error" });
         }
};



const registerBulkDIDs = async (req: Request, res: Response) => {
  try {
    
    const { email, data } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!email || !data || typeof data !== "object" || !token) {
       res.status(400).json({ error: "Missing required fields" });
       return;
    }

           const client = await getClient();
           const db = client.db(process.env.DB_NAME);
           const adminCollection = getAdminUserCollection(db);
       
           const admin = await adminCollection.findOne({ email });
       
           if (!admin) {
              res.status(404).json({ error: "Issuer not found" });
              return;
           }

    // Validate that `data` has the shape { phoneNumber: [obj, obj, …], … }
    for (const phoneNumber of Object.keys(data)) {
      const arr = data[phoneNumber];
      if (!Array.isArray(arr) || arr.some(item => typeof item !== "object" || item === null)) {
         res.status(400).json({
          error: `Invalid payload under "${phoneNumber}". Expected an array of objects.`
        });
        return;
      }
    }

    // 2) Build a new map: phoneNumber → { generatedDID: dataObj, … }
    const generatedMap: Record<string, Record<string, any>> = {};
    const allNewDIDs: string[] = [];

    for (const phoneNumber of Object.keys(data)) {
      const entries = data[phoneNumber] as Record<string, any>[];
      generatedMap[phoneNumber] = {};

      for (const entryData of entries) {
        // Generate a new DID for each entry
        const did = await generateUniqueDID();
        generatedMap[phoneNumber][did] = {
          ...entryData,
          createdAt: new Date().toISOString(),
          isRevoked: false,
          revokedAt: null,
          issuedBy: email,
          revokedBy: null,
        };
        allNewDIDs.push(did);
      }
    }

    // 3) Invoke chaincode with the JSON‐stringified generatedMap
    const apiUrl = process.env.CHAINCODE_INVOKE_API_URL || "";
    const payload = {
      method: "registerBulkDIDs",
      args: [email, JSON.stringify(generatedMap)],
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    // 4) Upsert into MongoDB collection 'issuedDIDs'
    const didColl = getIssuedDIDcollection(db);
    const existingEntry = await didColl.findOne({ email });
    if (existingEntry) {
      // Append new DIDs to the array, avoiding duplicates
      await didColl.updateOne(
        { email },
        { $addToSet: { DIDs: { $each: allNewDIDs } } }
      );
    } else {
      // Create a new document with all generated DIDs
      await didColl.insertOne({
        email,
        DIDs: allNewDIDs,
      });
    }
    // 5) Respond with chaincode result + list of generated DIDs
     res.json({
      ...response.data,
      registeredDIDs: allNewDIDs,
    });
  } catch (error) {
    logger.error("Error in registerBulkDIDs API", { error });
    if (axios.isAxiosError(error) && error.response) {
       res.status(error.response.status).json({ error: error.response.data });
       return;
    }
     res.status(500).json({ error: "Internal Server Error" });
  }
};



const registerFromEDistrict= async(req:Request,res:Response)=>{
  try{

    const { data } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
      res.status(400).json({ error: "Token Not Provided"});
      return;
    }

    if (!data || typeof data !== "object") {
       res.status(400).json({ error: "Missing or invalid 'data' object" });
       return;
    }

    const credentialSubject = data.credentialSubject;

    if (!credentialSubject || typeof credentialSubject !== "object") {
       res.status(400).json({ error: "'credentialSubject' missing or invalid" });
       return;
    }

    // Get the first key dynamically (e.g., casteCertificate, incomeCertificate, etc.)
    const [certificateKey] = Object.keys(credentialSubject);
    const certificateData = credentialSubject[certificateKey];

    if (!certificateData || typeof certificateData !== "object") {
       res.status(400).json({ error: "No valid certificate data found inside 'credentialSubject'" });
       return;
    }

    const phoneNumber = certificateData["Mobile Number"];
    if (!phoneNumber) {
       res.status(400).json({ error: "'Mobile Number' field is missing in certificate data" });
       return;
    }

    const did = await generateUniqueDID();
    const jsonData = JSON.stringify(data);

    const apiUrl = process.env.CHAINCODE_INVOKE_API_URL||'';

    const payload = {
      method: "registerSingleDID",
      args: [phoneNumber, did, jsonData],
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      },
    });

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(did)}&size=150x150`;

    res.json({
     ...response.data,
     qrCodeUrl,
   });


  }catch (error) {
    logger.error("Error in registerSingleDID API", {error});
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ error: error.response.data });
      return;
    }

    res.status(500).json({ error: "Internal Server Error" });
  }

}

const addDID = async (req: Request, res: Response) => {
         try {
           const { email,phoneNumber, data} = req.body;
           const token = req.headers.authorization?.split("Bearer ")[1];
           if (!email||!phoneNumber || !data || !token) {
             res.status(400).json({ error: "Missing required fields" });
             return;
           }
           const client = await getClient();
           const db = client.db(process.env.DB_NAME);
           const adminCollection = getAdminUserCollection(db);
       
           const admin = await adminCollection.findOne({ email });
       
           if (!admin) {
              res.status(404).json({ error: "Issuer not found" });
              return;
           }
           const did = await generateUniqueDID();
           const jsonData = JSON.stringify(data);
  
           const apiUrl = process.env.CHAINCODE_INVOKE_API_URL||'';
 
           const payload = {
             method: "addDID",
             args: [email,phoneNumber, did, jsonData],
           };
       
           const response = await axios.post(apiUrl, payload, {
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`, 
             },
           });

              const didColl = getIssuedDIDcollection(db);
              const existingEntry = await didColl.findOne({ email });

           if (existingEntry) {
             // Check if DID already exists in array
             if (existingEntry.DIDs.includes(did)) {
              res.status(409).json({ error: "DID already exists for this email" });
              return;
            }

           // Update the document to push new DID
          await didColl.updateOne(
                  { email },
                  { $addToSet: { DIDs: did } } // `$addToSet` avoids duplicates automatically
           );
          } else {
          // Create new document for the email
          await didColl.insertOne({
           email,
            DIDs: [did],
          });
        }
    
            
   
           const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(did)}&size=150x150`;

           res.json({
            ...response.data,
            qrCodeUrl,
          });

         } catch (error) {
           logger.error("Error in addDID API", {error}); 
           if (axios.isAxiosError(error) && error.response) {
             res.status(error.response.status).json({ error: error.response.data });
             return;
           }
       
           res.status(500).json({ error: "Internal Server Error" });
         }
};

const getIdentity = async (req: Request, res: Response) => {
         try {
           const { phoneNumber} = req.body;
           const token = req.headers.authorization?.split("Bearer ")[1];
           if (!phoneNumber || !token) {
             res.status(400).json({ error: "Missing required fields" });
             return
           }

           const apiUrl = process.env.CHAINCODE_INVOKE_API_URL||'';

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
           logger.error("Error in getIdentity API", {error});
   
           if (axios.isAxiosError(error) && error.response) {
             res.status(error.response.status).json({ error: error.response.data });
             return;
           }
       
           res.status(500).json({ error: "Internal Server Error" });
         }
};


const getAllDIDs = async (req: Request, res: Response) => {
         try {
          const token = req.headers.authorization?.split("Bearer ")[1];
             if (!token) {
              res.status(400).json({ error: "Authorization token is required" });
              return;
             }
     
             const payload= {
                  method: "getAllDIDs",
                  args: []
              }; 
             const apiUrl = process.env.CHAINCODE_INVOKE_API_URL||'';
             const response = await axios.post(apiUrl,payload,
                 {
                     headers: {
                         "Authorization": `Bearer ${token}`,
                         "Content-Type": "application/json"
                     }
                 }
             );
     
             res.status(200).json(response.data);
         } catch (error) {
             logger.error("Error in getAllDIDs API", { error });
     
             if (axios.isAxiosError(error) && error.response) {
                  res.status(error.response.status).json({ error: error.response.data });
                  return;
             }
     
             res.status(500).json({ error: "Internal Server Error" });
         }
};


const getOTPforRemoveCertificate = async (req: Request, res: Response) => {

  try {
    const email = (req as any).user?.email;
   
    if (!email) {
       res.status(400).json({ error: "Email is required" });
       return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const userCollection = getAdminUserCollection(db);

    const admin = await userCollection.findOne({ email });

    if (!admin) {
       res.status(404).json({ error: "User not found" });
       return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    const result = await sendOTPRemoveCertificate(email, otp);

    if (!result) {
       res.status(500).json({ error: "Failed to send OTP" });
       return;
    }

    await userCollection.updateOne(
      { email },
      { $set: { recentOTP: otp, otpExpiresAt } }
    );

 
     res.json({ message: "OTP sent successfully" });
  } catch (error) {
   
     res.status(500).json({ error: "Internal server error" });
  }

}


const revokeDID = async (req: Request, res: Response) => {
         try {
        
           const { phoneNumber, did,email, otp} = req.body;
           const token = req.headers.authorization?.split("Bearer ")[1];
        
           if (!phoneNumber || !did || !email || !otp || !token) {
             res.status(400).json({ error: "Missing required fields" });
             return;
           }
       
           const client = await getClient();
           const db = client.db(process.env.DB_NAME);
           const adminCollection = getAdminUserCollection(db);
       
           const admin = await adminCollection.findOne({ email });
       
           if (!admin) {
              res.status(404).json({ error: "Issuer not found" });
              return;
           }
       
           if (
             !admin.recentOTP ||
             admin.recentOTP !== otp ||
             !admin.otpExpiresAt ||
             new Date() > new Date(admin.otpExpiresAt)
           ) {
              res.status(401).json({ error: "Invalid or expired OTP" });
              return;
           }
       
        
           await adminCollection.updateOne(
             { email },
             { $set: { recentOTP: null, otpExpiresAt: undefined } }
           );
          
           const apiUrl = process.env.CHAINCODE_INVOKE_API_URL||'';
       
           const payload = {
             method: "revokeDID",
             args: [email,phoneNumber, did],
           };
       
          
           const response = await axios.post(apiUrl, payload, {
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`, 
             },
           });

           const revokedColl = getRevokedDIDcollection(db);
           const existing = await revokedColl.findOne({ email });

          if (existing) {
          // Add to set (avoid duplicates)
          await revokedColl.updateOne(
           { email },
          { $addToSet: { DIDs: did } }
         );
         } else {
           // Create new document
           await revokedColl.insertOne({
            email,
            DIDs: [did],
          });
        }
          
           res.json(response.data);
       
         } catch (error) {
             logger.error("Error in removeDID API", {error});
             if (axios.isAxiosError(error) && error.response) {
             res.status(error.response.status).json({ error: error.response.data });
             return;
           }
            res.status(500).json({ error: "Internal Server Error" });
         }
};


const revokeMultipleDIDs = async (req: Request, res: Response) => {
  try {
    // 1) Extract fields from request body
    const { email, dids, otp } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    // Validate: email, an array of strings, otp, and token must all be present
    if (
      !email ||
      !Array.isArray(dids) ||
      dids.some((d) => typeof d !== "string") ||
      !otp ||
      !token
    ) {
       res
        .status(400)
        .json({ error: "Missing or invalid required fields" });
        return;
    }

    // 2) Verify admin & OTP
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const adminCollection = getAdminUserCollection(db);

    const admin = await adminCollection.findOne({ email });
    if (!admin) {
       res.status(404).json({ error: "Issuer not found" });
       return;
    }

    if (
      !admin.recentOTP ||
      admin.recentOTP !== otp ||
      !admin.otpExpiresAt ||
      new Date() > new Date(admin.otpExpiresAt)
    ) {
       res.status(401).json({ error: "Invalid or expired OTP" });
       return;
    }

    // Clear the OTP fields
    await adminCollection.updateOne(
      { email },
      { $set: { recentOTP: null, otpExpiresAt: undefined } }
    );

    // 3) Call chaincode with [ email, JSON‐stringified array ]
    const bulkJson = JSON.stringify(dids);
    const apiUrl = process.env.CHAINCODE_INVOKE_API_URL || "";
    const payload = {
      method: "revokeMultipleDIDs",
      args: [email, bulkJson],
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // 4) Update our MongoDB “revokedDIDs” collection
    const revokedColl = getRevokedDIDcollection(db);
    const existing = await revokedColl.findOne({ email });

    if (existing) {
      // Add to set so we don’t insert duplicates
      await revokedColl.updateOne(
        { email },
        { $addToSet: { DIDs: { $each: dids } } }
      );
    } else {
      await revokedColl.insertOne({
        email,
        DIDs: dids,
      });
    }

    // 5) Respond with chaincode result + list of revoked DIDs
     res.json({
      ...response.data,
      revokedDIDs: dids,
    });
  } catch (error) {
    logger.error("Error in revokeMultipleDIDs API", { error });
    if (axios.isAxiosError(error) && error.response) {
       res
        .status(error.response.status)
        .json({ error: error.response.data });
        return;
    }
     res.status(500).json({ error: "Internal Server Error" });
     return;
  }
};

const getRevokedDIDs = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
       res.status(400).json({ error: "Missing Authorization header" });
       return;
    }

    // 1) Call chaincode with no args
    const apiUrl = process.env.CHAINCODE_INVOKE_API_URL || "";
    const payload = {
      method: "getRevokedDIDs",
      args: [],
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // 2) Forward chaincode response directly to client
     res.json(response.data);
  } catch (error) {
    logger.error("Error in getRevokedDIDs API", { error });
    if (axios.isAxiosError(error) && error.response) {
       res
        .status(error.response.status)
        .json({ error: error.response.data });
        return;
    }
     res.status(500).json({ error: "Internal Server Error" });
  }
};

const getActiveDIDs = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) {
       res.status(400).json({ error: "Missing Authorization header" });
       return;
    }

    // 1) Invoke chaincode with no arguments
    const apiUrl = process.env.CHAINCODE_INVOKE_API_URL || "";
    const payload = {
      method: "getActiveDIDs",
      args: [],
    };

    const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // 2) Forward the chaincode response back to the client
     res.json(response.data);
  } catch (error) {
    logger.error("Error in getActiveDIDs API", { error });
    if (axios.isAxiosError(error) && error.response) {
       res
        .status(error.response.status)
        .json({ error: error.response.data });
        return;
    }
     res.status(500).json({ error: "Internal Server Error" });
  }
};

const getIssuedCertificates = async (req: Request, res: Response) => {
  try {
    // 1) Extract email from authenticated user
    const email = (req as any).user?.email;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // 2) Connect to Mongo
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const issuedCollection = getIssuedDIDcollection(db);

    // 3) Since each document has a single array field "DIDs", fetch that one document:
    const issuedDoc = await issuedCollection.findOne(
      { email },
      { projection: { DIDs: 1, _id: 0 } }
    );

    // 4) If no document exists, default to an empty array
    const didList: string[] = issuedDoc?.DIDs ?? [];

    // 5) Build response
    const responsePayload: IssuedDIDs = {
      email,
      DIDs: didList,
    };

    res.status(200).json(responsePayload);
  } catch (error) {
    logger.error("Error in getIssuedCertificates API", { error });
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ error: error.response.data });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllIssuedCertificates = async (req: Request, res: Response) => {
  try {
     const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const issuedCollection = getIssuedDIDcollection(db);

    //  Aggregate by email: group documents by `email`, and collect all `did` values into an array.
    //  If our schema stores the DID under a different field name (e.g. `DID`), replace `$did` accordingly.
    const aggregationPipeline = [
      {
        $group: {
          _id: "$email",
          DIDs: { $push: "$did" }
        }
      },
      {
        $project: {
          _id: 0,
          email: "$_id",
          DIDs: 1
        }
      }
    ];

    const cursor = issuedCollection.aggregate<{ email: string; DIDs: string[] }>(aggregationPipeline);
    const results = await cursor.toArray();

    // results is now an array of objects: { email: "...", DIDs: ["did1", "did2", ...] }
    // We can directly return this array.
    res.status(200).json(results);
  }catch (error) {
    logger.error("Error in getIssuedCertificates API", { error });
    if (axios.isAxiosError(error) && error.response) {
       res
        .status(error.response.status)
        .json({ error: error.response.data });
        return;
    }
     res.status(500).json({ error: "Internal Server Error" });
  }
}


const getRevokedCertificates = async (req: Request, res: Response) => {
   try {
     const email = (req as any).user?.email;
   
          if (!email) {
             res.status(400).json({ error: "Email is required" });
             return;
          }
      
          const client = await getClient();
          const db = client.db(process.env.DB_NAME);
          const revokedCollection = getRevokedDIDcollection(db);
           const revokedDocs = await revokedCollection.findOne(
      { email },
      { projection: { DIDs: 1, _id: 0 } }
    );

         
        const didList: string[] = revokedDocs?.DIDs ?? [];

    
        const responsePayload: RevokedDIDs = {
         email,
         DIDs: didList,
       };

   
       res.status(200).json(responsePayload);


  } catch (error) {
    logger.error("Error in getRevokedCertificates API", { error });
    if (axios.isAxiosError(error) && error.response) {
       res
        .status(error.response.status)
        .json({ error: error.response.data });
        return;
    }
     res.status(500).json({ error: "Internal Server Error" });
  }
}





const queryDID = async (req: Request, res: Response) => {
         try {
         
           const { phoneNumber, did } = req.body;
           const token = req.headers.authorization?.split("Bearer ")[1];

           if (!phoneNumber || !did || !token) {
              res.status(400).json({ error: "Missing required fields" });
              return;
           }

           const apiUrl = process.env.CHAINCODE_INVOKE_API_URL||'';
       
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
           logger.error("Error in queryDID API", {error});
       
           
           if (axios.isAxiosError(error) && error.response) {
              res.status(error.response.status).json({ error: error.response.data });
              return;
           }
       
           res.status(500).json({ error: "Internal Server Error" });
         }
};

 

const insertEDistrictDataBulk = async (req: Request, res: Response) => {
   try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.some(item => typeof item !== "object" || item === null)) {
       res.status(400).json({ error: "Request body must contain an array of objects in `data`." });
       return;
    }

    const client = await getClient();
    const db: Db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCollection(db);
    const now = new Date();

    // 1. Deep sort any nested JSON
    const deepSort = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(deepSort).sort((a, b) =>
          JSON.stringify(a).localeCompare(JSON.stringify(b))
        );
      } else if (obj && typeof obj === "object") {
        return Object.keys(obj)
          .sort()
          .reduce((acc, key) => {
            acc[key] = deepSort(obj[key]);
            return acc;
          }, {} as Record<string, any>);
      }
      return obj;
    };

    // 2. Normalize = Deep sort + Stringify
    const normalize = (obj: Record<string, any>): string => {
      return JSON.stringify(deepSort(obj));
    };

    // Strip system fields (like insertedAt, status)
    const extractUserFields = (doc: Record<string, any>) => {
      const { status,issueID,insertedAt, ...userData } = doc;
      return userData;
    };

    // Pull only user field projections from DB (not insertedAt/status)
    const existingDocsCursor = collection.find({}, {
     projection: { _id: 0, insertedAt: 0, status: 0, issueID: 0 }
    });
    const existingDocs = await existingDocsCursor.toArray();
    const existingSet = new Set(existingDocs.map(normalize));

    // Filter new data
    const seen = new Set<string>();
    const docsToInsert: EDistrictData[] = [];

    for (const d of data) {
      const fullDoc = {
        ...d,
        status: "pending",
        insertedAt: now,
      };

      const userDataOnly = extractUserFields(fullDoc);
      const fingerprint = normalize(userDataOnly);

      if (!seen.has(fingerprint) && !existingSet.has(fingerprint)) {
        docsToInsert.push(fullDoc);
        seen.add(fingerprint);
      }
    }

    if (docsToInsert.length === 0) {
       res.status(200).json({
        message: "No new data to insert. All entries are duplicates.",
        insertedCount: 0,
        skippedCount: data.length,
      });
      return;
    }

    const result = await collection.insertMany(docsToInsert);

     res.status(200).json({
      message: "Bulk insert successful (excluding duplicates)",
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
      skippedCount: data.length - docsToInsert.length,
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
         const { phoneNumber,issueID } = req.body;

         if (!phoneNumber) {
           res.status(400).json({ error: "Missing phoneNumber in request body" });
           return;
         }

        const client = await getClient();
        const db = client.db(process.env.DB_NAME);
        const collection = getEDistrictDataCollection(db);

    // Update the document with this phoneNumber, setting status to "rejected"
      const result = await collection.updateOne(
        { phoneNumber,issueID},
        { $set: { status: "rejected" } }
      );

    if (result.matchedCount === 0) {
       res.status(404).json({ message: "No document found with the provided phoneNumber" });
       return;
    }

    res.status(200).json({
      message: "Status updated to rejected",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Error updating eDistrict data", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const updateEDistrictData = async (req: Request, res: Response) => {
        try {
       const { phoneNumber,issueID} = req.body;

    if (!phoneNumber) {
       res.status(400).json({ error: "Missing phoneNumber in request body"});
       return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCollection(db);

    // Update the document with this phoneNumber, setting status to "rejected"
    const result = await collection.updateOne(
      { phoneNumber,issueID},
      { $set: { status: "issued" } }
    );

    if (result.matchedCount === 0) {
       res.status(404).json({ message: "No document found with the provided phoneNumber" });
       return;
    }

    res.status(200).json({
      message: "Status updated to rejected",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Error updating eDistrict data", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getDepartmentCertificateTypes = async (req: Request, res: Response) => {
  try {
    const { department } = req.body;
    
    // Validate that department is provided
    if (!department) {
       res.status(400).json({
        status: 400,
        error: true,
        message: "Department is required"
      });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const departmentDataCollection = getDepartmentDataCollection(db);

    
    const departmentData = await departmentDataCollection.findOne<DepartmentData>({ department });

    if (!departmentData) {
       res.status(404).json({
        status: 404,
        error: true,
        message: `Department '${department}' not found`
      });
      return;
    }

    res.status(200).json({
      status: 200,
      error: false,
      department,
      certificateTypes: departmentData.certificateType
    });
    
  } catch (error) {
    logger.error("Error in getDepartmentCertificateTypes API", { error });
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
    const db: Db = client.db(process.env.DB_NAME);
    const collection = getDepartmentDataCollection(db);

    // Fetch only the `department` field, exclude `_id` and `certificateType`
    const departments = await collection
      .find({}, { projection: { _id: 0, department: 1 } })
      .toArray();

    const departmentList = departments.map((doc) => doc.department);

    res.status(200).json({
      message: "Departments fetched successfully",
      departments: departmentList,
    });
  } catch (error) {
    logger.error("Error in getAllDepartment API", { error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};


 const getEDistrictCronData = async (req: Request, res: Response)=>{
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCronCollection(db);
    const data = await collection.find().sort({ insertedAt: -1 }).toArray();
    
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching eDistrictDataCron:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};


const rejectEDistrictCronData = async (req: Request, res: Response) => {
 try {
    const { mobileNumber, certificateName } = req.body;

    if (!mobileNumber || !certificateName) {
       res.status(400).json({
        success: false,
        error: "Both mobileNumber and certificateName are required",
      });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCronCollection(db);

    const result = await collection.updateMany(
      {
        [`credentialSubject.${certificateName}.Mobile Number`]: mobileNumber
      },
      { $set: { status: "rejected" } }
    );

    res.json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      message: `Marked ${result.modifiedCount} document(s) with '${certificateName}' as 'rejected'.`,
    });
  } catch (error) {
    console.error("Error rejecting data:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



const updateEDistrictCronData = async(req:Request,res:Response)=>{
    try {
    const { mobileNumber, certificateName } = req.body;

    if (!mobileNumber || !certificateName) {
       res.status(400).json({ success: false, error: "Both mobileNumber and certificateName are required" });
       return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const collection = getEDistrictDataCronCollection(db);

    const result = await collection.updateMany(
      {
        status: { $ne: "rejected" },
        [`credentialSubject.${certificateName}.Mobile Number`]: mobileNumber
      },
      { $set: { status: "issued" } }
    );

    res.json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      message: `Marked ${result.modifiedCount} document(s) with '${certificateName}' as 'issued'.`,
    });
  } catch (error) {
    console.error("Error issuing data:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}


     

export default {
         login,
         signUp,
         forgotPassword,
         resetPassword,
         adminLogin,
         registerSingleDID,
         registerBulkDIDs,
         registerFromEDistrict,
         addDID,
         getIdentity,
         getAllDIDs,
         getOTPforRemoveCertificate,
         revokeDID,
         revokeMultipleDIDs,
         insertEDistrictDataBulk,
         queryDID,
         getIssuedCertificates,
         getAllIssuedCertificates,
         getRevokedCertificates,
         getRevokedDIDs,
         getActiveDIDs,
         registerUser,
         getEDistrictData,
         rejectEDistrictData,
         updateEDistrictData,
         getDepartmentCertificateTypes,
         getAllDepartments,
         getEDistrictCronData,
         rejectEDistrictCronData,
         updateEDistrictCronData
      };

      

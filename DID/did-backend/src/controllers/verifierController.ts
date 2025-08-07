import { Request, Response } from 'express';
import { getClient } from '../connections/connection';
import{validateSignUp,validatePassword} from '../helpers/helper';
import {sendOTPResetPassword} from '../helpers/email.helper';
import {getVerifierCollection,VerifierUser,getVerifierAccessCollection ,VerifierAccess} from '../models/models';
import logger from '../common/logger';
import axios from "axios";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
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
                  const verifierCollection = getVerifierCollection(db);
              
                  const existingVerifier = await verifierCollection.findOne({verifierEmail:Email });
                  if (existingVerifier) {
                     res.status(400).json({ error: "Verifier already exists." });
                     return;
                  }
              
                  const verifierAccessCollection = getVerifierAccessCollection(db);
                  const hashedPassword = await bcrypt.hash(password, 10);
              
                  const now = new Date();
              
                  const newVerifier: VerifierUser = {
                    verifierEmail: Email,
                    password: hashedPassword,
                    isVerified: false,
                    createdAt: now,
                    updatedAt: now,
                  };

                  const newVerifierAccess:VerifierAccess={
                    verifierEmail: Email,
                    did: [],
                    status: 'pending', 
                    prevStatus:'pending',
                    createdAt: now,
                  };
              
                  await verifierCollection.insertOne(newVerifier);
                  await verifierAccessCollection.insertOne(newVerifierAccess);


                  res.status(200).json({
                    message: "Verifier SignUP Sucessful",
                  });

                  
                } catch (error) {
                  logger.error("Error in verifierSignUp API", { error });
                  res.status(500).json({ error: "Internal Server Error" });
                   
                }

}

const login = async(req:Request,res:Response)=>{
         try {
           const {email,password } = req.body;
              
                  if (!email || !password) {
                    res.status(400).json({ error:'email and password are required.'});
                    return;
                  }
                  const client = await getClient();
                  const db = client.db(process.env.DB_NAME);
                  const userCollection = getVerifierCollection(db);
                  const verifierAccessCollection = getVerifierAccessCollection(db);
                  const verifier = await userCollection.findOne({verifierEmail:email});
                  const verifierAccess = await verifierAccessCollection.findOne({verifierEmail:email});

                  if (!verifier) {
                    res.status(404).json({ error: 'Verifer not found.' });
                    return;
                  }

                  if (!verifierAccess) {
                    res.status(404).json({ error: 'Verifier access not found.' });
                    return;
                  }

                  if(verifierAccess.status === 'pending'||verifierAccess.status === 'rejected'){
                     res.status(403).json({ error: 'Your account is not approved for Login' });
                     return;
                  }
              

                  const isPasswordValid = await bcrypt.compare(password, verifier.password);
                  if (!isPasswordValid) {
                     res.status(401).json({ error: 'Invalid credentials.' });
                     return;
                  }
                    
                
                  const token = jwt.sign(
                      {email: verifier.verifierEmail }, 
                      process.env.JWT_SECRET as string,        
                      {expiresIn: '1h' }                        
                  );
              
                
                  res.status(200).json({ message: 'Login successful!',
                                         AuthToken:token
                                        });
                } catch (error) {
                  logger.error('Error in login API',{error});
                  res.status(500).json({ error: 'Internal Server Error' });
                }
}

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const {email} = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required.' });
      return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME);
    const verifierCollection = getVerifierCollection(db);


    const admin = await verifierCollection.findOne({verifierEmail:email});
    if (!admin) {
      res.status(404).json({ error: 'Verifier Not Found' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    
    await verifierCollection.updateOne(
      { verifierEmail:email },
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
     const verifierCollection = getVerifierCollection(db);

    const admin = await verifierCollection.findOne({ verifierEmail:email,recentOTP:otp });
    if (!admin || !admin.otpExpiresAt || new Date() > new Date(admin.otpExpiresAt)) {
      res.status(400).json({ error: 'Invalid or expired OTP.' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await verifierCollection.updateOne(
      { verifierEmail:email },
      { 
        $set: { 
          password: hashedPassword, 
          updatedAt: new Date(), 
          recentOTP: null, 
          otpExpiresAt: undefined 
        } 
      }
    );
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    logger.error('Error in resetPassword API', { error });
    res.status(500).json({ message: 'Internal Server Error'});
  }
}



const verifierLogin = async (req: Request, res: Response) => {
         try {
           const apiUrl = process.env.VERIFIER_ENROLL_API_URL||'';
           const veriferiSecret = process.env.VERIFIER_SECRET||'';
       
           const payload = {
             id: "admin",
             secret: veriferiSecret
           };
       
           const response = await axios.post(apiUrl, payload, {
             headers: { "Content-Type": "application/json" },
           });
       
           const { token } = response.data;
       
           logger.info("Verifier login successful");
           res.json({ token });
       
         } catch (error) {
           logger.error("Error in verifierLogin API", {error});
       
           if (axios.isAxiosError(error) && error.response) {
             res.status(error.response.status).json({ error: error.response.data });
             return;
           }
       
           res.status(500).json({ error: "Internal Server Error" });
         }
       };

const getAccessedDIDs = async (req: Request, res: Response) => {
         try {
                  const { verifierEmail } = req.body;
              
                  if (!verifierEmail) {
                   res.status(400).json({ error: "Missing verifierEmail in request body" });
                   return;
                  }
              
                  const client = await getClient();
                  const db = client.db(process.env.DB_NAME);
                  const verifierAccessCollection = getVerifierAccessCollection(db);
              
                  const existingVerifierAccess = await verifierAccessCollection.findOne({verifierEmail});
              
                  if (!existingVerifierAccess) {
                     res.status(404).json({ error: `Verifier email '${verifierEmail}' not found` });
                     return;
                  }
              
                
                   res.status(200).json({ dids: existingVerifierAccess.did });
                } catch (error) {
                  logger.error("Error in getAccessedDIDs API", { error });
                  res.status(500).json({ error: "Internal Server Error" });
                }

}

const getAccessedDIDDetails= async(req:Request,res:Response)=>{
         try {
                  const { did, verifierEmail } = req.body;
                  const token = req.headers.authorization?.split("Bearer ")[1];
              
                
                  if (!did || !verifierEmail || !token) {
                     res.status(400).json({ error: "Missing DID, verifierEmail or Authorization token" });
                     return;
                  }
              
                  const client = await getClient();
                  const db = client.db(process.env.DB_NAME);
                  const verifierAccessCollection = getVerifierAccessCollection(db);
              
                 
                  const existingVerifierAccess = await verifierAccessCollection.findOne({ verifierEmail });
              
                  if (!existingVerifierAccess) {
                     res.status(404).json({ error: `Verifier email '${verifierEmail}' not found` });
                     return;
                  }
              
                 
                  if (!existingVerifierAccess.did.includes(did)) {
                     res.status(403).json({ error: `DID '${did}' is not accessible for verifier '${verifierEmail}'` });
                     return;
                  }
              
                  
                  const apiUrl = process.env.CHAINCODE_INVOKE_VERIFIER_API_URL || "";
              
                  const payload = {
                    method: "getDIDDetails",
                    args: [did],
                  };
              
                  const response = await axios.post(apiUrl, payload, {
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  });
              
                   res.json(response.data);
                } catch (error) {
                  logger.error("Error in getAccessedDIDDetails API", { error });
                  if (axios.isAxiosError(error) && error.response) {
                     res.status(error.response.status).json({ error: error.response.data });
                     return;
                  }
              
                   res.status(500).json({ error: "Internal Server Error" });
                }
}

 const getDIDDetails = async (req: Request, res: Response) => {
         try {
           const { did } = req.body;
           const token = req.headers.authorization?.split("Bearer ")[1];
       
           if (!did || !token) {
              res.status(400).json({ error: "Missing DID or Authorization token" });
              return;
           }
       
           const apiUrl = process.env.CHAINCODE_INVOKE_VERIFIER_API_URL || "";
       
           const payload = {
             method: "getDIDDetails",
             args: [did],
           };
       
           const response = await axios.post(apiUrl, payload, {
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`,
             },
           });
       
            res.json(response.data);
         } catch (error) {
           logger.error("Error in getDIDDetails API", { error });
           if (axios.isAxiosError(error) && error.response) {
              res.status(error.response.status).json({ error: error.response.data });
              return;
           }
       
            res.status(500).json({ error: "Internal Server Error" });
            return;
         }
};


 const getMultipleDIDDetails = async (req: Request, res: Response) => {
         try {
       
           const { dids } = req.body;
           const token = req.headers.authorization?.split("Bearer ")[1];
       
           if (!Array.isArray(dids) || !token) {
              res.status(400).json({ error: "Missing or invalid DIDs array or Authorization token" });
              return;
           }
       
           const apiUrl = process.env.CHAINCODE_INVOKE_VERIFIER_API_URL || "";
       
           const didsJsonString = JSON.stringify(dids); 
       
           const payload = {
             method: "getMultipleDIDDetails",
             args: [didsJsonString],
           };
       
           const response = await axios.post(apiUrl, payload, {
             headers: {
               "Content-Type": "application/json",
               Authorization: `Bearer ${token}`,
             },
           });
       
           res.json(response.data);
         } catch (error) {
           logger.error("Error in getMultipleDIDDetails API", { error });
           if (axios.isAxiosError(error) && error.response) {
              res.status(error.response.status).json({ error: error.response.data });
              return;
           }
       
            res.status(500).json({ error: "Internal Server Error" });
            return;
         }
       };

const getAllDIDs = async(req:Request,res:Response)=>{
  try {
    const { verifierEmail } = req.body;

    if (!verifierEmail || typeof verifierEmail !== "string") {
       res.status(400).json({ error: "Missing or invalid 'verifierEmail'" });
       return;
    }

    const client = await getClient();
    const db= client.db(process.env.DB_NAME);
    const collection = getVerifierAccessCollection(db);

    const record = await collection.findOne({ verifierEmail });

    if (!record) {
       res.status(404).json({ error: "Verifier not found" });
       return;
    }

     res.status(200).json({ dids: record.did || [] });

  } catch (error) {
    console.error("Error fetching verifier DIDs:", error);
     res.status(500).json({ error: "Internal Server Error" });
  }
}    
  

export default {
         signUp,
         login,
         forgotPassword,
         resetPassword,
         verifierLogin,
         getAccessedDIDs,
         getAccessedDIDDetails,
         getDIDDetails,
         getMultipleDIDDetails,
         getAllDIDs
      };

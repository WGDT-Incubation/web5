import { getClient } from "../connections/connection";
import { getDidCollection } from "../models/models";
import { Db } from "mongodb";
import Joi from 'joi';
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';

dotenv.config(); 

/**
 * Generates a unique 7-digit DID and ensures it is not already stored in MongoDB.
 */
export const generateUniqueDID = async ()=> {
         const client = await getClient();
         const db: Db = client.db(process.env.DB_NAME);
         const didCollection = getDidCollection(db);
       
         let uniqueDID: string = ""; // ✅ Initialize with an empty string
         let isUnique = false;
       
         while (!isUnique) {
           // Generate a 7-digit random number
           uniqueDID = Math.floor(1000000 + Math.random() * 9000000).toString();
       
           // Check if this DID already exists in the database
           const existingDID = await didCollection.findOne({ did: uniqueDID });
       
           if (!existingDID) {
             isUnique = true;
           }
         }
       
         await didCollection.insertOne({
           did: uniqueDID,
           createdAt: new Date(),
           updatedAt: new Date(),
         });
       
         return uniqueDID;
};

export const generateUniqueID = (): string => {
  return randomBytes(8).toString('hex');
};
 

const passwordValidation = Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:\'",.<>\\/?]).{8,}$'))
    .required()
    .messages({
        'string.empty': 'Password is required.',
        'string.pattern.base':
            'Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    });

const emailValidation = Joi.string().email().required().messages({
         'string.empty': 'Email is required.',
         'string.email': 'Email must be a valid email address.',
     })

const signUpSchema = Joi.object({
   
    Email:emailValidation,
    password: passwordValidation,   
});


export const validateSignUp = (data: {Email: string; password: string }) => {
    const { error } = signUpSchema.validate(data, { abortEarly: false });
    if (error) {
        // Map errors into an array of messages
        const messages = error.details.map((err) => err.message);
        throw new Error(messages.join(', '));
    }
};

export const validatePassword = (password: string) => {
    const { error } = passwordValidation.validate(password);
    if (error) {
        throw new Error(error.message);
    }
};

export const validateEmail=(email:string)=>{
         const {error}= emailValidation.validate(email);
         if(error){
           throw new Error(error.message);
         }
}

/**
 * Generate a numeric OTP of given length
 * @param length - Length of the OTP (default is 6)
 * @returns {string} - Generated OTP as a string
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

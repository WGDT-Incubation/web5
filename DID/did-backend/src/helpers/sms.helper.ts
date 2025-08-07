import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { Twilio } from "twilio";


dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM = process.env.TWILIO_FROM || "";

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    throw new Error(
        "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or TWILIO_FROM env vars",
    );
}
const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);


/**
 * Send a simple plain-text OTP email
 * @param Email - User's email
 * @param OTP - One-Time Password
 * @returns {Promise<number>} - Returns 1 if sent, else returns 0
 */
export async function sendOTPUserLogin(Number: string, OTP: number): Promise<number> {
    try {
        if (!Number||!OTP) {
            console.log({ message: "Phone Number & OTP is required" });
            return 0;
        }
        const body = `Your DID OTP is ${OTP}`
        const msg = await client.messages.create({
            body,
            from: TWILIO_FROM, // US long-code; will be re-written to 5-digit short-code
            to: `+91${Number}`,
          });
          console.log(`✅  Message queued. SID: ${msg.sid}`);
        return 1;
    } catch (error) {
        console.log("Error sending User login otp SMS:", error);
        return 0;
    }
}





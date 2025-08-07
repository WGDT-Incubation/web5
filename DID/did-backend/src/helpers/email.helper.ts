import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

/**
 * Send a simple plain-text OTP email
 * @param Email - User's email
 * @param OTP - One-Time Password
 * @returns {Promise<number>} - Returns 1 if sent, else returns 0
 */
export async function sendOTPRemoveCertificate(Email: string, OTP: string): Promise<number> {
  try {
    if (!Email) {
      console.log({ message: "Email is required" });
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Your OTP Code',
      text: `Dear Issuer,\n\nYour OTP for Deleting Certificate is : ${OTP}\n\nThis OTP is valid for 10 minutes.\nDo not share it with anyone.\n\n-`,
    };

    await sgMail.send(msg);
    console.log({ message: "Simple OTP email sent successfully" });
    return 1;
  } catch (error) {
    console.log("Error sending simple OTP email:", error);
    return 0;
  }
}

export async function sendOTPVerificationEmail(Email: string, OTP: string): Promise<number> {
  try {
    if (!Email) {
      console.log({ message: "Email is required" });
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Email Verification OTP',
      text: `Dear Issuer,\n\nYour OTP for Email Verification is : ${OTP}\n\nThis OTP is valid for 10 minutes.\nDo not share it with anyone.\n\n-`,
    };

    await sgMail.send(msg);
    console.log({ message: "Simple OTP email sent successfully" });
    return 1;
  } catch (error) {
    console.log("Error sending simple OTP email:", error);
    return 0;
  }
}


export async function sendOTPResetPassword(Email: string, OTP: string): Promise<number> {
  try {
    if (!Email) {
      console.log({ message: "Email is required" });
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Reset Password OTP',
      text: `,\n\nYour OTP for Resetting Password is : ${OTP}\n\nThis OTP is valid for 10 minutes.\nDo not share it with anyone.\n\n-`,
    };

    await sgMail.send(msg);
    console.log({ message: "Simple OTP email sent successfully" });
    return 1;
  } catch (error) {
    console.log("Error sending simple OTP email:", error);
    return 0;
  }
}


export async function sendGenerateUserLoginOtp(Email: string, OTP: string): Promise<number> {
  try {
    if (!Email||!OTP) {
      console.log({ message: "Email and Otp is required" });
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Email Verification OTP',
      text: `Dear User,\n\nYour OTP for Email Login is : ${OTP}\n\nThis OTP is valid for 10 minutes.\nDo not share it with anyone.\n\n-`,
    };

    await sgMail.send(msg);
    console.log({ message: "Generate User Login OTP email sent successfully" });
    return 1;
  } catch (error) {
    console.log("Error sending generate user login OTP email:", error);
    return 0;
  }
}


export async function sendAddIssuerApprovalEmail(Email: string): Promise<number> {
  try {
    if (!Email) {
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Access Granted as Issuer',
      text: `Dear Issuer,\n\n You have been granted the role of issuer. \n\nYou can start issuing certificates to users. \nDo not share this email with anyone.\n\n-`,
    };

    await sgMail.send(msg);
    console.log({ message: "Generate User Login OTP email sent successfully" });
    return 1;
  } catch (error) {
    console.log("Error sending generate user login OTP email:", error);
    return 0;
  }
}

export async function sendAddVerifierApprovalEmail(Email: string): Promise<number> {
  try {
    if (!Email) {
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Access Granted as Verifier',
      text: `Dear Verifier,\n\n You have been granted the role of Verifier. \n\nYou can start verifing certificates of users. \nDo not share this email with anyone.\n\n-`,
    };
    await sgMail.send(msg);
    return 1;
  } catch (error) {
    return 0;
  }
}




export async function sendRevokeIssuerEmail(Email: string): Promise<number> {
  try {
    if (!Email) {
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Access Revoked as Issuer',
      text: `Dear Issuer,\n\nYour issuer access has been revoked indefinitely wef this moment . \n\nYou are to no longer issue any kind of document.\n\nDo not share this email with anyone.\n\n-`,
    };

    await sgMail.send(msg);
    return 1;
  } catch (error) {
    return 0;
  }
}

export async function sendRevokeVerifierEmail(Email: string): Promise<number> {
  try {
    if (!Email) {
      return 0;
    }

    const msg = {
      to: Email,
      from: String(process.env.SENDGRID_API_FROM_EMAIL),
      subject: 'DID: Access Revoked as Verifier',
      text: `Dear Issuer,\n\nYour Verifier access has been revoked indefinitely from this moment . \n\nYou are to no longer verify any kind of document.\n\nDo not share this email with anyone.\n\n-`,
    };

    await sgMail.send(msg);
    return 1;
  } catch (error) {
    return 0;
  }
}

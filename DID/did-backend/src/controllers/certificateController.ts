import { Request, Response } from 'express';
import { getClient } from '../connections/connection';
import { getCertificateDataCollection, CertificateData } from '../models/models';
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();
interface DynamicKey { param: string; type: "string"; }
interface TableKey { param: string; type: "array"; }

type BaseKey = DynamicKey | TableKey;

const getIndustrialCertificateTemplate = (req: Request, res: Response) => {

  const params = {
    name: 'name',
    surname: 'surname',
    date: 'date',
    did: 'did',
  }
  const certificatePreviewHTML = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate of Achievement</title>
  <link rel="preconnect" href="https://fonts.gstatic.com" />
  <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
  <style>
    body { margin: 0; padding: 0; background-color: #F6F8FA; font-family: 'Arial', sans-serif; }
    .certificate-container { position: relative; width: 1000px; height: 700px; margin: 50px auto; background: #FFF; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .shape-orange-top-left { position: absolute; top: 0; left: 0; width: 300px; height: 300px; background: #F16B1B; transform: translate(-20%, -20%) rotate(-20deg); z-index: 1; }
    .shape-orange-bottom-right { position: absolute; bottom: 0; right: 0; width: 300px; height: 300px; background: #F16B1B; transform: translate(20%, 20%) rotate(20deg); z-index: 1; }
    .shape-blue-top-right { position: absolute; top: 0; right: 0; width: 250px; height: 250px; background: #0F70B7; transform: translate(30%, -30%) rotate(30deg); z-index: 2; }
    .shape-blue-bottom-left { position: absolute; bottom: 0; left: 0; width: 250px; height: 250px; background: #0F70B7; transform: translate(-30%, 30%) rotate(-30deg); z-index: 2; }
    .certificate-content { position: relative; z-index: 10; width: 80%; height: 100%; margin: 0 auto; text-align: center; padding-top: 80px; box-sizing: border-box; }
    .certificate-title { font-family: "Times New Roman", serif; font-size: 48px; color: #0F70B7; font-weight: bold; letter-spacing: 2px; margin: 0; }
    .certificate-subtitle { font-size: 24px; color: #333; margin: 0; margin-top: 8px; }
    .certificate-presented { margin-top: 40px; font-size: 18px; color: #666; }
    .certificate-name { font-family: 'Great Vibes', cursive; font-size: 48px; color: #F16B1B; margin: 20px 0; }
    .certificate-description { font-size: 14px; color: #555; margin: 0 auto; max-width: 600px; line-height: 1.6; }
    .certificate-footer { position: absolute; bottom: 40px; left: 0; width: 100%; display: flex; justify-content: space-around; align-items: center; }
    .footer-line { width: 200px; height: 1px; background: #333; margin: 0 auto; }
    .footer-item span { display: block; margin-top: 5px; font-size: 16px; color: #333; }
    .qr-code { margin-top: 20px; }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="shape-orange-top-left"></div>
    <div class="shape-orange-bottom-right"></div>
    <div class="shape-blue-top-right"></div>
    <div class="shape-blue-bottom-left"></div>
    <div class="certificate-content">
      <h1 class="certificate-title">CERTIFICATE</h1>
      <h2 class="certificate-subtitle">of Achievement</h2>
      <p class="certificate-presented">This Certificate Is Proudly Presented To</p>
      <h3 class="certificate-name">Name Surname</h3>
      <p class="certificate-description">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
        Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.
      </p>
      <div class="qr-code">
             <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

                      </div>
      <div class="certificate-footer">
        <div class="footer-item">
         
          <div class="footer-line"></div>
          <span>Date</span>
        </div>
        <div class="footer-item">
          <div class="footer-line"></div>
          <span>Authorized Signature</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
};

const getBirthCertificateTemplate = (req: Request, res: Response) => {

  const params = {
    name: 'name',
    fatherName: 'fatherName',
    motherName: 'motherName',
    dateOfBirth: 'dateOfBirth',
    timeOfBirth: 'dateOfBirth',
    state: 'state',
    dateOfIssue: ' dateOfIssue',
    did: 'did',
  }

  const certificatePreviewHTML = `
       <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Birth Certificate</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Lora:wght@400;700&family=Roboto&display=swap"
    rel="stylesheet"
  />
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: "Roboto", sans-serif;
    }
    .certificate-wrapper {
      width: 90%;
      max-width: 1100px;
      margin: 40px auto;
      background-color: #fff;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
      border: 10px solid #000;
      position: relative;
      overflow: hidden;
      padding: 20px;
    }
    .watermark {
      position: absolute;
      top: 55%;
      left: 50%;
      width: 50%;
      height: 50%;
      transform: translate(-50%, -50%);
      background: url("https://dfpd.gov.in/public/images/header-logo-emblem.png")
        no-repeat center center;
      background-size: contain;
      opacity: 0.2;
      z-index: 1;
    }
    .certificate-content {
      position: relative;
      z-index: 2;
      padding: 60px 80px;
      text-align: center;
    }
    .certificate-title {
      font-family: "Great Vibes", cursive;
      font-size: 64px;
      color: #444;
      letter-spacing: 3px;
      margin: 0;
    }
    .sub-title {
      font-family: "Lora", serif;
      font-size: 20px;
      color: #555;
      margin-bottom: 40px;
    }
    .highlight-name {
      font-family: "Great Vibes", cursive;
      font-size: 48px;
      color: #222;
      text-decoration: underline;
      margin: 20px 0;
    }
    .info-text {
      font-family: "Lora", serif;
      font-size: 18px;
      color: #333;
      line-height: 1.6;
      margin: 20px 0;
    }
    .separator {
      margin: 30px auto;
      width: 50%;
      height: 2px;
      background: #ccc;
    }
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin-top: 60px;
    }
    .signature-box {
      width: 220px;
      border-top: 2px solid #555;
      padding-top: 10px;
      font-family: "Lora", serif;
      font-size: 16px;
      color: #333;
    }
    .qr-box {
      text-align: right;
      margin-top: 40px;
      position: absolute;
      bottom: 10px;
      right: 10px;
    }
    .qr-box img {
      width: 100px;
      height: 100px;
    }
    @media screen and (max-width: 768px) {
      .certificate-content {
        padding: 0;
      }
      .certificate-title {
        font-size: 26px;
      }
      .sub-title {
        font-size: 14px;
        margin-bottom: 20px;
      }
      .highlight-name {
        font-size: 22px;
        margin: 10px 0;
      }
      .info-text {
        font-size: 10px;
        line-height: 1.4;
        margin: 11px 0;
      }
      .watermark {
        width: 200px;
        height: 200px;
      }
      .signature-section {
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin-top: 16px;
      }
      .signature-box {
        width: 44%;
        text-align: center;
        font-size: 9px;
        border-top: 1px solid #555;
      }
      .certificate-wrapper {
        border-width: 5px;
        margin: 20px auto;
        padding: 10px;
      }
      .separator {
        margin: 11px auto;
      }
      .qr-box img {
        width: 60px;
        height: 60px;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-wrapper">
    <div class="watermark"></div>
    <div class="certificate-content">
      <h1 class="certificate-title">Birth Certificate</h1>
      <div class="sub-title">Government of India</div>
      <p class="info-text">
        This is to certify that the following details have been duly recorded
        in the official birth registry under the authority of the Government
        of India.
      </p>
      <p class="highlight-name">Name</p>
      <p class="info-text">
        Child of <strong>Father Name</strong> and <strong>Mother Name</strong>, born on
        <strong>Date Of Birth</strong> at <strong>Time Of Birth</strong>, in
        the state of <strong>state</strong>.
      </p>
      <div class="separator"></div>
      <p class="info-text">Date of Issue: <strong></strong></p>
      <p class="info-text">
        Any unauthorized alteration or misuse of this document is strictly
        prohibited and subject to legal action.
      </p>
      <div class="signature-section">
        <div class="signature-box">Authorized Signatory</div>
        <div class="signature-box">Registrar</div>
      </div>
      <div class="qr-box">
             <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

                
      </div>
    </div>
  </div>
</body>
</html>`;
  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getIncomeCertificateTemplate = (req: Request, res: Response) => {

  const params = {
    name: 'name',
    fatherName: 'fatherName',
    fullAddress: 'fullAddress',
    income: 'income',
    wordIncome: 'wordIncome',
    did: 'did'
  }

  const certificatePreviewHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Income Certificate Preview</title>
     <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet" />
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: "Roboto", sans-serif;
          background-color: #F4F4F4;
        }
        .certificate-wrapper {
          max-width: 800px;
          margin: 40px auto;
          background-color: #fff;
          border: 2px solid #000;
          padding: 40px;
        }
        .certificate-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          display: flex;
          justify-content: space-between;
        }
        .certificate-header img {
          width: 100px;
          height: 100px;
        }
        .certificate-title {
          font-size: 20px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .certificate-no {
          margin-top: 20px;
          font-weight: bold;
        }
        .info-text {
          margin-top: 20px;
          font-size: 16px;
          line-height: 1.8;
          text-align: justify;
        }
        .qr-photo-section {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        .qr-code, .photo {
          width: 100px;
          height: 100px;
        }
        .qr-code img, .photo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .photo {
          height: 120px;
        }
        .signature {
          margin-top: 100px;
          text-align: right;
          font-size: 14px;
          color: green;
        }
        .signature span {
          display: block;
          font-weight: bold;
        }
        .footer-notes {
          font-size: 10px;
          margin-top: 20px;
          line-height: 1.4;
        }
@media screen and (max-width: 768px) {
          .certificate-wrapper {
            padding: 16px;
            margin: 20px auto;
            height: auto;
          }
          .certificate-header {
            align-items: center;
            gap: 10px;
            text-align: center;
          }
          .certificate-header img {
            width: 40px;
            height: 40px;
            margin: 0;
          }
          .certificate-title {
            font-size: 10px;
          }
          .certificate-no {
            font-size: 10px;
            margin-top: 10px;
          }
          .info-text {
            font-size: 9px;
            margin-top: 10px;
            line-height: 1.6;
          }
          .qr-photo-section {
            flex-direction: row;
            margin-top: 20px;
          }
          .qr-code, .photo {
            width: 50px;
            height: 50px;
          }
          .signature {
            font-size: 10px;
            margin-top: 50px;
          }
          .footer-notes {
            font-size: 8px;
            line-height: 1.2;
            margin-top: 10px;
            text-align: justify;
          }
        }
      </style>
  </head>
  <body>
    <div class="certificate-wrapper">
      <div class="certificate-header">
        <img src="https://seeklogo.com/images/D/delhi-police-logo-C454A2A54E-seeklogo.com.png" alt="Delhi Police" />
        <div>
          <div class="certificate-title">
            REVENUE DEPARTMENT, GOVT OF NCT OF DELHI<br />
            OFFICE OF THE DISTRICT MAGISTRATE<br />
            SAKET : SOUTH DISTRICT
          </div>
          <div class="certificate-title">INCOME CERTIFICATE</div>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" />
      </div>
      <div class="info-text">
        This is to certify that <strong>{name}</strong> S/o,D/o
        <strong>{fatherName}</strong> is a R/o Delhi having residence at
        <strong>{fullAddress}</strong>
        and his family income from all sources as declared by him is
        <strong>Rs. {income} ({wordIncome})</strong> per annum.
        <br /><br />
        This Certificate is valid up to 6 months from the Date of Issue.
      </div>
      <div class="qr-photo-section">
        <div class="qr-code">
                       <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

        </div>
       
      </div>
      <div class="footer-notes">
        <div class="signature">Signature</div>
        <p>
          1. This Certificate is valid as per Information Technology Act 2000 & is amended from time to time.
        </p>
        <p>
          2. The Authenticity of this document should be verified at
          http://edistrict.delhigovt.nic.in.
        </p>
        <p>
          3. The onus of checking the legitimacy is on the users of this document.
        </p>
        <p>
          4. In case of any discrepancy please inform the authority issuing this Certificate.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getBonafideCertificateTemplate = (req: Request, res: Response) => {

  const params = {
    studentName: 'studentName',
    fatherName: 'fatherName',
    motherName: 'motherName',
    dateOfBirth: 'dateOfBirth',
    admissionNo: 'admissionNo',
    classEnrolled: 'classEnrolled',
    schoolName: 'schoolName',
    issueDate: 'issueDate',
    principalName: 'principalName',
    did: 'did'
  }

  const certificatePreviewHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bonafide Certificate</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        background-color: #fff;
      }
      .certificate {
        max-width: 800px;
        margin: auto;
        border: 1px solid #000;
        padding: 20px;
        position: relative;

        background-image: url("https://www.freestock.com/450/freestock_567448516.jpg");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 30%;
      }
      .certificate-content {
        position: relative;
        z-index: 2;
        background-color: rgba(255, 255, 255, 0.85);
        min-height: 60vh;
        /* padding: 20px; */

        display: flex;
        justify-content: space-between;
        flex-direction: column;
      }
      .certificate-title {
        font-size: 20px;
        padding: 40px;
      }
      h2 {
        text-align: center;
        text-decoration: underline;
      }
      .content {
        font-size: 16px;
        line-height: 1.6;
        text-align: justify;
        margin-bottom: 20px;
        margin-top: 30px;
      }
      .details {
        margin: 20px 0;
      }
      .details strong {
        display: inline-block;
        width: 150px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 30px;
        font-size: 14px;
      }
      .qr {
        width: 100px;
        height: 100px;
      }
      .signature {
        text-align: right;
      }
      .note {
        font-size: 12px;
        margin-top: 60px;
      }
      .image {
        width: 100px;
        height: 100px;
      }
      @media screen and (max-width: 768px) {
        body {
          padding: 10px;
        }
        .certificate {
          padding: 10px;
        }
        .certificate-title {
          font-size: 14px;
          padding: 0px;
          padding-top: 0px;
          /* margin: 0; */
        }
        .qr {
          width: 60px;
          height: 60px;
        }
        .content {
          font-size: 10px;
          line-height: 1.4;
          margin-bottom: 10px;
          margin-top: 10px;
        }
        .note {
          font-size: 9px;
          margin-top: 10px;
        }
        .footer {
          align-items: flex-start;
          margin-top: 15px;
        }
        .signature {
          text-align: left;
          margin-top: 10px;
          font-size: 9px;
        }
        .certificate-content {
          min-height: 30vh;
        }
        .details p {
          font-size: 10px;
        }
        .details {
          margin: 10px 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate">
      <!-- <img src="https://www.freestock.com/450/freestock_567448516.jpg" class="image"/> -->
      <div class="certificate-content">
        <h2 class="certificate-title">BONAFIDE CERTIFICATE</h2>
        <div>
          <p class="content">
            This is to certify that <strong>Student Name</strong>, son/daughter
            of Mr. <strong>Father Name</strong> and Mrs.
            <strong>Mother Name</strong>, born on
            <strong>Date Of Birth</strong>, has been a bonafide student of
            <strong>School Name</strong>. He/She was admitted to this school
            with admission number <strong>Admission No</strong> and has been
            enrolled in class <strong>Class Enrolled</strong>.
          </p>
          <div class="details">
            <p><strong>Date of Issue:</strong></p>
          </div>
          <p class="note">
            This certificate is issued upon the request of the student for the
            purpose of
            <em>[mention purpose here]</em>. Any unauthorized alteration or
            misuse of this document is strictly prohibited and subject to legal
            action.
          </p>
        </div>
        <div class="footer">
          <div class="qr">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

          </div>
          <div class="signature">
            <strong>Principal Name</strong><br />
            Principal<br />
            School Name
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;
  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getCasteCertificateTemplate = (req: Request, res: Response) => {

  const params = {
    district: 'district',
    tehsil: 'tehsil',
    applicantNo: 'applicantNo',
    recipientNo: ' recipientNo',
    date: 'date',
    name: 'name',
    fatherName: 'fatherName',
    motherName: 'motherName',
    address: 'address',
    did: 'did'
  }

  const certificatePreviewHTML = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Caste Certificate</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Noto Sans', sans-serif;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .certificate-wrapper {
      width: 90%;
      max-width: 800px;
      margin: 40px auto;
      background-color: #fff;
      border: 8px solid #000;
      padding: 30px;
      position: relative;
    }
    .header {
      text-align: center;
      position: relative;
    }
    .header img {
      width: 80px;
      position: absolute;
      top: 0;
      left: 20px;
    }
    .gov-title {
      font-size: 24px;
      font-weight: bold;
      margin-top: 10px;
    }
    .form-type {
      font-size: 14px;
      margin-top: 10px;
    }
    .info-table {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      margin: 20px 0;
    }
    .info-table div {
      line-height: 1.6;
    }
    .main-content {
      font-size: 14px;
      text-align: justify;
      line-height: 1.8;
    }
    .photo-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
    }
    .qr img {
      width: 100px;
      height: 100px;
    }
    .photo {
      width: 100px;
      height: 120px;
    }
    .sign-section {
      text-align: right;
      margin-top: 40px;
    }
    .sign-text {
      font-size: 14px;
      font-weight: bold;
    }
    .issued-date {
      font-size: 12px;
      text-align: right;
      margin-top: 5px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40%;
      opacity: 0.1;
      z-index: 0;
    }
    @media screen and (max-width: 768px) {
      .gov-title {
        font-size: 16px;
      }
      .form-type {
        font-size: 10px;
      }
      .main-content,
      .info-table,
      .sign-text,
      .issued-date {
        font-size: 9px;
        line-height: 1.5;
      }
      .qr img,
      .photo {
        width: 50px;
        height: 50px;
      }
      .certificate-wrapper {
        padding: 15px;
        border-width: 3px;
        margin: 0px;
      }
      .header img {
        width: 40px;
        left: 10px;
      }
      .watermark {
        width: 100px;
      }
      .photo-section {
        margin-top: 20px;
      }
      .sign-section {
        margin-top: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-wrapper">
    <div class="header">
      <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Seal_of_Uttar_Pradesh.svg" alt="UP Emblem" />
      <div class="gov-title">Government of Uttar Pradesh</div>
      <div class="form-type">
        FORM OF<br/>
        CERTIFICATE TO BE PRODUCED BY OTHER BACKWARD CLASSES<br/>
        APPLYING FOR APPOINTMENT TO POSTS UNDER THE GOVERNMENT OF INDIA
      </div>
    </div>

    <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Seal_of_Uttar_Pradesh.svg" class="watermark" />

    <div class="info-table">
      <div>
        <strong>District: </strong> District Name<br/>
        <strong>Tehsil:</strong> Tehsil Name<br/>
        <strong>Application No:</strong> Application No<br/>
        <strong>Recipient No:</strong> Recipient No
      </div>
      <div>
        <strong>Date:</strong>
      </div>
    </div>

    <div class="main-content">
      This is to certify that <strong>Name</strong> son/daughter of <strong>Father Name</strong>, mother’s name <strong>Mother Name</strong> R/o, <strong>address</strong>, District in the Uttar Pradesh.

      <br/><br/>

      This is also to certify that he/she does not belong to the persons/sections (Creamy Layer) mentioned in column 3 of the schedule to the Government of India, Department of Personnel & Training O.M. No. 36012/22/93 Estt(SCT) dated 08-09-93 or the latest notification of the Government of India, which is modified vide OM No. 36033/3/2004 Estt.(Res.) dated 09/03/2004 and further modified vide OM No. 36033/3/2004-Estt. (Res.) dated 14/10/2008 or the latest notification of the Government of India.
    </div>

    <div class="photo-section">
      <div class="qr">
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />
      </div>
      <div class="photo"></div>
    </div>

    <div class="sign-section">
      <div class="sign-text">Signature</div>
      <div class="issued-date">Date:</div>
    </div>
  </div>
</body>
</html>
  `;
  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getCharacterCertificateTemplate = (req: Request, res: Response) => {
  const params = {
    name: 'name',
    fatherName: 'fatherName',
    address: 'address',
    years: 'years',
    date: 'date',
    applicant: 'applicant',
    did: 'did'
  }
  const certificatePreviewHTML = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Character Certificate</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f9f9f9;
    }

    .certificate {
    max-width: 800px;
    margin: auto;
    background: #fff;
    border: 2px solid #000;
    padding: 40px;
    position: relative;
    min-height: 50vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
    h2 {
      text-align: center;
      text-decoration: underline;
    }
    .annexure {
      text-align: right;
      font-size: 12px;
      font-weight: bold;
    }
    p {
      font-size: 16px;
      line-height: 1.8;
      text-align: justify;
    }
    .signature {
      margin-top: 60px;
      font-size: 16px;
    }
    .signature div {
      margin-bottom: 8px;
    }
    .qr {
      position: absolute;
      bottom: 40px;
      right: 40px;
      width: 100px;
      height: 100px;
    }
    .qr img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    @media screen and (max-width: 768px) {
      .certificate {
        padding: 16px;
        border-width: 1px;
        min-height: 30vh;
      }
      h2 {
        font-size: 16px;
      }
      p {
        font-size: 10px;
        line-height: 1.4;
text-align: justify;
      }
      .signature {
        font-size: 10px;
      }
      .qr {
        width: 60px;
        height: 60px;
        bottom: 20px;
        right: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
   <div>
    <div class="annexure">ANNEXURE IV</div>
    <h2 style="margin-bottom: 40px;">CHARACTER CERTIFICATE</h2>
    <p>
      This is to certify that I know Shri/Smt./Ku. <strong>Name</strong>
      S/o, D/o of Shri <strong>Father Name</strong>
      resident of <strong>Address</strong> for the last <strong>Years</strong> years.
      Shri/Smt./Ku. <strong>Name</strong> bears good moral character and to the best of my knowledge is not involved in any criminal activity and no personal legal case is pending against him/her.
    </p>
</div>
    <div class="signature">
      <div>(Signature with Seal)</div>
      <div><strong>Name:</strong> Applicant Name</div>
      <div><strong>Date:</strong> </div>
    </div>

    <div class="qr">
                <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

    </div>
  </div>
</body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getDomicileCertificateTemplate = (req: Request, res: Response) => {
  const params = {
    name: 'name',
    fatherName: 'fatherName',
    motherName: 'motherName',
    village: 'village',
    post: 'post',
    district: 'district',
    state: 'state',
    fromYear: 'fromYear',
    toYear: 'toYear',
    validYears: 'validYears',
    date: 'date',
    did: 'did',
    officerName: 'officerName',
  }


  const certificatePreviewHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Domicile Certificate</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        background-color: #fff;
      }
      .certificate {
        max-width: 800px;
        margin: auto;
        border: 1px solid #000;
        padding: 20px;
        position: relative;
        background: url("https://upload.wikimedia.org/wikipedia/commons/a/aa/Seal_of_Karnataka.svg") no-repeat center center;
        background-size: 30%;
        background-repeat: no-repeat;
        background-position: center;
        /* opacity: ; */
      }
      .certificate-content {
        position: relative;
        z-index: 2;
        background-color: rgba(255, 255, 255, 0.85);
        padding: 20px;
      }
      h2 {
        text-align: center;
        text-decoration: underline;
        font-size: 20px;
        margin-bottom: 10px;
      }
      .gov {
        text-align: center;
        font-weight: bold;
        margin-bottom: 10px;
      }
      p {
        font-size: 14px;
        line-height: 1.6;
        text-align: justify;
      }
      .qr {
        width: 100px;
        height: 100px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 30px;
      }
      .footer .right {
        text-align: right;
        font-size: 14px;
      }
      .note {
        font-size: 12px;
        margin-top: 20px;
      }
      .certificate-header{
        display: flex;
        justify-content: space-between;
      }
      .certificate-header img{
        width: 60px;
        height: 60px;
      }
      @media screen and (max-width: 768px) {
        body {
          padding: 10px;
        }
        .certificate {
          padding: 10px;
          min-height: 25vh;
        }
        .qr {
          width: 60px;
          height: 60px;
        }
        p {
          font-size: 10px;
          line-height: 1.4;
          text-align: justify;
        }
        .note {
          font-size: 9px;
          margin-top: 10px;
        }
        .footer .right {
          font-size: 8px;
        }
        h2 {
          font-size: 12px;
        }

        .gov {
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate">
      <div class="certificate-content">

     
      <div class="certificate-header">
      <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Seal_of_Karnataka.svg"/>
      <div>
        <div class="gov">GOVERNMENT OF KARNATAKA<br />REVENUE DEPARTMENT</div>
        <h2>DOMICILE CERTIFICATE</h2>
      </div>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"/>
    </div>
      <div>
        <p>
          This is to certify that <strong>Name</strong> S/o
          <strong>Father Name</strong> and Smt.
          <strong>Mother Name</strong> is a resident of
          <strong>Village</strong>, <strong>Post</strong>, in
          <strong>village</strong> Village
          of <strong>district</strong> District,
          <strong>state</strong> State and is residing in this Village, from
          <strong>fromYear</strong> to <strong>toYear</strong> years.
        </p>
        <p>The Certificate is valid for <strong>validYears</strong>.</p>
        <p><strong>Date:</strong> </p>
      </div>
      <div>
        <p class="note">
          Note: This is a digitally signed certificate and does not require
          manual signature.<br />
          Please, verify authenticity of this certificate by visiting
          <strong>www.nadakacheri.karnataka.gov.in</strong> & entering
          certificate Number.
        </p>
        <div class="footer">
          <div class="qr">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

          </div>
          <div class="right">
            Name: <strong>Officer Name</strong><br />
            Deputy Tahsildar<br />
            <strong></strong> District
          </div>
        </div>
      </div>
    </div>
    </div>
  </body>
</html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getMedicalCertificateTemplate = (req: Request, res: Response) => {
  const params = {
    doctorName: 'doctorName',
    applicantName: 'applicantName',
    fatherOrMotherName: 'fatherOrMotherName',
    age: 'age',
    place: 'place',
    date: 'date',
    did: 'did'
  }
  const certificatePreviewHTML = `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medical Fitness Certificate</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          background-color: #fff;
        }
        .certificate {
          max-width: 800px;
          margin: auto;
          border: 1px solid #000;
          padding: 40px;
          position: relative;
          min-height: 50vh;
        }
        h2 {
          text-align: center;
          text-decoration: underline;
        }
        .top-right {
          text-align: right;
          font-size: 14px;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          text-align: justify;
          margin-bottom: 20px;
        }
        .signature-section {
          margin-top: 40px;
          font-size: 16px;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          font-size: 14px;
        }
        .qr {
          width: 100px;
          height: 100px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="top-right">
          <div><strong>PLACE:</strong></div>
          <div><strong>DATE:</strong></div>
        </div>
        <h2>CERTIFICATE OF MEDICAL FITNESS</h2>
        <p>
          I, Dr. <strong>Doctor Name</strong> do hereby certify that I have carefully examined Mr./Ms.
          <strong>applicantName</strong>, son/daughter of <strong>fatherOrMotherName</strong>, age <strong>age</strong>,
          whose signature is given below, is fit both physically and mentally for duties in government/private organization.
          I further certify that before arriving at this decision, I carefully reviewed his/her previous medical status.
        </p>
        <div class="signature-section">
          <strong>Signature of the Applicant:</strong> ...................................................
        </div>
        <div class="footer">
          <div class="qr">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

          </div>
          <div>
            <strong>Name & signature of the Medical Officer</strong><br/>
            with seal and registration number.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getMigrationCertificateTemplate = (req: Request, res: Response) => {

  const params = {
    studentName: 'studentName',
    parentName: 'parentName',
    discipline: 'discipline',
    examName: 'examName',
    examHeldIn: 'examHeldIn',
    registrationNumber: 'registrationNumber',
    institute: 'institute',
    did: 'did'
  }
  const certificatePreviewHTML = `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Migration Certificate</title>
    <style>
      body {
        margin: 0;
        padding: 40px;
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
      }
      .certificate {
        max-width: 800px;
        margin: auto;
        background: #fff;
        border: 3px solid #888;
        padding: 40px;
        text-align: center;
        position: relative;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        min-height: 50vh;
      }
      .certificate h1 {
        margin: 0;
        font-size: 26px;
        font-weight: bold;
        letter-spacing: 2px;
      }
      .badge {
        width: 80px;
        height: 80px;
        margin: 10px auto;
        background: url("https://threebestrated.com.au/awards/migration_agents-canberra-2020-clr.svg") no-repeat center;
        background-size: contain;
      }
      .qr {
        position: absolute;
        top: 30px;
        right: 30px;
        width: 100px;
        height: 100px;
      }
      .qr img {
        width: 100%;
        height: 100%;
      }
      .content {
        font-size: 16px;
        text-align: justify;
        line-height: 1.8;
        margin-top: 20px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        padding: 0 40px;
        position: absolute;
bottom: 10px;
/* left: 22%; */
right: 0%;
      }
      .footer div {
        border-top: 1px solid #000;
        padding-top: 6px;
        width: 40%;
        font-size: 14px;
        display: flex;
        gap:20px
      }
      @media screen and (max-width: 768px) {
        body {
          padding: 10px;
        }
        .certificate {
          padding: 20px;
        }
        .footer div {
          font-size: 10px;
        }
        .qr {
          width: 60px;
          height: 60px;
        }
        .certificate h1 {
          font-size: 18px;
        }
        .content {
          font-size: 12px;
        }
        .footer div {
        font-size: 10px;
      }
      }
    </style>
  </head>
  <body>
    <div class="certificate">
      <div class="badge"></div>
      <h1>MIGRATION CERTIFICATE</h1>
      <div class="qr">
                   <img src="https://api.qrserver.com/v1/create-qr-code/?data=%E2%80%8B&size=100x100"  alt="QR Code" />

      </div>
      
      <div class="content">
        This is to certify that Mr./Ms. <strong>Student Name</strong> son/daughter of <strong>Parent Name</strong>
        has passed <strong>Exam Name</strong> in the discipline of <strong>discipline</strong> in the examination held in
        <strong>ExamHeldIn</strong> under <strong>registrationNumber</strong> as a student of <strong>institute</strong>.
        <br /><br />
        The University/College has "No Objection", whatsoever, to his/her migration/admission to pursue further studies.
      </div>
      <div class="footer">
        <div>Checked by</div>
        <div>Officer Incharge</div>
      </div>
    </div>
  </body>
</html>
  `;
  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });
}

const getFamilyCertificateTemplate = (req: Request, res: Response) => {

  const params = {
    name: 'name',
    fatherName: 'fatherName',
    motherName: 'motherName',
    dateOfBirth: 'dateOfBirth',
    relation: 'relation',
    familyId: 'familyId',
    date: 'date',
    mobile: 'mobile',
    memberId: 'memberId',
    occupation: 'occupation',
    caste: 'caste',
    disabled: 'disabled',
    address: 'address',
    city: 'city',
    block: 'block',
    ward: 'ward',
    income: 'income',
    dateOfIssue: 'dateOfIssue',
    did: 'did',
  }
  const certificatePreviewHTML = `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Haryana Family Certificate</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background: #fff;
      }
      .container {
        width: 90%;
        max-width: 900px;
        margin: 40px auto;
        border: 1px solid #000;
        padding: 20px;
        position: relative;
      }
      .header {
        text-align: center;
      }
      .header img {
        width: 80px;
        height: auto;
      }
      .title {
        font-size: 20px;
        font-weight: bold;
      }
      .subtitle {
        font-size: 18px;
        margin-top: 5px;
      }
      .info-section {
        margin-top: 20px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 20px;
      }
      .info-item {
        font-size: 14px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .table th,
      .table td {
        border: 1px solid #000;
        font-size: 12px;
        text-align: center;
        padding: 5px;
      }
      .disclaimer {
        font-size: 11px;
        color: #555;
        margin-top: 20px;
      }
      .signature {
        margin-top: 40px;
        text-align: right;
        font-weight: bold;
        font-size: 14px;
      }
      .qr {
        position: absolute;
        top: 20px;
        left: 20px;
      }
      .qr img {
        width: 90px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="qr">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?data=IFPS8137&size=90x90"
          alt="QR Code"
        />
      </div>
      <div class="header">
        <img
          src="https://dfpd.gov.in/public/images/header-logo-emblem.png"
          alt="Government Emblem"
        />
        <div class="title">Citizen Resource Information Department (CRID)</div>
        <div class="subtitle">हरियाणा परिवार पहचान पत्र</div>
      </div>

      <div class="info-section">
        <div class="info-grid">
          <div class="info-item"><strong>परिवार की आईडी:</strong> ID Number</div>
          <div class="info-item"><strong>प्रिंट तिथि:</strong> DD/MM/YYYY</div>
          <div class="info-item">
            <strong>मुखिया का नाम:</strong> Name
          </div>
          <div class="info-item"><strong>जिला:</strong> District</div>
          <div class="info-item"><strong>खण्ड नगर:</strong> City</div>
          <div class="info-item"><strong>गांव / वार्ड:</strong> Ward</div>
          <div class="info-item" style="grid-column: span 2">
            <strong>पता:</strong> Address
          </div>
        </div>
        <div class="info-item">
          <strong>Family Income (Declared):</strong> ₹96,000
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Father Name</th>
            <th>Mother Name</th>
            <th>DOB</th>
            <th>Relation</th>
            <th>Mobile</th>
            <th>Member ID</th>
            <th>Occupation</th>
            <th>Caste</th>
            <th>Is Disabled</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Name</td>
            <td>FatherName</td>
            <td>MotherName</td>
            <td>DD/MM/YYYY</td>
            <td>Relation</td>
            <td>XXXXXXXXXX</td>
            <td>XXXXXX</td>
            <td>Occupation</td>
            <td>Caste</td>
            <td>N</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>FatherName</td>
            <td>MotherName</td>
            <td>DD/MM/YYYY</td>
            <td>Relation</td>
            <td>XXXXXXXXXX</td>
            <td>XXXXXX</td>
            <td>Occupation</td>
            <td>Caste</td>
            <td>N</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>FatherName</td>
            <td>MotherName</td>
            <td>DD/MM/YYYY</td>
            <td>Relation</td>
            <td>XXXXXXXXXX</td>
            <td>XXXXXX</td>
            <td>Occupation</td>
            <td>Caste</td>
            <td>N</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>FatherName</td>
            <td>MotherName</td>
            <td>DD/MM/YYYY</td>
            <td>Relation</td>
            <td>XXXXXXXXXX</td>
            <td>XXXXXX</td>
            <td>Occupation</td>
            <td>Caste</td>
            <td>N</td>
          </tr>
          <tr>
            <td>Name</td>
            <td>FatherName</td>
            <td>MotherName</td>
            <td>DD/MM/YYYY</td>
            <td>Relation</td>
            <td>XXXXXXXXXX</td>
            <td>XXXXXX</td>
            <td>Occupation</td>
            <td>Caste</td>
            <td>N</td>
          </tr>
        </tbody>
      </table>

      <div class="info-item">
        I hereby give my consent to share Aadhaar with Government of Haryana.
      </div>
      <div class="info-item">
        I hereby declare that above details are true and correct to the best of
        my knowledge
      </div>

      <div class="signature">Applicant Signature</div>

      <div class="disclaimer">
        <p>
          <strong>DISCLAIMER:</strong> The information displayed on this page is
          NOT proof of verified information in FIDR. This information should NOT
          be construed as ‘verified information’ provided by Citizen Resources
          Information Department or Haryana Parivar Pehchan Authority,
          Panchkula, or used for any legal purpose. Users are advised to
          cross-check authenticity of any information with the concerned
          Government department.
        </p>

        <p>
          <strong>अस्वीकरण:</strong> इस पृष्ठ पर प्रदर्शित जानकारी FIDR में
          सत्यापित जानकारी का प्रमाण नहीं है। इस जानकारी को नागरिक संसाधन सूचना
          विभाग या हरियाणा परिवार पहचान प्राधिकरण, पंचकूला द्वारा प्रदान की गई
          ‘सत्यापित जानकारी’ के रूप में या किसी कानूनी उद्देश्य के लिए उपयोग
          नहीं किया जाना चाहिए। उपयोगकर्ताओं को सलाह दी जाती है कि वे संबंधित
          सरकारी विभाग के साथ किसी भी जानकारी की प्रामाणिकता की जांच करें।
        </p>
      </div>
    </div>
  </body>
</html>
`;

  res.setHeader("Content-Type", "text/html");
  res.json({
    certificatePreviewHTML,
    params: params
  });

}





const customIndustrialcertificate = (req: Request, res: Response) => {
  const { name, surname, date, did } = req.body;

  // Validation
  if (!name || !surname || !date) {
    res.status(400).json({ error: "Please provide name, surname, and date." });
    return;
  }

  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;



  const certificateHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Certificate of Achievement</title>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet" />
        <style>
          body { margin: 0; padding: 0; background-color: #F6F8FA; font-family: 'Arial', sans-serif; }
          .certificate-container { position: relative; width: 1000px; height: 700px; margin: 50px auto; background: #FFF; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden; }
          .shape-orange-top-left { position: absolute; top: 0; left: 0; width: 300px; height: 300px; background: #F16B1B; transform: translate(-20%, -20%) rotate(-20deg); z-index: 1; }
          .shape-orange-bottom-right { position: absolute; bottom: 0; right: 0; width: 300px; height: 300px; background: #F16B1B; transform: translate(20%, 20%) rotate(20deg); z-index: 1; }
          .shape-blue-top-right { position: absolute; top: 0; right: 0; width: 250px; height: 250px; background: #0F70B7; transform: translate(30%, -30%) rotate(30deg); z-index: 2; }
          .shape-blue-bottom-left { position: absolute; bottom: 0; left: 0; width: 250px; height: 250px; background: #0F70B7; transform: translate(-30%, 30%) rotate(-30deg); z-index: 2; }
          .certificate-content { position: relative; z-index: 10; width: 80%; height: 100%; margin: 0 auto; text-align: center; padding-top: 80px; box-sizing: border-box; }
          .certificate-title { font-family: "Times New Roman", serif; font-size: 48px; color: #0F70B7; font-weight: bold; letter-spacing: 2px; margin: 0; }
          .certificate-subtitle { font-size: 24px; color: #333; margin: 0; margin-top: 8px; }
          .certificate-presented { margin-top: 40px; font-size: 18px; color: #666; }
          .certificate-name { font-family: 'Great Vibes', cursive; font-size: 48px; color: #F16B1B; margin: 20px 0; }
          .certificate-description { font-size: 14px; color: #555; margin: 0 auto; max-width: 600px; line-height: 1.6; }
          .certificate-footer { position: absolute; bottom: 40px; left: 0; width: 100%; display: flex; justify-content: space-around; align-items: center; }
          .footer-line { width: 200px; height: 1px; background: #333; margin: 0 auto; }
          .footer-item span { display: block; margin-top: 5px; font-size: 16px; color: #333; }
          .qr-code { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="shape-orange-top-left"></div>
          <div class="shape-orange-bottom-right"></div>
          <div class="shape-blue-top-right"></div>
          <div class="shape-blue-bottom-left"></div>
          <div class="certificate-content">
            <h1 class="certificate-title">CERTIFICATE</h1>
            <h2 class="certificate-subtitle">of Achievement</h2>
            <p class="certificate-presented">This Certificate Is Proudly Presented To</p>
            <h3 class="certificate-name">${name} ${surname}</h3>
            <p class="certificate-description">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
              Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.
            </p>
            <div class="qr-code">
              <img src="${qrCodeURL}" alt="QR Code" width="100" height="100"/>
            </div>
            <div class="certificate-footer">
              <div class="footer-item">
                <span>${date}</span>
                <div class="footer-line"></div>
                <span>Date</span>
              </div>
              <div class="footer-item">
                <div class="footer-line"></div>
                <span>Authorized Signature</span>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
};

const customBirthCertificate = (req: Request, res: Response) => {
  const {
    name,
    fatherName,
    motherName,
    dateOfBirth,
    timeOfBirth,
    state,
    dateOfIssue,
    did
  } = req.body;

  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;


  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Birth Certificate</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Lora:wght@400;700&family=Roboto&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: "Roboto", sans-serif;
      }
      .certificate-wrapper {
        width: 90%;
        max-width: 1100px;
        margin: 40px auto;
        background-color: #fff;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.15);
        border: 10px solid #000;
        position: relative;
        overflow: hidden;
        padding: 20px;
      }
      .watermark {
        position: absolute;
        top: 55%;
        left: 50%;
        width: 50%;
        height: 50%;
        transform: translate(-50%, -50%);
        background: url("https://dfpd.gov.in/public/images/header-logo-emblem.png")
          no-repeat center center;
        background-size: contain;
        opacity: 0.2;
        z-index: 1;
      }
      .certificate-content {
        position: relative;
        z-index: 2;
        padding: 60px 80px;
        text-align: center;
      }
      .certificate-title {
        font-family: "Great Vibes", cursive;
        font-size: 64px;
        color: #444;
        letter-spacing: 3px;
        margin: 0;
      }
      .sub-title {
        font-family: "Lora", serif;
        font-size: 20px;
        color: #555;
        margin-bottom: 40px;
      }
      .highlight-name {
        font-family: "Great Vibes", cursive;
        font-size: 48px;
        color: #222;
        text-decoration: underline;
        margin: 20px 0;
      }
      .info-text {
        font-family: "Lora", serif;
        font-size: 18px;
        color: #333;
        line-height: 1.6;
        margin: 20px 0;
      }
      .separator {
        margin: 30px auto;
        width: 50%;
        height: 2px;
        background: #ccc;
      }
      .signature-section {
        display: flex;
        justify-content: space-around;
        margin-top: 60px;
      }
      .signature-box {
        width: 220px;
        border-top: 2px solid #555;
        padding-top: 10px;
        font-family: "Lora", serif;
        font-size: 16px;
        color: #333;
      }
      .qr-box {
        text-align: right;
        margin-top: 40px;
        position: absolute;
        bottom: 10px;
        right: 10px;
      }
      .qr-box img {
        width: 100px;
        height: 100px;
      }
      @media screen and (max-width: 768px) {
        .certificate-content {
          padding: 0;
        }
        .certificate-title {
          font-size: 26px;
        }
        .sub-title {
          font-size: 14px;
          margin-bottom: 20px;
        }
        .highlight-name {
          font-size: 22px;
          margin: 10px 0;
        }
        .info-text {
          font-size: 10px;
          line-height: 1.4;
          margin: 11px 0;
        }
        .watermark {
          width: 200px;
          height: 200px;
        }
        .signature-section {
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
        }
        .signature-box {
          width: 44%;
          text-align: center;
          font-size: 9px;
          border-top: 1px solid #555;
        }
        .certificate-wrapper {
          border-width: 5px;
          margin: 20px auto;
          padding: 10px;
        }
        .separator {
          margin: 11px auto;
        }
          .qr-box img {
                 width: 70%;
         height:70%
               }
               .qr-box{
                  right: 0px;
                  bottom: 0px;
               }
      }
    </style>
  </head>
  <body>
    <div class="certificate-wrapper">
      <div class="watermark"></div>
      <div class="certificate-content">
        <h1 class="certificate-title">Birth Certificate</h1>
        <div class="sub-title">Government of India</div>
        <p class="info-text">
          This is to certify that the following details have been duly recorded
          in the official birth registry under the authority of the Government
          of India.
        </p>
        <p class="highlight-name">${name}</p>
        <p class="info-text">
          Child of <strong>${fatherName}</strong> and <strong>${motherName}</strong>, born on
          <strong>${dateOfBirth}</strong> at <strong>${timeOfBirth}</strong>, in
          the state of <strong>${state}</strong>.
        </p>
        <div class="separator"></div>
        <p class="info-text">Date of Issue: <strong>${dateOfIssue}</strong></p>
        <p class="info-text">
          Any unauthorized alteration or misuse of this document is strictly
          prohibited and subject to legal action.
        </p>
        <div class="signature-section">
          <div class="signature-box">Authorized Signatory</div>
          <div class="signature-box">Registrar</div>
        </div>
        <div class="qr-box">
          <img src="${qrCodeURL}" alt="QR Code for DID" />
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
}

const customIncomeCertificate = (req: Request, res: Response) => {
  const {
    name,
    fatherName,
    fullAddress,
    income,
    wordIncome,
    did
  } = req.body;
  if (!name || !fatherName || !fullAddress || !income || !wordIncome || !did) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }
  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;

  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Income Certificate</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet" />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: "Roboto", sans-serif;
        background-color: #F4F4F4;
      }
      .certificate-wrapper {
        max-width: 800px;
        margin: 40px auto;
        background-color: #fff;
        border: 2px solid #000;
        padding: 40px;
      }
      .certificate-header {
        text-align: center;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        display: flex;
        justify-content: space-between;
      }
      .certificate-header img {
        width: 100px;
        height: 100px;
      }
      .certificate-title {
        font-size: 20px;
        font-weight: bold;
        text-transform: uppercase;
      }
      .certificate-no {
        margin-top: 20px;
        font-weight: bold;
      }
      .info-text {
        margin-top: 20px;
        font-size: 16px;
        line-height: 1.8;
        text-align: justify;
      }
      .qr-photo-section {
        display: flex;
        justify-content: space-between;
        margin-top: 30px;
      }
      .qr-code, .photo {
        width: 100px;
        height: 100px;
      }
      .qr-code img, .photo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .photo {
        height: 120px;
      }
      .signature {
        margin-top: 100px;
        text-align: right;
        font-size: 14px;
        color: green;
      }
      .signature span {
        display: block;
        font-weight: bold;
      }
      .footer-notes {
        font-size: 10px;
        margin-top: 20px;
        line-height: 1.4;
        text-align:left
      }
@media screen and (max-width: 768px) {
        .certificate-wrapper {
          padding: 16px;
          margin: 20px auto;
          height: auto;
        }
        .certificate-header {
          align-items: center;
          gap: 10px;
          text-align: center;
        }
        .certificate-header img {
          width: 40px;
          height: 40px;
          margin: 0;
        }
        .certificate-title {
          font-size: 10px;
        }
        .certificate-no {
          font-size: 10px;
          margin-top: 10px;
        }
        .info-text {
          font-size: 9px;
          margin-top: 10px;
          line-height: 1.6;
        }
        .qr-photo-section {
          flex-direction: row;
          margin-top: 20px;
        }
        .qr-code, .photo {
          width: 50px;
          height: 50px;
        }
        .signature {
          font-size: 10px;
          margin-top: 50px;
        }
        .footer-notes {
          font-size: 8px;
          line-height: 1.2;
          margin-top: 10px;
          text-align: left;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate-wrapper">
      <div class="certificate-header">
        <img src="https://seeklogo.com/images/D/delhi-police-logo-C454A2A54E-seeklogo.com.png" alt="Delhi Police" />
        <div>
          <div class="certificate-title">
            REVENUE DEPARTMENT, GOVT OF NCT OF DELHI<br />
            OFFICE OF THE DISTRICT MAGISTRATE<br />
            SAKET : SOUTH DISTRICT
          </div>
          <div class="certificate-title">INCOME CERTIFICATE</div>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" />
      </div>
      <div class="info-text">
        This is to certify that <strong>${name}</strong> S/o,D/o
        <strong>${fatherName}</strong> is a R/o Delhi having residence at
        <strong>${fullAddress}</strong>
        and his family income from all sources as declared by him is
        <strong>Rs. ${income} (${wordIncome})</strong> per annum.
        <br /><br />
        This Certificate is valid upto 6 months from the Date of Issue.
      </div>
      <div class="qr-photo-section">
        <div class="qr-code">
          <img src="${qrCodeURL}" alt="QR Code for DID ${did}" />
        </div>
      </div>
      <div class="footer-notes">
        <div class="signature">Signature</div>
        <p>
          1. This Certificate is valid as per Information Technology Act 2000 & is amended from time to time.
        </p>
        <p>
          2. The Authenticity of this document should be verified at
          http://edistrict.delhigovt.nic.in.
        </p>
        <p>
          3. The onus of checking the legitimacy is on the users of this document.
        </p>
        <p>
          4. In case of any discrepancy please inform the authority issuing this Certificate.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
};

const customBonafideCertificate = (req: Request, res: Response) => {
  const {
    studentName, fatherName, motherName, dateOfBirth, admissionNo, classEnrolled,
    schoolName, issueDate, principalName, did } = req.body; // Generate QR code URL
  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;

  const certificateHTML = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bonafide Certificate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background-color: #fff;
          }
          .certificate {
            max-width: 800px;
            margin: auto;
            border: 1px solid #000;
            padding: 20px;
            position: relative;
    
            background-image: url("https://www.freestock.com/450/freestock_567448516.jpg");
            background-repeat: no-repeat;
            background-position: center;
            background-size: 30%;
          }
          .certificate-content {
            position: relative;
            z-index: 2;
            background-color: rgba(255, 255, 255, 0.85);
            min-height: 60vh;
            /* padding: 20px; */
    
            display: flex;
            justify-content: space-between;
            flex-direction: column;
          }
          .certificate-title {
            font-size: 20px;
            padding: 40px;
          }
          h2 {
            text-align: center;
            text-decoration: underline;
          }
          .content {
            font-size: 16px;
            line-height: 1.6;
            text-align: justify;
            margin-bottom: 20px;
            margin-top: 30px;
          }
          .details {
            margin: 20px 0;
          }
          .details strong {
            display: inline-block;
            width: 150px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 30px;
            font-size: 14px;
          }
          .qr {
            width: 100px;
            height: 100px;
          }
            .qr img{
                width: 75%;
}
          .signature {
            text-align: right;
          }
          .note {
            font-size: 12px;
            margin-top: 60px;
          }
          .image {
            width: 100px;
            height: 100px;
          }
          @media screen and (max-width: 768px) {
            body {
              padding: 10px;
            }
            .certificate {
              padding: 10px;
            }
            .certificate-title {
              font-size: 14px;
              padding: 0px;
              padding-top: 0px;
              /* margin: 0; */
            }
            .qr {
              width: 60px;
              height: 60px;
            }
            .content {
              font-size: 10px;
              line-height: 1.4;
              margin-bottom: 10px;
              margin-top: 10px;
            }
            .note {
              font-size: 9px;
              margin-top: 10px;
            }
            .footer {
              align-items: flex-start;
              margin-top: 15px;
            }
            .signature {
              text-align: left;
              margin-top: 10px;
              font-size: 9px;
            }
            .certificate-content {
              min-height: 30vh;
            }
            .details p {
              font-size: 10px;
            }
            .details {
              margin: 10px 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <!-- <img src="https://www.freestock.com/450/freestock_567448516.jpg" class="image"/> -->
          <div class="certificate-content">
            <h2 class="certificate-title">BONAFIDE CERTIFICATE</h2>
            <div>
              <p class="content">
                This is to certify that <strong>${studentName}</strong>,
                son/daughter of Mr. <strong>${fatherName}</strong> and Mrs.
                <strong>${motherName}</strong>, born on
                <strong>${dateOfBirth}</strong>, has been a bonafide student of
                <strong>${schoolName}</strong>. He/She was admitted to this school
                with admission number <strong>${admissionNo}</strong> and has been
                enrolled in class <strong>${classEnrolled}</strong>.
              </p>
              <div class="details">
                <p><strong>Date of Issue:</strong> ${issueDate}</p>
              </div>
              <p class="note">
                This certificate is issued upon the request of the student for the
                purpose of
                <em>[mention purpose here]</em>. Any unauthorized alteration or
                misuse of this document is strictly prohibited and subject to legal
                action.
              </p>
            </div>
            <div class="footer">
              <div class="qr">
                <img src="${qrCodeURL}" alt="QR Code" />
              </div>
              <div class="signature">
                <strong>${principalName}</strong><br />
                Principal<br />
                ${schoolName}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
    `;
  res.setHeader("Content-Type", "text/html"); res.send(certificateHTML);
}

const customCasteCertificate = (req: Request, res: Response) => {
  const {
    district,
    tehsil,
    applicantNo,
    recipientNo,
    date,
    name,
    fatherName,
    motherName,
    address,
    did
  } = req.body;

  if (!district || !tehsil || !applicantNo || !recipientNo || !date || !name || !fatherName || !motherName || !address || !did) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;


  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Caste Certificate</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans', sans-serif;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      .certificate-wrapper {
        width: 90%;
        max-width: 800px;
        margin: 40px auto;
        background-color: #fff;
        border: 8px solid #000;
        padding: 30px;
        position: relative;
      }
      .header {
        text-align: center;
        position: relative;
      }
      .header img {
        width: 80px;
        position: absolute;
        top: 0;
        left: 20px;
      }
      .gov-title {
        font-size: 24px;
        font-weight: bold;
        margin-top: 10px;
      }
      .form-type {
        font-size: 14px;
        margin-top: 10px;
      }
      .info-table {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        margin: 20px 0;
      }
      .info-table div {
        line-height: 1.6;
      }
      .main-content {
        font-size: 14px;
        text-align: justify;
        line-height: 1.8;
      }
      .photo-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 30px;
      }
      .qr img {
        width: 100px;
        height: 100px;
      }
      .photo {
        width: 100px;
        height: 120px;
      }
      .sign-section {
        text-align: right;
        margin-top: 40px;
      }
      .sign-text {
        font-size: 14px;
        font-weight: bold;
      }
      .issued-date {
        font-size: 12px;
        text-align: right;
        margin-top: 5px;
      }
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40%;
        opacity: 0.1;
        z-index: 0;
      }
      @media screen and (max-width: 768px) {
        .gov-title {
          font-size: 16px;
        }
        .form-type {
          font-size: 10px;
        }
        .main-content,
        .info-table,
        .sign-text,
        .issued-date {
          font-size: 9px;
          line-height: 1.5;
        }
        .qr img,
        .photo {
          width: 50px;
          height: 50px;
        }
        .certificate-wrapper {
          padding: 15px;
          border-width: 3px;
          margin: 0px;
        }
        .header img {
          width: 20px;
          left: 0px;
        }
        .watermark {
          width: 100px;
        }
        .photo-section {
          margin-top: 20px;
        }
        .sign-section {
          margin-top: 20px;
        }
      }
      @media screen and (max-width: 300px) {
.gov-title {
 font-size: 14px;
}
}
    </style>
  </head>
  <body>
    <div class="certificate-wrapper">
      <div class="header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Seal_of_Uttar_Pradesh.svg" alt="UP Emblem" />
        <div class="gov-title">Government of Uttar Pradesh</div>
        <div class="form-type">
          FORM OF<br/>
          CERTIFICATE TO BE PRODUCED BY OTHER BACKWARD CLASSES<br/>
          APPLYING FOR APPOINTMENT TO POSTS UNDER THE GOVERNMENT OF INDIA
        </div>
      </div>

      <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Seal_of_Uttar_Pradesh.svg" class="watermark" />

      <div class="info-table">
        <div>
          <strong>District: </strong> ${district}<br/>
          <strong>Tehsil:</strong> ${tehsil}<br/>
          <strong>Application No:</strong> ${applicantNo}<br/>
          <strong>Recipient No:</strong> ${recipientNo}
        </div>
        <div>
          <strong>Date:</strong> ${date}
        </div>
      </div>

      <div class="main-content">
        This is to certify that <strong>${name}</strong> son/daughter of <strong>${fatherName}</strong>, mother’s name <strong>${motherName}</strong> R/o, <strong>${address}</strong>, District ${district} in the Uttar Pradesh.

        <br/><br/>

        This is also to certify that he/she does not belong to the persons/sections (Creamy Layer) mentioned in column 3 of the schedule to the Government of India, Department of Personnel & Training O.M. No. 36012/22/93 Estt(SCT) dated 08-09-93 or the latest notification of the Government of India, which is modified vide OM No. 36033/3/2004 Estt.(Res.) dated 09/03/2004 and further modified vide OM No. 36033/3/2004-Estt. (Res.) dated 14/10/2008 or the latest notification of the Government of India.
      </div>

      <div class="photo-section">
        <div class="qr">
          <img src="${qrCodeURL}" alt="QR Code for DID ${did}" />
        </div>
        <div class="photo"></div>
      </div>

      <div class="sign-section">
        <div class="sign-text">Signature</div>
        <div class="issued-date">Date: ${date}</div>
      </div>
    </div>
  </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
}

const customCharacterCertificate = (req: Request, res: Response) => {
  const {
    name,
    fatherName,
    address,
    years,
    date,
    applicant,
    did
  } = req.body;

  if (!name || !fatherName || !address || !years || !date || !applicant || !did) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;


  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character Certificate</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background: #f9f9f9;
      }

      .certificate {
      max-width: 800px;
      margin: auto;
      background: #fff;
      border: 2px solid #000;
      padding: 40px;
      position: relative;
      min-height: 50vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
      h2 {
        text-align: center;
        text-decoration: underline;
      }
      .annexure {
        text-align: right;
        font-size: 12px;
        font-weight: bold;
      }
      p {
        font-size: 16px;
        line-height: 1.8;
        text-align: justify;
      }
      .signature {
        margin-top: 60px;
        font-size: 16px;
      }
      .signature div {
        margin-bottom: 8px;
      }
      .qr {
        position: absolute;
        bottom: 40px;
        right: 40px;
        width: 100px;
        height: 100px;
      }
      .qr img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      @media screen and (max-width: 768px) {
        .certificate {
          padding: 16px;
          border-width: 1px;
          min-height: 30vh;
        }
        h2 {
          font-size: 16px;
        }
        p {
          font-size: 10px;
          line-height: 1.4;
text-align: justify;
        }
        .signature {
          font-size: 10px;
        }
        .qr {
          width: 60px;
          height: 60px;
          bottom: 20px;
          right: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate">
     <div>
      <div class="annexure">ANNEXURE IV</div>
      <h2 style="margin-bottom: 40px;">CHARACTER CERTIFICATE</h2>
      <p>
        This is to certify that I know Shri/Smt./Ku. <strong>${name}</strong>
        S/o, D/o of Shri <strong>${fatherName}</strong>
        resident of <strong>${address}</strong> for the last <strong>${years}</strong> years.
        Shri/Smt./Ku. <strong>${name}</strong> bears good moral character and to the best of my knowledge is not involved in any criminal activity and no personal legal case is pending against him/her.
      </p>
  </div>
      <div class="signature">
        <div>(Signature with Seal)</div>
        <div><strong>Name:</strong> ${applicant}</div>
        <div><strong>Date:</strong> ${date}</div>
      </div>

      <div class="qr">
        <img src="${qrCodeURL}" alt="QR Code for DID ${did}" />
      </div>
    </div>
  </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
}

const customDomicileCertificate = (req: Request, res: Response) => {
  const {
    name,
    fatherName, motherName, village, post, district, state, fromYear, toYear,
    validYears, date, did, officerName } = req.body;
  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;

  const certificateHTML = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Domicile Certificate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            background-color: #fff;
          }
          .certificate {
            max-width: 800px;
            margin: auto;
            border: 1px solid #000;
            padding: 20px;
            position: relative;
            background: url("https://upload.wikimedia.org/wikipedia/commons/a/aa/Seal_of_Karnataka.svg") no-repeat center center;
            background-size: 30%;
            background-repeat: no-repeat;
            background-position: center;
            /* opacity: ; */
          }
          .certificate-content {
            position: relative;
            z-index: 2;
            background-color: rgba(255, 255, 255, 0.85);
            padding: 20px;
          }
          h2 {
            text-align: center;
            text-decoration: underline;
            font-size: 20px;
            margin-bottom: 10px;
          }
          .gov {
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            text-align: justify;
          }
          .qr {
            width: 100px;
            height: 100px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 30px;
          }
          .footer .right {
            text-align: right;
            font-size: 14px;
          }
          .note {
            font-size: 12px;
            margin-top: 20px;
          }
          .certificate-header{
            display: flex;
            justify-content: space-between;
          }
          .certificate-header img{
            width: 60px;
            height: 60px;
          }
          @media screen and (max-width: 768px) {
            body {
              padding: 10px;
            }
            .certificate {
              padding: 10px;
              min-height: 25vh;
            }
            .qr {
              width: 60px;
              height: 60px;
            }
              .qr img{
              width:70%
              }
              p {
              font-size: 10px;
              line-height: 1.4;
              text-align: justify;
            }
            .note {
              font-size: 9px;
              margin-top: 10px;
            }
            .footer .right {
              font-size: 8px;
            }
            h2 {
              font-size: 12px;
            }
    
            .gov {
              font-size: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="certificate-content">
    
         
          <div class="certificate-header">
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/aa/Seal_of_Karnataka.svg"/>
          <div>
            <div class="gov">GOVERNMENT OF KARNATAKA<br />REVENUE DEPARTMENT</div>
            <h2>DOMICILE CERTIFICATE</h2>
          </div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"/>
        </div>
          <div>
            <p>
              This is to certify that <strong>${name}</strong> S/o
              <strong>${fatherName}</strong> and Smt.
              <strong>${motherName}</strong> is a resident of
              <strong>${village}</strong>, <strong>${post}</strong>, in
              <strong>${village}</strong> Village
              of <strong>${district}</strong> District,
              <strong>${state}</strong> State and is residing in this Village, from
              <strong>${fromYear}</strong> to <strong>${toYear}</strong> years.
            </p>
            <p>The Certificate is valid for <strong>${validYears}</strong>.</p>
            <p><strong>Date:</strong> ${date}</p>
          </div>
          <div>
            <p class="note">
              Note: This is a digitally signed certificate and does not require
              manual signature.<br />
              Please, verify authenticity of this certificate by visiting
              <strong>www.nadakacheri.karnataka.gov.in</strong> & entering
              certificate Number.
            </p>
            <div class="footer">
              <div class="qr">
                <img src="${qrCodeURL}" alt="QR Code" />
              </div>
              <div class="right">
                Name: <strong>${officerName}</strong><br />
                Deputy Tahsildar<br />
                <strong>${district}</strong> District
              </div>
            </div>
          </div>
        </div>
        </div>
      </body>
    </html>
    `;
  res.setHeader("Content-Type", "text/html"); res.send(certificateHTML);
}

const customMedicalCertificate = (req: Request, res: Response) => {
  const {
    doctorName,
    applicantName,
    fatherOrMotherName,
    age,
    place,
    date,
    did
  } = req.body;

  const safeDid = did;
  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;


  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Fitness Certificate</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
        background-color: #fff;
      }
      .certificate {
        max-width: 800px;
        margin: auto;
        border: 1px solid #000;
        padding: 40px;
        position: relative;
        min-height: 50vh;
      }
      h2 {
        text-align: center;
        text-decoration: underline;
      }
      .top-right {
        text-align: right;
        font-size: 14px;
      }
      p {
        font-size: 16px;
        line-height: 1.6;
        text-align: justify;
        margin-bottom: 20px;
      }
      .signature-section {
        margin-top: 40px;
        font-size: 16px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 60px;
        font-size: 14px;
      }
      .qr {
        width: 100px;
        height: 100px;
      }
        @media (max-width: 600px) {
  body {
    padding: 10px;
  }

  .certificate {
    padding: 15px;
  }

  h2 {
    font-size: 18px;
  }

  p,
  .signature-section,
  .footer {
    font-size: 13px;
  }

  .qr {
    width: 60px;
    height: 60px;
  }

  .footer {
    // flex-direction: column;
    align-items: flex-start;
    gap: 10px;
}
    .qr img{
    width: 70%
    }
      .footer div{
         size: 10px;
    }
    }
    </style>
  </head>
  <body>
    <div class="certificate">
      <div class="top-right">
        <div><strong>PLACE:</strong> ${place}</div>
        <div><strong>DATE:</strong> ${date}</div>
      </div>
      <h2>CERTIFICATE OF MEDICAL FITNESS</h2>
      <p>
        I, Dr. <strong>${doctorName}</strong> do hereby certify that I have carefully examined Mr./Ms.
        <strong>${applicantName}</strong>, son/daughter of <strong>${fatherOrMotherName}</strong>, age <strong>${age}</strong>,
        whose signature is given below, is fit both physically and mentally for duties in government/private organization.
        I further certify that before arriving at this decision, I carefully reviewed his/her previous medical status.
      </p>
      <div class="signature-section">
        <strong>Signature of the Applicant:</strong> ...................................................
      </div>
      <div class="footer">
        <div class="qr">
          <img src="${qrCodeURL}" alt="QR Code for DID ${safeDid}" />
        </div>
        <div>
          <strong>Name & signature of the Medical Officer</strong><br/>
          with seal and registration number.
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
}

const customMigrationCertificate = (req: Request, res: Response) => {
  const {
    studentName,
    parentName,
    discipline,
    examName,
    examHeldIn,
    registrationNumber,
    institute,
    did
  } = req.body;

  const qrData = `"${did}" is the did number of this document`;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=100x100`;


  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Migration Certificate</title>
      <style>
        body {
          margin: 0;
          padding: 40px;
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
        }
        .certificate {
          max-width: 800px;
          margin: auto;
          background: #fff;
          border: 3px solid #888;
          padding: 40px;
          text-align: center;
          position: relative;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          min-height: 50vh;
        }
        .certificate h1 {
          margin: 0;
          font-size: 26px;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .badge {
          width: 80px;
          height: 80px;
          background: url("https://threebestrated.com.au/awards/migration_agents-canberra-2020-clr.svg") no-repeat center;
          background-size: contain;
        }
        .qr {
          position: absolute;
          top: 30px;
          right: 30px;
          width: 100px;
          height: 100px;
        }
        .qr img {
          width: 80%;
          height: 80%;
        }
        .content {
          font-size: 16px;
          text-align: justify;
          line-height: 1.8;
          margin-top: 20px;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding: 0 40px;
          position: absolute;
bottom: 10px;
right: 0%;
        }
        .footer div {
          border-top: 1px solid #000;
          padding-top: 6px;
          width: 40%;
          font-size: 14px;
          display: flex;
          gap:20px
        }
        @media screen and (max-width: 768px) {
          body {
            padding: 10px;
          }
          .certificate {
            padding: 20px;
          }
          .footer div {
            font-size: 10px;
          }
          .qr {
            width: 60px;
            height: 60px;
          }
          .certificate h1 {
            font-size: 18px;
          }
          .content {
            font-size: 12px;
          }
          .footer div {
          font-size: 10px;
        }
           .badge {
          width: 40px;
          height: 40px;
        }
            .qr {
          position: absolute;
          top: 13px;
          right: 13px;
          width: 60px;
          height: 60px;
        }
  
               }
                             @media screen and (max-width: 400px) {
    .certificate h1 {
        font-size: 14px;
    }
}
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="badge"></div>
        <h1>MIGRATION CERTIFICATE</h1>
        <div class="qr">
          <img src="${qrCodeURL}" alt="QR Code" />
        </div>
        
        <div class="content">
          This is to certify that Mr./Ms. <strong>${studentName}</strong> son/daughter of <strong>${parentName}</strong>
          has passed <strong>${examName}</strong> in the discipline of <strong>${discipline}</strong> in the examination held in
          <strong>${examHeldIn}</strong> under <strong>${registrationNumber}</strong> as a student of <strong>${institute}</strong>.
          <br /><br />
          The University/College has "No Objection", whatsoever, to his/her migration/admission to pursue further studies.
        </div>
        <div class="footer">
          <div>Checked by</div>
          <div>Officer Incharge</div>
        </div>
      </div>
    </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
}

const customFamilyCertificate = (req: Request, res: Response) => {
  const {
    familyId,
    date,
    address,
    city,
    block,
    ward,
    income,
    did,
    members = []
  } = req.body;

  // Default QR data is based on first member's name or did
  const qrCodeData = did;
  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=100x100`;

  // Generate rows for each member
  const memberRowsHTML = members.map((member: {
    name: string;
    fatherName: string;
    motherName: string;
    dateOfBirth: string;
    relation: string;
    mobile: string;
    memberId: string;
    occupation: string;
    caste: string;
    disabled: boolean;
  }) => `
    <tr>
      <td>${member.name}</td>
      <td>${member.fatherName}</td>
      <td>${member.motherName}</td>
      <td>${member.dateOfBirth}</td>
      <td>${member.relation}</td>
      <td>${member.mobile}</td>
      <td>${member.memberId}</td>
      <td>${member.occupation}</td>
      <td>${member.caste}</td>
<td>${String(member.disabled).toUpperCase() === 'Y' ? 'Yes' : 'No'}</td>
    </tr>
  `).join('');
  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Family Certificate</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #fff;
      }
      .container {
        width: 95%;
        max-width: 1000px;
        margin: 20px auto;
        border: 1px solid #000;
        padding: 15px;
        position: relative;
        box-sizing: border-box;
      }
      .header {
        text-align: center;
      }
      .header img {
        width: 70px;
      }
      .title {
        font-size: 18px;
        font-weight: bold;
        margin-top: 5px;
      }
      .subtitle {
        font-size: 16px;
        margin-bottom: 20px;
      }
      .details {
        margin-top: 10px;
        font-size: 14px;
      }
      .info-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 10px 0;
      }
      .info-item {
        flex: 1 1 45%;
        word-break: break-word;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        font-size: 13px;
      }
      th,
      td {
        border: 1px solid #000;
        padding: 6px;
        text-align: center;
      }
      .disclaimer {
        font-size: 12px;
        margin-top: 30px;
        color: #000;
      }
      .signature {
        text-align: right;
        margin-top: 30px;
        font-weight: bold;
      }
      .qr-box {
        position: absolute;
        top: 15px;
        left: 15px;
      }
      .qr-box img {
        width: 80px;
        height: 80px;
      }
      @media (max-width: 768px) {
        .container {
          padding: 10px;
        }
        .info-item {
          flex: 1 1 40%;
        }
        table,
        th,
        td {
          font-size: 5px;
        }
        .header img {
          width: 20px;
        }
        .title {
          font-size: 12px;
        }
        .subtitle {
          font-size: 10px;
        }
        .details {
          font-size: 9px;
        }
        .info-row {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin: 0px 0;
        }
        .qr-box img {
          height: 20px;
          width: 20px;
        }
        .qr-box img {
          width: 60px;
          height: 60px;
        }
        .signature {
          text-align: left;
          font-size: 8px;
          margin-top: 15px;
        }
        .container p {
          font-size: 9px;
          margin: 0px;
        }
        .disclaimer {
          font-size: 8px;
          margin-top: 16px;
          color: #000;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="qr-box">
        <img src="${qrCodeURL}" alt="QR Code"/>
      </div>
      <div class="header">
        <img src="https://dfpd.gov.in/public/images/header-logo-emblem.png" alt="Government Emblem" />
        <div class="title">Citizen Resource Information Department (CRID)</div>
        <div class="subtitle">हरियाणा परिवार पहचान पत्र</div>
      </div>

      <div class="details">
        <div class="info-row">
          <div class="info-item"><strong>परिवार की आईडी:</strong> ${familyId}</div>
          <div class="info-item"><strong>प्रिंट तिथि:</strong> ${date}</div>
          <div class="info-item"><strong>जिला:</strong> ${city}</div>
          <div class="info-item"><strong>खण्ड / नगर:</strong> ${block}</div>
          <div class="info-item"><strong>गांव / वार्ड:</strong> ${ward}</div>
          <div class="info-item" style="flex: 1 1 100%;"><strong>पता:</strong> ${address}</div>
        </div>
        <strong>Family Income (Declared):</strong> ₹${income}
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Father Name</th>
            <th>Mother Name</th>
            <th>DOB</th>
            <th>Relation</th>
            <th>Mobile</th>
            <th>Member ID</th>
            <th>Occupation</th>
            <th>Caste</th>
            <th>Is Disabled</th>
          </tr>
        </thead>
        <tbody>
          ${memberRowsHTML}
        </tbody>
      </table>

      <p style="margin-top: 20px;">I hereby give my consent to share Aadhaar with Government of Haryana.</p>
      <p>I hereby declare that above details are true and correct to the best of my knowledge.</p>

      <div class="signature">Applicant Signature</div>

      <div class="disclaimer">
        <p><strong>DISCLAIMER:</strong> The information displayed on this page is NOT proof of verified information in FIDR. This information should NOT be construed as ‘verified information’ provided by Citizen Resources Information Department or Haryana Parivar Pehchan Authority, Panchkula, or used for any legal purpose. Users are advised to cross-check authenticity of any information with the concerned Government department.</p>
        <p><strong>अस्वीकरण:</strong> इस पृष्ठ पर प्रदर्शित जानकारी FIDR में सत्यापित जानकारी का प्रमाण नहीं है। इस जानकारी को नागरिक संसाधन सूचना विभाग या हरियाणा परिवार पहचान प्राधिकरण, पंचकूला द्वारा प्रदान की गई ‘सत्यापित जानकारी’ के रूप में या किसी कानूनी उद्देश्य के लिए उपयोग नहीं किया जाना चाहिए। उपयोगकर्ताओं को सलाह दी जाती है कि वे संबंधित सरकारी विभाग के साथ किसी भी जानकारी की प्रामाणिकता की जांच करें।</p>
      </div>
    </div>
  </body>
  </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(certificateHTML);
};



const getCertificateParams = (req: Request, res: Response) => {
  try {

    const certificateParams = {
      birthCertificate: [
        "name",
        "fatherName",
        "motherName",
        "dateOfBirth",
        "timeOfBirth",
        "state",
        "dateOfIssue",
        "did"
      ],
      incomeCertificate: [
        "name",
        "fatherName",
        "fullAddress",
        "income",
        "wordIncome",
        "did"
      ],
      bonafideCertificate: [
        "studentName",
        "fatherName",
        "motherName",
        "dateOfBirth",
        "admissionNo",
        "classEnrolled",
        "schoolName",
        "issueDate",
        "principalName",
        "did"
      ],
      casteCertificate: [
        "district",
        "tehsil",
        "applicantNo",
        "recipientNo",
        "date",
        "name",
        "fatherName",
        "motherName",
        "address",
        "did"
      ],
      characterCertificate: [
        "name",
        "fatherName",
        "address",
        "years",
        "date",
        "applicant",
        "did"
      ],
      domicileCertificate: [
        "name",
        "fatherName",
        "motherName",
        "village",
        "post",
        "district",
        "state",
        "fromYear",
        "toYear",
        "validYears",
        "date",
        "did",
        "officerName"
      ],
      medicalCertificate: [
        "doctorName",
        "applicantName",
        "fatherOrMotherName",
        "age",
        "place",
        "date",
        "did"
      ],
      migrationCertificate: [
        "studentName",
        "parentName",
        "discipline",
        "examName",
        "examHeldIn",
        "registrationNumber",
        "institute",
        "did"
      ],
      familyCertificate: {
        fields: [
          "familyId",
          "date",
          "address",
          "city",
          "block",
          "ward",
          "income",
          "did"
        ],
        members: [
          "name",
          "fatherName",
          "motherName",
          "dateOfBirth",
          "relation",
          "mobile",
          "memberId",
          "occupation",
          "caste",
          "disabled"
        ]
      }
    };

    res.status(200).json(certificateParams);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
}


const addCertificate = async (req: Request, res: Response) => {
  try {
    const { name, code, dynamicKeys, keys } = req.body;

    if (
      typeof name !== "string" ||
      typeof code !== "string" ||
      !Array.isArray(dynamicKeys) ||
      !Array.isArray(keys)
    ) {
      res.status(400).json({ error: "Missing or invalid parameters" });
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const certificatesCollection = getCertificateDataCollection(db);
    const nme = name.toLowerCase()
    const existing = await certificatesCollection.findOne({ name: nme });
    if (existing) {
      res
        .status(400)
        .json({ error: `A certificate named '${name.toLowerCase()}' already exists.` });
      return;
    }
    /* ---------- 2. Validate every key object -------------------- */
    const allKeys: BaseKey[] = [...dynamicKeys, ...keys];

    for (const k of allKeys) {
      if (typeof k.param !== "string" || typeof k.type !== "string") {
        res
          .status(400)
          .json({ error: "Each key requires 'param' and 'type'" });
        return
      }
      if (k.type !== "string" && k.type !== "array") {
        res.status(400).json({ error: `Unknown type '${k}'` });
        return;
      }
    }

    const dynamicParams: DynamicKey[] = dynamicKeys.filter(
      (k: any): k is DynamicKey => k.type === "string"
    );
    const tableParams: TableKey[] = keys.filter(
      (k: any): k is TableKey => k.type === "array"
    );
    const stringKeys: DynamicKey[] = keys.filter(
      (k: any): k is DynamicKey => k.type === "string"
    );
    const columns: TableKey[] = dynamicKeys.filter(
      (k: any): k is TableKey => k.type === "array"
    );
    console.log("columns -> ", columns);

    /* ---------- 3. Escape template code ------------------------- */
    const safeCode = code
      .replace(/`/g, "\\`")
      .replace(/\$\{(\w+)\}/g, "#{$1}");

    /* ---------- 4. File paths ----------------------------------- */
    const documentID = uuidv4();
    const fileName = `${documentID}.ts`;
    const templatesDir = path.join(__dirname, "..", "..", "assets", "certificates");
    if (!fs.existsSync(templatesDir)) fs.mkdirSync(templatesDir, { recursive: true });

    /* ---------- 5. Generate TS module --------------------------- */
    /* ---------- 6. Build TypeScript module --------------------- */
    const tsModuleContent = `
 /* Auto-generated – DO NOT EDIT */
 type Row = Record<string, string>;
 
 type Args = {
 ${stringKeys.map(k => `  ${k.param}: string;`).join("\n")}
   rows: Row[];   // ← table data comes here
 };
 
 const template = \`${safeCode}\`;
 
 /* -------- Preview -------- */
 export async function getTemplate(): Promise<string> {
   let output = template;
 
   // Replace #{param} with its own name
 ${stringKeys
        .map(k => `  output = output.replace(/#\\{${k.param}\\}/g, "${k.param}");`)
        .join("\n")}
 
   // Build a single empty preview row
   const previewRow = \`<tr>${columns
        .map(() => "<td style='border: 1px solid #000; padding: 4px; text-align: center;'>&nbsp;</td>")
        .join("")}</tr>\`;
   output = output.replace(/#\\{rows\\}/g, previewRow);
 
   return output;
 }
 
 /* -------- Final render -------- */
 export async function renderTemplate(args: Args): Promise<string> {
   let output = template;
 
   // Dynamic single-value replacements
 ${stringKeys
        .map(k => `  output = output.replace(/#\\{${k.param}\\}/g, args.${k.param});`)
        .join("\n")}
 
   // Table rows
   const rowsHtml = args.rows
     .map(
       row => \`<tr>${columns
        .map(col => `<td style='border: 1px solid #000; padding: 4px; text-align: center;'>\${row["${col.param}"] ?? ""}</td>`)
        .join("")}</tr>\`
     )
     .join("");
   output = output.replace(/#\\{rows\\}/g, rowsHtml);
 
   return output;
 }
 
 export default template;
 `.trimStart();


    // const certificateData: CertificateData = {
    /* ---------- 6. Write file ----------------------------------- */
    await fs.promises.writeFile(
      path.join(templatesDir, fileName),
      tsModuleContent,
      "utf-8"
    );

    /* ---------- 7. Store metadata in MongoDB -------------------- */
    // const client = await getClient();
    // const db = client.db(process.env.DB_NAME!);
    await certificatesCollection.insertOne({
      id: documentID,
      name: name.toLowerCase(),
      approvedStats: 'pending',
      fileName,
      dynamicKeys,
      keys,
      createdAt: new Date()
    });

    /* ---------- 8. Respond -------------------------------------- */
    res.status(200).json({
      success: true,
      id: documentID,
      fileName,
      status: 200,
      message: "New certificate added successfully"
    });
  } catch (err) {
    console.error("Error in addCertificate:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


const getAllCertificates = async (req: Request, res: Response) => {
  try {
    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const certificatesCollection = getCertificateDataCollection(db);
    const data = await certificatesCollection.find().toArray();
    if (data && data.length > 0) {
      const result = data.map(cert => ({
        id: cert.id,
        name: cert.name,
        approvedStats: cert.approvedStats,
        fileName: cert.fileName,
        params: Array.isArray(cert.keys)
          ? cert.keys.map(k => k?.param).filter(Boolean)
          : [],
        tableParams: Array.isArray(cert.dynamicKeys)
          ? cert.dynamicKeys.map(k => k?.param).filter(Boolean)
          : [],
      }));

      res
        .status(200)
        .json({
          success: true,
          status: 200,
          error: false,
          data: result,
          message: "certificates fetched successfully"
        });
    }
    else {
      res.status(400).json({
        status: 400,
        error: true,
        message: "No certificates found"
      });
    }

  } catch (err) {
    console.error("Error in addCertificate:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getAllCertificatesParams = async (req: Request, res: Response) => {
  try {
    // 5. Insert into MongoDB
    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const certificatesCollection = await getCertificateDataCollection(db);
    const data = await certificatesCollection.find().toArray();
    if (data && data.length > 0) {
      res
        .status(200)
        .json({
          success: true,
          status: 200,
          error: false,
          data: data,
          message: "certificates fetched successfully"
        });
    }
    else {
      res.status(400).json({
        status: 400,
        error: true,
        message: "No certificates found"
      });
    }
  } catch (err) {
    console.error("Error in getCertificate:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    // 1. Validate
    if (!id) {
      res.status(400).json({ error: "Missing or invalid parameters in request body" });
    }
    // 5. Insert into MongoDB
    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const certificatesCollection = getCertificateDataCollection(db);
    const data = await certificatesCollection.findOne({ id: id });
    if (data) {
      const modulePath = path.join(
        __dirname,
        "..",
        "..",
        "assets",
        "certificates",
        data.fileName
      );
      // 3) Dynamically import the module
      const certModule = await import(modulePath);
      //    certModule.getTemplate or certModule.renderTemplate
      // 4) Call the function you want
      //    Here, we just return the raw template:
      const html = await certModule.getTemplate();
      // 5) Send it back
      res.status(200).json({
        success: true,
        status: 200,
        error: false,
        data: {
          id: data.id,
          name: data.name,
          params: data.keys,
          dynamicKeys: data.dynamicKeys,
          html,           // your template string
        },
        message: "Certificate fetched successfully",
      });

    }
    else {
      res
        .status(400)
        .json({
          status: 400,
          error: true,
          message: "Bad Request"
        });
    }
  } catch (err) {
    console.error("Error in addCertificate:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export const getCertificateByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // 1. Validate
    if (typeof name !== "string" || name.trim() === "") {
      res
        .status(400)
        .json({ error: "Missing or invalid 'name' in request body" });
      return;
    }

    // 2. Fetch metadata from MongoDB by name
    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const certificatesCollection = getCertificateDataCollection(db);

    const certMeta = await certificatesCollection.findOne({ name });
    if (!certMeta) {
      res
        .status(404)
        .json({ status: 404, error: true, message: `Certificate '${name}' not found` });
      return;
    }

    // 3. Build path to the generated TS module
    const modulePath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "certificates",
      certMeta.fileName
    );

    // 4. Dynamically import and fetch the raw template
    const certModule = await import(modulePath);
    const html = await certModule.getTemplate();

    // 5. Respond with only the relevant fields
    res.status(200).json({
      success: true,
      status: 200,
      error: false,
      data: {
        name: certMeta.name,
        params: certMeta.keys,
        dynamicKeys: certMeta.dynamicKeys,
        html,
      },
      message: "Certificate fetched successfully",
    });

  } catch (err) {
    console.error("Error in getCertificateByName:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





const getCustomCertificate = async (req: Request, res: Response) => {
  try {
    /* ------------------------------------------------------------------ */
    /* 1. Extract the payload                                             */
    /* ------------------------------------------------------------------ */
    console.log("111111111111111111111111111111111111111");

    const { id, rows: suppliedRows, ...scalars } = req.body as {
      id: string;
      rows?: unknown;
      [key: string]: unknown;
    };
    console.log("2222222222222222222222222222222222222222222");

    if (!id) {
      res
        .status(400)
        .json({ success: false, message: "Missing certificate id" });
      return;
    }

    /* ------------------------------------------------------------------ */
    /* 2. Fetch the certificate definition                                */
    /* ------------------------------------------------------------------ */
    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const col = getCertificateDataCollection(db);

    const certDef = await col.findOne({ id });
    if (!certDef) {
      res
        .status(404)
        .json({ success: false, message: `No cert for id ${id}` });
      return;
    }

    /* ------------------------------------------------------------------ */
    /* 3. Work out required params                                        */
    /* ------------------------------------------------------------------ */
    const stringKeys = certDef.keys.filter((k) => k.type === "string");
    const arrayKey = certDef.dynamicKeys.find((k) => k.type === "array"); // optional

    const missingScalars = stringKeys
      .map((k) => k.param)
      .filter((p) => !(p in scalars));

    if (missingScalars.length) {
      res.status(400).json({
        success: false,
        message: `Missing required parameter(s): ${missingScalars.join(", ")}`,
      });
      return;
    }

    /* validate rows ---------------------------------------------------- */
    let rows: Record<string, string>[] = [];
    if (arrayKey) {
      if (!Array.isArray(suppliedRows)) {
        res.status(400).json({
          success: false,
          message: "`rows` must be an array of objects",
        });
        return;
      }
      rows = suppliedRows as Record<string, string>[];
    }

    /* ------------------------------------------------------------------ */
    /* 4. Dynamically import the template module                          */
    /* ------------------------------------------------------------------ */
    const modPath = path.join(
      __dirname,
      "..",
      "..",
      "assets",
      "certificates",
      certDef.fileName
    );
    const tplModule = await import(modPath); // ESM dynamic import

    /* ------------------------------------------------------------------ */
    /* 5. Build args compatible with renderTemplate()                     */
    /* ------------------------------------------------------------------ */
    const args: Record<string, unknown> = { rows };

    for (const { param } of stringKeys) {
      args[param] = scalars[param] as string;
    }

    /* ------------------------------------------------------------------ */
    /* 6. Render                                                          */
    /* ------------------------------------------------------------------ */
    let html = await (tplModule.renderTemplate as (o: any) => Promise<string>)(args);
    html = html.replace(/\\/g, " ");
    console.log("html ->", html);


    /* ------------------------------------------------------------------ */
    /* 7. Respond                                                         */
    /* ------------------------------------------------------------------ */
    res.status(200).json({
      status: 200,
      error: false,
      message: "User template rendered successfully",
      data: html,
    });
  } catch (err) {
    console.error("Error in getCustomCertificate:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



 const deleteCertificateTemplate = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
       res.status(400).json({ error: "Certificate name is required." });
       return;
    }

    const client = await getClient();
    const db = client.db(process.env.DB_NAME!);
    const certificatesCollection = getCertificateDataCollection(db);

    const certificate = await certificatesCollection.findOne({ name: name.toLowerCase() });

    if (!certificate) {
       res.status(404).json({ error: `Certificate '${name}' not found.` });
       return;
    }

    // Construct file path and remove the .ts file
    const templatesDir = path.join(__dirname, "..", "..", "assets", "certificates");
    const filePath = path.join(templatesDir, certificate.fileName);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // Remove the record from MongoDB
    await certificatesCollection.deleteOne({ name: name.toLowerCase() });

    res.status(200).json({
      success: true,
      message: `Certificate '${name}' deleted successfully.`,
    });
  } catch (err) {
    console.error("Error in deleteCertificate:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export default {
  getIndustrialCertificateTemplate,
  getIncomeCertificateTemplate,
  getBirthCertificateTemplate,
  getBonafideCertificateTemplate,
  getCasteCertificateTemplate,
  getCharacterCertificateTemplate,
  getDomicileCertificateTemplate,
  getMedicalCertificateTemplate,
  getMigrationCertificateTemplate,
  getFamilyCertificateTemplate,

  customIndustrialcertificate,
  customBirthCertificate,
  customIncomeCertificate,
  customBonafideCertificate,
  customCasteCertificate,
  customCharacterCertificate,
  customDomicileCertificate,
  customMedicalCertificate,
  customMigrationCertificate,
  customFamilyCertificate,


  getCertificateParams,
  addCertificate,
  deleteCertificateTemplate,
  getAllCertificates,
  getAllCertificatesParams,
  getCertificate,
  getCertificateByName,
  getCustomCertificate
};
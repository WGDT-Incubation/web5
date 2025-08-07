import exp from 'constants';
import { Db, Collection } from 'mongodb';

export interface Did {
  did: string;
  createdAt: Date;    
  updatedAt:Date;          
}

export interface User {
  userPhone:number;
  otp:string;
  otpExpiry:number;
  createdAt: Date;    
  updatedAt:Date;          
}



export interface SuperAdminUser{
  uniqueID: string;   
  email: string;        
  userName?: string;
  recentOTP?:string|null;
  otpExpiresAt?:Date;
  isVerified:boolean;
  password:string;
  createdAt:Date;
  updatedAt:Date;
}

export interface AdminUser{
  uniqueID: string;   
  email: string;        
  userName?: string;
  recentOTP?:string|null;
  otpExpiresAt?:Date;
  isVerified:boolean;
  password:string;
  createdAt:Date;
  updatedAt:Date;
}

export interface VerifierUser{
  verifierEmail:string;
  recentOTP?:string|null;
  otpExpiresAt?:Date;
  isVerified?:boolean;
  password:string;
  createdAt:Date;
  updatedAt:Date;
}



export type IssuerStatus = "pending" | "approved" | "rejected";

export interface VerifierAccess{
  verifierEmail:string;
  did:string[];
  prevStatus:IssuerStatus;
  status?: IssuerStatus;
  createdAt:Date;
  updatedAt?:Date;
}

export interface EDistrictData {
  [key: string]: any;
  status:string;
  insertedAt: Date;
}

export interface EDistrictCronData {
  [key: string]: any;
  status: string;
  insertedAt: Date;
}

export interface IssuerAdmin {
  issuerEmail: string;
  prevStatus:IssuerStatus;
  status: IssuerStatus;
  department: string;
  updatedAt: Date;
}

export interface DepartmentData{
  department: string;
  certificateType: string[];
}


export interface CertificateData{
  id:string;
  name: string;
  approvedStats: 'pending' | 'approved' | 'rejected';
  fileName: string;
  keys: any[];
  dynamicKeys:any[];
  createdAt:Date;
}


export interface IssuedDIDs {
  email: string;           
  DIDs: string[];     
}


export interface RevokedDIDs {
  email: string;             
  DIDs: string[];     
}

export const getIssuedDIDcollection = (db: Db): Collection<IssuedDIDs> => {
  return db.collection<IssuedDIDs>("issuedDIDs");
};

export const getRevokedDIDcollection = (db: Db): Collection<RevokedDIDs> => {
  return db.collection<RevokedDIDs>("revokedDIDs");
};


export const getDidCollection = (db:Db):Collection<Did>=>{
  return db.collection<Did>('did');
}

export const getUserCollection = (db:Db):Collection<User>=>{
  return db.collection<User>('user');
}

export const getAdminUserCollection = (db:Db):Collection<AdminUser>=>{
  return db.collection<AdminUser>('adminUser');
}

export const getIssuerAdminCollection = (db:Db):Collection<IssuerAdmin>=>{
  return db.collection<IssuerAdmin>('issuerAdmin');
}

export const getSuperAdminUserCollection = (db:Db):Collection<SuperAdminUser>=>{
  return db.collection<SuperAdminUser>('superAdminUser');
}

export const getVerifierCollection = (db:Db):Collection<VerifierUser>=>{
  return db.collection<VerifierUser>('verifierUser');
}

export const getVerifierAccessCollection = (db:Db):Collection<VerifierAccess>=>{
  return db.collection<VerifierAccess>('verifierAccess');
}

export const getEDistrictDataCollection = (db: Db): Collection<EDistrictData> => {
  return db.collection<EDistrictData>('eDistrictData');
};

export const getEDistrictDataCronCollection = (db: Db): Collection<EDistrictCronData> => {
  return db.collection<EDistrictCronData>('eDistrictDataCron');
};

export const getDepartmentDataCollection = (db: Db): Collection<DepartmentData> =>{
  return db.collection<DepartmentData>('departmentData');
};


export const getCertificateDataCollection = (db: Db): Collection<CertificateData>=>{
  return db.collection<CertificateData>('certificates');
}

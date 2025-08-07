import { Router } from "express";
import adminController from '../controllers/adminController';
import certificateController from '../controllers/certificateController';
import authMiddleware  from '../middleware/adminMiddleware/authMiddleware';
const router = Router();

router.get('/adminHealth',(req,res)=>{
         res.status(200).json({
             code:200,
             error:false,
             message:"Admin health check is successful"
         })
     })

router.post('/signup',adminController.signUp); 
router.post('/login', adminController.login); 
router.post('/forgotPassword',adminController.forgotPassword);
router.post('/resetPassword',adminController.resetPassword); 
router.post('/adminLogin',authMiddleware,adminController.adminLogin);
router.post('/registerUser',adminController.registerUser); 
router.post('/registerSingleDID',adminController.registerSingleDID); 
router.post('/registerFromEDistrict',adminController.registerFromEDistrict); 
router.post('/registerBulkDIDs',adminController.registerBulkDIDs); 
router.post('/addDID',adminController.addDID); 
router.get('/getOTPforRemoveCertificate',authMiddleware,adminController.getOTPforRemoveCertificate); 
router.post('/revokeDID',adminController.revokeDID);
router.post('/revokeMultipleDIDs',adminController.revokeMultipleDIDs); 
router.post('/getIdentity',adminController.getIdentity);
router.get('/getAllDIDs',adminController.getAllDIDs);
router.get('/getRevokedDIDs',adminController.getRevokedDIDs); 
router.get('/getActiveDIDs',adminController.getActiveDIDs); 
router.post('/queryDID',adminController.queryDID);
router.post('/insertEDistrictDataBulk',authMiddleware,adminController.insertEDistrictDataBulk);
router.get('/getIssuedCertificates',authMiddleware,adminController.getIssuedCertificates); 
router.get('/getAllIssuedCertificates',authMiddleware,adminController.getAllIssuedCertificates); 
router.get("/getRevokedCertificates", authMiddleware,adminController.getRevokedCertificates); 
router.get('/getEDistrictData',authMiddleware,adminController.getEDistrictData);
router.post('/rejectEDistrictData',authMiddleware,adminController.rejectEDistrictData);
router.post('/updateEDistrictData',authMiddleware,adminController.updateEDistrictData); 
router.post('/getDepartmentCertificateTypes',authMiddleware,adminController.getDepartmentCertificateTypes);
router.get('/getAllDepartments',adminController.getAllDepartments);


router.post('/addCertificate', authMiddleware,certificateController.addCertificate);
router.get('/getAllCertificates',authMiddleware, certificateController.getAllCertificates);
router.get('/getAllCertificatesParams', authMiddleware,certificateController.getAllCertificatesParams);

router.post('/getCertificate',authMiddleware, certificateController.getCertificate);
router.post('/getCertificateByName',authMiddleware, certificateController.getCertificateByName);
router.post('/getCustomCertificate', authMiddleware,certificateController.getCustomCertificate);

router.get('/getEDistrictCronData',authMiddleware, adminController.getEDistrictCronData);
router.post('/rejectEDistrictCronData',authMiddleware,adminController.rejectEDistrictCronData);
router.post('/updateEDistrictCronData',authMiddleware,adminController.updateEDistrictCronData); 



export default router;

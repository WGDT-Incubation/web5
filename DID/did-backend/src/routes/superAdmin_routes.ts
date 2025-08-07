import { Router } from "express";
import superAdminController from '../controllers/superAdminController';
import certificateController from '../controllers/certificateController';
import authMiddleware  from '../middleware/superAdminMiddleware/authMiddleware';
const router = Router();

router.get('/superAdminHealth',(req,res)=>{
         res.status(200).json({
             code:200,
             error:false,
             message:"Admin health check is successful"
         })
     })

router.post('/signup',superAdminController.signUp); 
router.post('/login', superAdminController.login); 
router.post('/forgotPassword',superAdminController.forgotPassword); // We will be sending the OTP to the user
router.post('/resetPassword',superAdminController.resetPassword); // We will be resetting the password
router.post('/insertEDistrictData',authMiddleware,superAdminController.insertEDistrictData); // We will be inserting the data from e-district
router.post('/insertEDistrictDataBulk',authMiddleware,superAdminController.insertEDistrictDataBulk); // We will be inserting the data from e-district in bulk
router.get('/getEDistrictData',authMiddleware,superAdminController.getEDistrictData); // We will be getting the data from e-district
router.get('/getPendingIssuerList',authMiddleware,superAdminController.getPendingIssuerList); // We will be getting the pending issuer list
router.get('/getIssuerApprovedList',authMiddleware,superAdminController.getIssuerApprovedList); // We will be getting the approved issuer list
router.get('/getIssuerRejectedList',authMiddleware,superAdminController.getIssuerRejectedList); // We will be getting the rejected issuer list
router.get('/getAllIssuerList',authMiddleware,superAdminController.getAllIssuerList); // We will be getting all the issuer list


router.get('/getPendingVerifierList',authMiddleware,superAdminController.getPendingVerifierList); // We will be getting the pending verifier list
router.get('/getVerifierApprovedList',authMiddleware,superAdminController.getVerifierApprovedList); // We will be getting the approved verifier list
router.get('/getVerifierRejectedList',authMiddleware,superAdminController.getVerifierRejectedList); // We will be getting the rejected verifier list
router.get('/getAllVerifierList',authMiddleware,superAdminController.getAllVerifierList); // We will be getting all the verifier list

router.post('/addissuer',authMiddleware,superAdminController.addIssuer); // We will be adding the issuer
router.post('/rejectIssuers',authMiddleware,superAdminController.rejectIssuers);// We will be rejecting the issuers
router.post('/undoIssuers',authMiddleware,superAdminController.undoIssuers); 

router.post('/addverifier',authMiddleware,superAdminController.addVerifier); // We will be adding the verifier
router.post('/rejectVerifiers',authMiddleware,superAdminController.rejectVerifiers); // We will be rejecting the verifiers
router.post('/undoVerifiers',authMiddleware,superAdminController.undoVerifiers); // We will be rejecting the verifiers



router.get('/getCertificates',authMiddleware,superAdminController.getCertificates); // We will be getting the certificates
router.get('/getAllDepartments',authMiddleware,superAdminController.getAllDepartments); // We will be getting all the departments
router.post('/addCertificateTypesToDepartment',authMiddleware,superAdminController.addCertificateTypesToDepartment); // We will be adding the certificate types to the department
router.post('/removeCertificateTypesFromDepartment',authMiddleware,superAdminController.removeCertificateTypesFromDepartment); // We will be removing the certificate types from the department

router.get('/getAllCertificates',authMiddleware, certificateController.getAllCertificates);
router.post('/getCertificateByName', authMiddleware,certificateController.getCertificateByName);
router.post('/approveCertificateTemplate',authMiddleware,superAdminController.approveCertificateTemplate); 
router.post('/rejectCertificateTemplate',authMiddleware,superAdminController.rejectCertificateTemplate); 
router.post('/deleteCertificateTemplate',authMiddleware,certificateController.deleteCertificateTemplate);


export default router;

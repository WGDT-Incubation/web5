import { Router } from "express";
import userController from '../controllers/userController';
import { userAuthMiddleware } from '../middleware/userMiddleware/authMiddleware';
const router = Router();

router.get('/userHealthCheck',(req,res)=>{
         res.status(200).json({
             code:200,
             error:false,
             message:"User health check is successful"
         })
})


router.post('/userLogin',userController.userLogin);
router.post('/generateUserOtp',userController.generateUserLoginOtp);


router.post('/getIdentity',userController.getIdentity);
router.get('/queryDID',userController.queryDID);
router.get('/getAllVerifierEmails',userAuthMiddleware,userController.getAllVerifierEmails);
router.post('/grantAccesstoVerifier',userAuthMiddleware,userController.grantAccesstoVerifier);
router.post('/getMultipleDIDDetails',userAuthMiddleware,userController.grantAccessToMultipleVerifiers);
router.post('/grantMultipleDIDAccesstoMultipleVerifier',userAuthMiddleware,userController.grantMultipleDIDAccesstoMultipleVerifier);
router.post('/removeAccessForDID',userAuthMiddleware,userController.removeAccessForDID);
router.post('/getVerifiersForDID', userAuthMiddleware,userController.getVerifiersForDID); 



export default router;

import { Router } from "express";
import verifierController from '../controllers/verifierController';
import authMiddleware from "../middleware/verifierMiddleware/authMiddleware";

const router = Router();

router.get('/verifierHealthCheck',(req,res)=>{
         res.status(200).json({
             code:200,
             error:false,
             message:"Verifier health check is successful"
         })
})

router.post('/signup',verifierController.signUp);
router.post('/login', verifierController.login); 
router.post('/forgotPassword',verifierController.forgotPassword); 
router.post('/resetPassword',verifierController.resetPassword);
router.post('/verifierLogin',authMiddleware,verifierController.verifierLogin);
router.post('/getAccessedDIDs',authMiddleware,verifierController.getAccessedDIDs); 
router.post('/getAccessedDIDDetails',verifierController.getAccessedDIDDetails); // fablo-token

router.post('/getDIDDetails',verifierController.getDIDDetails); 
router.post('/getAllDIDs',authMiddleware,verifierController.getAllDIDs);

router.post('/getMultipleDIDDetails',verifierController.getMultipleDIDDetails); //



export default router;

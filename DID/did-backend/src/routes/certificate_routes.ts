import { Router } from 'express';

import certificateController from '../controllers/certificateController';

const router = Router();

router.post('/addCertificate', certificateController.addCertificate);
router.get('/getAllCertificates', certificateController.getAllCertificates);
router.get('/getAllCertificatesParams', certificateController.getAllCertificatesParams);

router.post('/getCertificate', certificateController.getCertificate);
router.post('/getCertificateByName', certificateController.getCertificateByName);
router.post('/getCustomCertificate', certificateController.getCustomCertificate);


router.get('/getIndustrialcertificate', certificateController.getIndustrialCertificateTemplate);
router.post('/customIndustrialcertificate', certificateController.customIndustrialcertificate);

router.get('/getBirthCertificate',certificateController.getBirthCertificateTemplate);
router.post('/customBirthCertificate',certificateController.customBirthCertificate);

router.get('/getIncomeCertificateTemplate',certificateController.getIncomeCertificateTemplate);
router.post('/customIncomeCertificate',certificateController.customIncomeCertificate);

router.get('/getBonafideCertificateTemplate',certificateController.getBonafideCertificateTemplate);
router.post('/customBonafideCertificate',certificateController.customBonafideCertificate);

router.get('/getCasteCertificateTemplate',certificateController.getCasteCertificateTemplate);
router.post('/customCasteCertificate',certificateController.customCasteCertificate);

router.get('/getCharacterCertificateTemplate',certificateController.getCharacterCertificateTemplate);
router.post('/customCharacterCertificate',certificateController.customCharacterCertificate);

router.get('/getDomicileCertificateTemplate',certificateController.getDomicileCertificateTemplate);
router.post('/customDomicileCertificate',certificateController.customDomicileCertificate);

router.get('/getMedicalCertificateTemplate',certificateController.getMedicalCertificateTemplate);
router.post('/customMedicalCertificate',certificateController.customMedicalCertificate);

router.get('/getMigrationCertificateTemplate',certificateController.getMigrationCertificateTemplate);
router.post('/customMigrationCertificate',certificateController.customMigrationCertificate);

router.get('/getFamilyCertificateTemplate',certificateController.getFamilyCertificateTemplate);
router.post('/customFamilyCertificate',certificateController.customFamilyCertificate);


router.get('/getCertificateParams', certificateController.getCertificateParams);





export default router;

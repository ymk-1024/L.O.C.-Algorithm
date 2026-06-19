import { Router } from 'express';
import sitDataHandler from '../handler/sitDataHandler.mjs';
import { validateSitDataCreation } from '../middleware/validationMiddleware.mjs';
import authMiddleware from '../middleware/authMiddleware.mjs';

const sitData = Router();

// 読み取り系：認証不要
sitData.get('/', sitDataHandler.getAllSitData);
sitData.get('/:uuid', sitDataHandler.getSitDataById);

// 書き込み系：JWT 認証必須
sitData.post('/',        authMiddleware.autoRefreshAuth, validateSitDataCreation, sitDataHandler.createSitData);
sitData.put('/:uuid',   authMiddleware.autoRefreshAuth, sitDataHandler.updateSitData);
sitData.delete('/:uuid', authMiddleware.autoRefreshAuth, sitDataHandler.deleteSitData);

export default sitData;

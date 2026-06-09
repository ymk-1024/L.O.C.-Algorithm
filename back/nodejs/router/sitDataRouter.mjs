import { Router } from 'express';
import sitDataHandler from '../handler/sitDataHandler.mjs';
import { validateSitDataCreation } from '../middleware/validationMiddleware.mjs';

const sitData = Router();

sitData.get('/', sitDataHandler.getAllSitData);
sitData.get('/:uuid', sitDataHandler.getSitDataById);
sitData.post('/', validateSitDataCreation, sitDataHandler.createSitData);
sitData.put('/:uuid', sitDataHandler.updateSitData);
sitData.delete('/:uuid', sitDataHandler.deleteSitData);

export default sitData;

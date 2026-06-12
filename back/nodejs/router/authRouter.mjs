import { Router } from 'express';
import authHandler from '../handler/authHandler.mjs';
import authMiddleware from '../middleware/authMiddleware.mjs';

const auth = Router();

auth.post('/login', authHandler.login);
auth.get('/me', authMiddleware.verifyCookie, authHandler.me);
auth.post('/logout', authMiddleware.verifyCookie, authHandler.logout);

export default auth;

import { Router } from 'express';
import devicesRouter from './devices.route.js';
import timersRouter from './timers.route.js';
import lightChannelsRouter from './lightChannels.route.js';

const router = Router();

// Mount sub-routers
router.use('/devices', devicesRouter);
router.use('/timers', timersRouter);
router.use('/lightChannels', lightChannelsRouter);

export default router;

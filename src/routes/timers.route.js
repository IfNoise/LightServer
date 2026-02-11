import { Router } from 'express';
import TimerController from '../controllers/TimerController.js';

const router = Router();

// RESTful endpoints
router.get("/", TimerController.getAllTimers);
router.post("/", TimerController.createTimer);
router.get("/:name", TimerController.getTimer);
router.patch("/:name", TimerController.updateTimer);
router.put("/:name", TimerController.replaceTimer);
router.delete("/:name", TimerController.deleteTimer);

// Timer actions
router.post("/:name/subscribe", TimerController.subscribeChannels);
router.post("/:name/unsubscribe", TimerController.unsubscribeChannels);
router.post("/:name/start", TimerController.startTimer);
router.post("/:name/stop", TimerController.stopTimer);

// Legacy endpoints for backwards compatibility
router.post("/add", TimerController.addTimer);
router.post("/remove", TimerController.removeTimer);
router.post("/:name/setSteps", TimerController.setSteps);
router.post("/:name/setSunriseTime", TimerController.setSunriseTime);
router.post("/:name/setSunsetTime", TimerController.setSunsetTime);
router.post("/:name/setStepTime", TimerController.setStepTime);

export default router;


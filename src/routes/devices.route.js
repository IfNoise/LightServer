import { Router } from 'express';
import DeviceController from '../controllers/DeviceController.js';

const router = Router();

// RESTful endpoints
router.get("/", DeviceController.getAllDevices);
router.post("/", DeviceController.createDevice);
router.get("/:name", DeviceController.getDevice);
router.patch("/:name", DeviceController.updateDevice);
router.put("/:name", DeviceController.replaceDevice);
router.delete("/:name", DeviceController.deleteDevice);
router.get("/:name/state", DeviceController.getDeviceState);

// Legacy endpoint for backwards compatibility - use POST / instead
router.post("/add", DeviceController.createDevice);

export default router;



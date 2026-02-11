import { Router } from "express";
import ChannelController from "../controllers/ChannelController.js";

const router = Router();

// RESTful: Get all channels
router.get("/", ChannelController.getAllChannels);
router.get("/state", ChannelController.getAllChannelsState);
router.post("/", ChannelController.createChannel);
router.get("/:name", ChannelController.getChannel);
router.get("/:name/state", ChannelController.getChannelState);
router.patch("/:name", ChannelController.updateChannel);
router.put("/:name", ChannelController.replaceChannel);
router.delete("/:name", ChannelController.deleteChannel);

// Legacy endpoints for backwards compatibility
router.post("/add", ChannelController.addChannel);
router.post("/remove", ChannelController.removeChannel);
router.post("/:name/setMaxLevel", ChannelController.setMaxLevel);
router.post("/:name/setPort", ChannelController.setPort);
router.post("/:name/setDevice", ChannelController.setDevice);

export default router;

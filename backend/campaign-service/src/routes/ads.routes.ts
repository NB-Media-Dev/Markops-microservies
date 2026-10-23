import { Router } from "express";
import {
  getAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd
} from "../controllers/ads.controller.js";

const router = Router();

router.get("/ads", getAds);
router.get("/ads/:id", getAdById);
router.post("/ads", createAd);
router.put("/ads/:id", updateAd);
router.patch("/ads/:id", updateAd);
router.delete("/ads/:id", deleteAd);


router.get("/campaigns/:campaignId/ads", (req, _res, next) => {
  req.query.campaignId = req.params.campaignId;
  next();
}, getAds);

export default router;


import express from "express";
import { logout, login, signup, onboard} from "../controllers/auth.controllers.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", (req, res) => {
    res.send("Welcome to my project!!!");
});

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboard);

// checkis user is logged in or not
router.get("/me",protectRoute, (req, res) => {
    res.status(200).json({ success: true, user: req.user});
});

export default router;
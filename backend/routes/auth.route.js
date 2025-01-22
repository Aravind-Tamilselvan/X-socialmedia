import express from "express"

import { signup, login, logout, getMe } from "../controllers/auth.controllers.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router()

router.post("/signup",signup)
router.post("/login",login)
router.post("/logout",logout)
router.get("/me",protectRoute,getMe)





export default router;
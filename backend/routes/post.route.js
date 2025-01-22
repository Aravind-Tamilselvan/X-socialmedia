import express from "express"

import protectRoute from "../middleware/protectRoute.js"
import { createPost, deletePost, commentPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts } from "../controllers/post.controller.js"

const router = express.Router()

router.get("/all",protectRoute,getAllPosts)
router.get("/following",protectRoute,getFollowingPosts)
router.get("/likes/:id",protectRoute,getLikedPosts)
router.post("/create",protectRoute,createPost)
router.post("/:id",protectRoute,deletePost)
router.post("/comment/:id",protectRoute, commentPost)
router.post("/like/:id",protectRoute, likeUnlikePost)


export default router
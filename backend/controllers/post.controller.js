import Post from "../models/post.model.js"
import User from "../models/user.model.js"
import cloudinary from "cloudinary"

export const createPost = async (req, res) => {
    try {
        const { text } = req.body
        let { img } = req.body
        const userId = req.user._id.toString()

        const user = await User.findOne({ _id: userId })
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        if (!text && !img) {
            return res.status(400).json({ error: "Post must have text or image" })
        }

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img)
            img = uploadedResponse.secure_url
        }
        const newPost = new Post({
            user: userId,
            text,
            img
        })
        await newPost.save()
        res.status(201).json(newPost)

    } catch (error) {
        console.log(`Error in post controller : ${error}`)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        if (!post) {
            return res.status(404).json({ error: "Post not found" })
        }

        if (post.user.toString() !== req.user._id.toString()) { //checks if the post belongs to requested user
            return res.status(401).json({ error: "You are unauthorised to access the post" })
        }

        if (post.img) { //delete the post in cloudinary
            const imgId = post.img.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(imgId)
        }
        await Post.findByIdAndDelete(req.params.id) //delete the post in mongo db
        res.status(200).json({ message: "Post deleted successfully" })
    } catch (error) {
        console.log(`Error in deleting post controller: ${error}`)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const commentPost = async (req, res) => { //comment posts functions
    try {
        const { text } = req.body
        const postId = req.params.id
        const userId = req.user._id
        if (!text) {
            return res.status(400).json({ error: "Comment text is required" })
        }

        const post = await Post.findOne({ _id: postId })
        if (!post) {
            return res.status(404).json({ error: "Post not found" })
        }

        const comment = {
            user: userId,
            text
        }

        post.comments.push(comment)
        await post.save()
        res.status(200).json(post)
    } catch (error) {
        console.log(`Error in comment controller : ${error}`)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const likeUnlikePost = async (req, res) => { //like and unlike posts function
    try {
        const userId = req.user._id
        const { id: postId } = req.params

        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({ error: "Post not found" })
        }

        const userLikedPost = post.likes.includes(userId)

        if (userLikedPost) {
            //unlike post
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } })
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } })

            const updatedLikes = post.likes.filter((id)=> id.toString() !== userId.toString())
            res.status(200).json(updatedLikes)
        } else {
            post.likes.push(userId)
            await User.updateOne({_id: userId}, {$push: {likedPosts: postId}})
            await post.save()

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like"
            })
            await notification.save()

            const updatedLikes = post.likes
            res.status(200).json(updatedLikes)
        }
    } catch (error) {
        console.log(`Error in like and unlike controller: ${error}`)
        res.status(400).json({ error: "Internal server error" })
    }
}

export const getAllPosts = async (req, res) => { //gets all posts posted by the user
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).populate({
            path: "user",
            select: "-password"
        })
            .populate({
                path: "comments.user",
                select: ["-password", "-email", "-followers", "-following", "-bio", "-link"]
            })
        if (posts.length === 0) {
            return res.status(200).json([])
        }
        res.status(200).json(posts)
    } catch (error) {
        console.log(`Error in get all posts controller: ${error}`)
        res.status(500).json({ error: "Internal server error" })
    }
}

export const getLikedPosts = async (req,res) => { //gets user liked posts
    try {
        const userId = req.params.id
        const user = await User.findById({_id :userId})
        if(!user){
            return res.status(404).json({error:"User not found"})
        }
        const likedPosts = await Post.find({_id: {$in: user.likedPosts}})
                    .populate({
                        path: "user",
                        select : "-password"
                    })
                    .populate({
                        path : "comments.user",
                        select: ["-password", "-email", "-followers", "-following", "-bio", "-link"]
                    })
        res.status(200).json(likedPosts)
    } catch (error) {
        console.log(`Error in get liked posts controller: ${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}

export const getFollowingPosts = async(req,res) =>{ //gets user's followers' posts
    try {
        const userId = req.user._id
        const user = await User.findById({_id: userId})
        if(!user){
            return res.status(404).json({error :"user not found"})
        }
        const following = user.following

        const feedPosts = await Post.find({user : {$in : following}})
                          .sort({createdAt : -1})
                          .populate({
                            path : "user",
                            select : "-password"
                          })
                          .populate({
                            path : "comments.user",
                            select: "-password"
                          })
        res.status(200).json(feedPosts)
    } catch (error) {
        console.log(`Error in get following posts controller: ${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}

export const getUserPosts = async(req,res) =>{ //get posts posted by user
    try {
        const {username} = req.params
        const user = await User.findOne({username})
        if(!user){
            return res.status(404).json({error:"User not found"})
        }
        const posts = await Post.find({user : user._id}
                    .sort({createdAt : -1})
                    .populate({
                        path : "user",
                        select : "-password"
                      })
                      .populate({
                        path : "comments.user",
                        select: "-password"
                      })
        )
        res.status(200).json(posts)
    } catch (error) {
        console.log(`Error in get following posts controller: ${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}


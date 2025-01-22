import User from "../models/user.model.js"
import notification from "../models/notification.model.js"
import bcrypt from "bcryptjs"
import cloudinary from "cloudinary"

export const getProfile = async(req,res)=>{
    try {
        const {username} = req.params;
        const user = await User.findOne({username}).select("-password")

        if(!user){
            return res.status(404).json({error: "User not found"})
        }
        
        res.status(200).json(user)
    } catch (error) {
        console.log(`Error in get user profile controller: ${error}`)
        res.status(500).json({error: "Internal server error"})
    }
}

export const followUnFollowUser = async(req,res)=>{
    try {
        const {id} = req.params;
        const userToModify = await User.findById(id)
        const currentUser = await User.findById(req.user._id)

        if(id===req.user._id.toString()){
            return res.status(400).json({error:"You can't unfollow/follow yourself"})
        }

        if(!userToModify || !currentUser){
            return res.status(404).json({error: "User not found"})
        }

        const isFollowing = currentUser.following.includes(id)

        if(isFollowing){
            //unfollow
            await User.findByIdAndUpdate(id,{$pull:{followers: req.user._id}})
            await User.findByIdAndUpdate( req.user._id,{$pull: {following: id}})
            res.status(200).json({message:"Unfollowed Successfully"})
        }else{
            //follow
            await User.findByIdAndUpdate(id,{$push:{followers:req.user._id}})
            await User.findByIdAndUpdate( req.user._id,{$push :{following:id}})
            //notification
            const newNotification = new notification({
                type : "follow",
                from : req.user._id,
                to : userToModify._id
            })
            await newNotification.save()
            res.status(200).json({message:"User followed Successfully"})
        }
    } catch (error) {
        console.log(`Error in follow and unfollow controller: ${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}

export const getSuggestedUsers = async(req,res)=>{  //relearn this function
    try {
        const userId = req.user._id
        const userFollowedByMe = await User.findById({_id:userId}).select("-password")

        const users = await User.aggregate([
            {
                $match : {
                    _id : {$ne : userId}
                }
            },{
                $sample : {
                    size : 10
                }
            }
        ])
        const filteredUser = users.filter((user)=>!userFollowedByMe.following.includes(user._id))
        const suggestedUsers = filteredUser.slice(0,4)
        res.status(200).json(suggestedUsers)

        suggestedUsers.forEach((user)=>(user.password)=null)
    } catch (error) {
        console.log(`Error in getSuggestUsers controller: ${error}`)
        res.status(500).json({error:"Internal server error"}) 
    }
}

export const updateUser = async(req,res)=>{
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
}
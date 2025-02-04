import jwt from "jsonwebtoken";
import User from "../models/user.model.js"

const protectRoute = async(req,res,next)=>{
    try {
        const token = req.cookies.jwt; //converts requested cookie into a json web token 
        if(!token){ 
            return res.status(400).json({error:"Unauthorised: No token Provided"}) 
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET); // verify whether the token matches with our JWT_SECRET key
        if(!decoded){
            return res.status(400).json({error:"Unauthorised: Invalid token"})
        }

        const user = await User.findOne({_id: decoded.userId}).select("-password");//find whether the user id exists in decoded token
        if(!user){
            return res.status(400).json({error:"User not found"})
        }
        req.user = user
        next(); //Finishes this try block and calls the next function (getMe function)
    } catch (error) {
        console.log(`Error in protectRoute middleware:${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}

export default protectRoute
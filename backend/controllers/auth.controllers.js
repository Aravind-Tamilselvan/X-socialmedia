import User from "../models/user.model.js"
import generateToken from "../utils/generateToken.js"

import bcrypt from "bcryptjs"

export const signup = async(req,res)=>{
    try {
        const {username,fullName,email,password} = req.body

        const emailRegex = /^[^@]+@[^@]+\.[^@]+$/
        if(!emailRegex.test(email)){
            return res.status(400).json({error:"Invalid Email Format"})
        }
        
        const existingUser = await User.findOne({email : email})//check the existing user with user email
        if(existingUser){
            return res.status(400).json({error:"Already Existing User or email"})
        }

        if(password.length < 6){
            return res.status(400).json({error:"Password must have atleast 6 char length"})
        }

        //hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            username : username,
            fullName : fullName,
            email : email,
            password : hashedPassword
        })

        if(newUser){
            generateToken(newUser._id, res)
            await newUser.save()
            res.status(200).json({message:"User created successfully"})
        }else{
            res.status(400).json({error:"Invalid user data"})
        }

    } catch (error) {
        console.log(`Error in signup controller: ${error}`)
        res.status(500).json({error:"Internal Server error"})
    }
}

export const login = async(req,res)=>{
    try {
        console.log(req.body)
        const {username, password} = req.body
        const user = await User.findOne({username})
        const isPasswordCorrect = await bcrypt.compare(password,user?.password ||"") 

        if(!user||!isPasswordCorrect){
            return res.status(400).json({error:"Invalid username or password"})
        }

        generateToken(user._id,res);

        res.status(200).json({message:`${user._id} user id login successful`})
    } catch (error) {
        console.log(`Error in login controller: ${error}`)
        res.status(500).json({error:"Internal Server error"})
    }
}

export const logout = async (req,res)=>{
    try {
        res.cookie("jwt","",{maxAge : 0})
        res.status(200).json({message:"Logout successful"})
    } catch (error) {
        console.log(`Error in logout controller: ${error}`)
        res.status(500).json({error:"Internal Server error"})
    }
}

export const getMe = async(req,res)=>{
    try {
        const user = await User.findOne({_id : req.user._id})
        res.status(200).json(user)
    } catch (error) {
        console.log(`Error in getMe controller: ${error}`)
        res.status(500).json({error:"Internal Server error"})
    }
}
import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true
    },

    fullName : {
        type : String,
        required : true
    },

    email : {
        type : String,
        required : true,
        unique : true
    },

    password : {
        type : String,
        required : true,
        minLength : 6
    },

    followers : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            default : []
        }
    ],

    following : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User",
            default : []
        }
    ],

    profileImg : {
        type : String,
        default :""
    },

    coverImg : {
        type : String,
        default :""
    },

    bio : {
        type : String,
        default :""
    },

    link : {
        type : String,
        default :""
    },

    likedPosts : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Post",
            default : []
        }
    ]
},{timestamps: true}) //timestamps : mongodb function which stores the date and time when user is created or updated the profile

const User = mongoose.model("User",UserSchema)
export default User
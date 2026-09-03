import { apiErrors } from "../utils/apiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
import { model } from "mongoose";


export const verifyJwt = asyncHandler(async(req , res , next) =>{
 try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
   if(!token){
       throw new apiErrors(401, "Unauthorized request")
   }
     const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
   
   const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
   if(!user){
       throw new apiErrors(400,"invalid acccess token")
   }
   
   req.user = user;
   next()
 } catch (error) {
    throw new apiErrors(401, error?.message || "invalid access token")
 }
}) 


import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {apiErrors} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user._id
    //TODO: toggle like on video

    if(!isValidObjectId(videoId)){
        throw new apiErrors(400,"Invalid VideoId")
    }

    if(!userId){
        throw new apiErrors(400,"userId is required")
    }

    const like = await Like.findOne({
        video : videoId,
        likedBy : userId,
    })

    let action
    
    if(like){
        await Like.findByIdAndDelete(like._id)
        action = "unLiked"
    }else{
        await Like.create({
            video : videoId,
            likedBy : userId
        })
        action = "Liked"
    }

    const likeCount = await Like.countDocuments({ video: videoId })

    return res
    .status(200)
    .json(
        new apiResponse(200,{likeCount},`Video ${action} Successfully`)
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user._id
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new apiErrors(400,"Invalid commentId")
    }

    if(!userId){
        throw new apiErrors(400,"UserId is required")
    }

    const like = await Like.findOne({
        comment : commentId,
        likedBy : userId
    })

    let action;

    if(like){
        await Like.findByIdAndDelete(like._id)
        action = "unLiked"
    }
    else{
        await Like.create({
            comment : commentId,
            likedBy : userId
        })
        action = "Liked"
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{},`Comment ${action} successfully`)
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const {tweetId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(tweetId)){
        throw new apiErrors(400,"Invalid tweetId")
    }

    if(!userId){
        throw new apiErrors(400,"UserId is required")
    }

    const like = await Like.findOne({
        tweet : tweetId,
        likedBy : userId
    })

    let action;

    if(like){
        await Like.findByIdAndDelete(like._id)
        action = "unLiked"
    }
    else{
        await Like.create({
            tweet : tweetId,
            likedBy : userId
        })
        action = "Liked"
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{},`Tweet ${action} successfully`)
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    if(!userId){
        throw new apiErrors(400,"UserId is required")
    }

    const likedVideos = await Like.find({
        likedBy : userId
    })

    return res
    .status(200)
    .json(
        new apiResponse(200,likedVideos,"Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
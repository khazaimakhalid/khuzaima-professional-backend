import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {apiErrors} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user._id;

    if(!isValidObjectId(channelId)){
        throw new apiErrors(400,"Invalid channelId")
    }

    if(channelId.toString() === subscriberId.toString()){
        throw new apiErrors(400,"You cannot subscribe/unsubscribe to your own channel")
    }

    const channel = await User.findById(channelId); 
    if (!channel) {
        throw new apiErrors(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    let action; // To track if we subscribed or unsubscribed

    if (existingSubscription) {
        // If subscribed, DELETE the document (Unsubscribe)
        await Subscription.findByIdAndDelete(existingSubscription._id);
        action = "Unsubscribed";
    } else {
        // If not subscribed, CREATE a new document (Subscribe)
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        action = "Subscribed";
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,{ subscribed: !existingSubscription },`${action} successfully`)
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new apiErrors(400,"Invalid channelId")
    }

    const channelSubscriber = await Subscription.find({channel : channelId}).populate("subscriber" , "username avatar")

    if(channelSubscriber.length === 0){
        throw new apiErrors(400,"No Subscriber Found")
    }

    return res.status(200).json(new apiResponse(200,channelSubscriber,"ChannelSubscriber Fetched SuccessFully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const  {subscriberId}  = req.params

    if(!isValidObjectId(subscriberId)){
        throw new apiErrors(400,"Invalid subscriberId")
    }

    const subscribedchannel = await Subscription.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            fullName : 1,
                            avatar : 1,
                            createdAt : 1,
                            _id : 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$channelDetails"
        },
        {
            $project : {
                _id : 0,
                channel : "$channelDetails",
                subscribedAt : "$createdAt"
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200,subscribedchannel,"Subscriber details fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
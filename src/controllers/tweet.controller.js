import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiErrors } from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const {content} = req.body;
  const userId = req.user.id;

  if (!content) {
    throw new apiErrors(400, "Content is required");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: userId,
  });

  if (!tweet) {
    throw new apiErrors(400, "tweet is not created");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweet, "Tweet is uploaded successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate userId
  if (!userId) {
    throw new apiErrors(401, "User is not authenticated");
  }

  const tweets = await Tweet.aggregate([
    {
      // Match tweets by the owner ID
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },

    // Owner Lookup
    {
      // Get Owner Details
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },

    // Likes Count Lookup
    {
      // Get total likes for each tweet
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },

    {
     
      $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: {
          // Check if the current user has liked the tweet
          $in: [new mongoose.Types.ObjectId(userId), "$likes.likedBy"],
        },
      },
    },
    {
      $project: {
        // Final output fields
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        likesCount: 1,
        commentsCount: 1,
        isLiked: 1,
      },
    },
    {
      // Sort by creation date
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  // Return Response
  if (!tweets || tweets.length === 0) {
    return res
      .status(200)
      .json(new apiResponse(200, [], "No tweets found for this user"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const {tweetId} = req.params
  const {content} = req.body

  if(!isValidObjectId(tweetId)){
    throw new apiErrors(400,"tweetId is required")
  }

  if(!content){
    throw new apiErrors(400,"TweetContent is required")
  }

  const tweet = await Tweet.findById(tweetId)

  if(!tweet){
    throw new apiErrors(404,"tweet is missing")
  }

  // Authorization Check
  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new apiErrors(403, "You are not authorized to update this tweet");
  }

  const updatedTweet = await  Tweet.findByIdAndUpdate(
    tweetId,
    {
      content : content
    },
    {
      new : true,
      runValidators: true
    }
  )

  if(!updatedTweet){
    throw new apiErrors(500,"Unable to update the tweet !")
  }

  return res.
  status(200)
  .json(
    new apiResponse(200,updatedTweet,"Tweet updated Successfully")
  )
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const {tweetId} = req.params

  if(!isValidObjectId(tweetId)){
    throw new apiErrors(400,"Invalid tweetId")
  }

  const tweet = await Tweet.findById(tweetId)

  if(!tweet){
    throw new apiErrors(404,"Unable to find tweet")
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new apiErrors(403, "You are not authorized to delete this tweet");
  }

  const deleteTweetDoc = await Tweet.findByIdAndDelete(tweetId)

  if(!deleteTweetDoc){
    throw new apiErrors(500,"Unable to delete Tweet")
  }



  return res
  .status(200)
  .json(
    new apiResponse(200,deleteTweetDoc,"Tweet Deleted Successfully")
  )
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
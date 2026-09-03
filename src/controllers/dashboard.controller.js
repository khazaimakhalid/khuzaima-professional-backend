import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { apiErrors} from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // Get Channel ID from the logged-in user
  const channelId = req.user._id;

  // Aggregation Pipeline to calculate all stats in one query
  const stats = await Video.aggregate([
    {
      // Filter videos belonging to the current channel
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      // Group all videos to calculate total views and collect video IDs
      $group: {
        _id: null,
        totalVideoViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
        videoIds: { $push: "$_id" },
      },
    },
    // Total Subscribers
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id", // Dummy field, as we match on channel field below
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $match: {
              channel: new mongoose.Types.ObjectId(channelId),
            },
          },
        ],
      },
    },
    // Total Likes across all videos
    {
      $lookup: {
        from: "likes",
        localField: "videoIds", // Use collected video IDs from Stage 2
        foreignField: "video",
        as: "totalLikes",
      },
    },
    
    {
      $project: {
        _id: 0,
        totalSubscribers: { $size: "$subscribers" },
        totalVideos: 1,
        totalVideoViews: 1,
        totalLikes: { $size: "$totalLikes" },
      },
    },
  ]);

  // Check if the channel even exists
  if (!stats.length) {
    
    return res.status(200).json(
      new apiResponse(
        200,
        {
          totalSubscribers: 0,
          totalVideos: 0,
          totalVideoViews: 0,
          totalLikes: 0,
        },
        "Channel stats fetched successfully with zero counts"
      )
    );
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, stats[0], "Channel statistics fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
 
  const channelId = req.user._id; // Get the ID of the logged-in channel owner
  const { page = 1, limit = 10 } = req.query;

  if (!channelId) {
    // This check is mostly redundant if verifyJWT works, but good for safety
    throw new apiErrors(401, "Channel ID not found. User is not authenticated.");
  }

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // 2. Define the Aggregation Pipeline
  const pipeline = [
    {
      // Match videos belonging to the current channel owner
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },

    {
      // Sort by creation date (newest first)
      $sort: {
        createdAt: -1,
      },
    },
    {
     
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
      },
    },
  ];

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: pageNumber,
    limit: limitNumber,
    customLabels: {
      docs: "videos",
    },
  };

  const result = await Video.aggregatePaginate(videoAggregate, options);

  
  return res
    .status(200)
    .json(new apiResponse(200, result, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
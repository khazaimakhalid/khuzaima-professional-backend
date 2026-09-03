import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import {apiErrors } from "../utils/apiErrors.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new apiErrors(400, "Invalid videoId");
  }

  // Convert page and limit to numbers
  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const comment = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        owner: 1,
      },
    },
  ]);

  const options = {
    page: pageNumber,
    limit: limitNumber,
    customLabels: {
      docs: "comments",
    },
  };

  const result = await Comment.aggregatePaginate(comment, options);

  return res
    .status(200)
    .json(new apiResponse(200, result, "Video comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new apiErrors(400, "Invalid videoId");
  }

  if (!content) {
    throw new apiErrors(400, "Content is required");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new apiErrors(500, "Unable to find comment");
  }

  return res
    .status(201)
    .json(new apiResponse(201, comment, "Comment Created Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id

  if (!isValidObjectId(commentId)) {
    throw new apiErrors(400, "Invalid commentId");
  }

  if (!content) {
    throw new apiErrors(400, "Content is required");
  }

  const comment = await Comment.findById(commentId)

  if(!comment){
    throw new apiErrors(404,"Comment not found")
  }

  if(comment.owner.toString() !== userId.toString()){
    throw new apiErrors(403, "You are not authorized to update this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
        $set : {content : content}
    },
    {
        new : true,
        runValidators : true,
    }
  );

  if(!updatedComment){
    throw new apiErrors(500,"Unable to update comment")
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const {commentId} = req.params
  const userId = req.user._id

  if(!isValidObjectId(commentId)){
    throw new apiErrors(400,"Invalid commentId")
  }

  const comment = await Comment.findById(commentId)

  if(!comment){
    throw new apiErrors(404,"Comment not found")
  }

  if(comment.owner.toString() !== userId.toString()){
    throw new apiErrors(403, "You are not authorized to delete this comment");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId)

  if(!deleteComment){
    throw new apiErrors(500,"Unable to delete comment")
  }

  //await Like.deleteMany({ comment: commentId });

  return res
    .status(200)
    .json(new apiResponse(200, deleteComment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
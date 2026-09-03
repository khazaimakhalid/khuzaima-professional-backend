import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {apiErrors} from "../utils/apiErrors.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user._id

    //TODO: create playlist
    if(!(name && description)){
        throw new apiErrors(400,"name and description is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner : userId
    })

    if(!playlist){
        throw new apiErrors(500,"Unable to create playlist")
    }
    
    return res
    .status(201)
    .json(
        new apiResponse(201,playlist,"Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new apiErrors(400,"Invalid userId")
    }

    const playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos",
                pipeline : [
                    {
                        $project : {
                            thumbnail : 1,
                            duration : 1,
                            views : 1
                        }
                    }
                ]
            }
        },
        {
            $project : {
                _id: 1,
                name: 1,
                description: 1,
                createdAt: 1,
                totalVideos: { $size: "$videos" }, // Calculate video count
                totalViews: { $sum: "$videos.views" }, // Calculate total views
                // Show the first video's thumbnail as playlist thumbnail (optional)
                firstVideoThumbnail: { $first: "$videos.thumbnail" }
            }
        },
    ])

    return res
    .status(200)
    .json(
        new apiResponse(200, playlists, "User Playlists fetched Successfully")
    );
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new apiErrors(400,"Invalid playlistId")
    }

    // Aggregation Pipeline to fetch detailed playlist information
    const playlist = await Playlist.aggregate([
        {
            // Match the playlist by its ID
            $match : {
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },
        // Join with the Video collection to get details of all videos in the playlist
        {
            $lookup : {
                from : "videos",
                localField : "videos", // The array of video IDs in the Playlist model
                foreignField : "_id",
                as : "videos",
                pipeline : [
                    {
                        // Exclude unpublished videos from the playlist view
                        $match: { isPublished: true }
                    },
                    // Project only necessary video fields
                    {
                        $project : {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1,
                            createdAt: 1,
                        }
                    }
                ]
            }
        },
        {
            // Join with the User collection to get the playlist owner's details
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            fullName : 1,
                            username : 1,
                            avatar : 1,
                        }
                    }
                ]
            },
        },
        {
            $unwind : "$owner"
        },
        // Final projection to shape the output document
        {
            $project : {
                name : 1,
                description : 1,
                createdAt : 1,
                updatedAt : 1,
                owner : 1,
                videos : 1, // Array of detailed video objects
                totalVideos: { $size: "$videos" }, // Calculate total videos count
                totalViews: { $sum: "$videos.views" }, // Sum up views of all videos
            }
        }
    ])

    if(!playlist.length){
        throw new apiErrors(404, "Playlist not found");
    }

    //console.log(" UPDATED PLAYLIST:", playlist[0]);
    //console.log(" UPDATED VIDEO IDS:", playlist[0]?.videos);

    return res
    .status(200)
    .json(
        new apiResponse(200,playlist[0],"Playlist fetched Successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const userId = req.user._id // Get current logged-in user ID

    if(!isValidObjectId(playlistId)){
        throw new apiErrors(400,"Invalid PlaylistId")
    }

    if(!isValidObjectId(videoId)){
        throw new apiErrors(400, "Invalid videoId")
    }

    // Ownership and Existence Check (Crucial Security Step)
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found"); 
    }

    if (playlist.owner.toString() !== userId.toString()) {
        throw new apiErrors(403, "You are not authorized to add video to this playlist");
    }

    // Add video to playlist using $addToSet
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos: videoId } // also use $push to add video but addToSet insure duplication
        },
        {
            new : true
        }
    )

    //console.log(" UPDATED PLAYLIST:", updatedPlaylist);
    //console.log(" UPDATED VIDEO IDS:", updatedPlaylist?.videos);

    if(!updatedPlaylist){
        throw new apiErrors(500,"error while add video to the playlist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const userId = req.user._id
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId)){
        throw new apiErrors(400,"Invalid PlaylistId")
    }

    if(!isValidObjectId(videoId)){
        throw new apiErrors(400, "Invalid videoId")
    }

    // Ownership and Existence Check (Crucial Security Step)
    // Find the playlist first to check its existence and owner
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found"); 
    }

    // Check if the logged-in user is the owner of the playlist
    if (playlist.owner.toString() !== userId.toString()) {
        throw new apiErrors(403, "You are not authorized to remove video from this playlist");
    }

    // Remove video from playlist using $pull
    const updatedplaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        {
            new : true
        }
    )

    if(!updatedplaylist){
        throw new apiErrors(500,"error while remove video from the playlist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, updatedplaylist, "Video removed from playlist successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const userId = req.user._id; // Get current logged-in user ID
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new apiErrors(400,"Invalid PlaylistId")
    }

    // Find the playlist for existence and ownership check
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found");
    }

    //  Authorization Check 
    if (playlist.owner.toString() !== userId.toString()) {
        throw new apiErrors(403, "You are not authorized to delete this playlist");
    }

    // Delete Playlist from Database
    const deleteplaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deleteplaylist){
        throw new apiErrors(500,"Failed to delete playlist from database")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, deleteplaylist, "Playlist deleted successfully")
    )
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const userId = req.user._id; // Get current logged-in user ID

    if (!isValidObjectId(playlistId)) {
        throw new apiErrors(400, "Invalid playlistId");
    }

    // Check if at least one field is provided 
    if (!name && !description) {
        throw new apiErrors(400, "Please provide either name or description to update");
    }

    // Find for Ownership and Existence Check
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new apiErrors(404, "Playlist not found"); 
    }

    //  Authorization Check
    if (playlist.owner.toString() !== userId.toString()) {
        throw new apiErrors(403, "You are not authorized to update this playlist");
    }

    // Prepare update object using $set for partial update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;

    // 4. Update Playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: updateFields, // Use $set for robust partial update
        },
        {
            new: true,
            runValidators: true // Ensure updated data meets schema requirements
        }
    );

    if (!updatedPlaylist) {
        throw new apiErrors(500, "Failed to update playlist in database");
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, updatedPlaylist, "Playlist updated successfully")
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/apierror.js"
import { ApiResponse } from "../utils/apiresponce.js"
import { asyncHandler } from "../utils/asynchandler.js"


// POST /api/v1/likes/toggle/v/:videoId
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

    const existingLike = await Like.findOne({ video: videoId, likedBy: req.user._id })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Video unliked"))
    }

    await Like.create({ video: videoId, likedBy: req.user._id })
    return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Video liked"))
})


// POST /api/v1/likes/toggle/c/:commentId
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) throw new ApiError(400, "Invalid commentId")

    const existingLike = await Like.findOne({ comment: commentId, likedBy: req.user._id })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Comment unliked"))
    }

    await Like.create({ comment: commentId, likedBy: req.user._id })
    return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Comment liked"))
})


// POST /api/v1/likes/toggle/t/:tweetId
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweetId")

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: req.user._id })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Tweet unliked"))
    }

    await Like.create({ tweet: tweetId, likedBy: req.user._id })
    return res.status(200).json(new ApiResponse(200, { isLiked: true }, "Tweet liked"))
})


// GET /api/v1/likes/videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    { $match: { isPublished: true } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                { $project: { fullName: 1, username: 1, avatar: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$owner" },
                    { $project: { videoFile: 1, thumbnail: 1, title: 1, description: 1, views: 1, duration: 1, owner: 1, createdAt: 1 } }
                ]
            }
        },
        { $unwind: "$videoDetails" },
        { $replaceRoot: { newRoot: "$videoDetails" } }
    ])

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})


export { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike }

import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/apierror.js"
import { ApiResponse } from "../utils/apiresponce.js"
import { asyncHandler } from "../utils/asynchandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"


// GET /api/v1/videos?page=1&limit=10&query=keyword&sortBy=createdAt&sortType=desc&userId=xxx
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query

    const pipeline = []

    // Filter by owner if userId provided
    if (userId) {
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId")
        pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } })
    }

    // Only published videos unless it's the owner
    pipeline.push({ $match: { isPublished: true } })

    // Full-text search on title/description
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        })
    }

    // Populate owner info
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { $project: { fullName: 1, username: 1, avatar: 1 } }
                ]
            }
        },
        { $unwind: "$ownerDetails" }
    )

    // Sort
    const sortDir = sortType === "asc" ? 1 : -1
    pipeline.push({ $sort: { [sortBy]: sortDir } })

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) })

    const videos = await Video.aggregate(pipeline)
    const total = await Video.countDocuments({ isPublished: true })

    return res.status(200).json(
        new ApiResponse(200, { videos, total, page: parseInt(page), limit: parseInt(limit) }, "Videos fetched successfully")
    )
})


// POST /api/v1/videos
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body || {}

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoFileLocalPath) throw new ApiError(400, "Video file is required")
    if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required")

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url) throw new ApiError(500, "Error uploading video file")
    if (!thumbnail?.url) throw new ApiError(500, "Error uploading thumbnail")

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title: title.trim(),
        description: description.trim(),
        duration: videoFile.duration || 0,
        owner: req.user._id,
        isPublished: true
    })

    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})


// GET /api/v1/videos/:videoId
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    { $project: { fullName: 1, username: 1, avatar: 1, subscribersCount: 1, isSubscribed: 1 } }
                ]
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                owner: { $first: "$owner" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                videoFile: 1, thumbnail: 1, title: 1, description: 1,
                views: 1, duration: 1, createdAt: 1, isPublished: 1,
                owner: 1, likesCount: 1, isLiked: 1
            }
        }
    ])

    if (!video?.length) throw new ApiError(404, "Video not found")

    // Increment view count
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

    return res.status(200).json(
        new ApiResponse(200, video[0], "Video fetched successfully")
    )
})


// PATCH /api/v1/videos/:videoId
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body || {}

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    const updateData = {}
    if (title?.trim()) updateData.title = title.trim()
    if (description?.trim()) updateData.description = description.trim()

    // Handle thumbnail update
    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path)
        if (!thumbnail?.url) throw new ApiError(500, "Error uploading thumbnail")
        // Delete old thumbnail from cloudinary
        await deleteFromCloudinary(video.thumbnail)
        updateData.thumbnail = thumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})


// DELETE /api/v1/videos/:videoId
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    // Delete files from cloudinary
    await deleteFromCloudinary(video.videoFile, "video")
    await deleteFromCloudinary(video.thumbnail, "image")

    // Delete all likes on this video
    await Like.deleteMany({ video: videoId })

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})


// PATCH /api/v1/videos/toggle/publish/:videoId
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid videoId")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to toggle this video")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, `Video is now ${updatedVideo.isPublished ? "published" : "unpublished"}`)
    )
})


export {
    deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo
}

import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/apierror.js"
import { ApiResponse } from "../utils/apiresponce.js"
import { asyncHandler } from "../utils/asynchandler.js"


// POST /api/v1/subscriptions/c/:channelId — toggle subscribe/unsubscribe
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channelId")

    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existingSub = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existingSub) {
        await Subscription.findByIdAndDelete(existingSub._id)
        return res.status(200).json(
            new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully")
        )
    }

    await Subscription.create({ subscriber: req.user._id, channel: channelId })
    return res.status(200).json(
        new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully")
    )
})


// GET /api/v1/subscriptions/u/:subscriberId — list subscribers of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) throw new ApiError(400, "Invalid channelId")

    const subscribers = await Subscription.aggregate([
        { $match: { channel: new mongoose.Types.ObjectId(channelId) } },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribedToSubscriber" },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [channelId, "$subscribedToSubscriber.subscriber"] },
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
        { $unwind: "$subscriber" },
        { $replaceRoot: { newRoot: "$subscriber" } }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    )
})


// GET /api/v1/subscriptions/c/:channelId — channels the user has subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid subscriberId")

    const subscriptions = await Subscription.aggregate([
        { $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
                            latestVideo: { $first: "$videos" }
                        }
                    },
                    { $project: { fullName: 1, username: 1, avatar: 1, subscribersCount: 1 } }
                ]
            }
        },
        { $unwind: "$channel" },
        { $replaceRoot: { newRoot: "$channel" } }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully")
    )
})


export { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription }

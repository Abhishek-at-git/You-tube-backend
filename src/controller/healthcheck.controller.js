import { ApiResponse } from "../utils/apiresponce.js"
import { asyncHandler } from "../utils/asynchandler.js"

const healthcheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { status: "OK" }, "Server is healthy"))
})

export { healthcheck }
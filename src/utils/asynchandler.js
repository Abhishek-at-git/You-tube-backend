const asynchandler=(requesthandler)=>{
    return(req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).catch((err)=>next((err)))
    }
    
}


export const asyncHandler = asynchandler
export { asynchandler }







// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try{
//         await fn(req,res,next)

//     }catch(err){
//         res.status(err.code||500).json({
//             success:false,
//             message:`${err.name}: ${err.message}`
//         })
//     }
// }
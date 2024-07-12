const asyncHandler = (requestHandler) => {
    return (req,res,next)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
}}

export {asyncHandler}







// const asyncHandler = (func) => async(err,req,res,next)=>{
//     try{
//         await func(err,req,res,next)
//     }catch(error){
//         res.status(error.code || 404 ).json({
//             success:false,
//             message:err.message
//         })
//     }
// }

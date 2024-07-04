const apiHandler = () =>{(req,res,next)=>{
    Promise.resolve(asyncHandler(req,res,next)).reject((error)=>next(error))
}}


export {apiHandler}
/*
const asyncHandler = (func) => async(err,req,res,next)=>{
    try{
        await func(err,req,res,next)
    }catch(error){
        res.status(error.code || 404 ).json({
            success:false,
            message:err.message
        })
    }
}
*/
   

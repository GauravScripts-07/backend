class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong", // bekar message hai mat likhna
        error=[], // error ka array bhejne ke liye
        statck=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
         
        // utni jarurat nahi lekin production me use hota hai

        if(statck){
            this.stack=statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}


export {ApiError}
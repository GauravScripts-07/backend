class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong", // bekar message hai mat likhna
        error=[], // error ka array bhejne ke liye
        stack=""
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
      //  this.message=message
        this.success=false
        this.errors=error
        // utni jarurat nahi lekin production me use hota hai

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    } 
}


export {ApiError}
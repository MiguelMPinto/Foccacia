import {ERROR_CODES}  from "./errors.mjs"


function HttpError(obj, status) {
    this.body = obj
    this.status = status
}

const ERROR_MAPPING =  {
    [ERROR_CODES.InvalidData]: 400,
    [ERROR_CODES.NotFound]: 404,
    [ERROR_CODES.NotAuthorized]: 403
}

const INTERNAL_ERROR = new HttpError(500)



export default function(applicationError) {
    const httpErr = new HttpError(ERROR_MAPPING[applicationError.code])
    if(httpErr.status != undefined)
        return httpErr
    return INTERNAL_ERROR;
} 
/**
 * Implements all Books data access, stored in memory 
 */

import errors from '../errors.mjs'



let idNextUser = 0

//Sempre que passar a função User sem um token, ele cria um novo automáticamento com o token = crypto.randomUUID()
function User(name, token = crypto.randomUUID()) {
    this.id = ++idNextUser
    this.name = name
    this.userToken = token 
} 

export const EXTERNAL_USERS = {
    users: [
        new User("User1", "c176eafd-25eb-45d3-a8cb-7218f3d63b3b"),
        new User("User2", "3efa8c5d-a9f4-4d71-be2d-8d9347e540c0"),
    ]
}

function USERS() {
    return EXTERNAL_USERS.users
}


//Converte um token num ID, obter um ID através do token que recebemos
export function convertToken(userToken) {
    const user = USERS().find(u => u.userToken == userToken)
    if(!user) {
        return Promise.reject(errors.NOT_FOUND(`User with token ${userToken} not found`));
    } 

    return Promise.resolve(user.id)
}
/**
 * Implements all Groups handling logic
 */

import errors, { ERROR_CODES } from './errors.mjs'
//import * as manageData from './foccacia-groups.mjs'
//import * as manageDataT from './foccacia-teams.mjs'
//import * as usersData from './data/users-data-mem.mjs'

export default function(manageData,manageDataT,usersData) {

    if (manageData == null && manageDataT == null) { //&& usersData == null) {
        throw "dependencias invalidas"
    }
 
return {
   getGroups:changeArgUserTokenToUserId(getGroupsInternal),
   getGroup: changeArgUserTokenToUserId(getGroupInternal),
   updateGroup: changeArgUserTokenToUserId(updateGroupInternal),
   createGroup: changeArgUserTokenToUserId(createGroupInternal),
   deleteGroup: changeArgUserTokenToUserId(deleteGroupInternal),
   deleteTeam: changeArgUserTokenToUserId(deleteTeamInternal),
   createTeam: changeArgUserTokenToUserId(createTeamInternal),
   createUser: createUserInternal
}

function changeArgUserTokenToUserId(internalFunction) {
    return function(...args) {
        const userToken = args.pop()
        console.log(userToken)
        return usersData.convertToken(userToken)
        .then(userId => {
 
            args.push(userId.id)
            return internalFunction.apply(this, args)
        })
    }
}

/**
 * 
 * @returns Returns A Promise resolved with an array, with all books
 */
function getGroupsInternal(userId) { 

    return manageData.getGroups(userId)
    .then(groups => {
        const filteredGroups = groups.filter(group => group.ownerId === userId);
        return filteredGroups
    })
    
}


/**
 * Create a new Book, given a creator object
 * 
 * @param {*} groupCreator - The object with the initial data to create a Book
 * @returns a Promise resolved with the created book
 */


function createGroupInternal(groupID,groupCreator,userId) {
    return manageData.getGroups(userId)
    .then(groups => {
            const existingGroup = groups.find(group => group.id == groupID);

            if (existingGroup) {
                throw new Error(`o grupo com o id ${groupID} já existe`)
            }

            return manageData.createGroup(groupID,groupCreator,userId)
        })
        .catch(err => {
            console.error("erro ao criar grupo");
            throw new Error(err.message)
        }

        )
}




function createTeamInternal(groupId, teamCreator, userId){

    if(!teamCreator.name || !teamCreator.venue_name || !teamCreator.league || !teamCreator.season) {
        return Promise.reject(errors.INVALID_DATA(`To create a Team, a name, stadium_name, league and a season must be provided`))
    }
    return manageData.getGroup(groupId)
        .then(group => {
            if (group.ownerId != userId) {
              return Promise.reject("nao tem permissão")
            }
    
            return manageDataT.createTeam(groupId, teamCreator, userId)
        });   
}


function getGroupInternal(groupId,userId) {
    return manageData.getGroup(groupId)
        .then(group => {
           if(group.ownerId === userId) {
                return group 
            }
        })
        .catch(err => { 
        return Promise.reject(errors.NOT_AUTHORIZED(`User with id ${userId} does not own group with id ${groupId}`));  
        });
}


function updateGroupInternal(groupId, groupUpdater, userId) {
    
    if(!groupUpdater.name && !groupUpdater.description) {
        return Promise.reject(errors.INVALID_DATA(`To update a Group, a title and isbn must be provided`))         
    } 
        return manageData.getGroup(groupId,userId)
            .then(group => {
      
                if (group.ownerId == userId) {
                    return manageData.updateGroup(groupId,groupUpdater,userId)
                }
        })

}

function deleteGroupInternal(groupId,userId) {
    return manageData.getGroup(groupId)
        .then(group => {
                if(group.ownerId == userId)
                return manageData.deleteGroup(groupId)
        }) 
        .catch(err =>{ 
            return Promise.reject(errors.NOT_AUTHORIZED(`User with id  does not own group with id ${groupId}`));
        });        
}


function deleteTeamInternal(groupId, teamName, userId){
    return manageData.getGroup(groupId)
        .then(group => {
            if (group.ownerId == userId)
                return manageDataT.deleteTeam(groupId, teamName, userId)
            return Promise.reject(errors.NOT_AUTHORIZED(`User with id ${userId} does not own group with id ${teamName}`));
        })
}

function createUserInternal(username, email, password) {
    if (!username || !email || !password) {
        return Promise.reject(
            new Error("Para criar um utilizador, username, email e password são obrigatórios.")
        );
    }
    return usersData.createUser(username, email, password)
        .then(user => {
            console.log("Utilizador criado com sucesso:", user);
            return user;
        })
        .catch(err => {
            console.error("Erro ao criar utilizador:", err);
            return Promise.reject(new Error("Erro ao criar utilizador."));
        });
}


}

/**
 * This file contains all HTTP API handling functions
 */

import errosMapping from './application-to-http-erros.mjs'
import * as fetchOther from './foccacia-fetch.mjs'
import { isGuid } from 'is-guid' 
import errors from './errors.mjs'
import express from 'express'


const GROUPS = '/groups'
const GROUP = `${GROUPS}/:groupId`
const USERS = '/users'


const RESOURCES_API = {
    // Resource URI that represents ALL Groups
    GROUPS: GROUPS,    
    // Resource URI that represents ONE Group
    GROUP: GROUP,

    USERS: USERS
   
}

export default function(groupsService) {

    if(!groupsService) {
        throw "Invalid service provided"
    }

    const router = express.Router()
    router.use('/groups', getUserToken)

    router.get(RESOURCES_API.GROUPS, createHandler(internalGetGroups))
    router.post(RESOURCES_API.GROUPS, createHandler(internalAddGroup))
    router.get(RESOURCES_API.GROUP, createHandler(internalGetGroup))
   // router.post(RESOURCES_API.GROUP, createHandler(internalUpdateGroup))
    router.delete(RESOURCES_API.GROUP, createHandler(internalDeleteGroup))
    router.post(RESOURCES_API.GROUP, createHandler(internalModifyTeam))
    router.put(RESOURCES_API.USERS, createHandler(internalCreateUser))


    
    return router

 /*
    getGroups: createHandler(internalGetGroups),
    router.get(RESOURCES_API.BOOKS, createHandler(getBooks))
    addGroup: createHandler(internalAddGroup),
    modifyTeam: createHandler(internalModifyTeam),
    getGroup: createHandler(internalGetGroup),
    updateGroup: createHandler(InternalUpdateGroup),
    deleteGroup: createHandler(internalDeleteGroup),
   // deleteTeam: createHandler(internalDeleteTeam),
    getUserToken: getUserToken
*/

function internalGetGroups(req, rsp) {

    return groupsService.getGroups(req.token)
    .then( allGroups => {
         rsp.json(allGroups)
    })
    .catch (err => {
        console.error("erro em groupservices",err);
        rsp.status(500).send("erro ao obter grupos")
    })
}


function internalAddGroup(req, rsp) {
    let groupID = req.body.id;
    const userToken = req.token
    let groupData = {
        name: req.body.name,
        description: req.body.description,
       // ownerId: req.body.ownerId || null,
        teams: req.body.teams || []
    };
    
    return groupsService.createGroup(groupID,groupData,userToken)
        .then(Group => rsp.status(201).send({
            description: `Group created`,
            uri: `/api/groups/${groupID}`
           
        }))
        .catch(err => {
            if (!rsp.headersSent) {
                sendError(rsp, err);
            }
            });
}





function internalGetGroup(req, rsp) {
    const groupId = req.params.groupId
    const userToken = req.token
   
    return groupsService.getGroup(groupId,userToken) 
        .then(group => rsp.json(group)) 
        .catch(err => sendError(rsp, err));
}

/*
function internalUpdateGroup(req, rsp) {
    const groupId = req.params.groupId;
    const {name, description} = req.body;
    const userToken = req.token
 
    if (!name || !description) {
        return rsp.status(400).send({
            error: "deve fornecer o nome e a descrição para atualizar o grupo.",
        });
    }
    
    const updateData = { name, description };

    return groupsService.updateGroup(groupId,updateData,userToken)
        .then(console.log(1))
        .then(group => rsp.json({ message: `Group with id ${groupId} updated` }))
        .catch(error => sendError(rsp,error))
}
*/

function internalDeleteGroup(req, rsp) {
    const groupIdd = req.params.groupId
    const userToken = req.token
    return groupsService.deleteGroup(groupIdd,userToken)
        .then(groupId => rsp.json({ message: `Group with id ${groupIdd} deleted` }))
        .catch(error => sendError(rsp, error))
}


async function internalModifyTeam(req, rsp) {
    try {
        const userToken = req.token;
        const groupId = req.params.groupId;

        // Verificar os campos no corpo da requisição para determinar a ação
        if (req.body.team_id && req.body.league_id && req.body.season) {
            // Adicionar equipa
            const team_id = req.body.team_id;
            const league_id = req.body.league_id;
            const season = req.body.season;

            // Busca a equipa pelo ID
            const teamData = await fetchOther.fetchTeam(team_id);
            if (!teamData || !teamData.team.name || !teamData.venue.name) {
                throw new Error("Dados da equipa incompletos ou inválidos");
            }

            // Busca os detalhes da liga
            const leagueData = await fetchOther.fetchLeague(season, team_id, league_id);
            if (!leagueData || leagueData.length === 0) {
                throw new Error("Liga não encontrada");
            }

            // Montar os dados da nova equipa
            const newTeam = {
                name: teamData.team.name,
                venue_name: teamData.venue.name,
                league: leagueData.leagueName,
                season: season,
            };

            // Adicionar a equipa ao grupo
            await groupsService.createTeam(groupId,newTeam, userToken);

            rsp.status(201).json({
                description: "Team added",
                uri: `/api/groups/${groupId}`,
            });
        }

         else if (req.body.name && req.body.description) {
              const  name = req.body.name
              const description = req.body.description

              const updateData = {name, description}
            
                 await groupsService.updateGroup(groupId,updateData,userToken)

                 rsp.status(201).json({
                    description: "Group Updated",
                    uri: `/api/groups/${groupId}`,
                 });
              }
        else if (req.body.teamName) {
            // Remover equipa
            const teamName = req.body.teamName;

            // Validar o campo necessário
            if (!teamName) {
                throw new Error("O campo 'teamName' é obrigatório para remover uma equipa.");
            }

            // Remover a equipa do grupo
            await groupsService.deleteTeam(groupId,teamName, userToken);

            rsp.status(200).json({
                description: "Team removed",
                uri: `/api/groups/${groupId}`,
            });
        } else {
            throw new Error("Requisição inválida. Verifique o corpo da requisição.");
        }
    } catch (error) {
        console.error("[ERRO] Falha ao modificar equipa:", error);
        sendError(rsp, error);
    }
}

function internalCreateUser(req, rsp) {
    const { username, email, password } = req.body;

    // Verificar os campos obrigatórios
    if (!username || !email || !password) {
        return rsp.status(400).send({
            error: "Todos os campos (username, email, password) são obrigatórios.",
        });
    }

    // Chamar o serviço para criar o utilizador
    return groupsService.createUser(username, email, password)
        .then((user) => {
            rsp.status(201).json({
                description: "User created",
                uri: `/api/users/${user.id}`,
            });
        })
        .catch((err) => {
            console.error("[ERRO] Falha ao criar utilizador:", err);
            sendError(rsp, err);
        });
}



 


//Auxiliary functions
function createHandler(specificFunction) {
    return function (req, rsp, next) {
        try {
            const promiseResult = specificFunction(req, rsp);
            if (promiseResult && typeof promiseResult.catch === 'function') {
                // É uma Promise, encadeia o tratamento de erro
                promiseResult.catch(error => sendError(rsp, error));
            } else {
                console.error("[ERRO] specificFunction não retornou uma Promise.");
                sendError(rsp, new Error("Internal server error: Handler não retornou uma Promise."));
            }
        } catch (error) {
            console.error("[ERRO] Erro síncrono em specificFunction:", error);
            sendError(rsp, error);
        }
    };
}




function sendError(rsp, err) {
    if (rsp.headersSent) {
        console.error("[DEBUG] Não é possível enviar resposta: cabeçalhos já enviados.");
        return;
    }
    rsp.status(500).json({ error: err.message });
}


 function getUserToken(req, rsp, next) {
    console.log("extract token called")
    const authorizationHeader = req.get("Authorization")
    if (authorizationHeader) {
        const authHeaderParts = authorizationHeader.split(" ")
        if (authHeaderParts.length == 2 && authHeaderParts[0] == "Basic" && isGuid(authHeaderParts[1])) {
            const token = authHeaderParts[1]
                
            if (token) {
                req.token = token
                
                return next()
            }
        }
    }
    sendError(rsp, errors.INVALID_DATA(`Token is required to use this API`))
}

}


// Module responsibilities
// This file contains all HTTP Web Site handling functions.

import express from 'express';
import * as fetchOther from './foccacia-fetch.mjs';
import passport from "passport";
import initializePassport from "./passport-config.mjs";

// Inicializa o passport
initializePassport(passport);

const GROUPS = '/groups';
const GROUP = `${GROUPS}/:groupId`;
const TEAMS = `${GROUP}/teams`;
const DELETE_TEAM = `${TEAMS}/delete`;
const CREATE = `${GROUPS}/create`;
const DELETE = `${GROUPS}/delete`;
const UPDATE = `${GROUPS}/update`;
const LEAGUE = `${TEAMS}/select-league`
const ADDTEAM =  `${TEAMS}/addTeam`


const REGISTER = '/login/register';
const INDEX = 'site/index';

const RESOURCES_WEB_SITE = {
    GROUPS: GROUPS,
    GROUP: GROUP,
    TEAMS: TEAMS,
    DELETE_TEAM: DELETE_TEAM,
    CREATE: CREATE,
    UPDATE: UPDATE,
    DELETE: DELETE,
    REGISTER: REGISTER,
    INDEX: INDEX,
    LEAGUE: LEAGUE,
    ADDTEAM: ADDTEAM
};

export default function (groupsService) {
    const router = express.Router();

    router.get(RESOURCES_WEB_SITE.GROUPS, handlerWrapper(getGroups));
    router.get(RESOURCES_WEB_SITE.GROUP, handlerWrapper(getGroup));
    router.post(RESOURCES_WEB_SITE.DELETE, handlerWrapper(deleteGroup));
    router.post(RESOURCES_WEB_SITE.UPDATE, handlerWrapper(updateGroup));
    router.post(RESOURCES_WEB_SITE.CREATE, handlerWrapper(createGroup));
    router.get(RESOURCES_WEB_SITE.TEAMS, handlerWrapper(searchTeam));
    router.post(RESOURCES_WEB_SITE.DELETE_TEAM, handlerWrapper(deleteTeam));
    router.post('/site/groups/:groupId/modify-team', handlerWrapper(searchTeam));
    router.post(RESOURCES_WEB_SITE.INDEX, (req, res) => { res.render('index', { title: 'FOCCACIA Web Interface' }); });
    router.post(RESOURCES_WEB_SITE.LEAGUE, handlerWrapper(searchLeague))
    router.post(RESOURCES_WEB_SITE.DELETE, handlerWrapper(deleteTeam))
    router.post(RESOURCES_WEB_SITE.ADDTEAM, handlerWrapper(addTeam))
    router.post(RESOURCES_WEB_SITE.GROUP, handlerWrapper(modifyTeam))
   

    router.get('/index', (req, res) => {
        res.render('index');
    });

    router.get('/site/index', (req, res) => {
        res.render('index', { title: 'FOCCACIA Web Interface' });
    });

    router.get('/login', (req, res) => {
        res.render('login');
    });

    router.get('/site/dashboard', (req, res) => {
        res.render('dashboard', { user: req.user });
    });

    router.get('/login/register', (req, res) => {
        res.render('newAccount', { title: 'Criar Conta - FOCCACIA' });
    });

    router.post('/login/register-action', async (req, res) => {
        try {
            const username = req.body.username;
            const email = req.body.email;
            const password = req.body.password;

            if (!username || !email || !password) {
                return res.status(400).send('Todos os campos são obrigatórios!');
            }

            const newUser = await groupsService.createUser(username, email, password);

            res.status(201).redirect('/site/login');
        } catch (error) {
            console.error('Erro ao criar utilizador:', error);
            res.status(500).send('Erro interno ao criar utilizador.');
        }
    });

    router.post('/login-action', (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);
            if (!user) return res.redirect('/login');

            req.login(user, (err) => {
                if (err) return next(err);
                res.redirect('/site/index');
            });
        })(req, res, next);
    });

    return router;

    function setUserToken(req) {
        if (req.isAuthenticated() && req.user && req.user.token) {
            req.token = req.user.token;
            console.log(`Token definido para o utilizador: ${req.token}`);
        } else {
            console.error("Utilizador não autenticado ou token não encontrado.");
            req.token = null;
        }
          

    }

    function handlerWrapper(handler) {
        return async function (req, rsp) {
            setUserToken(req);
            try {
                await handler(req, rsp);
            } catch (e) {
                console.error("Erro na execução do handler");
                rsp.status(500).send('Erro interno no servidor.');
            }
        };
    }

    async function getGroups(req, res) {
        try {
            const groups = await groupsService.getGroups(req.token);
            res.render('groups', { groups });
        } catch (error) {
            console.error('Error fetching groups:', error);
            res.status(500).send('Failed to load groups');
        }
    }

    async function getGroup(req, res) {
        try {
            const groupId = req.params.groupId;
            const group = await groupsService.getGroup(groupId, req.token);
            res.render('group-details', { group, groupId });
        } catch (error) {
            console.error('Error fetching group details:', error);
            res.status(404).send('Group not found');
        }
    }

    async function updateGroup(req, res) {
        const { groupName, description } = req.body;
        const groupId = req.body.groupId



        if (!groupName || !description) {
            return res.status(400).send('Name and description are required');
        }

        try {
            await groupsService.updateGroup(groupId, { name: groupName, description }, req.token);
          //  res.render('index', {groupId})
            res.redirect(`/site/groups/${groupId}`);
        } catch (error) {
            console.error('Error updating group:', error);
            res.status(500).send('Failed to update group');
        }
    }

    async function createGroup(req, res) {
        const groupId = req.body.groupId;
        const name = req.body.groupName;
        const description = req.body.description;
        const teams = []
        const groupData = { name, description, teams };
 
        

        try {
            await groupsService.createGroup(groupId, groupData, req.token);
       
            res.status(201).redirect('/site/groups');
        } catch (error) {
            console.error('Error creating group:', error);
            res.status(500).send('Failed to create group');
        }
    }

    async function deleteGroup(req, res) {
        try {
         
            await groupsService.deleteGroup(req.body.groupId, req.token);
            res.redirect('/site/groups');
        } catch (error) {
            console.error('Error deleting group:', error);
            res.status(500).send('Failed to delete group');
        }
    }


    async function deleteTeam(req, res) {
        const groupId = req.params.groupId;
        const teamName = req.body.teamName;

        try {
            await groupsService.deleteTeam(groupId, teamName, req.token);
            res.redirect(`/site/groups/${groupId}`);
        } catch (error) {
            console.error('Error deleting team:', error);
            res.status(500).send('Failed to delete team');
        }
    }

    
    async function searchTeam(req, res) {
        try {
            const { teamName, season, action } = req.query;
            const groupId = req.params.groupId;
    
            if (!teamName || !season) {
                return res.render('teams', {
                    groupId, 
                    message: 'Preencha todos os campos para buscar uma equipa.'
                });
            }
    
            // Obter os resultados da pesquisa
            const result = await modifyTeam(action, teamName, null, null, season, groupId, req.token);
    
            // Passar as equipas corretamente para o template
            res.render('teams', { groupId, result, season, teamName });
        } catch (error) {
            console.error('Error fetching teams:', error);
            res.render('teams', {
                groupId: req.params.groupId,
                message: 'Erro ao buscar a equipa. Tente novamente mais tarde.'
            });
        }
    }

    async function searchLeague(req, res) {
        const  { teamId, teamName, stadium, season, action } = req.body; // Certifique-se de que o `teamName` está a ser extraído aqui
        const groupId = req.params.groupId;
    
        try {
    
            // Obter os resultados da pesquisa
            const result = await modifyTeam(action, null, teamId, null, season, null, req.token);
    
            // Passar as equipas corretamente para o template
            res.render('leagues', { 
                groupId, 
                result, 
                teamId, 
                teamName, 
                stadium, 
                season 
            });
        } catch (error) {
            console.error('Error fetching teams:', error);
            res.render('teams', {
                groupId: req.params.groupId,
                message: 'Erro ao buscar a equipa. Tente novamente mais tarde.'
            });
        }
    }

    async function addTeam(req, res) {
        const { teamId, season, league_name, teamName, stadium } = req.body;
        const groupId = req.params.groupId;
       
        
        const userToken = req.token

        try {

            const teamCreator = {
                name: teamName,
                venue_name: stadium,
                league: league_name,
                season: season
            };
            await groupsService.createTeam(groupId, teamCreator, userToken);
            res.redirect(`/site/groups/${groupId}`);        
        } catch (error) {
            console.error('Error deleting group:', error);
            res.status(500).alert('Failed to delete team.');
        }
    }

    

async function modifyTeam(action, teamName, teamId, leagueId, season, groupId, token) {
    try {
        if (action === '1') {

            if (!teamName || !season) {
                throw new Error("O nome da equipa e a época são obrigatórios para esta ação.");
            }

            const teamData = await fetchOther.fetchIdByName(teamName);


            //TODO: Ele para neste if ns pq
            if (!teamData) {
                throw new Error("Equipa não encontrada.");
            }

            return {
                team: teamData
            }

        } else if (action === '2') {

            if (!teamId) {
                throw new Error("O ID da equipa é obrigatório para esta ação.");
            }
            const leagueData = await fetchOther.fetchLeagues(teamId, season);
            
            if (!leagueData || leagueData.length === 0) {
                throw new Error("Nenhuma liga encontrada para a equipa especificada.");
            }

            return {
                leagues: leagueData,
                message: "Ligas encontradas com sucesso.",
            };
        } else if (action === '3') {

            if (!teamId || !leagueId || !season) {
                throw new Error("teamId, leagueId e season são obrigatórios para esta ação.");
            }

            const newTeam = { teamId, leagueId, season };
            const updatedGroup = await groupsService.createTeam(groupId, newTeam, token);

            return {
                group: updatedGroup,
                message: "Equipa adicionada ao grupo com sucesso.",
            };
        } else {
            throw new Error("Ação inválida.");
        }
    } catch (error) {
        console.error("[ERRO] Falha ao modificar equipa:", error);
        throw error;
    }
}

}

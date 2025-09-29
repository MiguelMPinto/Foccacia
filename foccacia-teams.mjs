/**
 * Manages all teams function 
 */
import * as groupsData from './data/foccacia-data-es.mjs'
import errors from './errors.mjs'
import fetch from 'node-fetch';

const URI_PREFIX = 'http://localhost:9200/';
const INDEX = 'groups';

export function createTeam(groupId, teamCreator, userId) {
    

    // Obtém o grupo existente
    return groupsData.getGroup(groupId)
        .then(existingGroup => {
            if (!existingGroup) {
                throw new Error(`Grupo com ID ${groupId} não encontrado`);
            }

           

            // Adiciona a nova equipa ao array de equipas existentes
            const updatedTeams = [...existingGroup.Teams, {
                name: teamCreator.name,
                stadium: teamCreator.venue_name,
                league: teamCreator.league,
                year: teamCreator.season,
            }];


            // Atualiza o grupo com as novas equipas
            const updatedGroup = {
                name: existingGroup.name,         // Mantém o nome atual
                description: existingGroup.description, // Mantém a descrição atual
                ownerId: existingGroup.ownerId,  // Mantém o proprietário atual
                teams: updatedTeams,             // Adiciona a nova equipa
            };


            // Envia a atualização para o Elasticsearch
            const uri = `${URI_PREFIX}${INDEX}/_doc/${groupId}`;
            return fetch(uri, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedGroup),
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao atualizar grupo: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .catch(err => {
            throw err;
        });
}



export function deleteTeam(groupId, teamName, userId) {

    return groupsData.getGroup(groupId)
        .then(existingGroup => {
            if (!existingGroup) {
                throw new Error("grupo não encontrado")
            }

            const updatedTeams = existingGroup.Teams.filter(team => team.name != teamName);
        

            if (updatedTeams.length === existingGroup.Teams.length) {
                throw new Error("Equipa com o nome dado não encontrada")
            }

            const updatedGroup = {
                name: existingGroup.name,         // Mantém o nome atual
                description: existingGroup.description, // Mantém a descrição atual
                ownerId: existingGroup.ownerId, 
                teams: updatedTeams
            };
           

            const uri = `${URI_PREFIX}${INDEX}/_doc/${groupId}`;
            return fetch(uri, {
                method: 'POST', // Método POST para atualizar o documento
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedGroup),
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao atualizar grupo: ${response.status} ${response.statusText}`);
            }
            return response.json();
            
        })
        .catch(err => {
            throw err;
        });

}
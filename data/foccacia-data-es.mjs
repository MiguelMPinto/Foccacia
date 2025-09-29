import errors from "../errors.mjs";
import fetch from 'node-fetch';



function Group(id, name, description, ownerId, teams) {
    this.id = id 
    this.name = name;
    this.description = description;
    this.ownerId = ownerId;
    this.Teams = teams;  
}

function Team(name, stadium_name, league, season) {
    this.name = name;
    this.stadium_name = stadium_name;
    this.league = league;
    this.season = season;
}

export const GROUPS = [
    new Group("Group 3 grandes", "Só estão os 3 grandes aqui", 
        1, [ 
            new Team("Benfica", "Estádio da Luz", "Champions League", 2022),
            new Team("Porto", "Estádio do Dragão", "Primeira Liga", 2022),
            new Team("Sporting", "Estádio José Alvalade", "Primeira Liga", 2022)
        ]
    ),
    new Group("Group Jovens Promessas", "Grupo dedicado aos jogadores jovens promissores",
        2, [  
            new Team("Real Madrid", "Santiago Bernabéu", "La Liga", 2021),
            new Team("Barcelona", "Camp Nou", "La Liga", 2021),
            new Team("Manchester United", "Old Trafford", "Premier League", 2021)
        ]
    ),
    new Group("Group Ligas Europeias", "Times participantes das principais ligas europeias",
        3, [  
            new Team("Liverpool", "Anfield", "Premier League", 2021),
            new Team("Bayern Munich", "Allianz Arena", "Bundesliga", 2021),
            new Team("Paris Saint-Germain", "Parc des Princes", "Ligue 1", 2021)
        ]
    ),
    new Group("Group Clássicos", "Equipes históricas e com grande tradição no futebol",
        4, [  
            new Team("Juventus", "Allianz Stadium", "Serie A", 2021),
            new Team("AC Milan", "San Siro", "Serie A", 2021),
            new Team("Chelsea", "Stamford Bridge", "Premier League", 2021)
        ]
    )
];

const URI_PREFIX = 'http://localhost:9200/'
const INDEX = 'groups'

export function getGroups(userId) {
    
    const uri = `${URI_PREFIX}${INDEX}/_search`;
    return fetch(uri) // Faz a chamada HTTP
        .then(res => res.json())
        .then(elObj => {
            return elObj.hits.hits
            .map(d => {
                const group = new Group(
                    d._id,
                    d._source.name,
                    d._source.description,
                    d._source.ownerId,
                    d._source.teams
                );
                return group;
            });
        })
        .catch(err => {
            console.error("Erro no fetch:", err);
            throw err;
        });
}


    export function createGroup(groupID, groupData,userId) {

        groupData.ownerId = userId
        console.log(groupData)
         const uri = `${URI_PREFIX}${INDEX}/_doc/${groupID}`;
        
            return fetch(uri, {
                method: 'POST',
                headers: {
                    'content-Type': 'application/json',
                },
                body: JSON.stringify(groupData),
            })
            .then(data => {
                console.log(data)
                return data;
            })
            .catch (err =>{
                throw err
            });
    }

    
 
    export function getGroup(groupId,userId) {
        const uri = `${URI_PREFIX}${INDEX}/_doc/${groupId}`;
        
        console.log("asduniasbudauhsd")
         return fetch(uri)// Faz a chamada HTTP
        .then(res => res.json())
        .then(elObj => {
            
                const group = new Group(
                    elObj._id,
                    elObj._source.name,
                    elObj._source.description,
                    elObj._source.ownerId,
                    elObj._source.teams
                );
                
                return group;
            })
        .catch(err => {
            console.error("Erro no fetch:", err);
            throw err;
        });
    }
    
    export function updateGroup(groupId, groupUpdater, userId) {

        return getGroup(groupId) // Usa a função já existente
            .then(existingGroup => {
               
    
                // Mesclar os novos valores com os existentes
                const updatedGroup = {
                    name: groupUpdater.name,
                    description: groupUpdater.description, 
                    ownerId: existingGroup.ownerId, // Mantém inalterado
                    teams: existingGroup.Teams, // Mantém inalterado
                };
    
                // Atualiza o grupo no ElasticSearch
                const uri = `${URI_PREFIX}${INDEX}/_doc/${groupId}`;
                return fetch(uri, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedGroup),
                });
            })
            .then(data => {
                
                return data;
            })
            .catch(err => {
               
                throw err;
            });
    }
    

    
    
    export function deleteGroup(groupId,userId) {

        const uri = `${URI_PREFIX}${INDEX}/_doc/${groupId}`;

        return fetch(uri, {
            method: 'DELETE',
    })
    .then(data => {
        return data;
    })
    .catch (err =>{
        throw err
    });
}


import fs from 'fs/promises'; // fs.promises para trabalhar com promises
import path from 'path';

// Caminho do arquivo de cache persistente
const CACHE_FILE_PATH = path.resolve(process.cwd(), "data.json");

// Carrega a cache do arquivo (se existir)
async function loadCache() {
    try {
        const data = await fs.readFile(CACHE_FILE_PATH, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        if (err.code === "ENOENT") {
            // Arquivo não encontrado, retorna cache vazio
            return {};
        }
        throw err;
    }
}

// Salva a cache no arquivo
async function saveCache(cache) {
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
}

// Função memoise para cache persistente
function memoise(fn) {
    const cache = new Map();

    return async function (...args) {
        const key = JSON.stringify(args);

        // Carrega a cache do arquivo na primeira execução
        if (cache.size === 0) {
            const fileCache = await loadCache();
            for (const [k, v] of Object.entries(fileCache)) {
                cache.set(k, v);
            }
        }

        // Verifica se o valor está na cache
        if (cache.has(key)) {
            return cache.get(key);
        }

        // Caso contrário, executa a função original
        const result = await fn(...args);

        // Converte o resultado para JSON se necessário (garante que a resposta seja um objeto JSON)
        const jsonResult = await result.json();

        cache.set(key, jsonResult); // Armazena o resultado como JSON

        // Atualiza a cache persistente no arquivo
        await saveCache(Object.fromEntries(cache));

        return jsonResult;
    };
}

// Memoiza a função fetch
globalThis.fetch = memoise(globalThis.fetch);


export function fetchIdByName(teamName) {
    return fetch(`https://v3.football.api-sports.io/teams?name=${teamName}`, {
        method: 'GET',
        headers: {
            'x-apisports-key': 'b0e529fea241972b4c2f399f655d07fb'
        }
    })
        .then(response => response)
        .then(data => {
            if (!data || !data.response || data.response.length === 0) {
                return Promise.reject('Equipa não encontrada');
            }

            const teams = data.response.map(item => ({
                id: item.team.id,
                name: item.team.name,
                stadium: item.venue.name
            }));


         
            return teams

        })
        .catch(err => {
            Promise.reject("Equipa/as não encontradas")
        });
}


export function fetchTeam(teamID) {
    return fetch(`https://v3.football.api-sports.io/teams?id=${teamID}`, {
        method: 'GET',
        headers: {
            'x-apisports-key': 'b0e529fea241972b4c2f399f655d07fb'
        }
    })
        .then(response => response)
        .then(data => {
            if (!data || !data.response || data.response.length === 0) {
                return Promise.reject('Equipa não encontrada');
            }
       
            return data.response[0];
        });
}

export function fetchLeagues(team_id, season_year) {
    return fetch(`https://v3.football.api-sports.io/leagues?team=${team_id}`, {
        method: 'GET',
        headers: {
            'x-apisports-key': 'b0e529fea241972b4c2f399f655d07fb'
        },
    })
        .then(response => response)
        .then(leagueData => {

            // Itera por todas as ligas retornadas
            const matchedLeagues = leagueData.response
                .map(league => {
                    const { league: leagueInfo, seasons } = league;

                    if (!seasons || seasons.length === 0) {
                        return null;
                    }
                    // Busca a temporada correspondente
                    const seasonMatchs = seasons.find(season => season.year == season_year);




                    if (seasonMatchs) {
                        return {
                            leagueName: leagueInfo.name,
                            id: leagueInfo.id,
                            season: seasonMatchs.year,
                        };
                    }

                })

                .filter(Boolean); //retira os null do array
                
            if (matchedLeagues.length === 0) {
                return Promise.reject("nenhuma liga encontrada com os dados fornecidos")
            }

            // Exibe as ligas correspondentes
            return matchedLeagues;
        })
}



export function fetchLeague(season_year, team_id, league_id) {

    // Chama fetchLeagues para buscar todas as ligas associadas ao team_id e season_year
    return fetchLeagues(team_id, season_year)
        .then(leagues => {
            // Filtra a liga pelo ID fornecido

            const matchedLeague = leagues.find(league => league.id === league_id);

            if (!matchedLeague) {
                return Promise.reject("Nenhuma liga encontrada com o ID fornecido.");
            }

          
            return matchedLeague;
        })
        .catch(error => {
            console.error(error);
            return Promise.reject(error); // Propaga o erro
        });
}






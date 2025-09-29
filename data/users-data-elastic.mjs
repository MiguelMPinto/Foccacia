// Module manages application users data.
// In this specific module, data is stored ElasticSearch
import fetch from 'node-fetch';

const NUM_USERS = 2    

let USERS = new Array(NUM_USERS).fill(0, 0, NUM_USERS)
    .map((_, idx) => { 
        return {
            id: idx,
            username: `User${idx}`,
            email: `User${idx}@slb.pt`,
            password: `Pass${idx}`,
            token: "ef604e80-a351-4d13-b78f-c888f3e63b6" + idx
        } 
    })


    export async function createUser(username_d,email_d,password_d) {
        const nextId = await getNextUserId();

        const uri = `http://localhost:9200/users/_doc/${nextId}`
        const body = {
            id: nextId,
            username: username_d,
            email: email_d,
            password: password_d,
            token: "c176eafd-25eb-45d3-a8cb-7218f3d63b3" + nextId,
        }

    

        const response = await fetch(uri, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

   

        if (!response.ok) {
            throw new Error("erro ao criar utilizador");
            
        }

        return body;
    }

    async function getNextUserId() {
        const uri = "http://localhost:9200/users/_count";
        const resp = await fetch(uri, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
    
        if (!resp.ok) {
            throw new Error("Erro ao obter número de utilizadores.");
        }
    
        const obj = await resp.json();
        return obj.count + 1; // Próximo ID é o número atual + 1
    }

    export async function convertToken(token) {
        const uriUserDocument = "http://localhost:9200/users/_search"
        let resp = await fetch(uriUserDocument, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: {
                    match: { token: token } // Filtra os resultados pelo token
                }
            })
        });

        let obj = await resp.json()

        let hit = obj.hits.hits[0]
        if (hit.length == 0) {
            throw new Error("Utilizador não encontrado")
        }
        let retObj = Object.assign({id: hit._id}, hit._source)
        return retObj
            
    }
        
    

export async function getUserByUsername(username) {
    return getUserBy("username", username)
}

export async function getUserById(id) {
    return getUserBy("id", id)
}

async function getUserBy(propName, value) {
    const uriUserDocument = "http://localhost:9200/users/_search"
    let resp = await fetch(uriUserDocument, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query: {
                match: { [propName]: value } // Filtra os resultado
            }
        })
    });

    let obj = await resp.json()


    let hit = obj.hits.hits[0]
 

    if (hit.length == 0) {
        throw new Error("Utilizador não encontrado")
    }

    return hit._source
}







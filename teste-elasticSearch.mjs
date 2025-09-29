

const URI_PREFIX = 'http://localhost:9200/';
const INDEX = 'groups';
const uri = `${URI_PREFIX}${INDEX}/_search`;

fetch(uri)
    .then(res => {
        console.log("HTTP Status:", res.status);
        return res.json();
    })
    .then(data => console.log("Resposta:", data))
    .catch(err => console.error("Erro no ElasticSearch:", err));

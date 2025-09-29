import express from 'express';
import cors from 'cors';
import path from 'path';
import session from 'express-session';
import passport from 'passport';
import init from './foccacia-server-config.mjs';

const app = express();

// Middleware para JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Habilitar CORS
app.use(cors());

// Configurar pasta estática para servir HTML
const __dirname = path.resolve();
app.use('/html', express.static(path.join(__dirname, 'html')));

// Configuração de sessões
/*app.use(
    session({
        secret: 'chave-secreta',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // Sessão válida por 24 horas
        },
    })
);*/

// Inicializar o Passport
//app.use(passport.initialize());
//app.use(passport.session());

// Inicializar configuração do servidor
init(app);

// Configurar motor de visualização
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views')); // Caminho correto para a pasta 'views'

// Iniciar o servidor
const PORT = 3310;
app.listen(PORT, (e) => {
    if (e) {
        console.log(`Server not started due to: ${e}`);
    } else {
        console.log(`Server listening on port ${PORT}`);
    }
});

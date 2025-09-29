/**
 * Configures the express HTTP application (including routes and middlewares)
 */

import { fileURLToPath } from 'url';
import path from 'path';
import hbs from 'hbs';
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import initializePassport from './passport-config.mjs';

import * as manageData from './data/foccacia-data-es.mjs';
import * as manageDataT from './foccacia-teams.mjs';
import * as usersData from './data/users-data-elastic.mjs';
import foccaciaServiceInit from './foccacia-service.mjs';
import apiInit from './foccacia-api.mjs';
import siteInit from './foccacia-web-site.mjs';

const foccaciaService = foccaciaServiceInit(manageData, manageDataT, usersData);
const apiRouter = apiInit(foccaciaService);
const siteRouter = siteInit(foccaciaService);

export default function (app) {
    app.use('/api/*', express.json());
    app.use('/site/*', express.urlencoded({ extended: true }));

    const fileUrl = import.meta.url;
    const __filename = fileURLToPath(fileUrl);
    const __dirname = path.dirname(__filename);

    // Configuração do motor de visualização
    const viewPath = path.join(__dirname, 'views');
    const partialsPath = path.join(viewPath, 'partials');

    app.set('views', path.join(viewPath));
    app.set('view engine', 'hbs');
    hbs.registerPartials(partialsPath);

    // Inicializar o Passport e as sessões
    app.use(
        session({
            secret: 'chave-secreta',
            resave: false,
            saveUninitialized: false,
            cookie: { expires: null },
        })
    );
    initializePassport(passport);
    app.use(passport.initialize());
    app.use(passport.session());

    app.use(countReq, showRequestData);

    // Rotas da aplicação
    app.use('/api', apiRouter);
    app.use('/site', siteRouter);

    let count = 1;
    function countReq(req, rsp, next) {
        console.log(`Number of requests: ${count++}`);
        next();
    }

    function showRequestData(req, rsp, next) {
        console.log(`Request method: ${req.method}`);
        console.log(`Request uri: ${req.originalUrl}`);
        next();
    }
}

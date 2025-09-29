import LocalStrategy from "passport-local";

import {getUserByUsername} from "./data/users-data-elastic.mjs"; // Usa a tua função existente
import {getUserById} from "./data/users-data-elastic.mjs"; // Usa a tua função existente

function initialize(passport) {

    const authenticateUser = async (username, password, done) => {
      
        try {
            const user = await getUserByUsername(username);
            if (!user) {
                return done(null, false, { message: "Utilizador não encontrado" });
            }

            
            if (user.password !== password) {
               
                return done(null, false, { message: "Palavra-passe incorreta" });
            }
            
            return done(null, user); // Autenticação bem-sucedida
        } catch (err) {
           
            return done(err);
        } 
    };

    passport.use(new LocalStrategy({ usernameField: "username" }, authenticateUser));

    passport.serializeUser((user, done) =>  {
   
        done(null, user.id)}); // Salva o ID na sessão

    passport.deserializeUser(async (id, done) => {
        try {
           
            const user = await getUserById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}

export default initialize;

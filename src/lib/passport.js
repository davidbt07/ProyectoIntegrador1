const passport = require('passport');
const pool=require('../database');
const LocalStrategy = require('passport-local').Strategy;
const helpers = require ('../lib/helpers');
const axios = require('axios');



passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
        const { role } = req.body;
       
        const rows = await pool.query('SELECT * FROM USER WHERE username=?', [username]);


        let user;
        console.log(rows);
        if (rows.length > 0) {
            if (rows[0].role == role) {
                 user = rows[0];
            } else if (rows[1].role == role) {
                 user = rows[1];
            }else if (rows[2].role == role) {
                 user = rows[2];
            }

            console.log('user');
            console.log(user);

            const validPassword = await helpers.matchPassword(password, user.password);
         
            if (validPassword) {
              
                done(null, user, req.flash('success','Bienvendio ' + user.fullname));
            } else {
               
                done(null, false, req.flash('message','Contraseña incoreccta'));
            }

        } else {
           
            return done(null, false, req.flash('message','Nombre de usuario no existe'));
        }
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
      

        const { passwordlis } = req.body;
        const newUser = {
            username,password
        };
      
       const a = await axios.post('https://lis.udea.edu.co/api/ldap/login', {
            'username': username,
            'password': passwordlis
        }).catch(e => {
            

        });

        const u = a.data;
        const fullname = u.name +' '+ u.lastName;
        newUser.id = u.id;
        newUser.role = u.role;
        newUser.fullname = fullname;
        newUser.password = await helpers.encryptPassword(password);
       await pool.query('INSERT INTO USER SET?', [newUser]);
       
       
        return done(null, newUser);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser(async (user, done) => {
    const rows = await pool.query('SELECT * FROM USER WHERE ID= ? AND ROLE=?', [user.id,user.role]);
    done(null, rows[0]);

});

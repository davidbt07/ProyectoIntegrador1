const express = require('express');
const router = express.Router();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { route } = require('.');
router.get('/', (req, res) => {
    res.render('auth/signin');
});

router.get('/signup', (req, res) => {
    res.render('auth/signup');
});

router.post('/signup', (req, res) => {
    console.log(req.body);
    res.send("recivido");
});

router.post('/login', authUser,ensureToken,async (req, res) => {

    if (req.user.role == 1005) {

        res.setHeader('Authorization', 'Bearer ' + user.token);
        res.redirect('admin/');
    }
    
});

async function authRole(role) {
    return (res, req, next => {
        if (req.user.role !== role) {
            res.send('Not allowed');
        }
        next();
    });


}


async function authUser(req, res, next) {
    const { username } = req.body;
    const { password } = req.body;
    const axios = require('axios')

    const a = await axios.post('https://lis.udea.edu.co/api/ldap/login', {
        'username': username,
        'password': password
    }).catch(e => {
        req.flash('danger', '¡USUARIO y/o CONSTRASEÑA INVÁLIDOS!');
        res.redirect('/auth/');
      
    });

    req.token = a.data.token;
    next();
}


function ensureToken(req, res, next){
    const bearerheader = req.token;
  
    if (typeof bearerheader !== 'undefined') {
       
        jwt.verify(bearerheader, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
            if (err) {
                res.sendStatus(403);

            } else {
               
                const user = data.user;
                const token = bearerheader;
                const role = data.roleCode;
                req.user = { user, role, token};  
               
                next();
            }


        });
      
    } else {
        res.sendStatus(401);
       
    }
  

}
module.exports.authRole = authRole;
module.exports = router;
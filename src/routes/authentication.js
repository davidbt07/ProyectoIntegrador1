const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('auth/signin');
});

router.post('/login', async (req, res) => {
    const { username } = req.body;
    const { password } = req.body;
   
    const axios = require('axios')

    const a=await axios.post('https://lis.udea.edu.co/api/ldap/login', {
            'username': username,
        'password': password
    }).catch(e => {
        req.flash('danger', '¡USUARIO y/o CONSTRASEÑA INVÁLIDOS!');
      
    });
    console.log(a.data);
});

module.exports = router;
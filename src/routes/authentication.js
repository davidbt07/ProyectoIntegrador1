const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('auth/signin');
});

router.post('/login', async (req, res) => {
    const { username } = req.body;
    const { password } = req.body;
   
    const axios = require('axios')

    axios
        .post('https://lis.udea.edu.co/api/ldap/login', {
            
                'username': username,
                'password': password
            
        })
        .then((res) => {
            console.log(`statusCode: ${res.statusCode}`);
            console.log(res);
        })
        .catch((error) => {
            console.error(error);
        });



});

module.exports = router;
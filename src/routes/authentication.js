const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('auth/signin');
});

router.post('/login', async (req, res) => {
    const { username } = req.body;
    const { password } = req.body;
    const body = { username, password };
    console.log(username);
    console.log(password);
    const axios = require('axios')

    axios
        .post('https://lis.udea.edu.co/api/ldap/login', {
            body,
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
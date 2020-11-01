const express = require('express');
const router = express.Router();

const pool = require('../database');


router.get('/', (req, res) => {
    res.send('Hi teacher');
});

router.get('/practice/list', async(req, res) => {
    const practices = await pool.query('SELECT * FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id');
    
    console.log(practices);
    res.render('teacher/practicesList', {practices});
});

router.get('/practice/list/zoomin/:id', async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE ID=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    res.render('teacher/zoominPracticesList', { practice: practice[0] });
});


router.get('/practice/add', (req, res) => {
    console.log(req.body);
    res.render('teacher/createPractice');
});

router.post('/practice/add/next', async(req, res) => {
    let pods;
    if(req.body.pods === 'on'){
         pods = true;
    }else{
         pods = false;
    }
    await pool.query('INSERT INTO practice(name, description,pods)VALUES(?,?,?)',[req.body.name,req.body.description, pods]);
    console.log(req.body);
    const { name } = req.body;
    const deviceG = await pool.query('SELECT * FROM GENERALTYPE');
    console.log(deviceG);
    res.render('teacher/nextCreatePractice', {name, deviceG});
});

router.get('/practice/add/next', (req, res) => {
    res.render('teacher/nextCreatePractice');
});
module.exports = router;
const express = require('express');
const router = express.Router();

const pool = require('../database');


router.get('/', (req, res) => {
    res.send('Hi teacher');
});

router.get('/practice/list', async(req, res) => {
    const practices = await pool.query('SELECT r.id, r.id_practice, r.course, r.day, r.startHour, r.endHour, p.name, p.pods FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id;');
    res.render('teacher/practicesList', {practices});
});

router.get('/practice/list/zoomin/:id', async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE ID=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    const devices = await pool.query('SELECT gd.name as name, gt.name as type, gd.amount as amount, gd.ports as ports FROM RESERVEG r JOIN RESERVEBYDEVICE rd ON r.id = rd.reserve JOIN SPECIFICDEVICE sd ON rd.device = sd.id JOIN GENERALDEVICE gd ON sd.type = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE r.id = ?',[id]);
    res.render('teacher/zoominPracticesList', { practice: practice[0], devices});
});

router.get('/practice/list/edit/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id);
    const reserve = await pool.query('SELECT r.id as id, r.course as course, r.day as day, r.startHour as startHour, r.endHour as endHour, r.podsAmount as podsAmount, p.name as name FROM RESERVEG r JOIN PRACTICE p ON r.id_practice = p.id WHERE r.id = ?', [id]); 
    const practices = await pool.query('SELECT * FROM PRACTICE');//Le falta filtro a la practica
    console.log(reserve[0]);
    res.render('teacher/editReserve', {reserve: reserve[0], practices});
});
router.post('/practice/list/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { name, day, startHour, endHour, course, podsAmount } = req.body;
    const newReserve = {
        id_practice: name,
        day, 
        startHour,
        endHour,
        course,
        podsAmount
    };
    await pool.query('UPDATE RESERVEG set ? WHERE id = ?',[newReserve, id]);
    req.flash('success', 'PRÁCTICA ACTUALIZADA EXITOSAMENTE');
    res.redirect('/teacher/practice/list');
});

router.get('/practice/add', (req, res) => {
    res.render('teacher/createPractice');
});

router.get('/practice/remove/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM RESERVEG WHERE id = ?', [id]);
    req.flash('success', 'PRACTICA ELIMINADA EXITOSAMENTE');
    res.redirect('/teacher/practice/list');
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
const express = require('express');
const router = express.Router();

const pool = require('../database');


router.get('/', (req, res) => {
    res.send('Hi student');
});

router.get('/practice/list', async(req, res) => {
    const practices = await pool.query('SELECT r.id, r.id_practice, r.course, r.day, r.startHour, r.endHour, p.name, p.pods FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id;');
    res.render('student/practicesList', {practices});
});

router.get('/practice/list/zoomin/:id', async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE ID=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    const devices = await pool.query('SELECT gd.name as name, gt.name as type, gd.amount as amount, gd.ports as ports FROM RESERVEG r JOIN RESERVEBYDEVICE rd ON r.id = rd.reserve JOIN SPECIFICDEVICE sd ON rd.device = sd.id JOIN GENERALDEVICE gd ON sd.type = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE r.id = ?',[id]);
    res.render('student/zoominPracticesList', { practice: practice[0], devices});
});


router.get('/practice/reserva', async (req, res) => {
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');
    res.render('student/reservarPractice', { gtypes });
});
router.get('/practice/editarReserva', (req, res) => {
    res.render('student/editReserve');
});

module.exports = router;
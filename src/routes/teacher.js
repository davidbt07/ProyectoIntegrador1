'use strict';
const express = require('express');
const router = express.Router();

const pool = require('../database');


router.get('/', (req, res) => {
    res.send('Hi teacher');
});

router.get('/reserve/list', async (req, res) => {
    const reserves = await pool.query('SELECT r.id, r.id_practice, r.course, r.day, r.startHour, r.endHour, p.name, p.pods FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id;');
    res.render('teacher/reservesList', { reserves });
});

router.get('/reserve/list/zoomin/:id', async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE ID=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    const devices = await pool.query('SELECT gd.name as name, gt.name as type, gd.amount as amount, gd.ports as ports FROM RESERVEG r JOIN RESERVEBYDEVICE rd ON r.id = rd.reserve JOIN SPECIFICDEVICE sd ON rd.device = sd.id JOIN GENERALDEVICE gd ON sd.type = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE r.id = ?', [id]);
    res.render('teacher/zoominPracticesList', { practice: practice[0], devices });
});

router.get('/reserve/list/edit/:id', async (req, res) => {
    const { id } = req.params;
    console.log(id);
    const reserve = await pool.query('SELECT r.id as id, r.course as course, r.day as day, r.startHour as startHour, r.endHour as endHour, r.podsAmount as podsAmount, p.name as name FROM RESERVEG r JOIN PRACTICE p ON r.id_practice = p.id WHERE r.id = ?', [id]);
    const practices = await pool.query('SELECT * FROM PRACTICE');//Le falta filtro a la practica
    console.log(reserve[0]);
    res.render('teacher/editReserve', { reserve: reserve[0], practices });
});
router.post('/reserve/list/edit/:id', async (req, res) => {
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
    await pool.query('UPDATE RESERVEG set ? WHERE id = ?', [newReserve, id]);
    req.flash('success', 'PRÁCTICA ACTUALIZADA EXITOSAMENTE');
    res.redirect('/teacher/reserve/list');
});

router.get('/reserve/remove/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM RESERVEG WHERE id = ?', [id]);
    req.flash('success', 'PRACTICA ELIMINADA EXITOSAMENTE');
    res.redirect('/teacher/reserve/list');
});

router.get('/reserve/create', async (req, res) => {
    const practices = await pool.query('SELECT * FROM PRACTICE');
    res.render('teacher/bookPracticeG', { practices });
});
router.post('/reserve/create', async (req, res) => {
    const { name, day, startHour, endHour, course, podsAmount } = req.body;
    console.log(name);
    const newReserve = {
        id_practice: name,
        day,
        startHour,
        endHour,
        course: 'COM2',
        podsAmount
    };
    await pool.query('INSERT INTO RESERVEG(id_practice, day, startHour, endHour, course, podsAmount) values(?,?,?,?,?,?)', [name, day, startHour, endHour, 'COM2', podsAmount]);
    req.flash('success', 'PRÁCTICA CREADA EXITOSAMENTE');
    res.redirect('/teacher/reserve/list');
});

router.get('/practice/list', async (req, res) => {
    //Un profesor tiene unas practicas, por lo cual falta unir eso en el modelo entidad relacion.
    var practices = await pool.query('SELECT * FROM PRACTICE');
    //console.log(practices);
    Object.keys(practices).forEach(practice => {
        if(practices[practice].pods == true){
            practices[practice].pods='SI';
        }else{
            practices[practice].pods='NO';
        }
        console.log(practice, practices[practice]);
    });
    res.render('teacher/practicesList',{ practices });
});

router.get('/practice/add', (req, res) => {
    res.render('teacher/createPractice');
});

router.post('/practice/add/next', async (req, res) => {
    let pod;
    if (req.body.pods === 'on') {
        pod = true;
    } else {
        pod = false;
    }
    var practice = await pool.query('SELECT * FROM PRACTICE WHERE name = ? and description = ? and pods = ?', [req.body.name, req.body.description, pod]);
    if (practice[0] == undefined) {
        await pool.query('INSERT INTO practice(name, description,pods)VALUES(?,?,?)', [req.body.name, req.body.description, pod]);
        practice = await pool.query('SELECT * FROM PRACTICE WHERE name = ? and description = ? and pods = ?', [req.body.name, req.body.description, pod]);
        console.log(practice[0]);
        const { name } = req.body;
        const types = await pool.query('SELECT * FROM GENERALTYPE');
        res.render('teacher/nextCreatePractice', { name, types, practice: practice[0] });
    } else {
        console.log('no se puede insertar porque ya existe');

        res.redirect('/teacher/practice/add');
    }


});

router.get('/practice/add/next', (req, res) => {
    res.render('teacher/nextCreatePractice');
});

router.post('/practice/add/next/confirm', (req, res) => {
    res.redirect('/teacher/reserve/list');
});

router.get('/practice/add/cancel/:practice', async (req, res) => {
    const { practice } = req.params;
    console.log('cancelando');
    await pool.query('DELETE FROM PRACTICE WHERE id = ?',[practice]).catch(err => {
        console.log(err);
        res.send('No se encuentra la práctica');
    });
    res.redirect('/teacher/reserve/list');
});

//Rutas ajax
router.get('/practice/add/gdevicesfortype/:typ', async (req, res) => {
    const { typ } = req.params;
    const deviceG = await pool.query('SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type and g.type=?', [typ]);
    res.json(deviceG);
});

router.get('/practice/add/device/:practice/:device', async (req, res) => {
    const { practice, device } = req.params;
    console.log(req.params);
    await pool.query('INSERT INTO DEVICEBYPRACTICE(practice, device)VALUES(?,?)', [practice, device]).catch(err => {
        console.log(err);
        res.json('');
    });
    const dev = await pool.query('SELECT * FROM GENERALDEVICE WHERE id = ?', [device]);
    res.json(dev);
});

router.get('/practice/add/delete/:practice/:device', async (req, res) => {
    const { practice, device } = req.params;
    console.log(req.params);
    const dev = await pool.query('SELECT * FROM DEVICEBYPRACTICE WHERE practice = ? AND device = ?', [practice, device]);
    console.log(dev);
    await pool.query('DELETE FROM DEVICEBYPRACTICE WHERE practice = ? AND device = ?', [practice, device]);
    res.json(dev);
});
module.exports = router;
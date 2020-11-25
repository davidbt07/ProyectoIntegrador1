'use strict';
const express = require('express');
const router = express.Router();
const { isLoggedIn, isTeacher } = require('../lib/auth');
const pool = require('../database');


router.get('/', (req, res) => {
    res.send('Hi teacher');
});

router.get('/reserve/list', isLoggedIn, isTeacher, async (req, res) => {
    const reserves = await pool.query('SELECT r.id, r.id_practice, r.course, r.day, r.startHour, r.endHour, p.name, p.pods FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id');
    res.render('teacher/reservesList', { reserves });
});

router.get('/reserve/list/zoomin/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE ID=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    const devices = await pool.query('SELECT gd.name as name, gt.name as type, gd.amount as amount, gd.ports as ports FROM RESERVEG r JOIN RESERVEBYDEVICE rd ON r.id = rd.reserve JOIN SPECIFICDEVICE sd ON rd.device = sd.id JOIN GENERALDEVICE gd ON sd.type = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE r.id = ?', [id]);
    res.render('teacher/zoominReservesList', { practice: practice[0], devices });
});

router.get('/reserve/list/edit/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    console.log(id);
    var reserve = await pool.query('SELECT r.id as id, r.course as course, r.day as day, r.startHour as startHour, r.endHour as endHour, r.podsAmount as podsAmount, p.name as name, r.semester as semester, r.groupC as groupC, r.id_practice as practice FROM RESERVEG r JOIN PRACTICE p ON r.id_practice = p.id WHERE r.id = ?', [id]);
    const practices = await pool.query('SELECT * FROM PRACTICE');//Le falta filtro a la practica, son practicas de un profesor especifico
    const d = reserve[0].day;
    const fecha = new Date(d);
    reserve[0].day = fecha.getUTCFullYear() + '-' + fecha.getUTCMonth() + '-' + fecha.getUTCDate();
    console.log(reserve[0]);
    const courses = await pool.query('SELECT DISTINCT(name) FROM COURSE');
    res.render('teacher/editReserve', { reserve: reserve[0], practices, courses });
});
router.post('/reserve/list/edit/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    const { name, day, startHour, endHour, course, semesters, groups } = req.body;
    var { podsAmount } = req.body;
    const tempPractice = await pool.query('SELECT * FROM PRACTICE WHERE id = ?', [name]);
    if(tempPractice[0].pods == null){
        console.log('practica temporal')
        console.log(tempPractice[0]);
        podsAmount = null;
    }
    const newReserve = {
        id_practice: name,
        day,
        startHour,
        endHour,
        course,
        podsAmount,
        semester:semesters,
        groupC:groups
    };
    await pool.query('UPDATE RESERVEG set ? WHERE id = ?', [newReserve, id]);
    req.flash('success', 'PRÁCTICA ACTUALIZADA EXITOSAMENTE');
    res.redirect('/teacher/reserve/list');
});

router.get('/reserve/remove/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM RESERVEG WHERE id = ?', [id]);
    res.json('');
});

router.get('/reserve/create', isLoggedIn, isTeacher, async (req, res) => {
    const practices = await pool.query('SELECT * FROM PRACTICE');
    //Poner el filtro del profesor en los cursos a obtener
    const courses = await pool.query('SELECT DISTINCT(name) FROM COURSE');
    res.render('teacher/bookPracticeG', { practices, courses });
});
router.post('/reserve/create', isLoggedIn, isTeacher, async (req, res) => {
    const { name, day, startHour, endHour, course, semesters, groups, podsAmount } = req.body;
    await pool.query('INSERT INTO RESERVEG(id_practice, course, semester, groupC, day, startHour, endHour, podsAmount) values (?,?,?,?,?,?,?,?)', [name, course, semesters, groups, day, startHour, endHour, podsAmount]);
    req.flash('success', 'RESERVA CREADA EXITOSAMENTE');
    res.redirect('/teacher/reserve/list');
});

router.get('/practice/list', isLoggedIn, isTeacher, async (req, res) => {
    //Un profesor tiene unas practicas, por lo cual falta unir eso en el modelo entidad relacion.
    var practices = await pool.query('SELECT p.id ,p.name, p.pods, COUNT(dp.practice) as cantidad FROM PRACTICE p LEFT JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice GROUP BY p.id ,p.name, p.pods');
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

router.get('/practice/add', isLoggedIn, isTeacher, (req, res) => {
    res.render('teacher/createPractice');
});

router.post('/practice/add/next', isLoggedIn, isTeacher, async (req, res) => {
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
        const { name } = req.body;
        const types = await pool.query('SELECT * FROM GENERALTYPE');
        res.render('teacher/nextCreatePractice', { name, types, practice: practice[0] });
    } else {
        console.log('no se puede insertar porque ya existe');

        res.redirect('/teacher/practice/add');
    }


});

router.get('/practice/add/next', isLoggedIn, isTeacher, (req, res) => {
    res.render('teacher/nextCreatePractice');
});

router.post('/practice/add/next/confirm', isLoggedIn, isTeacher, (req, res) => {
    res.redirect('/teacher/practice/list');
});

router.get('/practice/add/next/cancel/:practice', isLoggedIn, isTeacher, async (req, res) => {
    const { practice } = req.params;
    await pool.query('DELETE FROM PRACTICE WHERE id = ?',[practice]).catch(err => {
        console.log(err);
        res.send('No se encuentra la práctica');
    });
    res.redirect('/teacher/practice/list');
});

router.get('/practice/list/zoomin/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [id]);
    const devices = await pool.query('SELECT gd.id as id,gd.name as name, gt.name as type, gd.ports as ports FROM PRACTICE p JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice JOIN GENERALDEVICE gd ON dp.device = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE p.id=?', [id]);
    res.render('teacher/zoominPracticesList', { practice: practice[0], devices });
});

router.get('/practice/list/edit/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    const practice = await pool.query('SELECT * FROM PRACTICE WHERE id = ?', [id]);
    const types = await pool.query('SELECT * FROM GENERALTYPE');
    const devices = await pool.query('SELECT gd.id as id,gd.name as name, gt.name as type, gd.ports as ports FROM PRACTICE p JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice JOIN GENERALDEVICE gd ON dp.device = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE p.id=?', [id]);
    res.render('teacher/editPractice', { practice: practice[0], types, devices});
});

router.post('/practice/list/edit/:id', isLoggedIn, isTeacher, async (req, res) => {
    console.log(req.body);
    console.log(req.params);
    var { name, description, pods, tipo } = req.body;
    const { id } = req.params;
    if(pods == 'on'){
        pods = true;
    }else{
        pods = false;
    }
    const newPractice = {
        name,
        description,
        pods
    }
    await pool.query('UPDATE PRACTICE set ? WHERE id = ?', [newPractice, id]);
    req.flash('success', 'PRÁCTICA EDITADA EXITOSAMENTE');
    res.redirect('/teacher/practice/list');
});

//Rutas ajax
router.get('/practice/add/gdevicesfortype/:typ', isLoggedIn, isTeacher, async (req, res) => {
    const { typ } = req.params;
    const deviceG = await pool.query('SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type and g.type=?', [typ]);
    res.json(deviceG);
});

router.get('/practice/add/device/:practice/:device', isLoggedIn, isTeacher, async (req, res) => {
    const { practice, device } = req.params;
    console.log(req.params);
    await pool.query('INSERT INTO DEVICEBYPRACTICE(practice, device)VALUES(?,?)', [practice, device]).catch(err => {
        console.log(err);
        res.json('');
    });
    const dev = await pool.query('SELECT * FROM GENERALDEVICE WHERE id = ?', [device]);
    res.json(dev);
});

router.get('/practice/add/delete/:practice/:device', isLoggedIn, isTeacher, async (req, res) => {
    const { practice, device } = req.params;
    await pool.query('DELETE FROM DEVICEBYPRACTICE WHERE practice = ? AND device = ?', [practice, device]);
    res.json('');
});

router.get('/practice/list/delete/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM PRACTICE WHERE id = ?', [id]);
    res.json('');
});

router.get('/reserve/create/semesterbycourse/:course', isLoggedIn, isTeacher, async (req, res) => {
    const { course } = req.params;
    const semesters = await pool.query('SELECT DISTINCT(semester) FROM COURSE WHERE name = ?',[course]);
    res.json(semesters);
});

router.get('/reserve/create/groupbysemester/:semester/:course', isLoggedIn, isTeacher, async (req, res) => {
    const { semester, course } = req.params;
    const groups = await pool.query('SELECT DISTINCT(groupC) FROM COURSE WHERE name = ? and semester = ?', [course, semester]);
    res.json(groups);
});

router.get('/reserve/create/podsinpractice/:practice', isLoggedIn, isTeacher, async (req, res) => {
    const { practice } = req.params;
    console.log(practice);
    const pods = await pool.query('SELECT pods FROM PRACTICE WHERE id = ?', [practice]);
    console.log(pods);
    if(pods[0]){
        if (pods[0].pods == true ){
            pods[0] = true;
        }else{
            pods[0] = false;
        }
    }
    res.json(pods[0]);
});

module.exports = router;
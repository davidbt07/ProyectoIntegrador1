'use strict';
const express = require('express');
const router = express.Router();
const { isLoggedIn, isTeacher } = require('../lib/auth');
const pool = require('../database');
const role = 'profesor';

router.get('/', (req, res) => {
    res.send('Hi teacher');
});

router.get('/reserve/list', isLoggedIn, isTeacher, async (req, res) => {
    const reserves = await pool.query('SELECT r.id, r.id_practice, r.course, r.day, r.startHour, r.endHour, p.name, p.pods FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id where p.teacher_id = ? and role = ?', [req.teacher.id, role]);
    res.render('teacher/reservesList', { reserves });
});

//Por editar
router.get('/reserve/list/zoomin/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE id=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    const devices = await pool.query('SELECT gd.name as name, gt.name as type,COUNT(*) as amount, gd.ports as ports FROM RESERVEG rg JOIN RESERVEBYDEVICE rd ON rg.id = rd.reserve JOIN SPECIFICDEVICE sd ON sd.id = rd.device JOIN GENERALDEVICE gd ON sd.type = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE rg.id = ? GROUP BY gt.id', [id]);
    res.render('teacher/zoominReservesList', { practice: practice[0], devices });
});

router.get('/reserve/list/edit/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    var reserve = await pool.query('SELECT r.id as id, r.course as course, r.day as day, r.startHour as startHour, r.endHour as endHour, r.podsAmount as podsAmount, p.name as name, r.semester as semester, r.groupC as groupC, r.id_practice as practice FROM RESERVEG r JOIN PRACTICE p ON r.id_practice = p.id WHERE r.id = ? and p.teacher_id = ? and role = ?', [id, req.teacher.id, role]);
    const practices = await pool.query('SELECT * FROM PRACTICE WHERE teacher_id = ? and role = ?', [req.teacher.id, role]);//Le falta filtro a la practica, son practicas de un profesor especifico
    const d = reserve[0].day;
    const fecha = new Date(d);
    var dia = fecha.getUTCDate();
    var mes = fecha.getUTCMonth();
    console.log(dia);
    if(dia < 10){
        dia = '0' + fecha.getUTCDate();
    }
    if(mes <10){
        mes = '0' + fecha.getUTCMonth();
    }
    reserve[0].day = fecha.getUTCFullYear() + '-' + mes + '-' + dia;
    console.log(reserve[0]);
    const courses = await pool.query('SELECT DISTINCT(name) FROM COURSE WHERE teacher_id = ? and role = ?', [req.teacher.id, role]);
    res.render('teacher/editReserve', { reserve: reserve[0], practices, courses });
});
router.post('/reserve/list/edit/:id', isLoggedIn, isTeacher, async (req, res) => {
    const { id } = req.params;
    const { name, day, startHour, endHour, course, semesters, groups } = req.body;
    var { podsAmount } = req.body;
    const tempPractice = await pool.query('SELECT * FROM PRACTICE WHERE id = ?', [name]);
    if(tempPractice[0].pods == null){
        podsAmount = null;
    }
    //Aquí hay que actualizar el cambio de practica, es decir, editar la tabla reservebydevice, agregarle o quitarle dispositivos
    await pool.query('DELETE FROM RESERVEBYDEVICE WHERE reserve = ?', [id]);
    const students = await pool.query('SELECT COUNT(DISTINCT(student_id)) as cantidad FROM COURSE c JOIN ENROLLMENT e ON e.semester = c.semester and e.course = c.name and e.groupC = c.groupC WHERE c.name=? and c.semester = ? and c.groupC = ?',[course, semesters, groups]);
    const types = await pool.query('SELECT sd.type FROM PRACTICE p JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice JOIN GENERALDEVICE gd ON gd.id = dp.device JOIN SPECIFICDEVICE sd ON sd.type = gd.id WHERE p.id = ? and sd.id NOT IN (SELECT sd.id FROM RESERVEBYDEVICE rd JOIN SPECIFICDEVICE sd ON sd.id = rd.device  JOIN RESERVEG rg ON rg.id = rd.reserve JOIN PRACTICE p ON p.id = rg.id_practice JOIN DEVICEBYPRACTICE dp ON dp.practice = p.id JOIN GENERALDEVICE gd ON gd.id = dp.device  WHERE (rg.day = ?) AND ((rg.startHour BETWEEN ? AND ?) OR (rg.endHour BETWEEN ? AND ?)) AND (sd.state = ?) AND (p.id = ?) AND (sd.type = gd.id))GROUP BY sd.type ORDER BY sd.type ASC', [name, day, startHour, endHour, startHour, endHour, 'DISPONIBLE', name]);
    for(const type in types){
        const devices = await pool.query('SELECT * FROM (SELECT sd.id, sd.type FROM PRACTICE p JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice JOIN GENERALDEVICE gd ON gd.id = dp.device JOIN SPECIFICDEVICE sd ON sd.type = gd.id WHERE p.id = ? and sd.id NOT IN (SELECT sd.id FROM RESERVEBYDEVICE rd JOIN SPECIFICDEVICE sd ON sd.id = rd.device  JOIN RESERVEG rg ON rg.id = rd.reserve JOIN PRACTICE p ON p.id = rg.id_practice JOIN DEVICEBYPRACTICE dp ON dp.practice = p.id JOIN GENERALDEVICE gd ON gd.id = dp.device  WHERE (rg.day = ?) AND ((rg.startHour BETWEEN ? AND ?) OR (rg.endHour BETWEEN ? AND ?)) AND (sd.state = ?) AND (p.id = ?) AND (sd.type = gd.id))ORDER BY sd.type ASC) d WHERE type = ? LIMIT ?', [name, day, startHour, endHour, startHour, endHour, 'DISPONIBLE', name, `${types[type].type}`, students[0].cantidad + 1]);
        for(const dev in devices){
            console.log('insertando');
            await pool.query('INSERT INTO RESERVEBYDEVICE(reserve, device) VALUES(?,?)', [id,  `${devices[dev].id}`]);
        }
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
    const practices = await pool.query('SELECT * FROM PRACTICE WHERE teacher_id = ? and role = ?', [req.teacher.id, role]);
    const courses = await pool.query('SELECT DISTINCT(name) FROM COURSE WHERE teacher_id = ? and role = ?', [req.teacher.id, role]);
    res.render('teacher/bookPracticeG', { practices, courses });
});
router.post('/reserve/create', isLoggedIn, isTeacher, async (req, res) => {
    const { name, day, startHour, endHour, course, semesters, groups } = req.body;
    var { podsAmount } = req.body;
    console.log(req.body);
    await pool.query('INSERT INTO RESERVEG(id_practice, course, semester, groupC, day, startHour, endHour, podsAmount) values (?,?,?,?,?,?,?,?)', [name, course, semesters, groups, day, startHour, endHour, podsAmount]);
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE id_practice = ? and course = ? and semester = ? and groupC = ? and day = ? and startHour = ? and endHour = ?',[name, course, semesters, groups, day, startHour, endHour]);
    const students = await pool.query('SELECT COUNT(DISTINCT(student_id)) as cantidad FROM COURSE c JOIN ENROLLMENT e ON e.semester = c.semester and e.course = c.name and e.groupC = c.groupC WHERE c.name=? and c.semester = ? and c.groupC = ?',[course, semesters, groups]);
    const types = await pool.query('SELECT sd.type FROM PRACTICE p JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice JOIN GENERALDEVICE gd ON gd.id = dp.device JOIN SPECIFICDEVICE sd ON sd.type = gd.id WHERE p.id = ? and sd.id NOT IN (SELECT sd.id FROM RESERVEBYDEVICE rd JOIN SPECIFICDEVICE sd ON sd.id = rd.device  JOIN RESERVEG rg ON rg.id = rd.reserve JOIN PRACTICE p ON p.id = rg.id_practice JOIN DEVICEBYPRACTICE dp ON dp.practice = p.id JOIN GENERALDEVICE gd ON gd.id = dp.device  WHERE (rg.day = ?) AND ((rg.startHour BETWEEN ? AND ?) OR (rg.endHour BETWEEN ? AND ?)) AND (sd.state = ?) AND (p.id = ?) AND (sd.type = gd.id))GROUP BY sd.type ORDER BY sd.type ASC', [name, day, startHour, endHour, startHour, endHour, 'DISPONIBLE', name]);
    for(const type in types){
        const devices = await pool.query('SELECT * FROM (SELECT sd.id, sd.type FROM PRACTICE p JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice JOIN GENERALDEVICE gd ON gd.id = dp.device JOIN SPECIFICDEVICE sd ON sd.type = gd.id WHERE p.id = ? and sd.id NOT IN (SELECT sd.id FROM RESERVEBYDEVICE rd JOIN SPECIFICDEVICE sd ON sd.id = rd.device  JOIN RESERVEG rg ON rg.id = rd.reserve JOIN PRACTICE p ON p.id = rg.id_practice JOIN DEVICEBYPRACTICE dp ON dp.practice = p.id JOIN GENERALDEVICE gd ON gd.id = dp.device  WHERE (rg.day = ?) AND ((rg.startHour BETWEEN ? AND ?) OR (rg.endHour BETWEEN ? AND ?)) AND (sd.state = ?) AND (p.id = ?) AND (sd.type = gd.id))ORDER BY sd.type ASC) d WHERE type = ? LIMIT ?', [name, day, startHour, endHour, startHour, endHour, 'DISPONIBLE', name, `${types[type].type}`, students[0].cantidad + 1]);
        for(const dev in devices){
            console.log('insertando');
            await pool.query('INSERT INTO RESERVEBYDEVICE(reserve, device) VALUES(?,?)', [reserve[0].id,  `${devices[dev].id}`]);
        }
    }
    req.flash('success', 'RESERVA CREADA EXITOSAMENTE');
    res.redirect('/teacher/reserve/list');
});

router.get('/practice/list', isLoggedIn, isTeacher, async (req, res) => {
    //Un profesor tiene unas practicas, por lo cual falta unir eso en el modelo entidad relacion.
    var practices = await pool.query('SELECT p.id ,p.name, p.pods, COUNT(dp.practice) as cantidad FROM PRACTICE p LEFT JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice WHERE p.teacher_id = ? and p.role = ? GROUP BY p.id ,p.name, p.pods', [req.teacher.id, role]);
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

router.get('/practice/add/next', isLoggedIn, isTeacher, (req, res) => {
    res.render('teacher/nextCreatePractice');
});

router.post('/practice/add/next', isLoggedIn, isTeacher, async (req, res) => {
    let pod;
    if (req.body.pods === 'on') {
        pod = true;
    } else {
        pod = false;
    }
    var practice = await pool.query('SELECT * FROM PRACTICE WHERE name = ? and description = ? and pods = ? and teacher_id = ? and role = ?', [req.body.name, req.body.description, pod, req.teacher.id, role]);
    if (practice[0] == undefined) {
        await pool.query('INSERT INTO practice(name, description,pods, teacher_id, role)VALUES(?,?,?,?,?)', [req.body.name, req.body.description, pod, req.teacher.id, role]);
        practice = await pool.query('SELECT * FROM PRACTICE WHERE name = ? and description = ? and pods = ? and teacher_id = ? and role = ?', [req.body.name, req.body.description, pod, req.teacher.id, role]);
        const { name } = req.body;
        const types = await pool.query('SELECT * FROM GENERALTYPE');
        res.render('teacher/nextCreatePractice', { name, types, practice: practice[0] });
    } else {
        console.log('no se puede insertar porque ya existe');

        res.redirect('/teacher/practice/add');
    }


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
    const semesters = await pool.query('SELECT DISTINCT(semester) FROM COURSE WHERE name = ? and teacher_id = ? and role = ?',[course, req.teacher.id, role]);
    res.json(semesters);
});

router.get('/reserve/create/groupbysemester/:semester/:course', isLoggedIn, isTeacher, async (req, res) => {
    const { semester, course } = req.params;
    const groups = await pool.query('SELECT DISTINCT(groupC) FROM COURSE WHERE name = ? and semester = ? and teacher_id = ? and role = ?', [course, semester, req.teacher.id, role]);
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

router.get('/reserve/create/verify/:info', isLoggedIn, isTeacher, async (req, res) => {
    const info = req.params.info;
    var array = info.split(',');
    const students = await pool.query('SELECT COUNT(DISTINCT(student_id)) as cantidad FROM COURSE c JOIN ENROLLMENT e ON e.semester = c.semester and e.course = c.name and e.groupC = c.groupC WHERE c.name=? and c.semester = ? and c.groupC = ?',[array[4], array[5], array[6]]);
    const devicesAv = await pool.query('SELECT sd.type ,COUNT(*) as cantidad FROM PRACTICE p JOIN DEVICEBYPRACTICE dp ON p.id = dp.practice JOIN GENERALDEVICE gd ON gd.id = dp.device JOIN SPECIFICDEVICE sd ON sd.type = gd.id WHERE p.id = ? and sd.id NOT IN (SELECT sd.id FROM RESERVEBYDEVICE rd JOIN SPECIFICDEVICE sd ON sd.id = rd.device  JOIN RESERVEG rg ON rg.id = rd.reserve JOIN PRACTICE p ON p.id = rg.id_practice JOIN DEVICEBYPRACTICE dp ON dp.practice = p.id JOIN GENERALDEVICE gd ON gd.id = dp.device  WHERE (rg.day = ?) AND ((rg.startHour BETWEEN ? AND ?) OR (rg.endHour BETWEEN ? AND ?)) AND (sd.state = ?) AND (p.id = ?) AND (sd.type = gd.id)) GROUP BY sd.type;', [array[0], array[1], array[2], array[3], array[2], array[3], 'DISPONIBLE', array[0]]);
    var bander = true;
    if(devicesAv[0] == undefined){
        bander = false;
    }else{
        Object.keys(devicesAv).forEach(iterator => {
         if(devicesAv[iterator].cantidad < students[0].cantidad){//Es menor o igual
             console.log(devicesAv[iterator].type,'menor');
             console.log('Error, NO HAY DISPOSITIVOS DISPONIBLES');
             bander = false;
         }else{
             console.log(devicesAv[iterator].type,'mayor');
             console.log('Hay dispositivos disponibles');
         }
     });
    }
    res.json(bander);
});

module.exports = router;
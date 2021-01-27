const express = require('express');
const router = express.Router();
const { isLoggedIn, isStudent } = require('../lib/auth');
const pool = require('../database');


router.get('/', (req, res) => {
    res.send('Hi student');
});

router.get('/practice/list', isLoggedIn, isStudent, async(req, res) => {
    const practices = await pool.query('SELECT r.id, r.id_practice, r.course, r.day, r.startHour, r.endHour, p.name, p.pods FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id;');
    res.render('student/practicesList', {practices});
});

router.get('/practice/list/zoomin/:id', isLoggedIn, isStudent, async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE ID=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    const devices = await pool.query('SELECT gd.name as name, gt.name as type, gd.amount as amount, gd.ports as ports FROM RESERVEG r JOIN RESERVEBYDEVICE rd ON r.id = rd.reserve JOIN SPECIFICDEVICE sd ON rd.device = sd.id JOIN GENERALDEVICE gd ON sd.type = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE r.id = ?',[id]);
    res.render('student/zoominPracticesList', { practice: practice[0], devices});
});


router.get('/practice/reserva', isLoggedIn, isStudent, async (req, res) => {
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');
    res.render('student/reservarPractice', { gtypes });
});
router.get('/practice/editarReserva', isLoggedIn, isStudent, (req, res) => {
    res.render('student/editReserve');
});


router.get('/practice/gdevicesfortype/:typ', isLoggedIn, isStudent, async (req, res) => {
    const { typ } = req.params;
    const gDevices = await pool.query('SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type and g.type=?', [typ]);
    res.json(gDevices);
});

router.post('/practice/add/', isLoggedIn, isStudent,async (req, res) => {
   const{day,startHour,type,endHour}=req.body;
   console.log(req.body);
    const r=await pool.query('SELECT * FROM (SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type WHERE s.type=? AND s.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEG rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))) AS r WHERE r.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEI rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))',[type,type,day,startHour,endHour,startHour,endHour,type,day,startHour,endHour,startHour,endHour])
    await console.log(r);
    const idr=r[0].id;
   
    const reservei={};
    reservei.user=req.student.id;
    reservei.day=day;
    reservei.startHour=startHour;
    reservei.endHour=endHour;
        const result= await pool.query('INSERT INTO RESERVEI SET ? ',[reservei]);
        console.log(result);
        const reserveid=result.insertId;
        const reservebd={};
        reservebd.reserve=reserveid;
        reservebd.type='I';
        reservebd.device=idr;
        await pool.query('INSERT INTO RESERVEBYDEVICE SET ?',[reservebd]);

    console.log(r);


});

router.get('/practice/g', isLoggedIn, isStudent, async (req, res) => {
    const r=await pool.query('SELECT * FROM GENERALDEVICE g JOIN SPECIFICDEVICE c WHERE g.type=3')
   
    
    console.log(r);
});


module.exports = router;
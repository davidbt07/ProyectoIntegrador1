const express = require('express');
const router = express.Router();
const { isLoggedIn, isStudent } = require('../lib/auth');
const pool = require('../database');
const { NodeSSH } = require('node-ssh')

router.get('/', (req, res) => {
    res.send('Hi student');
});

router.get('/practice/list', isLoggedIn, isStudent, async (req, res) => {
    const practices = await pool.query('SELECT r.id, r.id_practice, r.course, r.day, r.startHour, r.endHour, p.name, p.pods FROM RESERVEG r INNER JOIN PRACTICE p ON r.id_practice = p.id;');
    res.render('student/practicesList', { practices });
});
router.get('/singleReserves', isLoggedIn, isStudent, async (req, res) => {
    const practicesi= await pool.query('SELECT * FROM RESERVEI WHERE USER=?', [req.student.id]);
    res.render('student/practicesListi', {practicesi });
});

router.get('/practice/list/zoomin/:id', isLoggedIn, isStudent, async (req, res) => {
    const { id } = req.params;
    const reserve = await pool.query('SELECT * FROM RESERVEG WHERE ID=?', [id]);
    const practice = await pool.query('SELECT * FROM PRACTICE p WHERE p.id = ?', [reserve[0].id_practice]);
    const devices = await pool.query('SELECT gd.name as name, gt.name as type, gd.amount as amount, gd.ports as ports FROM RESERVEG r JOIN RESERVEBYDEVICE rd ON r.id = rd.reserve JOIN SPECIFICDEVICE sd ON rd.device = sd.id JOIN GENERALDEVICE gd ON sd.type = gd.id JOIN GENERALTYPE gt ON gd.type = gt.id WHERE r.id = ?', [id]);
    res.render('student/zoominPracticesList', { practice: practice[0], devices });
});

router.get('/practice/add/delete/:pid/:sd', isLoggedIn, isStudent, async (req, res) => {
    const { pid,sd } = req.params;
    const r=await pool.query('DELETE FROM RESERVEBYDEVICE WHERE reserve=? and device=?',[pid,sd])
    console.log(r);
res.json('');
});


router.get('/practice/book', isLoggedIn, isStudent, async (req, res) => {

    res.render('student/bookPractice');
});
router.get('/practice/editarReserva', isLoggedIn, isStudent, (req, res) => {
    res.render('student/editReserve');
});


router.get('/practice/gdevicesfortype/:typ', isLoggedIn, isStudent, async (req, res) => {
    const { typ } = req.params;
    const gDevices = await pool.query('SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type and g.type=?', [typ]);
    res.json(gDevices);
});

router.get('/turn/:type', isLoggedIn, isStudent, async (req, res) => {
    const { type } = req.params;
      var err=false;
    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.27.16',
        username: 'pi',
        password: 'raspberry'
    }).catch(e => {
        err=true;
        req.flash('danger', 'ERROR DE CONEXIÓN');
        console.log(e);
        res.redirect('/student');
    });
    await ssh.execCommand('/home/pi/pin26-' + type, { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
    }).catch(e => {
        req.flash('danger', 'ERROR DE CONEXIÓN');
        err=true;
        console.log(e);
        res.redirect('/student');
    });

if(!err){
    res.json('');
}
});

router.get('/reserve/start/:id', isLoggedIn, isStudent, async (req, res) => {
    const { id } = req.params;
    const today = new Date();
    const reserve = await pool.query('SELECT * FROM RESERVEI WHERE id=?', [id]);
    const reservei = reserve[0];


    var reservehours = new Date();
    const reserveDate = new Date(reservei.day);



    if (today.getDay() == reserveDate.getDay()) {

        const startHour = new Date("December 17, 1995 " + reservei.startHour);
        const endHour = new Date("December 17, 1995 " + reservei.endHour);
       

        if (today.getHours() >= startHour.getHours() && today.getHours() <= endHour.getHours()) {
               
            if (today.getHours() == startHour.getHours() && today.getHours() == endHour.getHours()) {
                if (today.getMinutes() > startHour.getMinutes() && today.getMinutes() < endHour.getMinutes()) {
                    res.render('student/turnonoff')
                }else {
                    req.flash('danger', 'No es la hora de la reserva');
                    res.redirect('/student/practice/list');
                }

            }else if(today.getHours()==startHour.getHours()){
                if(today.getMinutes()>=startHour.getMinutes()){
                    res.render('student/turnonoff')
                }else {
                    req.flash('danger', 'No es la hora de la reserva');
                    res.redirect('/student/practice/list');
                }
            }else if(today.getHours()==endHour.getHours()){
                if(today.getMinutes()<=endHour.getMinutes()){
                    res.render('student/turnonoff')
                }else {
                    req.flash('danger', 'No es la hora de la reserva');
                    res.redirect('/student/practice/list');
                }
            }else{
                res.render('student/turnonoff')
            }

           

        }else{
            console.log('aqui');
            req.flash('danger', 'No es la hora de la reserva');
            res.redirect('/student/practice/list');
        }
    } else {
        console.log('aqui');
        req.flash('danger', 'No es la hora de la reserva');
        res.redirect('/student/practice/list');
    }


});

router.post('/practice/add', isLoggedIn, isStudent, async (req, res) => {
    const { type, id } = req.body;
      var result=[{}];    
    const reservei = await pool.query('SELECT * FROM RESERVEI WHERE id=?', [id]);
    const day = reservei[0].day;
    const startHour = reservei[0].startHour;
    const endHour = reservei[0].endHour;
    const r = await pool.query('SELECT * FROM (SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type WHERE s.type=? AND s.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEG rg ON rb.reserve=rg.id where s.type=? and day=? and( ? between startHour and endHour or ? between startHour and endHour))) AS r WHERE r.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEI rg ON rb.reserve=rg.id where s.type=? and day=? and( ? between startHour and endHour or ? between startHour and endHour))', [type,type,day,startHour,endHour,type,day,startHour,endHour]);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
   
   
    if (r.length != 0) {
        const idr = r[0].id;
        const reservebd = {};
        reservebd.reserve = id;
        reservebd.type = 'I';
        reservebd.device = idr;
        await pool.query('INSERT INTO RESERVEBYDEVICE SET ?', [reservebd]);
        result=await pool.query('SELECT s.id,g.name,g.ports,g.type FROM SPECIFICDEVICE s INNER JOIN GENERALDEVICE g ON s.type=g.id WHERE s.id=?',[idr]);
        result[0].result=1;
    }else{
        result[0].result=0;
    }
    res.json(result);

})

router.get('/reserve/delete/:id', isLoggedIn, isStudent, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM RESERVEBYDEVICE WHERE RESERVE=?', [id]);
    await pool.query('DELETE FROM RESERVEI WHERE ID=?', [id]);
    res.json('');

});

router.get('/gdetails/:id', isLoggedIn, isStudent, async (req, res) => {
    const { id } = req.params;
    const gDevice = await pool.query('SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type and g.id=?', [id]);
    const sDevices = await pool.query('SELECT * FROM (SELECT id as sid,state, type from SPECIFICDEVICE) sd JOIN GENERALDEVICE g WHERE sd.type=g.id and g.id=?', [id]);

    res.render('student/gDeviceDetails', { gDevice: gDevice[0], sDevices });
});

router.get('/reserve/list/zoomin/:id', isLoggedIn, isStudent, async (req, res) => {
    const { id } = req.params;
    devices = await pool.query('SELECT gd.name,gd.ports,gt.name as type,gd.id FROM RESERVEI ri INNER JOIN RESERVEBYDEVICE rbd ON ri.id=rbd.reserve INNER JOIN SPECIFICDEVICE sd ON sd.id=rbd.device INNER JOIN GENERALDEVICE gd ON gd.id=sd.type INNER JOIN GENERALTYPE gt ON gd.type=gt.id WHERE ri.id=?', [id]);

    res.render('student/zoominReservesList', { devices });
});

router.post('/practice/book/', isLoggedIn, isStudent, async (req, res) => {
    const { day, startHour, endHour } = req.body;
    const reservei = {};
    reservei.user = req.student.id;
    reservei.day = day;
    reservei.startHour = startHour;
    reservei.endHour = endHour;
    const result = await pool.query('INSERT INTO RESERVEI SET ? ', [reservei]);
    const id = result.insertId;
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');
    res.render('student/bookPracticeNext', { id, gtypes })


    /*const{day,startHour,type,endHour,id}=req.body;
     console.log(id);
     var result={};
     if(id==-1){
         const r=await pool.query('SELECT * FROM (SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type WHERE s.type=? AND s.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEG rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))) AS r WHERE r.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEI rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))',[type,type,day,startHour,endHour,startHour,endHour,type,day,startHour,endHour,startHour,endHour])
         
         if(r.length!=0){
         const idr=r[0].id;
        
         
         const reservei={};
         reservei.user=req.student.id;
         reservei.day=day;
         reservei.startHour=startHour;
         reservei.endHour=endHour;
              result= await pool.query('INSERT INTO RESERVEI SET ? ',[reservei]);
            
             const reserveid=result.insertId;
             const reservebd={};
             reservebd.reserve=reserveid;
             reservebd.type='I';
             reservebd.device=idr;
             await pool.query('INSERT INTO RESERVEBYDEVICE SET ?',[reservebd]);
             console.log(idr);
         result=await pool.query('SELECT s.id,g.name,g.ports,g.type FROM SPECIFICDEVICE s INNER JOIN GENERALDEVICE g ON s.type=g.id WHERE s.id=?',[idr]);
         result[0].pid=reserveid;    
     }else{
             result.result=0;
         }
         console.log(result[0]);
   
     }else{
         
         const r=await pool.query('SELECT * FROM (SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type WHERE s.type=? AND s.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEG rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))) AS r WHERE r.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEI rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))',[type,type,day,startHour,endHour,startHour,endHour,type,day,startHour,endHour,startHour,endHour])
        
         if(r.length!=0){
         const idr=r[0].id;
             const reservebd={};
             reservebd.reserve=id;
             reservebd.type='I';
             reservebd.device=idr;
             await pool.query('INSERT INTO RESERVEBYDEVICE SET ?',[reservebd]);
         result=await pool.query('SELECT s.id,g.name,g.ports,g.type FROM SPECIFICDEVICE s INNER JOIN GENERALDEVICE g ON s.type=g.id WHERE s.id=?',[idr]);
         result[0].pid=id;   
     }else{
             result.result=0;
         }
     }
    /*const r=await pool.query('SELECT * FROM (SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type WHERE s.type=? AND s.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEG rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))) AS r WHERE r.id NOT IN(SELECT s.id FROM GENERALDEVICE g INNER JOIN SPECIFICDEVICE s ON g.id=s.type INNER JOIN RESERVEBYDEVICE rb ON rb.device=s.id INNER JOIN RESERVEI rg ON rb.reserve=rg.id where s.type=? and day=? and (startHour between ? and ?)  or (endHour between ? and ?))',[type,type,day,startHour,endHour,startHour,endHour,type,day,startHour,endHour,startHour,endHour])
     var result={};
     if(r.length!=0){
     const idr=r[0].id;
    
     
     const reservei={};
     reservei.user=req.student.id;
     reservei.day=day;
     reservei.startHour=startHour;
     reservei.endHour=endHour;
         var result= await pool.query('INSERT INTO RESERVEI SET ? ',[reservei]);
        
         const reserveid=result.insertId;
         const reservebd={};
         reservebd.reserve=reserveid;
         reservebd.type='I';
         reservebd.device=idr;
         await pool.query('INSERT INTO RESERVEBYDEVICE SET ?',[reservebd]);
         console.log(idr);
     result=await pool.query('SELECT s.id,g.name,g.ports,g.type FROM SPECIFICDEVICE s INNER JOIN GENERALDEVICE g ON s.type=g.id WHERE s.id=?',[idr]);
     }else{
         result.result=0;
     }
     console.log(result[0]);*/
});

router.get('/practice/g', isLoggedIn, isStudent, async (req, res) => {
    const r = await pool.query('SELECT * FROM GENERALDEVICE g JOIN SPECIFICDEVICE c WHERE g.type=3')


    console.log(r);
});


module.exports = router;
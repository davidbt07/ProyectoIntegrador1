const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../lib/auth');
const pool = require('./../database');
//const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
//const gDeviceController = require('../controller/gdevice.controller');


const fs = require('fs')
const path = require('path')
const { NodeSSH } = require('node-ssh')

router.get('/add', isLoggedIn, isAdmin, async (req, res) => {
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');
    res.render('admin/addg', { gtypes });
});


router.get('/open-router/:id', async (req, res) => {
    const ssh = new NodeSSH();
    const {id}=req.params;

    console.log(stan);
    await ssh.connect({
        host: '192.168.30.49',
        username: 'telematica',
        password: 'root'
    });
    await ssh.execCommand('/scripts/create-vm.sh '+stan+' '+vlan, { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
        res.redirect('http://192.168.30.49:8080/'+stan);
    })
});

router.get('/create-vm/:stan/:vlan', async (req, res) => {
    const ssh = new NodeSSH();
    const {stan,vlan}=req.params;

    console.log(stan);
    await ssh.connect({
        host: '192.168.30.49',
        username: 'telematica',
        password: 'root'
    });
    await ssh.execCommand('/scripts/create-vm.sh '+stan+' '+vlan, { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
        res.redirect('http://192.168.30.49:8080/'+stan);
    })
});

router.get('/delete-vm/:stani/:stanf', async (req, res) => {
    const ssh = new NodeSSH();
    const {stani,stanf}=req.params;

 console.log(stani,stanf)
    await ssh.connect({
        host: '192.168.30.49',
        username: 'telematica',
        password: 'root'
    });
    await ssh.execCommand('/scripts/delete-vms.sh '+stani+' '+stanf, { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
        res.redirect('http://localhost:4000');
    })
});

router.get('/ssh2', async (req, res) => {
    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.30.49',
        username: 'telematica',
        password: 'root'
    });
    await ssh.execCommand('/scripts/run-vm.sh 12', { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
    })
});

router.get('/ssh3', async (req, res) => {
    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.30.49',
        username: 'telematica',
        password: 'root'
    });
    await ssh.execCommand('/scripts/delete-vm.sh 13', { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
    })
});

router.get('/ssh', async (req, res) => {
    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.30.49',
        username: 'telematica',
        password: 'root'
    });
    await ssh.execCommand('/scripts/create-vm.sh 13 10', { cwd: '' }).then(function (result) {
  
res.redirect("http://192.168.30.49:8080/")

    })
});


router.post('/add', isLoggedIn, isAdmin, async (req, res) => {

    const { name, type, description, amount, ports } = req.body;
    const newGDevice = { name, type, description, amount, ports };
    const a = await pool.query('INSERT INTO GENERALDEVICE SET?', [newGDevice]);
    id = a.insertId;
    const d = 'DISPONIBLE';
    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.30.49',
        username: 'telematica',
        password: 'root'
    });
    await ssh.execCommand('/scripts/create-vms.sh '+0+' '+amount+ " "+10, { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
 
    });
  
    for (var i = 0; i < amount; i++) {
      const result= await pool.query('INSERT INTO SPECIFICDEVICE(state, type)VALUES(?, ?)', [d, id]);
       await ssh.execCommand('/scripts/create-vm.sh '+result.insertId+" "+10, { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
 
    });
  
      
    }

    req.flash('success', 'DISPOSITIVO GUARDADO EXITOSAMENTE');

    res.redirect('/admin');
});

router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    //const gDevices = await gDeviceController.getAllGDevices();
    let gDevices = await pool.query("SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type");

    res.render('admin/listgDevices', { gDevices });
});



router.get('/delete/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const a = await pool.query('DELETE FROM GENERALDEVICE WHERE ID=?', [id]).catch(e => {
        req.flash('danger', 'ELIMINE PRIMERO LOS DISPOSITIVOS ESPECIFICOS');
        res.redirect('/admin');
    });

    req.flash('success', 'DISPOSITIVO ELIMINADO EXITOSAMENTE');
    res.redirect('/admin');
});
router.get('/reserve/list/zoomin/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    devices = await pool.query('SELECT gd.name,gd.ports,gt.name as type,gd.id FROM RESERVEI ri INNER JOIN RESERVEBYDEVICE rbd ON ri.id=rbd.reserve INNER JOIN SPECIFICDEVICE sd ON sd.id=rbd.device INNER JOIN GENERALDEVICE gd ON gd.id=sd.type INNER JOIN GENERALTYPE gt ON gd.type=gt.id WHERE ri.id=?', [id]);

    res.render('admin/zoominReservesList', { devices });
});

router.get('/reserve/start/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const today = new Date();
    const reserve = await pool.query('SELECT * FROM RESERVEI ri JOIN RESERVEBYDEVICE rd ON ri.id=rd.reserve WHERE id=? ', [id]);
    const reservei = reserve[0];
 


    var reservehours = new Date();
    const reserveDate = new Date(reservei.day);
    var isOk=false;


    if (today.getDay() == reserveDate.getDay()) {

        const startHour = new Date("December 17, 1995 " + reservei.startHour);
        const endHour = new Date("December 17, 1995 " + reservei.endHour);
       

        if (today.getHours() >= startHour.getHours() && today.getHours() <= endHour.getHours()) {
               
            if (today.getHours() == startHour.getHours() && today.getHours() == endHour.getHours()) {
                if (today.getMinutes() > startHour.getMinutes() && today.getMinutes() < endHour.getMinutes()) {
                isOk=true;
                }else {
                    req.flash('danger', 'No es la hora de la reserva');
                    res.redirect('/admin/practice/reservelist');
                }

            }else if(today.getHours()==startHour.getHours()){
                if(today.getMinutes()>=startHour.getMinutes()){
                    isOk=true;
                }else {
                    req.flash('danger', 'No es la hora de la reserva');
                    res.redirect('/admin/practice/reservelist');
                }
            }else if(today.getHours()==endHour.getHours()){
                if(today.getMinutes()<=endHour.getMinutes()){
                    isOk=true;
                }else {
                    req.flash('danger', 'No es la hora de la reserva');
                    res.redirect('/admin/practice/reservelist');
                }
            }else{
                isOk=true;
            }

            if(isOk){
                res.redirect('http://192.168.30.49:8080/'+reservei.device);
            }

           

        }else{
            console.log('aqui');
            req.flash('danger', 'No es la hora de la reserva');
            res.redirect('/admin/practice/reservelist');
        }
    } else {
        console.log('aqui');
        req.flash('danger', 'No es la hora de la reserva');
        res.redirect('/admin/practice/reservelist');
    }


});

router.get('/reserve/delete/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM RESERVEBYDEVICE WHERE RESERVE=?', [id]);
    await pool.query('DELETE FROM RESERVEI WHERE ID=?', [id]);
    res.json('');

});

router.get('/practice/reservelist', isLoggedIn, isAdmin, async (req, res) => {
    const practices = await pool.query('SELECT * FROM RESERVEI WHERE USER=?', [req.admin.id]);
    res.render('admin/listPractice', { practices })
});

router.get('/practice/book', isLoggedIn, isAdmin, async (req, res) => {

    res.render('admin/bookPractice');
});

router.post('/practice/add', isLoggedIn, isAdmin, async (req, res) => {
    const { type, id } = req.body;
    console.log(req.body);
    var result=[{}];    
    const reservei = await pool.query('SELECT * FROM RESERVEI WHERE id=?', [id]);
    console.log(reservei);
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
        result = await pool.query('SELECT s.id,g.name,g.ports,g.type FROM SPECIFICDEVICE s INNER JOIN GENERALDEVICE g ON s.type=g.id WHERE s.id=?', [idr]);
        result[0].result = 1;
    } else {
        result[0].result = 0;
    }
    res.json(result);

})

router.post('/practice/book/', isLoggedIn, isAdmin, async (req, res) => {
    const { day, startHour, endHour } = req.body;
    const reservei = {};
    reservei.user = req.admin.id;
    reservei.day = day;
    reservei.startHour = startHour;
    reservei.endHour = endHour;
    const result = await pool.query('INSERT INTO RESERVEI SET ? ', [reservei]);
    const id = result.insertId;
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');
    res.render('admin/bookPracticeNext', { id, gtypes })
});

router.get('/deletes/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    var idg = await pool.query('SELECT type FROM SPECIFICDEVICE WHERE ID=?', [id]);
    r = idg[0].type;
    gDevice = await pool.query('SELECT * FROM GENERALDEVICE WHERE id=?', [r]);
    nDevices = gDevice[0].amount;
    await pool.query('UPDATE GENERALDEVICE SET amount=? WHERE id=?', [(nDevices - 1), r]);

    await pool.query('DELETE FROM SPECIFICDEVICE WHERE ID=?', [id]);
    req.flash('success', 'DISPOSITIVO ELIMINADO EXITOSAMENTE');


    res.redirect('/admin/gdetails/' + r);
});

router.get('/edit/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const gDevice = await pool.query('SELECT * FROM GENERALDEVICE WHERE ID=?', [id]);
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');

    res.render('admin/editgDevice', { gDevice: gDevice[0], gtypes });
});

router.get('/practice/add/delete/:pid/:sd', isLoggedIn, isAdmin, async (req, res) => {
    const { pid,sd } = req.params;
    const r=await pool.query('DELETE FROM RESERVEBYDEVICE WHERE reserve=? and device=?',[pid,sd])
    console.log(r);
res.json('');
});

router.get('/edit/', isLoggedIn, isAdmin, async (req, res) => {
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');

    res.render('admin/editDevices', { gtypes });
});

router.get('/delete/', isLoggedIn, isAdmin, async (req, res) => {
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');

    res.render('admin/deleteDevices', { gtypes });
});

router.get('/gdetails/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const gDevice = await pool.query('SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type and g.id=?', [id]);
    const sDevices = await pool.query('SELECT * FROM (SELECT id as sid,state, type from SPECIFICDEVICE) sd JOIN GENERALDEVICE g WHERE sd.type=g.id and g.id=?', [id]);

    res.render('admin/gDeviceDetails', { gDevice: gDevice[0], sDevices });
});


router.post('/edit/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, type, description, amount, ports } = req.body;
    const updatedgDevice = { name, type, description, amount, ports };
    await pool.query('UPDATE GENERALDEVICE SET ? WHERE id=? ', [updatedgDevice, id]);
    req.flash('success', 'DISPOSITIVO ACTUALIZADO EXITOSAMENTE');
    res.redirect('/admin');

});

router.get('/gdevicesfortype/:typ', isLoggedIn, isAdmin, async (req, res) => {
    const { typ } = req.params;
    const gDevices = await pool.query('SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type and g.type=?', [typ]);
    res.json(gDevices);
});
router.get('/gdevice/:gdevices', isLoggedIn, isAdmin, async (req, res) => {
    const { gdevices } = req.params;
    const gDevice = await pool.query('SELECT * FROM GENERALDEVICE WHERE ID=?', [gdevices]);
    res.json(gDevice);
});

router.get('/sdevicedevices/:sdevice', isLoggedIn, isAdmin, async (req, res) => {
    const { sdevice } = req.params;
    const sdevices = await pool.query('SELECT * FROM GENERALDEVICE g, SPECIFICDEVICE c WHERE c.type=g.id and c.type=?', [sdevice]);
    res.json(sdevices);
});


router.get('/edits/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const sDevice = await pool.query('SELECT * FROM SPECIFICDEVICE WHERE ID=?', [id]);

    res.render('admin/editsDevice', { sDevice: sDevice[0] });
});

router.post('/edits/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { state } = req.body;
    const { type } = req.body;


    const updatedgDevice = { state };
    await pool.query('UPDATE SPECIFICDEVICE SET ? WHERE id=? ', [updatedgDevice, id]);
    req.flash('success', 'DISPOSITIVO ACTUALIZADO EXITOSAMENTE');
    res.redirect('/admin/gdetails/' + type);

});


router.post('/editss/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { sdevices } = req.body;
    const { states } = req.body;
    const { gdevicess } = req.body;
    const state = states;
    const updatedgDevice = { state };
    await pool.query('UPDATE SPECIFICDEVICE SET ? WHERE id=? ', [updatedgDevice, sdevices]);
    req.flash('success', 'DISPOSITIVO ACTUALIZADO EXITOSAMENTE');
    res.redirect('/admin/gdetails/' + gdevicess);
    console.log(req.body);

});

router.get('/selectdevices', isLoggedIn, async (req, res) => {

    res.render('admin/turnonoff.hbs');
});

router.get('/xterm',  (req, res) => {

    res.render('admin/xterm.hbs');
});

router.post('/reserve/create', isLoggedIn, async (req, res) => {
    const { day, startHour, endHour } = req.body;
    user = req.user.id;

    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');
    const result = await pool.query('INSERT INTO RESERVEI SET?', { day, startHour, endHour, user });
    const reserve = result.insertId;
    res.render('admin/selectDevicesNext', { reserve, gtypes });

});



router.get('/reserve/add/device/:practice/:device', isLoggedIn, isAdmin, async (req, res) => {
    const { practice, device } = req.params;
    console.log(req.params);
    await pool.query('INSERT INTO DEVICEBYPRACTICE(practice, device)VALUES(?,?)', [practice, device]).catch(err => {
        console.log(err);
        res.json('');
    });
    const dev = await pool.query('SELECT * FROM GENERALDEVICE WHERE id = ?', [device]);
    console.log(dev);
    res.json(dev);
});


router.get('/turn/:type', isLoggedIn, isAdmin, async (req, res) => {
    const { type } = req.params;

    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.27.16',
        username: 'pi',
        password: 'raspberry'
    });
    await ssh.execCommand('/home/pi/pin26-' + type, { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
    }).catch(e => {
        req.flash('danger', 'ERROR DE CONEXIÓN');
        console.log(e);
        res.redirect('/admin');
    });


    res.json('');
});


module.exports = router;
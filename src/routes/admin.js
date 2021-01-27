const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../lib/auth');
const pool = require('./../database');
const awaitHandlerFactory = require('../middleware/awaitHandlerFactory.middleware');
const gDeviceController = require('../controller/gdevice.controller');


const fs = require('fs')
const path = require('path')
const { NodeSSH } = require('node-ssh')

router.get('/add', isLoggedIn, isAdmin, async (req, res) => {
    const gtypes = await pool.query('SELECT * FROM GENERALTYPE');
    res.render('admin/addg', { gtypes });
});

router.get('/ssh', async (req, res) => {
    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.27.64',
        username: 'pi',
        password: 'raspberry'
    });
    await ssh.execCommand('/home/pi/pin26-on', { cwd: '' }).then(function (result) {
        console.log('STDOUT: ' + result.stdout)
        console.log('STDERR: ' + result.stderr)
    })
});


router.post('/add', isLoggedIn, isAdmin, async (req, res) => {



    const { name, type, description, amount, ports } = req.body;
    const newGDevice = { name, type, description, amount, ports };
    const a = await pool.query('INSERT INTO GENERALDEVICE SET?', [newGDevice]);
    id = a.insertId;
    const d = 'DISPONIBLE';

    for (var i = 0; i < amount; i++) {
        await pool.query('INSERT INTO SPECIFICDEVICE(state, type)VALUES(?, ?)', [d, id]);
    }

    req.flash('success', 'DISPOSITIVO GUARDADO EXITOSAMENTE');

    res.redirect('/admin');
});

router.get('/',isLoggedIn, isAdmin,async (req, res) => {
    const gDevices = await gDeviceController.getAllGDevices();
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

router.get('/deletes/:id', isLoggedIn, isAdmin, async (req, res) => {
    const { id } = req.params;
    var idg = await pool.query('SELECT type FROM SPECIFICDEVICE WHERE ID=?', [id]);
    r = idg[0].type;

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


router.get('/turn/:type', isLoggedIn, isAdmin,async (req, res) => { 
    const {type}=req.params;

    const ssh = new NodeSSH();
    await ssh.connect({
        host: '192.168.27.16',
        username: 'pi',
        password: 'raspberry'
    });
    await ssh.execCommand('/home/pi/pin26-'+type, { cwd: '' }).then(function (result) {
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
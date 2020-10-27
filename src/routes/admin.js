const express = require('express');
const router = express.Router();

const pool = require('./../database');
const { route } = require('.');


router.get('/add', (req, res) => {
    res.render('admin/addg');
});

router.post('/add', async (req, res) => {
    const { name, type, description, amount, ports } = req.body;
    const newGDevice = { name, type, description, amount, ports };
    await pool.query('INSERT INTO GENERALDEVICE SET?', [newGDevice]);
    req.flash('success', 'DISPOSITIVO GUARDADO EXITOSAMENTE');
    res.redirect('/admin');
});

router.get('/', async (req, res) => {
    const gDevices = await pool.query('SELECT * FROM GENERALDEVICE');
    console.log(gDevices);
    res.render('admin/listgDevices', { gDevices });
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query('DELETE FROM GENERALDEVICE WHERE ID=?', [id]);
    req.flash('success', 'DISPOSITIVO ELIMINADO EXITOSAMENTE');
    res.redirect('/admin');
});

router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const gDevice = await pool.query('SELECT * FROM GENERALDEVICE WHERE ID=?', [id]);
    res.render('admin/editgDevice', { gDevice: gDevice[0] });
});

router.get('/edit/', async (req, res) => {


    res.render('admin/editDevices');
});

router.get('/delete/', async (req, res) => {


    res.render('admin/deleteDevices');
});

router.get('/gdetails/:id', async (req, res) => {
    const { id } = req.params;
    const gDevice = await pool.query('SELECT * FROM GENERALDEVICE WHERE ID=?', [id]);
    res.render('admin/gDeviceDetails', { gDevice: gDevice[0] });
});


router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, description, amount, ports } = req.body;
    const updatedgDevice = { name, type, description, amount, ports };
    await pool.query('UPDATE GENERALDEVICE SET ? WHERE id=? ', [updatedgDevice, id]);
    req.flash('success', 'DISPOSITIVO ACTUALIZADO EXITOSAMENTE');
    res.redirect('/admin');

});

module.exports = router;
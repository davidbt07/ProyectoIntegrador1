const express = require('express');
const router = express.Router();
const passport=require('passport');
const { isNotLoggedIn, isLoggedIn } = require('../lib/auth');

router.get('/', isNotLoggedIn, (req, res) => {
    res.redirect('/signin');
});
router.get('/admin', isNotLoggedIn, (req, res) => {
    res.render('auth/signinadmin');
});
router.get('/teacher', isNotLoggedIn, (req, res) => {
    res.render('auth/signinteacher');
});

router.get('/signup', isNotLoggedIn, (req, res) => {
    res.render('auth/signup');
});

router.get('/signin', isNotLoggedIn,(req, res) => {
    res.render('auth/main')
});


//PARA CREAR UN ADMIN,STUDENT Y TEACHER POR DEFAULT
router.get('/default', async (req, res) => {
    const pool = require('./../database');
    const helpers = require('../lib/helpers');
    const username = 'root';
    const password = 'root';
    const id = '000000000';
    const fullname = 'root';
    let role = 'admin';


   let newUser = {
        username,id,role,fullname
    }
    newUser.password = await helpers.encryptPassword(password);
    await pool.query('INSERT INTO USER SET?', [newUser]);
    newUser.role = 'estudiante';
    await pool.query('INSERT INTO USER SET?', [newUser]);
    newUser.role = 'profesor';
    await pool.query('INSERT INTO USER SET?', [newUser]);

    res.redirect('/signin');
});

router.post('/signin', isNotLoggedIn, (req, res, next) => {
    console.log(req.body);
    passport.authenticate('local.signin', {
        successRedirect: '/role',
        failureRedirect: '/signin',
        failureFlash: true
    })(req, res, next);
});

router.get('/role', isLoggedIn, (req, res) => {

    if (typeof req.student !== 'undefined') {
        res.redirect('/student/practice/list');
    } else if (typeof req.admin !== 'undefined') {
        res.redirect('/admin/');
    } else if (typeof req.teacher !== 'undefined') {
        res.redirect('/teacher/reserve/list');
    }

});


router.post('/signup', isNotLoggedIn, passport.authenticate('local.signup', {
    succesRedirect: '/admin',
    failureRedirect: '/signup',
    failureFlash: true
}));

router.get('/logout', (req, res) => {
    req.logOut();
    req.session.destroy();
    res.redirect('/auth');
});



  


module.exports = router;
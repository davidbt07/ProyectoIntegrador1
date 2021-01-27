const express = require('express');
const helpers = require ('../lib/helpers');
const nodemailer = require("nodemailer");
const router = express.Router();
const passport=require('passport');
require('dotenv').config();
const { isNotLoggedIn, isLoggedIn } = require('../lib/auth');
const pool = require('./../database');

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

router.get('/signupcode', isNotLoggedIn, (req, res) => {
    res.render('auth/signupCode');
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
    succesRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true
}));

router.post('/signupcode', isNotLoggedIn, passport.authenticate('local.signupcode', {
    succesRedirect: '/admin',
    failureRedirect: '/signupcode',
    failureFlash: true
}));


router.get('/logout', (req, res) => {
    req.logOut();
    req.session.destroy();
    res.redirect('/auth');
});


router.get('/sendcode/:email',async (req, res) => {
    
    const {email}=req.params;
    const emailLength=email.length;

    if(emailLength>12){
    emailService=email.substring(emailLength-11,emailLength);

    if(emailService=='udea.edu.co'){

    console.log(emailService);
     var max=9;
     var min=0;
     var ale='';
    for(var i=0;i<7;i++){
    var current=Math.round(Math.random() * (max - min) + min);
    ale+=current.toString();
    }
    var GENERATEDCODE={};
    GENERATEDCODE.code =ale;
    GENERATEDCODE.email=email;
    console.log(process.env.email)
    await pool.query('INSERT INTO GENERATEDCODE SET?',[GENERATEDCODE])

    let transporter = await nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.email, // generated ethereal user
            pass: process.env.email_password, // generated ethereal password
        },
    });
     await transporter.sendMail({
         from: "Vitual_lab Telematica", // sender address
         to: [email], // list of receivers
         subject: 'Código de verificación', // Subject line
         text: 'Su código de verificación en Virtual lab telemática es: '+ale, // plain text body
    
    }, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log(info)
            }
        }         
            );

    }
}


 
 res.json('');
});
  


module.exports = router;
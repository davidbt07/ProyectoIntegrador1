const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../lib/auth');
const pool = require('./../database');

router.get('/reservei/start/:id', isLoggedIn, async (req, res) => {
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


router.get('/reserveg/start/:id', isLoggedIn, async (req, res) => {

    const { id } = req.params;
    const today = new Date();
    const reserves = await pool.query('SELECT device, gd.type,name FROM RESERVEG rg JOIN RESERVEBYDEVICE rd ON rg.id=rd.reserve JOIN SPECIFICDEVICE sd ON rd.device=sd.id JOIN GENERALDEVICE gd ON gd.id=sd.type WHERE rg.id=? ', [id]);
    var urls=[];
  await reserves.forEach(reserve => {

    if(reserve.type==4){
        urls.push({url:'http://192.168.30.49:8080/pc/'+reserve.device, name:reserve.name})
    }else if(reserve.type==3){
        urls.push({url:'http://192.168.30.49:8080/router/'+reserve.device, name:reserve.name})
    }
    else if(reserve.type==2){
        urls.push({url:'http://192.168.30.49:8080/sw2/'+reserve.device, name:reserve.name})
    }
    else if(reserve.type==1){
        urls.push({url:'http://192.168.30.49:8080/sw3/'+reserve.device, name:reserve.name})
    }
   });

   console.log(urls)
   res.render('user/showurls', { urls })

});

module.exports = router;
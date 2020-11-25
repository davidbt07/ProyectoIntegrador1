const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session');
const { database } = require('./keys.js');
const passport = require('passport');

//initializations
const app = express();
require('./lib/passport');
//settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}))
app.set('view engine', '.hbs');


//Middlewares
app.use(session({
    secret: 'virtuallabsession',
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session())






//Global variables

app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.danger = req.flash('danger');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;

    if (typeof req.user !== 'undefined') {

        if (req.user.role == 'estudiante') {
            app.locals.student = req.user;
            req.student = req.user;
        }
        else if (req.user.role == 'admin') {
            app.locals.admin = req.user;
            req.admin = req.user;
        }
        else if (req.user.role == 'profesor') {
            app.locals.teacher = req.user;
            req.teacher = req.user;
        }

    } else {
        app.locals.teacher = req.user;
        req.teacher = req.user;
        app.locals.admin = req.user;
        req.admin = req.user;
        app.locals.student = req.user;
        req.student = req.user;
    }

    next();
});

//Routes
app.use(require('./routes'));

app.use('/admin', require('./routes/admin'));
app.use('/teacher', require('./routes/teacher'));
app.use('/student', require('./routes/student'));
app.use(require('./routes/authentication'));
app.use('/auth', require('./routes/authentication'));

//Public
app.use(express.static(path.join(__dirname, 'public')));
//Starting the server
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});

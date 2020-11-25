module.exports = {
    isLoggedIn(req, res, next){
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/signin');
    },
    isNotLoggedIn(req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/auth/role')
    },
    isAdmin(req, res, next) {
        if (req.user.role=='admin') {
            return next();
        }
        return res.redirect('/auth/role')
    }, isTeacher(req, res, next) {
        if (req.user.role == 'profesor') {
            return next();
        }
        return res.redirect('/auth/role')
    }, isStudent(req, res, next) {
        if (req.user.role == 'estudiante') {
            return next();
        }
        return res.redirect('/auth/role')
    }
 

};
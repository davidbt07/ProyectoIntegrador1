const bcrypt = require('bcryptjs');
const helpers = {};

helpers.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(11);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};


helpers.matchPassword = async (password, savedPassword) => {
  
    const f = await bcrypt.compare(password, savedPassword);

    return f;
};

module.exports = helpers;
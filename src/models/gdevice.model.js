const pool = require('./../database');
class GDeviceModel {
    
    find = async (params = {},redirect) => {
        let sql = `SELECT * FROM (SELECT name as gtname,id as gtid from GENERALTYPE) gt JOIN GENERALDEVICE g WHERE gt.gtid=g.type`;
        return  pool.query(sql);
    }
}
module.exports = new GDeviceModel;
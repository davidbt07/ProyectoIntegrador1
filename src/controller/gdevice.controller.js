const GDeviceModel = require('../models/gdevice.model');

class GDeviceController {
    getAllGDevices = async (req, res, next) => {
        let gDevices = await GDeviceModel.find();
        return gDevices;
    };

}
module.exports = new GDeviceController;
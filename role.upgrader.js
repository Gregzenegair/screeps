var helperCreep = require('helper.creep');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function (creep) {
        var target;
        if (null != creep
                && null != creep.room
                && null != creep.room.controller
                && creep.room.controller.my) {
            target = creep.room.controller;
        }
        if (target) {
            if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
                var moveToResult = helperCreep.moveTo(creep, target);
            }
        }
        return target;
    }
};

module.exports = roleUpgrader;
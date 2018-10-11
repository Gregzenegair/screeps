var helperCreep = require('helper.creep');
var helperEnergy = require('helper.energy');

var roleFiller = {

    /** @param {Creep} creep **/
    run: function (creep) {

        var target = helperEnergy.findNotFullClosestDeposit(creep);
        if (null == target) {
            target = helperEnergy.findNotFullClosestContainer(creep);
        }
        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                helperCreep.moveTo(creep, target);
            }
        }
        return target;
    }
};

module.exports = roleFiller;
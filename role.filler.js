var helperCreep = require('helper.creep');
var helperEnergy = require('helper.energy');

var roleFiller = {

    /** @param {Creep} creep **/
    run: function (creep) {

        // First try to fill empty things, then fill other things
        var target = helperEnergy.findEmptyClosestDeposit(creep);
        // NO MORE FILL CONTAINERS
        if (null == target) {
            target = helperEnergy.findNotFullClosestDeposit(creep);
            //target = helperEnergy.findNotFullClosestContainer(creep);
        }
        if (target) {
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                helperCreep.moveTo(creep, target, true);
            }
        }
        return target;
    }
};

module.exports = roleFiller;
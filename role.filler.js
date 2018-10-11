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
                creep.moveTo(target, {reusePath: 32, ignoreCreeps: true, visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        return target;
    }
};

module.exports = roleFiller;
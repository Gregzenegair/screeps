var helperCreep = require('helper.creep');
var helperEnergy = require('helper.energy');

var roleFiller = {

    /** @param {Creep} creep **/
    run: function (creep) {

        var target;

        if (null != creep.memory.fillTarget) {
            var memTarget = Game.getObjectById(creep.memory.fillTarget);
            if (null != memTarget) {
                if (memTarget.structureType === STRUCTURE_CONTAINER
                        || memTarget.structureType === STRUCTURE_TERMINAL
                        || memTarget.structureType === STRUCTURE_STORAGE) {
                    target = _.sum(memTarget.store[RESOURCE_ENERGY]) < memTarget.store.getCapacity(RESOURCE_ENERGY) ? memTarget : null;
                } else {
                    target = memTarget.energy < memTarget.energyCapacity ? memTarget : null;
                }
            }
        }

        // First try to fill empty things, then fill other things
        if (creep.memory.role !== "filler" && null == target) {
            target = helperEnergy.findEmptyClosestDeposit(creep);
        }

        if (null == target) {
            target = helperEnergy.findNotFullClosestDeposit(creep);
        }

        if (target) {
            creep.memory.fillTarget = target.id;
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                helperCreep.moveTo(creep, target, true);
            }
        }
        return target;
    }
};

module.exports = roleFiller;
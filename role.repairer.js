var helperCreep = require('helper.creep');

var roleRepairer = {

    /** @param {Creep} creep **/
    run: function (creep) {

        var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: function (structure) {
                return (structure.hits < structure.hitsMax / 3);
            }
        });

        if (null == target) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: function (structure) {
                    return structure.structureType === STRUCTURE_ROAD && (structure.hits < structure.hitsMax / 3);
                }
            });
        }

        if (target) {
            if (creep.repair(target) === ERR_NOT_IN_RANGE) {
                var moveToResult = helperCreep.moveTo(creep, target);

            }
        }
        return target;
    }
};

module.exports = roleRepairer;
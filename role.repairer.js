var helperCreep = require('helper.creep');

var roleRepairer = {

    /** @param {Creep} creep **/
    run: function (creep) {
        var room = creep.room;
        if (!(null == room.controller
                || (null != room.controller
                        && room.controller.my)
                || (null != room.controller
                        && room.controller.reservation
                        && room.controller.reservation.username === "Gregzenegair"
                        && room.controller.reservation.ticksToEnd > 1024))) {
            return null;// prevento to repair any not a minimum controlloed by me
        }

        var target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: function (structure) {
                return (structure.hits < structure.hitsMax / 3 && structure.isActive());
            }
        });

        if (null == target) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: function (structure) {
                    return structure.structureType === STRUCTURE_ROAD && (structure.hits < structure.hitsMax / 3 && structure.isActive());
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
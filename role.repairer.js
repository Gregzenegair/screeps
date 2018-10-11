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
                var moveToResult = creep.moveTo(target, {reusePath: 32, visualizePathStyle: {stroke: '#ffffff'}});
                if (moveToResult === ERR_NO_PATH) {
                    creep.memory.errorPathCount++;
                    if (creep.memory.errorPathCount > 3) {
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#0000ff'}});
                    }
                }
            }
        }
        return target;
    }
};

module.exports = roleRepairer;
var roleBuilder = {

    /** @param {Creep} creep **/
    run: function (creep) {
        var target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
            filter: (structure) => {
                return structure.my;
            }
        });

        if (target) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
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

module.exports = roleBuilder;
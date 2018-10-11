var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function (creep) {
        var target;
        if (creep.room.controller.my) {
            target = creep.room.controller;
        }
        if (target) {
            if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
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

module.exports = roleUpgrader;
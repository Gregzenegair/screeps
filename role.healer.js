var roleHealer = {

    /** @param {Creep} creep **/
    run: function (creep) {

        var targets = _.filter(Game.creeps, (creep) => creep.memory.role == "combat" && creep.hits < creep.hitsMax);
        var target;
        if (null != targets && targets.length > 0) {
            target = targets[0];
        } else {
            targets = _.filter(Game.creeps, (creep) => creep.memory.role == "combat");
            if (null != targets && targets.length > 0) {
                target = targets[0];
            }
        }

        if (target) {
            if (creep.heal(target) === ERR_NOT_IN_RANGE) {
                var moveToResult = creep.moveTo(target, {reusePath: 32, visualizePathStyle: {stroke: '#23ff65'}});
                if (moveToResult === ERR_NO_PATH) {

                }
            }
        }
        return target;
    }
};

module.exports = roleHealer;
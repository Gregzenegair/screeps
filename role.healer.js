var helperCreep = require('helper.creep');

var roleHealer = {

    /** @param {Creep} creep **/
    run: function (creep) {

        var targets = _.filter(Game.creeps, (creep) => creep.memory.role == "combat" && creep.hits < creep.hitsMax && creep.ticksToLive > 128);
        var target;
        if (null != targets && targets.length > 0) {
            target = targets[0];
        } else {
            targets = _.filter(Game.creeps, (creep) => creep.memory.role == "combat" && creep.ticksToLive > 128);
            if (null != targets && targets.length > 0) {
                target = targets[0];
            }
        }

        if (target && creep) {
            if (creep.heal(target) === ERR_NOT_IN_RANGE) {
                var moveToResult = helperCreep.moveTo(creep, target);
                if (moveToResult === ERR_NO_PATH) {

                }
            }
        }
        return target;
    }
};

module.exports = roleHealer;
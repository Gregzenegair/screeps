var helperCreep = require('helper.creep');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function (creep) {
        var target = creep.pos.findClosestByPathInMemory(FIND_CONSTRUCTION_SITES, {
            filter: (structure) => {
                return structure.my;
            }
        });

        if (target) {
            if (creep.build(target) == ERR_NOT_IN_RANGE) {
                var moveToResult = helperCreep.moveTo(creep, target);
            }
        }
        return target;
    }

};

module.exports = roleBuilder;
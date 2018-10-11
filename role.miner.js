var helperCreep = require('helper.creep');
var helperEnergy = require('helper.energy');

/**
 * A specialised miner that only mine one spot
 * and fill it's assigned container
 * 
 * Goals :
 * - seek for free containers (should not be built if nothings free
 * in the first place
 * - reach the container (already built next to mining spot)
 * - mine until it dies, when it dies notify the memory he freed
 * the current spot he was mining on, to generate a new creep
 * 
 * 5Work 1Move
 * @type {{run: roleMiner.run}}
 */
var roleMiner = {

    getFreeSpot: function (creep) {
        var room = creep.room;
        var containerSources = Memory.containerSources[room.name];
        for (var i = 0; i < containerSources.length; i++) {
            var containerSource = containerSources[i];
            if (containerSource.free) {
                containerSource.free = creep.id;
                return containerSource.container;
            }
        }
    },

    moveToFreeSpot: function (creep) {
        if (null == creep.memory.containerSpot) {
            creep.memory.containerSpot = this.getFreeSpot(creep);
        }

        helperCreep.moveTo(creep, creep.memory.containerSpot);
        if (creep.pos.x === creep.memory.containerSpot.pos.x
                && creep.pos.y === creep.memory.containerSpot.pos.y) {
            creep.memory.mineSpotReached = true;
        }

    },

    mineSpot: function (creep) {
        if (creep.memory.mineSpotReached) {
            var source = creep.pos.findClosestByRange(FIND_SOURCES);
            creep.harvest(source);
        } else {
            this.moveToFreeSpot(creep);
        }
    }


};

module.exports = roleMiner;
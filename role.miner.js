var helperCreep = require('helper.creep');
var helperEnergy = require('helper.energy');
var helperMiner = require('helper.miner');

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

    run: function (creep) {
        this.mineSpot(creep);
    },

    getFreeSpot: function (creep) {
        var room = creep.room;
        var containerSources = Memory.containerSources[room.name];
        for (var i = 0; i < containerSources.length; i++) {
            var containerSource = containerSources[i];
            if (containerSource.free == true) {
                Memory.containerSources[room.name][i].free = false;
                return containerSource.container;
            }
        }
        return null;
    },

    moveToFreeSpot: function (creep) {
        if (null == creep.memory.containerSpot) {
            var freeSpot = this.getFreeSpot(creep);
            if ((null != freeSpot)) {
                creep.memory.containerSpot = freeSpot;
            }
        }

        if (null != creep.memory.containerSpot) {
            var containerSpot = Game.getObjectById(creep.memory.containerSpot);
            helperCreep.moveTo(creep, containerSpot);
            if (creep.pos.x === containerSpot.pos.x
                    && creep.pos.y === containerSpot.pos.y) {
                creep.memory.mineSpotReached = true;
            }
        }

    },

    mineSpot: function (creep) {

        if (creep.room.name != creep.memory.roomAssigned) {
            creep.say("GoSpotR");
            helperCreep.moveToAnOtherRoom(creep, creep.memory.roomAssigned);
            return;
        }

        helperMiner.memoryStoreSpot(creep.room);
        if (creep.memory.mineSpotReached) {
            var source = creep.pos.findClosestByRange(FIND_SOURCES);
            creep.harvest(source);
        } else {
            creep.say("GoSpot");
            this.moveToFreeSpot(creep);
        }
    }


};

module.exports = roleMiner;
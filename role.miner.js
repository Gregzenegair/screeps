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

        // try to match the containter we already are on
        // to prevent creep swithing after spawn
        // loop two times
        for (var i = 0; i < containerSources.length; i++) {
            var containerSource = containerSources[i];
            var container = Game.getObjectById(containerSource.container);
            if (null != container) {
                if (containerSource.free == true && creep.pos.x === container.pos.x
                        && creep.pos.y === container.pos.y) {
                    Memory.containerSources[room.name][i].free = false;
                    return containerSource.container;
                }
            }
        }

        var miners = _.filter(Game.creeps, (creep) => creep.memory.role == "miner");

        for (var i = 0; i < containerSources.length; i++) {
            var containerSource = containerSources[i];
            var container = Game.getObjectById(containerSource.container);
            if (null != container && containerSource.free == true) {
                var minerAlreadyOn = false;
                for (var j = 0; j < miners.length; j++) {
                    var miner = miners[j];
                    if (miner.pos.x === container.pos.x
                            && miner.pos.y === container.pos.y) {
                        minerAlreadyOn = true;
                    }
                }

                if (!minerAlreadyOn) {
                    Memory.containerSources[room.name][i].free = false;
                    return containerSource.container;
                }
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
            helperCreep.moveTo(creep, containerSpot, true);
            if (null != creep && null != containerSpot
                    && creep.pos.x === containerSpot.pos.x
                    && creep.pos.y === containerSpot.pos.y) {
                creep.memory.mineSpotReached = true;
            }
            if (Game.time % 4 === 0) {
                creep.say("Go ⚒");
            }
        } else {
            if (Game.time % 4 === 0) {
                creep.say("Wait ⚒");
            }
        }

    },

    mineSpot: function (creep) {

        var reached = helperCreep.moveToRoomAssigned(creep);
        if (!reached) {
            return;
        }

        helperMiner.memoryStoreSpot(creep.room);
        if (creep.memory.mineSpotReached) {
            var source = creep.pos.findClosestByRangeInMemory(FIND_SOURCES);
            creep.harvest(source);
        } else {
            this.moveToFreeSpot(creep);
        }
    }


};

module.exports = roleMiner;
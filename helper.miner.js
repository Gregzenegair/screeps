var helperRoom = require('helper.room');
var helperEnergy = require('helper.energy');
var helperCreep = require('helper.creep');

require('object.extension')();

var helperMiner = {

    /** @param {Creep} creep **/
    memoryStoreSpot: function (room) {

        if (null == Memory.containerSources || Game.time % 2048 === 0) {
            Memory.containerSources = {};
            for (var name in Game.creeps) {
                var creep = Game.creeps[name];
                creep.memory.containerSpot = null;
                creep.memory.mineSpotReached = null;
            }
        }

        if (Game.time % 256 === 0 || null == Memory.containerSources[room.name]) {
            var sources = room.findInMemory(FIND_SOURCES);

            Memory.containerSources[room.name] = [];

            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];

                var structure = helperEnergy.hasAContainerAround(source, room);

                /**
                 * Check if container is built
                 */
                if (null != structure.hitsMax && structure.structureType === STRUCTURE_CONTAINER && null == structure.progress) {
                    Memory.containerSources[room.name].push({
                        "source": source.id,
                        "container": structure.id,
                        "free": true
                    });

                }
            }
        }
    },

    /**
     * Free a container Id if its screep is dead
     */
    freedSpot: function (containerId) {
        if (null != containerId) {
            Memory.containerSources = null;

            for (var roomName in Memory.containerSources) {
                for (var i = 0; i < roomName.length; i++) {
                    var containerSource = roomName[i];
                    if (containerSource.container == containerId) {
                        roomName[i].free = true;
                    }
                }
            }
        }
    }

};

module.exports = helperMiner;
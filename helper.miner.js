var helperRoom = require('helper.room');
var helperEnergy = require('helper.energy');
var helperCreep = require('helper.creep');


var helperMiner = {

    /** @param {Creep} creep **/
    memoryStoreEligibles: function (room) {

        if (null == Memory.containerSources || Game.time % 2048 === 0) {
            Memory.containerSources = {};
        }

        if (Game.time % 256 === 0) {
            var sources = room.find(FIND_SOURCES);
            
            Memory.containerSources[room.name] = [];
            
            for (var i = 0; i < sources.length; i++) {
                var source = sources[i];

                var structure = helperEnergy.hasAContainerAround(source, room);

                /**
                 * Check if container is built
                 */
                if (!structure instanceof Array && structure.structureType === STRUCTURE_CONTAINER && null == structure.progress) {
                    Memory.containerSources[room.name].push({
                        "source": source,
                        "container": structure,
                        "free" : true
                    });

                }
            }
        }
    }

};

module.exports = helperMiner;
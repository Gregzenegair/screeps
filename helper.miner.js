var helperRoom = require('helper.room');
var helperEnergy = require('helper.energy');


var helperMiner = {

    /** @param {Creep} creep **/
    memoryStoreEligibles: function (room) {

        if (null == Memory.containerSources) {
            Memory.containerSources = {};
        }

        var sources = room.find(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];

            var structure = helperEnergy.hasAContainerAround(source, room);

            /**
             * Check if container is built
             */
            if (!structure instanceof Array && structure.structureType === STRUCTURE_CONTAINER && null == structure.progress) {
                if (null == Memory.containerSources[room.name]) {
                    Memory.containerSources[room.name] = [];
                }

                Memory.containerSources[room.name].push({
                    "source": source,
                    "container": structure
                });

            }
        }
    },

    sendMiner: function (room) {


    },

    sendFetcher: function (room) {


    },

};

module.exports = helperMiner;
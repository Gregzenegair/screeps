var helperEnergy = require('helper.energy');

var helperCreep = {

    moveTo: function (creep, energySource) { // should be into an helper class
        var moveResult = creep.moveTo(energySource, {
            reusePath: 32,
            visualizePathStyle: {stroke: '#fffd00'}
        });

        if (moveResult === ERR_NO_PATH) {
            creep.memory.errorPathCount++;
            if (creep.memory.errorPathCount > 3) {
                creep.memory.errorPathCount = 0;
                creep.memory.alternativePath = true;
            }
        }

        if (moveResult === ERR_NO_PATH && !creep.memory.alternativePath) {

            energySource = this.setEnergySource(creep, true);
            creep.moveTo(energySource,
                    {reusePath: 32, visualizePathStyle: {stroke: '#fffd00'}});
        }

//        creep.say("Moved=" + moveResult);
    },

    setEnergySource: function (creep, seekOtherPath) {
        var energySource = null;
        if (null != creep.memory.energySourceId && !seekOtherPath) {
            energySource = Game.getObjectById(creep.memory.energySourceId);
        } else {
            if (!seekOtherPath && !creep.memory.alternativePath) {
                // a filler can not pretend to seek into deposits
                energySource = helperEnergy.findNearestEnergySource(creep, !creep.memory.filler);
            } else {
                console.log("find a new path for creep=" + creep.name);
                energySource = helperEnergy.findValidPathHarvestSource(creep);
                creep.memory.alternativePath = true;
            }

            if (energySource) {
                creep.memory.energySourceId = energySource.target.id;
                creep.memory.energySourceType = energySource.energySourceType;
                energySource = energySource.target;
            }
        }
        return energySource;
    },
    
    
    /** @param {Creep} creep **/
    findNearest: function (creep, endPositions) {
        var targeted = creep.pos.findClosestByRange(endPositions);
        return targeted;
    },

    /** @param {Creep} creep **/
    moveRandomly: function (creep, range) {
        var newPosX = creep.pos.x + Math.round(Math.random() * range) - range / 2;
        var newPosY = creep.pos.y + Math.round(Math.random() * range) - range / 2;
        creep.moveTo(newPosX, newPosY, {reusePath: 32, visualizePathStyle: {stroke: '#ffffff'}});
    }
    
    
};

module.exports = helperCreep;
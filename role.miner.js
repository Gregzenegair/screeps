var helperCreep = require('helper.creep');
var helperEnergy = require('helper.energy');

var roleFiller = require('role.filler');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleRepairer = require('role.repairer');

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
        
        this.moveTo(creep, creep.memory.containerSpot);

    },

    mineSpot: function (creep) {

    },

    /** @param {Creep} creep **/
    run: function (creep) {

        if (null == Memory.miners) {
            Memory.miners = [];
        }

        if (!creep.memory.canWork) {
            var energySource = this.setEnergySource(creep);

            if (energySource) {
                switch (creep.memory.energySourceType) {
                    case helperEnergy.ENERGY_SOURCE_TYPES.DROPPED:
                        var creepPickupAction = creep.pickup(energySource);
                        if (creepPickupAction === ERR_NOT_IN_RANGE) {
                            this.moveTo(creep, energySource);
                        }

                        if (creepPickupAction === ERR_INVALID_TARGET) {
                            creep.memory.energySourceId = null;
                        }
                        break;

                    case helperEnergy.ENERGY_SOURCE_TYPES.DEPOSIT:
                        var creepWithdrawAction = creep.withdraw(energySource, RESOURCE_ENERGY);
                        if (creepWithdrawAction === ERR_NOT_IN_RANGE) {
                            this.moveTo(creep, energySource);
                        }

                        if (creepWithdrawAction === ERR_INVALID_ARGS || creepWithdrawAction === ERR_INVALID_TARGET || creepWithdrawAction === ERR_NOT_ENOUGH_RESOURCES) {
                            creep.memory.energySourceId = null;
                        }
                        break;

                    default :
                    case helperEnergy.ENERGY_SOURCE_TYPES.SOURCE:
                        // console.log("energySource=" + energySource + " creep name=" + creep.name);
                        creep.memory.filler = true;
                        var creepHarvestAction = creep.harvest(energySource);
                        if (creepHarvestAction === ERR_NOT_IN_RANGE) {
                            this.moveTo(creep, energySource);
                        }

                        if (creepHarvestAction === ERR_NOT_ENOUGH_RESOURCES) {
                            creep.memory.energySourceId = null;
                        }
                        break;
                }

            } else {
                console.log("energySource is null or not found");
                creep.memory.energySourceId = null;
                creep.memory.energySourceType = null;
                // TODO: set something to do if no energy source
            }
        }

        if (creep.memory.canWork) {

            var target = null;

            if (creep.memory.filler) {
                target = roleFiller.run(creep);
            }
        }
    },

    moveTo: function (creep, energySource) {
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
        } else {
            creep.memory.alternativePath = false;
        }

        if (moveResult === ERR_NO_PATH && creep.memory.alternativePath) {

            energySource = this.setEnergySource(creep, true);
            creep.moveTo(energySource,
                    {reusePath: 32, visualizePathStyle: {stroke: '#fffd00'}});
        }
    },

    setEnergySource: function (creep) {
        var energySource = null;
        if (null != creep.memory.energySourceId) {
            energySource = Game.getObjectById(creep.memory.energySourceId);
        } else {
            energySource = helperEnergy.findValidPathHarvestSource(creep);

            if (energySource) {
                Memory.miners[energySource.target.id] = creep.id;
                creep.memory.energySourceId = energySource.target.id;
                creep.memory.energySourceType = energySource.energySourceType;
                energySource = energySource.target;
            }
        }
        return energySource;
    }


};

module.exports = roleMiner;
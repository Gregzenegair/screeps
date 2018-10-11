var movementHelper = require('movement.helper');
var helperEnergy = require('helper.energy');

var roleFiller = require('role.filler');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleRepairer = require('role.repairer');

/**
 * If it just harvested, it is tagged as a filler,
 * a filler will try to fill deposits
 *
 * if all deposits are full, it is going to try
 * to empty its ressources by building, or upgrading
 *
 * if i is empty, and is not a filler, it will
 * seek for any nearest energy source to do its work
 *
 * if it's a filler, it will look for the nearest source
 * of energy, expected deposits
 *
 * @type {{run: roleUtility.run}}
 */
var roleUtility = {

    /** @param {Creep} creep **/
    run: function (creep) {

        if (creep.carry.energy === creep.carryCapacity) {
            creep.memory.isFullResources = true;
            creep.memory.isEmptyResources = false;
            creep.memory.canWork = true;
            creep.memory.energySourceId = null;
            creep.memory.alternativePath = false;
            creep.memory.errorPathCount = 0;
            creep.say('Use/drop Energy');
        }

        if (creep.carry.energy === 0) {
            creep.memory.isEmptyResources = true;
            creep.memory.isFullResources = false;
            creep.memory.canWork = false;
            creep.memory.errorPathCount = 0;
            creep.memory.filler = false;
            creep.say('Get Energy');
        }

        if (!creep.memory.canWork) {
            var energySource = this.setEnergySource(creep, false);

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

            if (creep.memory.filler && !creep.memory.upgrade) {
                target = roleFiller.run(creep);
            }

            if (null == target && creep.memory.filler) {
                creep.memory.filler = false;
                // if he was a filler, has emptied his load but is not full now,
                // make if get full again before going to work
                if (creep.carry.energy < creep.carryCapacity) {
                    creep.memory.canWork = false;
                }
            }

            if (null == target && !creep.memory.upgrade
                    && creep.room.controller && creep.room.controller.level < 3) {
                target = roleRepairer.run(creep);
            }

            if (null == target && !creep.memory.upgrade) {
                target = roleBuilder.run(creep);
            }

            if (null == target) {
                target = roleUpgrader.run(creep);
            }

            if (null == target) {
                //TODO : should not be null, there is always a controller to upgrade right ?
                //TODO : or controller is full, there is no more anything to do here
            }

        }
        if (Game.time % 256 === 0) {
            this.mustUpgrade(creep);
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

    mustUpgrade: function (creep) {
        if (creep.room.controller && creep.room.controller.ticksToDowngrade < 1024) {
            creep.memory.upgrade = true;
        } else {
            creep.memory.upgrade = false;
        }
    }

};

module.exports = roleUtility;
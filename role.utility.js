var helperCreep = require('helper.creep');
var helperEnergy = require('helper.energy');

var roleFiller = require('role.filler');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleRepairer = require('role.repairer');

require('object.extension')();

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

        var reached = helperCreep.moveToRoomAssigned(creep);
        if (!reached) {
            return;
        }

        if (this.canWorkCreep(creep)) {
            creep.memory.isFullResources = true;
            creep.memory.isEmptyResources = false;
            creep.memory.canWork = true;
            creep.memory.energySourceId = null;
            creep.memory.energySourceType = null;
            if (creep.memory.role === "filler") {
                creep.memory.filler = true;
            }
        }

        if (creep.carry.energy === 0) {
            creep.memory.isEmptyResources = true;
            creep.memory.isFullResources = false;
            creep.memory.canWork = false;
            creep.memory.filler = false;

            /**
             * Make external creeps go back to their working room
             */
            if (creep.memory.roomAssigned != creep.room.name) {
                creep.memory.roomAssignedReached = false;
            }

            if (creep.memory.role === "filler") {
                creep.memory.filler = true;
                creep.memory.fillTarget = null;
            }
        }


        if (!creep.memory.canWork) {
            var energySource = helperEnergy.setEnergySource(creep, false);

            if (energySource) {
                switch (creep.memory.energySourceType) {
                    case helperEnergy.ENERGY_SOURCE_TYPES.DROPPED:
                        var creepPickupAction = creep.pickup(energySource);
                        if (creepPickupAction === ERR_NOT_IN_RANGE) {
                            helperEnergy.moveToEnergySource(creep, energySource);
                        }

                        if (creepPickupAction === ERR_INVALID_TARGET) {
                            creep.memory.energySourceId = null;
                        }
                        break;

                    case helperEnergy.ENERGY_SOURCE_TYPES.CONTAINER:
                    case helperEnergy.ENERGY_SOURCE_TYPES.DEPOSIT:
                        var creepWithdrawAction = creep.withdraw(energySource, RESOURCE_ENERGY);
                        if (creepWithdrawAction === ERR_NOT_IN_RANGE) {
                            helperEnergy.moveToEnergySource(creep, energySource);
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
                            helperEnergy.moveToEnergySource(creep, energySource);
                        }

                        if (creepHarvestAction === ERR_NOT_ENOUGH_RESOURCES) {
                            creep.memory.energySourceId = null;
                        }
                        break;
                }

                if (creep.memory.energySourceType == helperEnergy.ENERGY_SOURCE_TYPES.CONTAINER
                        || creep.memory.energySourceType == helperEnergy.ENERGY_SOURCE_TYPES.DROPPED) {
                    creep.memory.filler = true;
                }

                creep.say('Get ☢︎');
            } else {
                console.log("energySource is null or not found");
                creep.memory.energySourceId = null;
                creep.memory.energySourceType = null;
                // TODO: set something to do if no energy source

                helperCreep.moveRandomly(creep, 2); // prevent to stay stuck (may block a miner position)
                creep.say('418 ☢︎');
            }
        }

        if (creep.memory.canWork) {

            var target = null;

            if (creep.memory.filler && !creep.memory.upgrade
                    && !this.getBuildingPriority(creep)
                    && ((Memory.fillerUnitCount[creep.room.name] < Memory.utilityMaxCount[creep.room.name]
                            && creep.memory.role !== "filler") || creep.memory.role === "filler")) {
                target = roleFiller.run(creep);
                creep.say('Drop ☢︎');
            }

            if (null == target && creep.memory.filler && creep.memory.role !== "filler") {
                creep.memory.filler = false;
                // if he was a filler, has emptied his load but is not full now,
                // make if get full again before going to work
                if (creep.carry.energy === 0) {
                    creep.memory.canWork = false;
                }
            }

            if (creep.memory.role !== "filler") {
                if (null == target && !creep.memory.upgrade && null != creep.room
                        && null != creep.room.controller
                        && creep.room.controller && creep.room.controller.my) {
                    target = roleRepairer.run(creep);
                    creep.say('Repair');
                }

                if (null == target && !creep.memory.upgrade) {
                    target = roleBuilder.run(creep);
                    creep.say('Build');
                }

                if (null == target) {
                    target = roleUpgrader.run(creep);
                    creep.say('Upgrade');
                }
            }

            var moveExit = OK;
            if (null == target) {

                //TODO : should not be null, there is always a controller to upgrade right ?
                //TODO : or controller is full, there is no more anything to do here
                //TODO : or has movved to an other room, keep it back to home
                if (creep.memory.roomHome != creep.room.name) {
                    if (null != creep.memory.roomHome) {
                        creep.say('BHome ☢︎');
                        moveExit = helperCreep.moveToAnOtherRoom(creep, creep.memory.roomHome);
                    } else {
                        creep.say('BRand ☢︎');
                        moveExit = helperCreep.assigneRandomExitRoom(creep);
                    }
                    return;
                }
            }

            if (null == target && creep.memory.role === "filler") {
                target = helperEnergy.findContainerController(creep, false);
            }

            if (null != target) {
                creep.memory.fillTarget = target.id;
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    helperCreep.moveTo(creep, target, true);
                }
            }

            if (null == target || moveExit != OK && creep.fatigue === 0) {
                helperCreep.moveRandomly(creep, 2); // prevent to stay stuck (may block a miner position)
                creep.say('418 ☢︎');
            }

        }

        if (Game.time % 256 === 0 || null == creep.memory.upgrade) {
            this.mustUpgrade(creep);
        }
    },

    canWorkCreep: function (creep) {
        return (creep.memory.role === "filler" && creep.carry.energy !== 0 && creep.memory.roomHome === creep.room.name)
                || (creep.memory.role === "filler" && creep.carry.energy === creep.carryCapacity && creep.memory.roomHome !== creep.room.name)
                || (creep.memory.role !== "filler" && creep.carry.energy === creep.carryCapacity);
    },

    mustUpgrade: function (creep) {
        if (creep.memory.role === "filler") {
            return false;
        }

        if (creep.room.controller && creep.room.controller.ticksToDowngrade < 4096) {
            creep.memory.upgrade = true;
        } else {
            creep.memory.upgrade = false;
        }
    },

    getBuildingPriority: function (creep) {
        if (creep.memory.role === "filler") {
            return false;
        }
        var targets = creep.room.findInMemory(Game.CONSTRUCTION_SITES);

        return targets.length > 10 && Memory.utilityUnitCount[creep.room.name] === Memory.utilityMaxCount[creep.room.name];
    }

};

module.exports = roleUtility;
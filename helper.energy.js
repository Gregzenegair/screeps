require('object.extension')();

var helperRoom = require('helper.room');
var helperCreep = require('helper.creep');

var helperEnergy = {

    /**
     * Star of generic seek energy source methods
     */
    ENERGY_SOURCE_TYPES: {
        DROPPED: "DROPPED",
        DEPOSIT: "DEPOSIT",
        CONTAINER: "CONTAINER",
        SOURCE: "SOURCE"
    },

    operators: {
        'eq': function (a, b) {
            return a === b;
        },
        'sup': function (a, b) {
            return a > b;
        },
        'inf': function (a, b) {
            return a < b;
        }
    },

    structureValues: {
        'energy': function (structure) {
            return structure.store[RESOURCE_ENERGY];
        },
        'energyCapacity': function (structure) {
            return structure.store.getCapacity(RESOURCE_ENERGY);
        },
        'zero': function (structure) {
            return 0;
        }
    },

    /**
     *
     * @param room
     * @param operator
     * @param a
     * @param b
     * @returns {target STRUCTURE_}
     */
    findDepositOperator: function (room, operator, a, b) {

        var targets = room.findInMemory(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType !== STRUCTURE_CONTROLLER &&
                        structure.structureType !== STRUCTURE_STORAGE &&
                        this.operators[operator](a(structure), b(structure)
                        ));
            }
        });

        return targets;
    },

    findClosestDepositOperator: function (creep, operator, a, b) {

        var target = creep.pos.findClosestByRangeInMemory(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType !== STRUCTURE_CONTROLLER &&
                        structure.structureType !== STRUCTURE_STORAGE &&
                        this.operators[operator](a(structure), b(structure)
                        ));
            }
        }, 32);

        return target;
    },

    findClosestContainerOperator: function (creep, operator, a, b) {
        var notWantedContainer = this.findContainerController(creep, false);
        if (null != notWantedContainer) {
            notWantedContainer = notWantedContainer.id;
        }
        var target = creep.pos.findClosestByRangeInMemory(FIND_STRUCTURES, {
            filter: (structure) => {
                return (notWantedContainer != structure.id
                        && structure.structureType === STRUCTURE_CONTAINER &&
                        this.operators[operator](a(structure), b(structure)
                        ));
            }
        }, 2048);

        return target;
    },

    findClosestContainerOperatorMoreFilledThanCreep: function (creep) {
        var notWantedContainer = this.findContainerController(creep, false);
        if (null != notWantedContainer) {
            notWantedContainer = notWantedContainer.id;
        }

        var target = creep.pos.findClosestByRangeInMemory(FIND_STRUCTURES, {
            filter: (structure) => {
                return (notWantedContainer != structure.id
                        && structure.structureType === STRUCTURE_CONTAINER
                        && structure.store[RESOURCE_ENERGY] > creep.carryCapacity
                        );
            }
        });

        return target;

    },

    findMostFilledContainerOperator: function (creep) {
        var notWantedContainer = this.findContainerController(creep, false);
        if (null != notWantedContainer) {
            notWantedContainer = notWantedContainer.id;
        }

        var targets = this.findMostFilledContainerOperatorTargetMethod(creep);

        var result = null;
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            if (null == result) {
                result = target;
            } else {
                if (notWantedContainer != target.id
                        && target.store[RESOURCE_ENERGY] > result.store[RESOURCE_ENERGY]) {
                    result = target;
                }
            }
        }

        return result;
    },

    findMostFilledContainerOperatorMoreFilledThanCreep: function (creep) {
        var notWantedContainer = this.findContainerController(creep, false);
        if (null != notWantedContainer) {
            notWantedContainer = notWantedContainer.id;
        }
        var targets = this.findMostFilledContainerOperatorMoreFilledThanCreepTargetMethod(creep);

        var result = null;
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            if (null == result && null != target) {
                result = target;
            } else if (null != target) {
                if (notWantedContainer != target.id
                        && target.store[RESOURCE_ENERGY] > result.store[RESOURCE_ENERGY]) {
                    result = target;
                }
            }
        }

        return result;
    },

    findMostFilledContainerOperatorTargetMethod: function (creep) {
        var notWantedContainer = this.findContainerController(creep, false);
        if (null != notWantedContainer) {
            notWantedContainer = notWantedContainer.id;
        }
        console.log(notWantedContainer);
        return creep.room.findInMemory(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER
                        && structure.id !== notWantedContainer);
            }
        });
    },

    findMostFilledContainerOperatorMoreFilledThanCreepTargetMethod: function (creep) {
        var notWantedContainer = this.findContainerController(creep, false);
        if (null != notWantedContainer) {
            notWantedContainer = notWantedContainer.id;
        }
        console.log(notWantedContainer);
        return creep.room.findInMemory(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER
                        && structure.store[RESOURCE_ENERGY] > creep.carryCapacity
                        && structure.id !== notWantedContainer);
            }
        });
    },

    findNotFullDeposit: function (room) {
        return this.findDepositOperator(room, 'inf', this.structureValues.energy, this.structureValues.energyCapacity);
    },

    findFullDeposit: function (room) {
        return this.findDepositOperator(room, 'eq', this.structureValues.energy, this.structureValues.energyCapacity);
    },

    findNotEmptyDeposit: function (room) {
        return this.findDepositOperator(room, 'sup', this.structureValues.energy, this.structureValues.zero);
    },

    findEmptyDeposit: function (room) {
        return this.findDepositOperator(room, 'eq', this.structureValues.energy, this.structureValues.zero);
    },

    findNotFullClosestDeposit: function (creep) {
        return this.findClosestDepositOperator(creep, 'inf', this.structureValues.energy, this.structureValues.energyCapacity);
    },

    findFullClosestDeposit: function (creep) {
        return this.findClosestDepositOperator(creep, 'eq', this.structureValues.energy, this.structureValues.energyCapacity);
    },

    findNotEmptyClosestDeposit: function (creep) {
        return this.findClosestDepositOperator(creep, 'sup', this.structureValues.energy, this.structureValues.zero);
    },

    findEmptyClosestDeposit: function (creep) {
        return this.findClosestDepositOperator(creep, 'eq', this.structureValues.energy, this.structureValues.zero);
    },

    findFullClosestContainer: function (creep) {
        return this.findClosestContainerOperator(creep, 'eq', this.structureValues.energy, this.structureValues.energyCapacity);
    },

    findNotEmptyClosestContainer: function (creep) {
        return this.findClosestContainerOperator(creep, 'sup', this.structureValues.energy, this.structureValues.zero);
    },

    findNotFullClosestContainer: function (creep) {
        return this.findClosestContainerOperator(creep, 'inf', this.structureValues.energy, this.structureValues.energyCapacity);
    },

    findNotFullNotEmptyClosestContainer: function (creep) {
        var target = this.findClosestContainerOperator(creep, 'inf', this.structureValues.energy, this.structureValues.energyCapacity);
        if (target.store[RESOURCE_ENERGY] === 0) {
            target = this.findClosestContainerOperator(creep, 'sup', this.structureValues.energy, this.structureValues.zero);
        }
        return target;
    },

    findRoomstorage: function (room) {
        var target = room.findInMemory(STRUCTURE_STORAGE);

        if (null != target && null != target[0]) {
            target = target[0];
        }
        return target;
    },

    findContainerController: function (creep, checkNotEmpty) {
        helperRoom.memoryStoreContainersController(creep.room);
        if (null != Memory.containersControllers) {
            var containerController = Memory.containersControllers[creep.room.name];
            if (null != containerController) {
                var container = Game.getObjectById(containerController.container);
                if (containerController.built && null != container && null != container.store) {
                    if (checkNotEmpty && container.store[RESOURCE_ENERGY] < creep.carryCapacity / 4) {
                        return null;
                    }
                    return container;
                }
            }
        }
        return null;
    },

    /**
     * End of generic seek energy source methods
     */
    moveToEnergySource: function (creep, energySource) { // should be into an helper class
        var moveResult = helperCreep.moveTo(creep, energySource, true);

        if (moveResult === ERR_NO_PATH || creep.memory.alternativePath) {
            helperCreep.moveTo(creep, energySource);
        }

        if (moveResult === ERR_NO_PATH || creep.memory.alternativePath) {
            energySource = this.setEnergySource(creep, true);
            helperCreep.moveTo(creep, energySource);
        }

//        creep.say("Moved=" + moveResult);
    },

    setEnergySource: function (creep, seekOtherPath) {
        var energySource = null;

        var isRoleFiller = creep.memory.role === "filler";

        var canSeekForSources = Memory.minerMaxCount[creep.room.name] === 0
                || (null == Memory.minerMaxCount[creep.room.name]
                        || null == Memory.minerUnitCount[creep.room.name])
                || Memory.minerMaxCount[creep.room.name] != Memory.minerUnitCount[creep.room.name];

        if (isRoleFiller) {
            canSeekForSources = false;
        }

        if (null != creep.memory.energySourceId && !seekOtherPath) {
            energySource = Game.getObjectById(creep.memory.energySourceId);
        } else {
            if (!seekOtherPath && !creep.memory.alternativePath) {
                // a filler can not pretend to seek into deposits
                energySource = helperEnergy.findNearestEnergySource(creep, !creep.memory.filler, canSeekForSources);
            } else if (!isRoleFiller) {
                console.log("find a new path for creep=" + creep.name);
                energySource = helperEnergy.findNearestEnergySource(creep, !creep.memory.filler, !canSeekForSources);
                creep.memory.alternativePath = true; // may already be true
            } else {
                energySource = helperEnergy.findNearestEnergySource(creep, false, false);
            }

            if (null == energySource && !isRoleFiller) {
                energySource = helperEnergy.findValidPathHarvestSource(creep);
                creep.memory.alternativePath = true; // may already be true
            }

            if (null == energySource && !isRoleFiller) {
                helperCreep.assigneRandomExitRoom(creep);
            }

            if (energySource) {
                creep.memory.energySourceId = energySource.target.id;
                creep.memory.energySourceType = energySource.energySourceType;
                energySource = energySource.target;
            }
        }
        return energySource;
    },

    findNearestEnergySource: function (creep, canSeekIntoDeposits, canSeekForSources) {
        // First check into full containers if exists, to prevent infinie dropped
        // ressources on the floor pushed by miners
        var energySourceType = null;
        var target = null;

        if (creep.memory.role !== "filler") {
            target = this.findContainerController(creep, true);
        }

        if (null == target) {
            target = this.findFullClosestContainer(creep);
        }

        if (null != target) {
            energySourceType = this.ENERGY_SOURCE_TYPES.CONTAINER;
        }

        if (null == target) {
            target = creep.pos.findClosestByRangeInMemory(FIND_DROPPED_RESOURCES);
            if (null != target) {
                energySourceType = this.ENERGY_SOURCE_TYPES.DROPPED;
            }
        }

        // If not at maximum, keep filling deposits, we ensure to have them always filled at priority
        if (canSeekIntoDeposits && creep.room.energyAvailable !== creep.room.energyCapacityAvailable) {
            canSeekIntoDeposits = false;
        }

        if (null == target && canSeekIntoDeposits) {
            // For now, no more seek into deposits, containers are enough
            // energySourceType = this.ENERGY_SOURCE_TYPES.DEPOSIT;
            // target = this.findFullClosestDeposit(creep);
            // if (null == target) {
            //     target = this.findFullClosestContainer(creep);
            //     console.log("sourcetarget DEPOSIT=" + target);
            // }
        }

        if (null == target && !canSeekIntoDeposits) {
            target = this.findMostFilledContainerOperatorMoreFilledThanCreep(creep);
            if (null != target) {
                energySourceType = this.ENERGY_SOURCE_TYPES.CONTAINER;
                console.log("sourcetarget most full CONTAINER=" + target);
            }

        }

        if (null == target && !canSeekIntoDeposits) {
            target = this.findClosestContainerOperatorMoreFilledThanCreep(creep);
            if (null != target) {
                energySourceType = this.ENERGY_SOURCE_TYPES.CONTAINER;
                console.log("sourcetarget CONTAINER=" + target);
            }

        }

        if (null == target && canSeekForSources) {
            energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
            target = creep.pos.findClosestByRangeInMemory(FIND_SOURCES, {
                filter: function (source) {
                    return source.energy > 0;
                }
            });
            if (null != target) {
                console.log("sourcetarget SOURCE=" + target);
            }

        }

        if (null == target) {
            console.log("sourcetarget not found, returning null");
            return null;
        }

        return {"target": target, "energySourceType": energySourceType};
    },

    findValidPathHarvestSource: function (creep) {
        var target = null;
        var energySourceType = null;

        energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
        var targets = [];
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            targets = targets.concat(room.findInMemory(FIND_SOURCES, {
                filter: function (source) {
                    return source.energy > 0;
                }
            }));
        }

        for (var i = 0; i < targets.length; i++) {
            target = targets[i];
            // ensure we seek in the same room and the path to move to is ok
            if (creep.room.name === target.room.name &&
                    helperCreep.moveTo(creep, target) == OK) {
                break;
            } else {
                target = null;
            }
        }

        // seek into other rooms
        if (null == target) {
            var exits = Game.map.describeExits(creep.room.name);
            for (var name in exits) {
                var otherRoom = Game.rooms[exits[name]];
                if (otherRoom) {
                    energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
                    target = otherRoom.findInMemory(FIND_SOURCES, {
                        filter: function (source) {
                            return source.energy > 0;
                        }
                    });
                }
                if (target && target.length > 0) {
                    target = target[0];
                    break;
                }
            }
            console.log("source target external room SOURCE=" + target);
        }

        if (null == target) {
            return null;
        }

        return {"target": target, "energySourceType": energySourceType};
    },

    findMinerHarvestSource: function (creep) {
        var target = null;
        var energySourceType = null;

        energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
        var targets = [];
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            targets = targets.concat(room.findInMemory(FIND_SOURCES, {
                filter: function (source) {

                    for (var i = 0; i < Memory.miners.length; i++) {

                    }

                    return source.energy > 0;
                }
            }));
        }

        for (var i = 0; i < targets.length; i++) {
            target = targets[i];
            // ensure we seek in the same room and the path to move to is ok
            if (creep.room.name === target.room.name &&
                    helperCreep.moveTo(creep, target, true) == OK) {
                break;
            } else {
                target = null;
            }
        }

        // seek into other rooms
        if (null == target) {
            var exits = Game.map.describeExits(creep.room.name);
            for (var name in exits) {
                var otherRoom = Game.rooms[exits[name]];
                if (otherRoom) {
                    energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
                    target = otherRoom.findInMemory(FIND_SOURCES, {
                        filter: function (source) {
                            return source.energy > 0;
                        }
                    });
                }
                if (target && target.length > 0) {
                    target = target[0];
                    break;
                }
            }
            console.log("source target external room SOURCE=" + target);
        }

        if (null == target) {
            return null;
        }

        return {"target": target, "energySourceType": energySourceType};
    },

    findAllRoomEnergySources: function (room) {
        return room.findInMemory(FIND_SOURCES);
    },

    /**
     * may cost much, should be done only one time at init
     * @param room
     */
    countEnergyMineSpots: function (room) {
        var result = 0;
        var sources = room.findInMemory(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];

            result += helperRoom.countFreeSpots(source);

        }
        return result;
    },

    buildContainerToSource: function (energySource, room) {
        if (room.controller && room.controller.my && room.controller.level < 2 && Game.rooms === 1) {
            return "Not building container, too low controller (< 2) or inexistant";
        }

        var enemyStructures = room.findInMemory(FIND_HOSTILE_STRUCTURES);

        if (null != enemyStructures && enemyStructures.length > 0) {
            return "Not building container, enemy buildings there";
        }

        var coords = helperRoom.hasAContainerAround(energySource, room);
        if (coords instanceof Array) {
            for (var i = 0; i < coords.length; i++) {
                var coord = coords[i];
                if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) {
                    return room.createConstructionSite(coord.x, coord.y, STRUCTURE_CONTAINER);
                }
            }
        }
        return "Already built";
    }

};

module.exports = helperEnergy;
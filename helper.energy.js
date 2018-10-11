var helperRoom = require('helper.room');
var helperCreep = require('helper.creep');

var helperEnergy = {

    ENERGY_SOURCE_TYPES: {
        DROPPED: "DROPPED",
        DEPOSIT: "DEPOSIT",
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
            return structure.energy;
        },
        'energyCapacity': function (structure) {
            return structure.energyCapacity;
        },
        'store': function (structure) {
            return structure.store[RESOURCE_ENERGY];
        },
        'storeCapacity': function (structure) {
            return structure.storeCapacity;
        },
        'zero': function () {
            return 0;
        },
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

        var targets = room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType !== STRUCTURE_CONTROLLER &&
                        this.operators[operator](a(structure), b(structure)
                        ));
            }
        });

        return targets;
    },

    findClosestDepositOperator: function (creep, operator, a, b) {

        var target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType !== STRUCTURE_CONTROLLER &&
                        this.operators[operator](a(structure), b(structure)
                        ));
            }
        });

        return target;
    },

    findClosestContainerOperator: function (creep, operator, a, b) {

        var target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_CONTAINER &&
                        this.operators[operator](a(structure), b(structure)
                        ));
            }
        });

        return target;
    },
    
        moveToEnergySource: function (creep, energySource) { // should be into an helper class
        var moveResult = helperCreep.moveTo(creep, energySource);

        if (moveResult === ERR_NO_PATH) {
            creep.memory.errorPathCount++;
            if (creep.memory.errorPathCount > 3) {
                creep.memory.errorPathCount = 0;
                creep.memory.alternativePath = true;
            }
        }

        if (moveResult === ERR_NO_PATH && !creep.memory.alternativePath) {

            energySource = this.setEnergySource(creep, true);
            helperCreep.moveTo(creep, energySource);
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
        return this.findClosestContainerOperator(creep, 'eq', this.structureValues.store, this.structureValues.storeCapacity);
    },

    findNotFullClosestContainer: function (creep) {
        return this.findClosestContainerOperator(creep, 'inf', this.structureValues.store, this.structureValues.storeCapacity);
    },

    findNotFullNotEmptyClosestContainer: function (creep) {
        var target = this.findClosestContainerOperator(creep, 'inf', this.structureValues.store, this.structureValues.storeCapacity);
        if (target.store[RESOURCE_ENERGY] === 0) {
            target = this.findClosestContainerOperator(creep, 'sup', this.structureValues.store, 0);
        }
        return target;


    },

    findNearestEnergySource: function (creep, canSeekIntoDeposits) {
        var energySourceType = this.ENERGY_SOURCE_TYPES.DROPPED;
        var target = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);

        // If not at maximum, keep feeling deposits, we ensure to have them always filled at priority
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
            energySourceType = this.ENERGY_SOURCE_TYPES.DEPOSIT;
            target = this.findFullClosestContainer(creep);
            console.log("sourcetarget DEPOSIT=" + target);
        }

        if (null == target) {
            energySourceType = this.ENERGY_SOURCE_TYPES.SOURCE;
            target = creep.pos.findClosestByRange(FIND_SOURCES, {
                filter: function (source) {
                    return source.energy > 0;
                }
            });
            console.log("sourcetarget SOURCE=" + target);
        }

        if (null == target) {
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
            targets = targets.concat(room.find(FIND_SOURCES, {
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
                    target = otherRoom.find(FIND_SOURCES, {
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
            targets = targets.concat(room.find(FIND_SOURCES, {
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
                    target = otherRoom.find(FIND_SOURCES, {
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
        return room.find(FIND_SOURCES);
    },

    /**
     * may cost much, should be done only one time at init
     * @param room
     */
    countEnergyMineSpots: function (room) {
        var result = 0;
        var sources = room.find(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            var source = sources[i];

            var coords = this.getCoordsAround(source.pos.x, source.pos.y);

            for (var i = 0; i < coords.length; i++) {
                var coord = coords[i];
                if (0 === Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) {
                    result++;
                }
            }
        }
        return result;
    },

    getCoordsAround: function (x, y) { // should be in helper.room
        var xA = x + 1;
        var xR = x - 1;
        var yA = y + 1;
        var yR = y - 1;
        var array = [
            {"x": xA, "y": y},
            {"x": xR, "y": y},
            {"x": x, "y": yA},
            {"x": x, "y": yR},
            {"x": xA, "y": yA},
            {"x": xR, "y": yA},
            {"x": xR, "y": yR},
            {"x": xA, "y": yR}
        ];
        return array;
    },

    /**
     * @param {type} energySource
     * @param {type} room
     * @returns x/y coords Objects Array, or a construcitonSite Object or a structure Object
     */
    hasAContainerAround: function (energySource, room) { // should be in helper.room ?

        var coordsAround = this.getCoordsAround(energySource.pos.x, energySource.pos.y);
        for (var i = 0; i < coordsAround.length; i++) {
            var coord = coordsAround[i];
            var containers = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType === STRUCTURE_CONTAINER;
                }
            });
            
            var constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
                filter: (structure) => {
                    return structure.structureType === STRUCTURE_CONTAINER;
                }
            });
            
            for (var j = 0; j < containers.length; j++) {
                var container = containers[j];
                if (container.pos.x === coord.x && container.pos.y === coord.y) {
                    return container;
                }
            }
            
            for (var j = 0; j < constructionSites.length; j++) {
                var constructionSite = constructionSites[j];
                if (constructionSite.pos.x === coord.x && constructionSite.pos.y === coord.y) {
                    return constructionSite;
                }
            }
        }

        return coordsAround;
    },

    buildContainerToSource: function (energySource, room) {
        if (room.controller && room.controller.level < 3) {
            return "Not building container, too low controller (< 3) or inexistant";
        }
        var coords = this.hasAContainerAround(energySource, room);
        if (coords instanceof Array) {
            for (var i = 0; i < coords.length; i++) {
                var coord = coords[i];
                if (0 === Game.map.getRoomTerrain(room.name).get(coord.x, coord.y)) {
                    return room.createConstructionSite(coord.x, coord.y, STRUCTURE_CONTAINER);
                }
            }
        }
        return "Already built";
    }

};

module.exports = helperEnergy;
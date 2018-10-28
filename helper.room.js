var helperRoom = {

    MEMORY_KEYS: {
        DANGEROUS_ROOM: "DANGEROUS_ROOM"
    },

    /** @param {Creep} creep **/
    findDeposit: function (room) {

        var targets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
            }
        });

        if (targets.length > 0) {
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                if (target.store < target.storeCapacity) {
                    return target;
                }
            }
        }
        return null;
    },

    /**
     * Returns 1 spawn
     * @param {type} room
     * @returns {nm$_helper.room.helperRoom.findSpawn.targets|helperRoom.findSpawn.target}
     */
    findSpawn: function (room) {

        var targets = this.findSpawns(room);

        if (targets.length > 0) {
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                return target;
            }
        }
        return null;
    },

    findSpawns: function (room) {

        var targets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN
                        && structure.my);
            }
        });

        return targets;
    },

    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathToSources: function (room) {
        var spawn = this.findSpawn(room);
        var targets = room.find(FIND_SOURCES);
        var paths = [];
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            paths[i] = spawn.pos.findPathTo(target, {
                ignoreCreeps: true,
                ignoreDestructibleStructures: false,
                ignoreRoads: false,
                swampCost: 1,
                plainCost: 1
            });
        }

        return paths;
    },

    findPathSourcesToSources: function (room) {
        var targets = room.find(FIND_SOURCES);
        var paths = [];
        if (targets.length > 1) {
            // cycling through sources
            for (var i = 1; i <= targets.length; i++) {
                if (i === targets.length) {
                    var target0 = targets[i - 1];
                    var target1 = targets[0];
                } else {
                    var target0 = targets[i - 1];
                    var target1 = targets[i];
                }
                paths.push(target0.pos.findPathTo(target1, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false,
                    swampCost: 1,
                    plainCost: 1
                }));
            }
        }

        return paths;
    },

    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathMyStructures: function (room) {
        var spawn = this.findSpawn(room);
        var targets = room.find(FIND_MY_STRUCTURES);
        var paths = [];
        for (var i = 0; i < targets.length; i++) {
            var target = targets[i];
            paths[i] = spawn.pos.findPathTo(target, {
                ignoreCreeps: true,
                ignoreDestructibleStructures: false,
                ignoreRoads: false,
                range: 1,
                swampCost: 1,
                plainCost: 1
            });
        }

        return paths;
    },

    /**
     * For building purposes
     * @param {type} room
     * @returns 
     */
    findPathExits: function (room) {
        var spawn = this.findSpawn(room);
        var paths = [];

        var exits = Game.map.describeExits(room.name);
        for (var name in exits) {
            var targets = [];
            var otherRoom = Game.rooms[exits[name]];
            if (otherRoom) {
                targets = otherRoom.find(FIND_SOURCES);
            }

            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                paths.push(spawn.pos.findPathTo(target, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: false,
                    ignoreRoads: false
                }));
            }
        }

        return paths;
    },

    activateSafeMode: function (room) {
        var controller = this.getMyRoomController(room);

        //safeMode
        //safeModeAvailable
        //safeModeCooldown
    },

    getMyRoomController: function (room) {
        if ((null != room.controller
                && room.controller.my)
                || (null != room.controller
                        && room.controller.reservation
                        && room.controller.reservation.username === "Gregzenegair")) {
            return room.controller;
        }
        return null;
    },

    /**
     * coords as a staro, not full squares
     * @param {type} x
     * @param {type} y
     * @param {type} range
     * @returns {Array|helperRoom.getCoordsAround.array|nm$_helper.room.helperRoom.getCoordsAround.array}
     */
    getCoordsAround: function (x, y, range) {
        var array = [];
        if (null == range) {
            range = 1;
        }

        for (var i = 1; i <= range; i++) {
            var xA = x + i;
            var xR = x - i;
            var yA = y + i;
            var yR = y - i;
            array.push({"x": xA, "y": y});
            array.push({"x": xR, "y": y});
            array.push({"x": x, "y": yA});
            array.push({"x": x, "y": yR});
            array.push({"x": xA, "y": yA});
            array.push({"x": xR, "y": yA});
            array.push({"x": xR, "y": yR});
            array.push({"x": xA, "y": yR});

        }


        return array;
    },

    findCombatTarget: function () {
        var target = null;
        if (null == target) {
            var targets;
            for (var roomName in Game.rooms) {
                var room = Game.rooms[roomName];
                targets = room.find(FIND_HOSTILE_CREEPS);
                if (null != targets && targets.length > 0) {
                    target = targets[0];
                    break;
                } else {
                    targets = room.find(FIND_HOSTILE_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType !== STRUCTURE_CONTROLLER);
                        }
                    });
                    if (null != targets && targets.length > 0) {
                        target = targets[0];
                        break;
                    }
                    if (null == target) {
                        targets = room.find(FIND_HOSTILE_CONSTRUCTION_SITES);
                        if (null != targets && targets.length > 0) {
                            target = targets[0];
                        }
                    }
                }
            }
        }
        return target;
    },

    findHostile: function (room) {
        var target = null;
        target = room.find(FIND_HOSTILE_CREEPS);
        if (null == target) {
            target = room.find(FIND_HOSTILE_STRUCTURES);
        }
        return target;
    },

    /**
     * Takes a room name
     */
    roomDataSetter: function (roomName, key, value) {
        this.roomDataMemoryReader(roomName)[key] = value;
    },

    /**
     * Takes a room name
     */
    roomDataGetter: function (roomName, key) {
        return this.roomDataMemoryReader(roomName)[key];
    },

    /**
     * private method
     */
    roomDataMemoryReader: function (roomName) {
        if (null == Memory.roomDatas || Game.time % 4096 === 0) { // reset every 4096 (if accessed, this will be not often)
            Memory.roomDatas = {};
        }

        if (null == Memory.roomDatas[roomName]) {
            Memory.roomDatas[roomName] = {};
        }

        return Memory.roomDatas[roomName];
    }

};

module.exports = helperRoom;
require('object.extension')();

var helperRoom = {

    MEMORY_KEYS: {
        DANGEROUS_ROOM: "DANGEROUS_ROOM"
    },

    /** @param {Creep} creep **/
    findDeposit: function (room) {

        var targets = room.findInMemory(FIND_STRUCTURES, {
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

        var targets = room.findInMemory(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN
                        && structure.my);
            }
        });

        return targets;
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

    countFreeSpots: function (roomObject) {
        var result = 0;

        var coords = helperRoom.getCoordsAround(roomObject.pos.x, roomObject.pos.y);

        for (var i = 0; i < coords.length; i++) {
            var coord = coords[i];
            if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(roomObject.room.name).get(coord.x, coord.y)) {
                result++;
            }
        }
        return result;
    },

    getFreeSpots: function (roomObject) {
        var array = [];

        var coords = helperRoom.getCoordsAround(roomObject.pos.x, roomObject.pos.y);

        for (var i = 0; i < coords.length; i++) {
            var coord = coords[i];
            if (TERRAIN_MASK_WALL !== Game.map.getRoomTerrain(roomObject.room.name).get(coord.x, coord.y)) {
                array.push({"x": coord.x, "y": coord.y});
            }
        }
        return array;
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
                targets = room.findInMemory(FIND_HOSTILE_CREEPS);
                if (null != targets && targets.length > 0) {
                    target = targets[0];
                    break;
                } else {
                    targets = room.findInMemory(FIND_HOSTILE_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType !== STRUCTURE_CONTROLLER);
                        }
                    });
                    if (null != targets && targets.length > 0) {
                        target = targets[0];
                        break;
                    }
                    if (null == target) {
                        targets = room.findInMemory(FIND_HOSTILE_CONSTRUCTION_SITES);
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
        target = room.findInMemory(FIND_HOSTILE_CREEPS);
        if (null == target) {
            target = room.findInMemory(FIND_HOSTILE_STRUCTURES);
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
    },

    scanRoom: function (room) {

    },

    /**
     * @param {type} energySource
     * @param {type} room
     * @returns x/y coords Objects Array, or a construcitonSite Object or a structure Object
     */
    hasAContainerAround: function (roomObject, room) { // should be in helper.room ?
        return this.hasASomethingAround(roomObject, STRUCTURE_CONTAINER, room);
    },

    hasAStorageAround: function (roomObject, room) { // should be in helper.room ?
        return this.hasASomethingAround(roomObject, STRUCTURE_STORAGE, room);
    },

    hasASomethingAround: function (roomObject, somethingType, room) { // should be in helper.room ?

        var coordsAround = helperRoom.getCoordsAround(roomObject.pos.x, roomObject.pos.y);
        for (var i = 0; i < coordsAround.length; i++) {
            var coord = coordsAround[i];
            var containers = room.findInMemory(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType === somethingType;
                }
            });

            var constructionSites = room.findInMemory(FIND_CONSTRUCTION_SITES, {
                filter: (structure) => {
                    return structure.structureType === somethingType;
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
    }


};

module.exports = helperRoom;
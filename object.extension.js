module.exports = function () {

    StructureSpawn.prototype.spawnCustom = function spawnCustom(type, energy, spawn, roomAssigned, spawnForItself) {

        var room = spawn.room;
        var body = type.baseBody;

        var baseBody = JSON.parse(JSON.stringify(type.baseBody));
        ;
        if (null != room.controller && room.controller.level < 2
                && type.name === "utility") {
            baseBody.push(MOVE);
        }

        var energyLeft = energy;
        var allPartsCost = this.getPartsCosts(baseBody);
        var cost = allPartsCost;
        var maxParts = Math.floor(MAX_CREEP_SIZE / baseBody.length) - baseBody.length; // secured

        /**
         * Do smaller unis if only one source
         * Or
         * If if not spawning for itself
         */
        if (room.findInMemory(FIND_SOURCES).length === 1 || !spawnForItself) {
            maxParts = Math.round(maxParts / 3);
        }

        while (maxParts > 0) {
            cost += allPartsCost;
            if (energyLeft < cost) {
                break;
            }

            body = body.concat(baseBody);
            maxParts--;
        }

        if (type.simpleBody) {
            body = baseBody;
        }

        // create creep with the created body and the given role
        if (type.filler) {
            return this.createCreep(body, null, {
                role: type.name,
                filler: type.filler,
                spawner: spawn.name,
                roomHome: spawn.room.name,
                roomAssigned: roomAssigned
            });
        } else {
            return this.createCreep(body, null, {
                role: type.name,
                spawner: spawn.name,
                roomHome: spawn.room.name,
                roomAssigned: roomAssigned
            });
        }
    };

    Room.prototype.findInMemory = function findInMemory(type, options) {
        if (Memory.findInMemory == null || Game.time % 4096 === 0) {
            Memory.findInMemory = {};
        }
        var key = "name=" + this.name + "_type=" + type + "_options=" + JSON.stringify(options);
        var results = [];
        if (null != Memory.findInMemory[key]) {
            var memResults = Memory.findInMemory[key];
            results = [];
            for (var i = 0; i < memResults.length; i++) {
                var memObject = Game.getObjectById(memResults[i]);
                if (null != memObject) {
                    results.push(memObject);
                }
            }
        } else {
            results = this.find(type, options);
            var memResults = [];
            for (var i = 0; i < results.length; i++) {
                var memObject = results[i].id;
                if (null != memObject) {
                    memResults.push(memObject);
                }
                Memory.findInMemory[key] = memResults;
            }
        }
        return results;
    };

    StructureSpawn.prototype.getPartsCosts = function getPartsCosts(bodies) {
        var cost = 0;
        for (var i = 0; i < bodies.length; i++) {
            var body = bodies[i];
            cost += BODYPART_COST[body];
        }
        return cost;
    };

    Math.myRandom = function myRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    Array.prototype.diff = function (array) {
        return this.filter(function (i) {
            return array.indexOf(i) < 0;
        });
    };


    /**
     * Glbals usages
     */
    console.log("Creating source memory...");
    if (Memory.sources == undefined) {
        Memory.sources = {};
    }
    Source.prototype.memory = Memory.sources[this.id];

};
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
        if (room.find(FIND_SOURCES).length === 1 || !spawnForItself) {
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
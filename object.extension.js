module.exports = function () {

    StructureSpawn.prototype.spawnCustom = function spawnCustom(type, energy, spawnerName) {

        var body = type.baseBody;

        var energyLeft = energy;
        var allPartsCost = this.getPartsCosts(type.baseBody);
        var cost = allPartsCost;
        var maxParts = Math.floor(MAX_CREEP_SIZE / type.baseBody.length) - type.baseBody.length; // secured

        while (maxParts > 0) {
            cost += allPartsCost;
            if (energyLeft < cost) {
                break;
            }

            body = body.concat(type.baseBody);
            maxParts--;
        }

        if (type.simpleBody) {
            body = type.baseBody;
        }

        // create creep with the created body and the given role
        if (type.filler) {
            return this.createCreep(body, null, {role: type.name, filler: type.filler, spawner: spawnerName});
        } else {
            return this.createCreep(body, null, {role: type.name, spawner: spawnerName});
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
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


    /**
     * Caches in Memory
     * @param {type} memoryName
     * @param {type} key
     * @param {type} accessDefaultFunction
     * @param {type} cacheRefresh
     * @returns {Array|Math.findAnythingInMemory.results}
     */
    Math.findAnythingInMemory = function findAnythingInMemory(memoryName, key, accessDefaultFunction, context, cacheRefresh) {
        if (Memory[memoryName] == null || Game.time % cacheRefresh === 0) {
            Memory[memoryName] = {};
        }
//        console.log("memoryName=" + memoryName);
//        console.log("accessDefaultFunction");
//        console.log(context.that);
        var results = [];
        if (null != Memory[memoryName][key]) {
            var memResults = Memory[memoryName][key];
            results = [];
            for (var i = 0; i < memResults.length; i++) {
                var memObject = Game.getObjectById(memResults[i]);
                if (null != memObject) {
                    results.push(memObject);
                }
            }
        }

        if (null == Memory[memoryName][key] || Memory[memoryName][key].length > 0
                || results.length == 0) {
            results = accessDefaultFunction(context);
            var memResults = [];
            if (null != results) {
                for (var i = 0; i < results.length; i++) {
                    var memObject = results[i].id;
                    if (null != memObject) {
                        memResults.push(memObject);
                    }
                    Memory[memoryName][key] = memResults;
                }
            }
        }
        return results;
    };

    Room.prototype.findInMemory = function findInMemory(type, options) {
        var sOptions = "";
        if (null != options) {
            for (var option in options) {
                sOptions += option + options[option].toString();
            }
            sOptions = sOptions.replace(/\s/g, "").replace("\r\n", "");
        }

        var key = "name=" + this.name + "_type=" + type + "_options=" + sOptions;
        var that = this;

        var defaultFunction = function (context) {
            return context.that.find(context.type, context.options);
        };

        var context = {
            that: that,
            type: type,
            options: options
        };

        return Math.findAnythingInMemory("find", key, defaultFunction, context, 4096);
    };

    RoomPosition.prototype.findPathToInMemory = function findPathToInMemory(target, options) {
        var sOptions = "";
        if (null != options) {
            for (var option in options) {
                sOptions += option + options[option].toString();
            }
            sOptions = sOptions.replace(/\s/g, "").replace("\r\n", "");
        }

        var key = "name=" + this.name + "_x=" + this.x + "_y=" + this.y + "_target=" + target + "_options=" + sOptions;
        var that = this;

        var defaultFunction = function (context) {
            return context.that.findPathTo(context.target, context.options);
        };

        var context = {
            that: that,
            type: target,
            options: options
        };

        return Math.findAnythingInMemory("findPathTo", key, defaultFunction, context, 4096);
    };

    RoomPosition.prototype.findClosestByPathInMemory = function findClosestByPathInMemory(type, options) {
        var sOptions = "";
        if (null != options) {
            for (var option in options) {
                sOptions += option + options[option].toString();
            }
            sOptions = sOptions.replace(/\s/g, "").replace("\r\n", "");
        }

        var key = "name=" + this.name + "_x=" + this.x + "_y=" + this.y + "_type=" + type + "_options=" + sOptions;
        var that = this;

        var defaultFunction = function (context) {
            return context.that.findClosestByPath(context.type, context.options);
        };

        var context = {
            that: that,
            type: type,
            options: options
        };

        return Math.findAnythingInMemory("findClosestByPath", key, defaultFunction, context, 8192);
    };

    RoomPosition.prototype.findClosestByRangeInMemory = function findClosestByRangeInMemory(type, options) {
        var sOptions = "";
        if (null != options) {
            for (var option in options) {
                sOptions += option + options[option].toString();
            }
            sOptions = sOptions.replace(/\s/g, "").replace("\r\n", "");
        }

        var key = "name=" + this.name + "_x=" + this.x + "_y=" + this.y + "_type=" + type + "_options=" + sOptions;
        var that = this;

        var defaultFunction = function (context) {
            return context.that.findClosestByRange(context.type, context.options);
        };

        var context = {
            that: that,
            type: type,
            options: options
        };

        return Math.findAnythingInMemory("findClosestByRange", key, defaultFunction, context, 8192);
    };


};
var helperController = require('helper.controller');


var helperSecurity = {

    run: function () {
        if (Game.time % 256 === 0) {
            for (var roomName in Game.rooms) {
                var room = Game.rooms[roomName];
                if (null != room) {
                    if (helperController.isMyController(room)) {
                        var controller = room.controller;
                        var hostiles = room.findInMemory(FIND_HOSTILE_CREEPS);
                        if (null != hostiles && hostiles.length > 0) {

                        }

                        var nukes = room.findInMemory(FIND_NUKES);
                        if (null != nukes && nukes.length > 0) {
                            for (var nuke in nukes) {
                                if (nuke.timeToLand < 1024) {
                                    if (controller.safeModeAvailable > 0) {
                                        controller.activateSafeMode();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

};


module.exports = helperSecurity;
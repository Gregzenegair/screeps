var helperController = {

    isNotClaimable: function (creep) {
        var room = creep.room;
        return null == room.controller
                || (null != room.controller
                        && room.controller.my)
                || (null != room.controller
                        && room.controller.reservation
                        && room.controller.reservation.username === "Gregzenegair"
                        && room.controller.reservation.ticksToEnd >= 4096
                        );
    }

};

module.exports = helperController;
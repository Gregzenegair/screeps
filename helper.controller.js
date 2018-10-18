var helperController = {

    isNotClaimable: function (room) {
        return null == room.controller
                || (this.isMyController(room))
                || (this.isMyReservedController(room));
    },

    isMyController: function (room) {
        return null != room.controller
                && room.controller.my;

    },

    isMyReservedController: function (room, minTickCheck) {
        if (null == minTickCheck) {
            minTickCheck = 4096;
        }
        return null != room.controller
                && room.controller.reservation
                && room.controller.reservation.username === "Gregzenegair"
                && room.controller.reservation.ticksToEnd >= minTickCheck;

    }



};

module.exports = helperController;
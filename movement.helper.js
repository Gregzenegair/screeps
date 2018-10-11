/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('movement.helper');
 * mod.thing == 'a thing'; // true
 */

var movementHelper = {

    /** @param {Creep} creep **/
    findNearest: function (creep, endPositions) {
        var targeted = creep.pos.findClosestByRange(endPositions)
        return targeted;
    },

    /** @param {Creep} creep **/
    moveRandomly: function (creep, range) {
        var newPosX = creep.pos.x + Math.round(Math.random() * range) - range / 2;
        var newPosY = creep.pos.y + Math.round(Math.random() * range) - range / 2;
        creep.moveTo(newPosX, newPosY, {reusePath: 32, visualizePathStyle: {stroke: '#ffffff'}});
    }
};

module.exports = movementHelper;
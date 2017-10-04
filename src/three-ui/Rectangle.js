var DisplayObject = require('./DisplayObject');

/**
 * Rectangle
 * @extends ThreeUI.DisplayObject
 * 
 * Used internally by ThreeUI, shouldn't be used directly
 * Use ThreeUI.createRectangle instead to create rectangles
 * 
 * @param {ThreeUI} ui
 * @param {string} color 
 * @param {int} x 
 * @param {int} y 
 * @param {int} width
 * @param {int} height
 */

var Rectangle = function(ui, color, x, y, width, height) {
	this.color = color;

	var x = typeof x !== 'undefined' ? x : 0;
	var y = typeof y !== 'undefined' ? y : 0;
	var width = typeof width !== 'undefined' ? width : 1;
	var height = typeof height !== 'undefined' ? height : 1;

	// Run DisplayObject constructor on this object
	DisplayObject.bind(this)(ui, x, y, width, height);
};

Rectangle.prototype = Object.create(DisplayObject.prototype);

/**
 * Draw this Rectangle onto the provided context
 * Used internally by DisplayObject.render
 * 
 * @param {CanvasRenderingContext2D} context
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 */

Rectangle.prototype.draw = function(context, x, y, width, height) {
	context.fillStyle = this.color;
	context.fillRect(x, y, width, height);
};

// Export Rectangle as module
module.exports = Rectangle;

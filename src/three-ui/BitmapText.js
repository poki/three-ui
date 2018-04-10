var DisplayObject = require('./DisplayObject.js');

/**
 * BitmapText
 * @extends ThreeUI.DisplayObject
 *
 * Used internally by ThreeUI, shouldn't be used directly
 * Use ThreeUI.createBitmapText instead to create text
 *
 * @param {ThreeUI} ui
 * @param {string} text
 * @param {float} scale
 * @param {int} x
 * @param {int} y
 */

var fallbackWidth = 6;
var fallbackHeight = 6;

var BitmapText = function(ui, text, scale, x, y, sheetImagePath, sheetDataPath) {
	this.parseSheet(sheetImagePath, sheetDataPath);

	this.scale = typeof scale !== 'undefined' ? scale : 1;

	this.setText(text);

	var x = typeof x !== 'undefined' ? x : 0;
	var y = typeof y !== 'undefined' ? y : 0;

	var dimensions = this.calculateDimensions();

	// Run DisplayObject constructor on this object
	DisplayObject.bind(this)(ui, x, y, dimensions.width, dimensions.height);

	this.pivot.x = 0;
	this.pivot.y = 0;
};

BitmapText.prototype = Object.create(DisplayObject.prototype);

/**
 * Set the text of this BitmapText
 *
 * @param {string} text
 */

BitmapText.prototype.setText = function(text) {
	if (this.text === text) return; // Safe-guard for update text spam

	this.text = typeof text !== 'undefined' ? text.toString() : '';
	this.characters = this.text.split('');

	var dimensions = this.calculateDimensions();
	this.width = dimensions.width;
	this.height = dimensions.height;
};

/**
 * Parse a sheet from its image and data
 *
 * @param {string} sheetImagePath
 * @param {string} sheetDataPath
 */

BitmapText.prototype.parseSheet = function(sheetImagePath, sheetDataPath) {
	if(typeof sheetImagePath === 'undefined' && !this.sheet) {
		throw new Error('Sheet image path missing when creating sprite from sheet');
	}

	if(typeof sheetDataPath === 'undefined' && !this.sheetData) {
		throw new Error('Sheet data path missing when creating sprite from sheet');
	}

	if (sheetImagePath || !this.sheet) {
		this.sheet = AssetLoader.getAssetById(sheetImagePath);
	}

	if (sheetDataPath || !this.sheetData) {
		this.sheetData = AssetLoader.getAssetById(sheetDataPath);
	}

	if (typeof this.sheetData !== 'object') {
		throw new Error('Invalid sheet data ' + sheetDataPath + ' -- not an object');
	}

	// Parse all characters
	this.characterData = {};
	var keys = Object.keys(this.sheetData);
	var length = keys.length;
	for (var i = 0;i < length;i++) {
		var char = keys[i];
		var data = this.sheetData[char];

		// Make sure coords are within bounds
		data['uv0'][0] = Math.min(1, Math.max(0, data['uv0'][0]));
		data['uv0'][1] = Math.min(1, Math.max(0, data['uv0'][1]));
		data['uv1'][0] = Math.min(1, Math.max(0, data['uv1'][0]));
		data['uv1'][1] = Math.min(1, Math.max(0, data['uv1'][1]));

		// Calculate pixel coordinates
		this.characterData[char] = {
			x: Math.round(data['uv0'][0] * this.sheet.width),
			y: Math.round((1 - data['uv0'][1]) * this.sheet.height),
			width: Math.round((data['uv1'][0] - data['uv0'][0]) * this.sheet.width),
			height: Math.round((data['uv0'][1] - data['uv1'][1]) * this.sheet.height),
		};

		// Width and height need to be bigger than 0 or some browsers will break
		var cData = this.characterData[char];
		cData.width = Math.max(0.00001, cData.width);
		cData.height = Math.max(0.00001, cData.height);
	}
};

/**
 * Calculates the dimensions of this BitmapText
 * Internal use only
 *
 * @return {object} {width, height}
 */

BitmapText.prototype.calculateDimensions = function() {
	var dimensions = {
		width: 0,
		height: 0,
	};

	var length = this.characters.length;
	for (var i = 0;i < length;i++) {
		var character = this.characters[i];
		if (!this.characterData[character]) {
			// Take dimensions of first existing character instead
			character = Object.keys(this.characterData)[0];
		}

		var data = this.characterData[character];
		dimensions.width += data ? data.width : 0;
		dimensions.height = Math.max(dimensions.height, data ? data.height : 0);
	}

	dimensions.width *= this.scale;
	dimensions.height *= this.scale;

	return dimensions;
};

/**
 * Draw this BitmapText onto the provided context
 * Used internally by DisplayObject.render
 *
 * @param {CanvasRenderingContext2D} context
 * @param {int} x
 * @param {int} y
 */

BitmapText.prototype.draw = function(context, x, y) {
	var length = this.characters.length;
	for (var i = 0;i < length;i++) {
		var character = this.characters[i];
		var bounds = this.drawCharacter(context, character, x, y);

		// Move up coordinates for the next character
		x = bounds.x + bounds.width;
		y = bounds.y;
	}
};

/**
 * Draw give character BitmapText onto the provided context
 * Used internally by DisplayObject.render
 *
 * @param {CanvasRenderingContext2D} context
 * @param {int} x
 * @param {int} y
 * @return {object} {x,y, width, height} returns bounding box
 */

BitmapText.prototype.drawCharacter = function(context, character, x, y) {
	var data = this.characterData[character];
	var skipDraw = false;

	if (typeof data === 'undefined') { // Character does not exist in this BitmapText
		data = {
			width: fallbackWidth,
			height: fallbackHeight,
		};
		skipDraw = true;
	}

	var width = data.width * this.scale;
	var height = data.height * this.scale;

	if (!skipDraw) {
		context.drawImage(this.sheet, data.x, data.y, data.width, data.height, x, y, width, height);
	}

	return {
		x: x,
		y: y,
		width: width,
		height: height,
	};
};


// Export BitmapText as module
module.exports = BitmapText;

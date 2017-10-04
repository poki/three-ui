var DisplayObject = require('./DisplayObject.js');

/**
 * Sprite
 * @extends ThreeUI.DisplayObject
 * 
 * Used internally by ThreeUI, shouldn't be used directly
 * Use ThreeUI.createSprite instead to create sprites
 * 
 * @param {ThreeUI} ui
 * @param {string} assetPath 
 * @param {int} x 
 * @param {int} y 
 * @param {int} width
 * @param {int} height
 */

var Sprite = function(ui, assetPath, x, y, width, height, sheetImagePath, sheetDataPath) {
	this.setAssetPath(assetPath, sheetImagePath, sheetDataPath);

	var x = typeof x !== 'undefined' ? x : 0;
	var y = typeof y !== 'undefined' ? y : 0;
	var width = typeof width !== 'undefined' ? width : null;
	var height = typeof height !== 'undefined' ? height : null;

	if (this.asset) {
		width = width !== null ? width : this.asset.width;
		height = height !== null ? height : this.asset.height;
	} else if (this.sheet && this.sheetImageData) {
		width = width !== null ? width : this.sheetImageData['frame']['w'];
		height = height !== null ? height : this.sheetImageData['frame']['h'];
	}

	// Run DisplayObject constructor on this object
	DisplayObject.bind(this)(ui, x, y, width, height);
};

Sprite.prototype = Object.create(DisplayObject.prototype);

/**
 * Draw this Sprite onto the provided context
 * Used internally by DisplayObject.render
 * 
 * @param {CanvasRenderingContext2D} context
 * @param {int} x
 * @param {int} y
 * @param {int} width
 * @param {int} height
 */

Sprite.prototype.draw = function(context, x, y, width, height) {
	if (this.sheet && this.sheetImageData) {
		// We're handling a sprite from a sheet
		context.drawImage(this.sheet, this.sheetImageData['frame']['x'], this.sheetImageData['frame']['y'], this.sheetImageData['frame']['w'], this.sheetImageData['frame']['h'], x, y, width, height);
	} else {
		context.drawImage(this.asset, x, y, width, height);
	}
};

/**
 * Adjust the asset ID of this sprite
 * 
 * @param {string} assetPath
 * @param {string} sheetImagePath
 * @param {string} sheetDataPath
 */

Sprite.prototype.setAssetPath = function(assetPath, sheetImagePath, sheetDataPath) {
	this.assetPath = assetPath;
	if (typeof sheetImagePath === 'undefined' && !this.sheet) {
		this.asset = AssetLoader.getAssetById(assetPath);
		this.sheet = null;
	} else {
		this.asset = null;
		this.parseSheet(assetPath, sheetImagePath, sheetDataPath)
	}
};

/**
 * Parse a sheet from its image and data
 * 
 * @param {string} sheetImagePath
 * @param {string} sheetDataPath
 */

Sprite.prototype.parseSheet = function(assetPath, sheetImagePath, sheetDataPath) {
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
	} else if(!this.sheetData['frames']) {
		throw new Error('Invalid sheet data ' + sheetDataPath + ' -- does not have frames');
	}

	var data;
	this.sheetData['frames'].forEach(function(frame) {
		if (frame['filename'] === assetPath) {
			data = frame;
		}
	});	

	if (!data) {
		throw new Error('Asset "' + assetPath + '" does not exist in sheet "' + sheetDataPath + '"');
	}

	this.sheetImageData = data;
};

// Export Sprite as module
module.exports = Sprite;

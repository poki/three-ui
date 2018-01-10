// const JSZip = require('jszip');

/**
 * AssetLoader
 *
 * Handles loading of assets
 *
 * @todo: rewrite to ES6 now that it runs through webpack
 * @todo: should not be static, and configurable through constructor
 * @todo: custom loaders need to be separate addons (i.e. the ones dependent on (js)zip and three.js)
 */

var AssetLoader = {};

// Configuration
AssetLoader.maxConcurrency = Infinity;

// Working variables
AssetLoader.assetProgress = {};
AssetLoader.loadedAssets = {};
AssetLoader.queue = [];
AssetLoader.queueIdx = 0;
AssetLoader.loader = {};

/**
 * Load provided assets and call callback when done
 *
 * @param {Object[]} assets Array of Objects that have key: identifier and value: file source
 * @param {Function} callback
 */

AssetLoader.load = function(callback) {
	AssetLoader.asyncQueue(AssetLoader.queue, function() {
		// Reset queue and progress for future loading
		AssetLoader.queue = [];
		AssetLoader.assetProgress = {};

		if (typeof callback === 'function') {
			callback();
		}
	});
};

/**
 * Moves all assets added to load next to a fresh collection, queued after the previous
 * ensuring they are loaded after previous assets are all done loading
 */

AssetLoader.queueNext = function() {
	AssetLoader.queueIdx++;
};

/**
 * Used internally to store loaded assets
 *
 * @param {string} key
 * @param {any} asset
 */

AssetLoader.done = function(key, asset) {
	AssetLoader.loadedAssets[key] = asset;
	AssetLoader.updateAssetProgress(key, 1, 1);
};

/**
 * Used internally to push a loader method to the queue
 *
 * @param {function}
 */

AssetLoader.push = function(func) {
	if (typeof AssetLoader.queue[AssetLoader.queueIdx] === 'undefined') {
		AssetLoader.queue[AssetLoader.queueIdx] = [];
	}

	AssetLoader.queue[AssetLoader.queueIdx].push(func);
};

/**
 * Listener for progress, set to create progress bars etc.
 *
 * @param {float} progress progress between 0 and 1, where 1 is fully loaded
 */

AssetLoader.progressListener = null;

/**
 * Retrieves current AssetLoader progress
 *
 * @return {float} progress progress between 0 and 1, where 1 is fully loaded
 */

AssetLoader.getProgress = function() {
	if (AssetLoader.queue.length <= 0) {
		return 1;
	}

	var total = 0;
	Object.keys(AssetLoader.assetProgress).forEach(function(asset) {
		total += AssetLoader.assetProgress[asset];
	});

	var totalLoaders = 0;
	AssetLoader.queue.forEach(function(collection) {
		totalLoaders += collection.length;
	});

	return total / totalLoaders;
};

/**
 * Used internally to update progress made on an asset
 *
 * @param {number} done
 * @param {number} total
 */

AssetLoader.updateAssetProgress = function(asset, done, total) {
	if (AssetLoader.assetProgress[asset] === 1 || total < done || total <= 0) return;

	var progress = 1;
	if (typeof done !== 'undefined' && typeof total !== 'undefined') {
		progress = done / total;
	}

	AssetLoader.assetProgress[asset] = progress;

	if (typeof AssetLoader.progressListener === 'function') {
		AssetLoader.progressListener(AssetLoader.getProgress());
	}
};

/**
 * Retrieve an asset by its ID
 *
 * @param {string} id
 *
 * @return {Image|Object}
 */

AssetLoader.getAssetById = function(id) {
	return AssetLoader.loadedAssets[id];
};

/**
 * Internal utility function that handles running loader function collection in queue
 *
 * @param {Function[][]} queue queue with collections of loader functions
 * @param {Function} callback Function that is called after the queue is finished
 */

AssetLoader.asyncQueue = function(queue, callback) {
	var workingQueue = queue.slice();
	var next = function() {
		var collection = workingQueue.shift();
		AssetLoader.asyncCollection(collection, function() {
			if (workingQueue.length > 0) {
				next();
			} else {
				callback();
			}
		});
	};
	next();
};

/**
 * Internal utility function that allows simultanuous running of a collection of async methods
 *
 * @param {Function[]} collection Collection of loader functions
 * @param {Function} callback Function that is called after the queue is finished
 */

AssetLoader.asyncCollection = function(collection, callback) {
	var collection = collection.slice();
	var numLoading = Math.min(AssetLoader.maxConcurrency, collection.length);

	var loadAndContinue = function(func) {
		func(function() {
			numLoading--;
			if (collection.length > 0) {
				// Load the next one from the collection
				numLoading++;
				loadAndContinue(collection.shift());
			} else if (numLoading === 0) {
				// We're all done, move forward
				callback();
			}
		});
	};

	collection.splice(0, AssetLoader.maxConcurrency).forEach(loadAndContinue);
};

/**
 * Loader that auto-detects file-type, only to be used for basic loading
 *
 * @param {string} asset
 */

AssetLoader.add = function(asset) {
	var fileType = asset.split('.').pop();
	if (fileType === 'png') {
		AssetLoader.add.image(asset);
	} else if (fileType === 'json') {
		AssetLoader.add.json(asset);
	} else if (fileType === 'css') {
		AssetLoader.add.css(asset);
	} else {
		throw new Error('Unsupported file-type (' + fileType + ') passed to AssetLoader.add.');
	}
};

/**
 * Loader that takes care of loading images
 *
 * @param {string} asset
 */

AssetLoader.add.image = function(asset) {
	AssetLoader.push(function(done) {
		var img = new Image();
		img.onload = function() {
			AssetLoader.done(asset, img);
			// @TODO: Can use XHR instead so we can get actual image loading progress
			AssetLoader.updateAssetProgress(asset, 1, 1);
			done();
		};
		img.src = asset;
	});
};


/**
 * Loader that takes care of loading archives
 *
 * @param {string} asset
 */

// AssetLoader.add.archive = function(asset, callback) {
// 	AssetLoader.push(function(done) {
// 		loadGeneric(asset, function(response) {
// 			JSZip.loadAsync(response).then(function(data) {
// 				AssetLoader.done(asset, data);
// 				AssetLoader.updateAssetProgress(asset, 1, 1);
// 				done();

// 				if (typeof callback === 'function') {
// 					callback(data);
// 				}
// 			});
// 		});
// 	});
// };

/**
 * Loads audio
 *
 * @param {string} asset
 */
AssetLoader.setupAudioLoader = function() {
	AssetLoader.audioLoader = AssetLoader.audioLoader || new THREE.AudioLoader();
};

AssetLoader.add.audio = function(filename) {
	AssetLoader.setupAudioLoader();
	AssetLoader.push(function(done) {
		AssetLoader.audioLoader.load(filename, function (buffer) {
			AssetLoader.done(filename, buffer);
			done();
		});
	});
};

AssetLoader.add.plainAudio = function(asset) {
	AssetLoader.push(function(done) {
		var audio = new Audio(asset);
		AssetLoader.done(asset, audio);
		done();
	});
};

/**
 * Loader that takes care of loading web font
 *
 * @param {string} fontFamily the font family as defined in the webfont's css file
 * @param {string} css
 */

AssetLoader.add.webFont = function(fontFamily, css) {
	AssetLoader.add.css(css);

	// Preload font
	var el = document.createElement('div');
	el.innerText = 'Loading ' + fontFamily;
	el.style.fontFamily = fontFamily;
	el.style.width = 0;
	el.style.height = 0;
	el.style.overflow = 'hidden';

	document.body.appendChild(el);
};

/**
 * Loader that takes care of loading JSON files
 *
 * @param {string} asset
 */

AssetLoader.add.json = function(asset) {
	AssetLoader.push(function(done) {
		loadJSON(asset, function(response) {
			AssetLoader.done(asset, response);
			done();
		});
	});
};

/**
 * Loader that takes care of loading scripts
 *
 * @param {string} script
 */

AssetLoader.add.script = function(asset) {
	AssetLoader.push(function(done) {
		AssetLoader.loader.script(asset, function() {
			AssetLoader.done(asset, asset);
			done();
		});
	})
};

AssetLoader.loader.script = function(asset, callback) {
	var el = document.createElement('script');
	el.src = asset;
	el.onload = callback;
	document.head.appendChild(el);
};

/**
 * Loader that takes care of loading CSS files
 *
 * @param {string} asset
 */

AssetLoader.add.css = function(asset) {
	AssetLoader.push(function(done) {
		var el = document.createElement('link');
		el.type = 'text/css';
		el.rel = 'stylesheet';
		el.href = asset;
		el.onload = function() {
			AssetLoader.done(asset, el);
			done();
		};
		document.head.appendChild(el);
	});
};

/**
 * Helper method to load generic files
 *
 * @param {string} url
 * @param {Function} callback Function that accepts an Object as first argument
 */

var loadGeneric = function(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);

	// if (url.indexOf('.zip') !== -1) {
	// 	// Archives should probably have an adjusted version of "loadGeneric()" instead of this hack
	// 	xhr.responseType = 'arraybuffer';
	// }

	var readyCallback = function() {
		if (xhr.readyState === 4) { // Done
			callback(xhr.response || xhr.responseText);
			xhr.onload = null;
			xhr.onreadystatechange = null;
		}
	};

	xhr.onload = readyCallback;
	xhr.onreadystatechange = readyCallback;
	xhr.onprogress = function(evt) {
		AssetLoader.updateAssetProgress(url, evt.loaded, evt.total);
	};
	xhr.onerror = function(error) {
		throw new Error('Error during XHR: ' + error);
	};

	xhr.send();
};

/**
 * Helper method to load JSON files
 *
 * @param {string} url
 * @param {Function} callback Function that accepts an Object as first argument
 */

var loadJSON = function(url, callback) {
	loadGeneric(url, function(response) {
		callback(JSON.parse(response));
	});
};

// Export AssetLoader as module
module.exports = AssetLoader;

// Expose AssetLoader to the window
window.AssetLoader = AssetLoader;
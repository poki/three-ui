# ThreeUI

UI solution for [Three.js](http://threejs.org/).

Basic layout system that will draw UI elements (rectangles, text, sprites) on a canvas, and will render this canvas on a quad in a separate Three.js scene.

## Usage

Once you make sure you have three.js and three-ui loaded you can get started quite easily.

```js
// Setup THREE.WebGLRenderer
const renderer = new THREE.WebGLRenderer();
document.body.appendChild(renderer.domElement);

const ui = new ThreeUI(renderer.domElement, 720);

// Create things
const rectangle = ui.createRectangle('#FF6D92', 0, 0, 250, 250);

// Render!
ui.render(renderer);
```

## Basic Example

Full source can be found in `examples/` ([here](examples/basic.html)).

```js
// Create a new THREE.WebGLRenderer
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// Create a UI of 720 pixels high
// will scale up to match renderer.domElement's size
const ui = new ThreeUI(renderer.domElement, 720);

// Place a Pretty Pink 500x150 rectangle in the center of the screen
const rectangle = ui.createRectangle('#FF6D92', 0, 0, 500, 100);
rectangle.anchor.x = ThreeUI.anchors.center;
rectangle.anchor.y = ThreeUI.anchors.center;

// Add some text to the rectangle
const text = ui.createText('BEST BUTTON EVER', 40, 'Arial', 'white');
text.textAlign = 'center';
text.textBaseline = 'middle';
text.anchor.x = ThreeUI.anchors.center;
text.anchor.y = ThreeUI.anchors.center;

text.parent = rectangle;

// Give the rectangle a click handler
rectangle.onClick(() => {
	console.info('You got me!');
});

// Animate that rectangle!
const animate = (deltaTime = 0) => {
	rectangle.x = Math.sin(deltaTime / 500) * 100;
	rectangle.y = Math.cos(deltaTime / 500) * 100;

	ui.render(renderer);

	requestAnimationFrame(animate);
};
animate();
```

## More examples

The following example is more like an appendix and won't fully run, will split this up into working examples later.

This project comes with an asset loader as well (for now at least). You can use your own asset loading implementation, but ThreeUI depends on `AssetLoader.getAssetById` to exist and return correct objects. 

For now I would recommend using the provided asset loader to make sure everything works properly.

```js
// Add assets to the asset loader
AssetLoader.add.webFont('webFont', 'fonts/web-font.css');
AssetLoader.add.image('sprites/asset.png');
AssetLoader.add.image('sprites/asset-active.png');
AssetLoader.add.spriteSheet('sprites/sheet.png', 'sprites/sheet.json');
AssetLoader.add.bitmapText('fonts/bitmap-font.png', 'fonts/bitmap-font.json');

// Set a progress listener, can be used to create progress bars
AssetLoader.progressListener = function(progress) {
	console.info('Progress: ' + (progress * 100) + '%');
};

// Load, and start game when done
AssetLoader.load(function() { // This function is called when all assets are loaded
	// Initialize the game
	init();
});

// Inside of Game

function init () {
 	// Init the UI with the game canvas, renderer.domElement from Three.js
	// Second argument determines UI height in pixels
	// the ui will always stretch to the full game canvas but these pixels are used for calculations
	this.ui = new ThreeUI(this.canvas, 720); // this.canvas is the canvas your game is rendered in

	// We like pixels
	this.ui.texture.minFilter = THREE.NearestFilter;
	this.ui.texture.magFilter = THREE.NearestFilter;

	// Create a new rectangle
	var rectangle = this.ui.createRectangle('#ffffff', 0, 0, 1280, 50);
	rectangle.alpha = .8;
	rectangle.anchor.x = ThreeUI.anchors.center;
	rectangle.anchor.y = ThreeUI.anchors.center;

	// Create a new sprite
	sprite = ui.createSprite('sprites/asset.png');
	sprite.alpha = 1; // Default
	sprite.x = 50;
	sprite.y = 50;
	sprite.pivot.x = 0.5; // Default
	sprite.pivot.y = 0.5; // Default
	sprite.anchor.x = ThreeUI.anchors.left; // Default
	sprite.anchor.y = ThreeUI.anchors.top; // Default
	sprite.parent = rectangle; // You can base the sprite's position on another DisplayObject's bounds by setting it as its parent

	// You can also stretch a display object, and adjust it's final position / dimensions with offset (this works with parent)
	// Please note that setting stretch to true will mean the coordinates and dimensions you've set for that dimension will be ignored
	// i.e. stretch.x = true will mean x, width and anchor.x values are ignored
	var stretchRectangle = this.ui.createRectangle('#ffffff', 0, 0, 1280, 50);
	stretchRectangle.alpha = .8;
	stretchRectangle.stretch.x = true;
	stretchRectangle.offset.left = 50;
	stretchRectangle.offset.right = '50%'; // Offsets can also be in %	

	// Create text (text, font, color)
	var text = this.ui.createText('Hello World!', 20, 'webFont', '#ffffff');
	text.y = 50;
	text.anchor.x = ThreeUI.anchors.center;
	text.anchor.y = ThreeUI.anchors.top;
	text.textAlign = 'center';

	// Create BitmapText (text, scale, x, y, sheetImagePath, sheetDataPath)
	var bitmapText = this.ui.createBitmapText('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@', 1, 0, 0, 'fonts/bitmap-font.png', 'fonts/bitmap-font.json');
	bitmapText.anchor.x = ThreeUI.anchors.left;
	bitmapText.anchor.y = ThreeUI.anchors.top;
	bitmapText.pivot.x = 0.5; // Bitmap alignment is also done through pivot, 0,0 is default for BitmapText
	bitmapText.smoothing = false; // For pixel fonts make sure to set smoothing to false (this also works for sprites!)

	// Update bitmaptext text by calling setText
	bitmapText.setText('OTHERTEXT');

	// Note: Sprites, Rectangles, Text and BitmapText are all DisplayObjects and have mostly the same methods and properties available to them.

	sprite.onClick(function(sprite) {
		console.log("You've clicked sprite!");
	});

	sprite.setAssetPath('sprites/asset-active.png'); // Change the sprite's asset by using setAssetPath

	// Create a sprite from a sheet
	var spriteFromSheet = ui.createSpriteFromSheet('asset-in-sheet.png', 'sprites/sheet.png', 'sprites/sheet.json');

	spriteFromSheet.setAssetPath('other-asset-in-sheet.png'); // Change the sprite to a different one within this sheet
	spriteFromSheet.setAssetPath('asset-from-other-sheet.png', 'sprites/other-sheet.png', 'sprites/other-sheet.json'); // Change the sprite to a different one in a different sheet

	animate();
}

function animate() {
	update();
	render();
	
	requestAnimationFrame(animate);
}

function update() {
	// Sprites can be animated simply by adjusting their values
	sprite.x += 1;
}

function render() {
	// Your three js renderer
	renderer.render(this.scene, this.camera); // Render the game with the game's camera
	this.ui.render(game.renderer); // Render the UI in it's own scene in the game's renderer
}
```

## Spritesheets

We have basic spritesheet support. We use the free version of Texturepacker, and export to JSON (Array). We only support the "filename" and "frame" keys in this format, so the other values can be stripped.

Example stripped down unminified sheet.json:

```json
{
	"frames": [
		{
			"filename": "sprite.png",
			"frame": {
				"x": 0,
				"y": 0,
				"w": 100,
				"h": 100
			}
		}
	]
}
```

## Bitmap fonts

We have basic bitmap font support. We accept a json that contains UV coordinates per character.

Example stripped down unminified sheet.json:

```json
{
	"A": { 
		"uv0": [0.0078125, 0.9921875],
		"uv1": [0.109375, 0.890625]
	}
}
```

## Wishlist

- ES6
- eslint
- Naming of methods like 'DisplayObject:determinePositionInCanvas' and 'DisplayObject:getOffsetInCanvas' could be clearer
- Allow % values for all position / dimensions (not just offset)
- Unit testing
- Completely functional rotation
- Advanced spritesheet features such as trimmed or rotated sprites
- Non-square event handling bounding boxes
- Separate render logic from "Three.js logic", so other renderers (like PIXI.js) can be used instead

## Known limitations / bugs

- Rotation isn't functional with bounding boxes and therefore event listeners
- Rotation doesn't respect pivot on a stretched DisplayObject

### Misc.

Thanks to Evermade's Jaakko for the [blog post](https://www.evermade.fi/en/pure-three-js-hud/) that inspired this project.
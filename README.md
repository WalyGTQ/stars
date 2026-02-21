# Star.js ✨

A lightweight, time-aware star background library designed for modern portfolios and creative websites.

`Star.js` automatically detects the local time of your visitors and adjusts the atmosphere (colors, star density, gradients) to match their world.

## Features

- 🕒 **Time-Aware**: Changes themes based on the user's local hour (Night, Dawn, Day, Sunset).
- 🎨 **Customizable**: Override themes or set a manual theme easily.
- 🚀 **Performant**: Built with HTML5 Canvas for smooth animations.
- 📱 **Responsive**: Automatically adapts to any screen size.
- 🧊 **Zero Dependencies**: Pure JavaScript.

## Installation

Simply include the script in your HTML:

```html
<script src="path/to/star.js"></script>
```

## Usage

Initialize the background with default settings:

```javascript
const stars = new StarBackground();
```

### Advanced Usage

You can pass an options object to customize the behavior:

```javascript
const stars = new StarBackground({
  starCount: 300, // Number of stars
  baseSpeed: 0.2, // Movement speed
  enableTimeAwareness: true, // Auto-change themes
  manualTheme: "night", // Force a specific theme ('night', 'dawn', 'day', 'sunset')
});
```

### Methods

- `stars.destroy()`: Removes the canvas and stops animations.

## Themes

The library currently includes 4 dynamic themes:

- **Night** (00h - 05h): Dense starfield with dark gradients.
- **Dawn** (05h - 08h): Rising sun gradients with fewer stars.
- **Day** (08h - 17h): Blue sky with faint stars.
- **Sunset** (17h - 20h): Orange atmosphere with emerging stars.

## License

MIT License. Feel free to use it in your personal or commercial projects!

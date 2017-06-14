# babel-plugin-transform-package

Add __module and __version to ES6 classes 

## Installation

```sh
$ npm install babel-plugin-transform-package
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["transform-package"]
}
```

### Via CLI

```sh
$ babel --plugins transform-package script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["transform-package"]
});
```

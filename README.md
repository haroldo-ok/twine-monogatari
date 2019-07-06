# twine-monogatari
Allows one to use Twine to create Visual Novels for the Monogatari engine.

**Work in progress.**

<!--
[![Build Status](https://travis-ci.org/lazerwalker/twison.svg?branch=master)](https://travis-ci.org/lazerwalker/twison)
-->

Based on [Twison](https://github.com/lazerwalker/twison).

Twison is a story format for [Twine 2](http://twinery.org/2) that simply exports to JSON.

It is inspired by [Entweedle](http://www.maximumverbosity.net/twine/Entweedle/) as a model for how Twine 2 story formats work.


## Development

If you want to hack on this tool itself:

1. Clone this repo and run `npm install` to install dependencies.
2. Make your changes to the unminified code in the `src` folder
3. Run `node build.js` to compile your source into a `format.js` file that Twine 2 can understand. Alternatively, you can run `node watch.js` to watch the `src` directory for changes and auto-recompile every time you save.


### Testing your changes locally

Running `npm start` will start the `watch.js` auto-compile behavior, and also start a local web server that serves the compiled `format.js` file. By default, this will be available at `http://localhost:3000/format.js`. Add that URL as a story format to your copy of Twine 2; every time you save a source file and then re-generate the "Play" view of your story in Twine, it should use the latest version of your code.

This is easier to do with the browser-based version of Twine 2 than with the downloadable copy, as you can just refresh your output page and it'll use the latest version of Twison.


All contributions are welcome! If making code changes, please be sure to run the test suite (`npm test`) before opening a pull request.


## License

twine-monogatari is licensed under the MIT license. See the LICENSE file for more information.

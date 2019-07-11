<h1 align="center">Welcome to twine-monogatari 👋</h1>
<p>
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/haroldo-ok/twine-monogatari#readme">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" target="_blank" />
  </a>
  <a href="https://github.com/haroldo-ok/twine-monogatari/graphs/commit-activity">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" target="_blank" />
  </a>
  <a href="https://github.com/haroldo-ok/twine-monogatari/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
  </a>
  <a href="https://twitter.com/Haroldo0k">
    <img alt="Twitter: Haroldo0k" src="https://img.shields.io/twitter/follow/Haroldo0k.svg?style=social" target="_blank" />
  </a>
</p>

This Twine 2 story format allows one to use [Twine](https://twinery.org/) to create Visual Novels for the [Monogatari](http://monogatari.io) engine.

Based on [Twison](https://github.com/lazerwalker/twison).

## Install

1. Open the Twine 2 online editor: https://twinery.org/2/
2. On the left hand side, click on "Formats";
3. Click on "Add new format";
4. Inform the URL: http://www.haroldo-ok.com/twine-monogatari/v0.1.0/format.js
5. Click on "Add".

## Development

```sh
npm install
node build.js
```

If you want to hack on this tool itself:

1. Clone this repo and run `npm install` to install dependencies.
2. Make your changes to the unminified code in the `src` folder
3. Run `node build.js` to compile your source into a `format.js` file that Twine 2 can understand. Alternatively, you can run `node watch.js` to watch the `src` directory for changes and auto-recompile every time you save.


## Run locally

```sh
npm start
```

Running `npm start` will start the `watch.js` auto-compile behavior, and also start a local web server that serves the compiled `format.js` file. By default, this will be available at `http://localhost:3000/format.js`. Add that URL as a story format to your copy of Twine 2; every time you save a source file and then re-generate the "Play" view of your story in Twine, it should use the latest version of your code.

This is easier to do with the browser-based version of Twine 2 than with the downloadable copy, as you can just refresh your output page and it'll use the latest version of Twison.

## Run tests

```sh
npm run test
```

## Author

👤 **Haroldo O. Pinheiro**

* Twitter: [@Haroldo0k](https://twitter.com/Haroldo0k)
* Github: [@haroldo-ok](https://github.com/haroldo-ok)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/haroldo-ok/twine-monogatari/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2019 [Haroldo O. Pinheiro](https://github.com/haroldo-ok).<br />
This project is [MIT](https://github.com/haroldo-ok/twine-monogatari/blob/master/LICENSE) licensed.


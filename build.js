var fs = require('fs')
var ncp = require('ncp');

var package = JSON.parse(fs.readFileSync("package.json", "utf-8"))
var html = fs.readFileSync("src/storyFormat.html", "utf-8")

html = html.replace(/\{\{ENGINE_URL\}\}/g, 'http://localhost:3000/');

var outputJSON = {
  name: package.name,
  version: package.version,
  author: package.author,
  description: package.description,
  proofing: false,
  source: html
};

var outputString = "window.storyFormat(" + JSON.stringify(outputJSON, null, 2) + ");";
fs.writeFile("dist/format.js", outputString, function(err) {
  if (err) { 
    console.log("Error building story format:", err);
  } else {
    console.log("Successfully built story format to dist/format.js");
  }
});

ncp('Monogatari/dist', 'dist/Monogatari', function (err) {
  if (err) {
    return console.error("Error copying Monogatari engine", err);
  } 
  console.log('Successfully copied engine to dist/Monogatari/');
});

ncp('src/twison.js', 'dist/twison.js', function (err) {
  if (err) {
    return console.error("Error copying Monogatari custom scripts", err);
  } 
  console.log('Successfully copied twison.js');
});

ncp('src/Monogatari', 'dist/Monogatari', function (err) {
  if (err) {
    return console.error("Error copying Monogatari custom scripts", err);
  } 
  console.log('Successfully copied custom scripts to dist/Monogatari/js');
});

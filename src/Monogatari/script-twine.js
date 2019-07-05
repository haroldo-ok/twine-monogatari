/* global monogatari */

// Define the messages used in the game.
monogatari.action ('Message').messages ({
	'Help': {
		title: 'Help',
		subtitle: 'Some useful Links',
		body: `
			<p><a href='https://monogatari.io/documentation/'>Documentation</a> - Everything you need to know.</p>
			<p><a href='https://monogatari.io/demo/'>Demo</a> - A simple Demo.</p>
		`
	}
});

// Define the notifications used in the game
monogatari.action ('Notification').notifications ({
	'Welcome': {
		title: 'Welcome',
		body: 'This is the Monogatari VN Engine',
		icon: ''
	}
});

// Define the Particles JS Configurations used in the game
monogatari.action ('Particles').particles ({

});

monogatari.assets ('gallery', {

});

// Define the music used in the game.
monogatari.assets ('music', {

});

// Define the voice files used in the game.
monogatari.assets ('voice', {

});

// Define the sounds used in the game.
monogatari.assets ('sound', {

});

// Define the videos used in the game.
monogatari.assets ('video', {

});

// Define the images used in the game.
monogatari.assets ('images', {

});

// Define the backgrounds for each scene.
monogatari.assets ('scenes', {

});


// Define the Characters
monogatari.characters ({
	'y': {
		name: 'Yui',
		color: '#5bcaff'
	}
});

monogatari.script(twineStory.passages.reduce(function(script, passage) {
	var commands = passage.commands.slice();
	var links = passage.links && [{
		Choice: passage.links.reduce(function(choices, link) {
			choices[link.name] = {
				Text: link.name,
				Do: 'jump ' + link.link
			}
			return choices;
		}, {})
	}] || [];
	
	script[passage.name] = commands.concat(links);
	return script;
}, {}));
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
monogatari.action ('Particles').particles (twineStory.declarations.Particles || {});

monogatari.assets ('gallery', twineStory.declarations.Gallery || {});

// Define the music used in the game.
monogatari.assets ('music', twineStory.declarations.Music || {});

// Define the voice files used in the game.
monogatari.assets ('voice', twineStory.declarations.Voice || {});

// Define the sounds used in the game.
monogatari.assets ('sound', twineStory.declarations.Sound || {});

// Define the videos used in the game.
monogatari.assets ('video', twineStory.declarations.Video || {});

// Define the images used in the game.
monogatari.assets ('images', twineStory.declarations.Images || {});

// Define the backgrounds for each scene.
monogatari.assets ('scenes', twineStory.declarations.Scenes || {});


// Define the Characters
monogatari.characters (twineStory.declarations.Characters || {});

monogatari.script(twineStory.passages.reduce(function(script, passage) {
	var commands = passage.commands.map(function(o) {
		return o.content || o.source;
	});
	
	var links = passage.links && [{
		Choice: passage.links.reduce(function(choices, link) {
			var choice = {
				Text: link.name,
				Do: 'jump ' + link.link
			};
			
			if (link.condition) {
				choice.Condition = link.condition;
			}
			
			choices[link.name] = choice;
			return choices;
		}, {})
	}] || [];
	
	script[passage.name] = commands.concat(links);
	return script;
}, {}));

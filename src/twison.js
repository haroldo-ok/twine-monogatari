'use strict'

var Twison = {
  extractLinksFromText: function(text) {
    var links = text.match(/\[\[.+?\]\]/g)
    if (links) {
      return links.map(function(link) {
        var differentName = link.match(/\[\[(.*?)\-\&gt;(.*?)\]\]/);
        if (differentName) {
          // [[name->link]]
          return {
            name: differentName[1],
            link: differentName[2]
          };
        } else {
          // [[link]]
          link = link.substring(2, link.length-2)
          return {
            name: link,
            link: link
          }
        }
      });
    }
  },
  
  extractCommandsFromText: function(text) {
    var lines = text.split(/[\r\n]+/g)
      // Removes links and trailing spaces
      .map(function(s){ 
        return s.replace(/\[\[.*?\]\]/g, '').trimEnd();
      })
      // Removes empty lines and comments
      .filter(function(s) {
        return s && !s.startsWith('//');
      });
    
    var commands = Twison.processScriptingBlocks(lines);    
    return commands;
  },
  
  processScriptingBlocks: function(lines) {
    // Processes the "```" blocks
    return lines.reduce(function(o, s) {
      if (o.scriptType) {
        
        // We're within a code block
        
        if (s.startsWith("```")) {
          // It's the end of a code block
          o.commands.push(Twison.processScriptingBlock(o.scriptType, o.scriptLines));
          o.scriptLines.length = 0;
        } else {
          // A line within a code block
          o.scriptLines.push(s);
        }
        
      } else if (s.startsWith("```")) {
        
        // It's the start of a code block
        
        o.scriptType = s.slice(3).trimEnd() || 'js';
        if (o.scriptType === 'js') {
          o.scriptType = 'javascript';
        }
        
      } else {        
        // Plain text
        o.commands.push(s);
      }
      return o;
    }, {
      commands: [],
      scriptType: '',
      scriptLines: []
    })
    .commands;
  },
  
  processScriptingBlock: function(scriptType, lines) {
    if (scriptType === 'javascript') {
      try {
        var compiledFunction = new Function('storage', lines.join('\n'));
        return function monogataryCallWrapper() {
          var storage = monogatari.storage();
          var result = compiledFunction(storage);
          monogatari.storage(storage);
          return result;
        }
      } catch (e) {
        console.error('Error while execute JS block. ', e);
      }
    } else {
      // TODO: Proper error handling.
      console.error('Unknown script type: ' + scriptType);
    }
  },

  convertPassage: function(passage) {
  	var dict = {text: passage.innerHTML};

    var links = Twison.extractLinksFromText(dict.text);
    if (links) {
      dict.links = links;
    }

    ["name", "pid", "position", "tags"].forEach(function(attr) {
      var value = passage.attributes[attr].value;
      if (value) {
        dict[attr] = value;
      }
    });

    if(dict.position) {
      var position = dict.position.split(',')
      dict.position = {
        x: position[0],
        y: position[1]
      }
    }

    if (dict.tags) {
      dict.tags = dict.tags.split(" ");
    }

    var commands = Twison.extractCommandsFromText(dict.text);
    if (commands) {
      dict.commands = commands;
    }

    return dict;
	},

  convertStory: function(story) {
    var passages = story.getElementsByTagName("tw-passagedata");
    var convertedPassages = Array.prototype.slice.call(passages).map(Twison.convertPassage);

    var dict = {
      passages: convertedPassages
    };

    ["name", "startnode", "creator", "creator-version", "ifid"].forEach(function(attr) {
      var value = story.attributes[attr].value;
      if (value) {
        dict[attr] = value;
      }
    });

    // Add PIDs to links
    var pidsByName = {};
    dict.passages.forEach(function(passage) {
      pidsByName[passage.name] = passage.pid;
    });

    dict.passages.forEach(function(passage) {
      if (!passage.links) return;
      passage.links.forEach(function(link) {
        link.pid = pidsByName[link.link];
        if (!link.pid) {
          link.broken = true;
        }
      });
    });

    return dict;
  },

  convert: function() {
    var storyData = document.getElementsByTagName("tw-storydata")[0];
    var convertedStory = Twison.convertStory(storyData);
    console.log('Parsed story', convertedStory);
    return convertedStory;
  }
}

window.Twison = Twison;
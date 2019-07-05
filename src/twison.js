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
      .map(function(s){ 
        return s.replace(/\[\[.*?\]\]/g, '').trimEnd();
      })
      .filter(function(s) {
        return s && s !== '&lt;p&gt;' && !s.startsWith('//');
      });
    return lines;
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
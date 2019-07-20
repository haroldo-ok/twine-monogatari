'use strict'

(function(){

var Parser = {
  extractConditionalFromLinks: function(links) {
      return links && links..map(function(link) {
        var m = /(^.*?)(\|\?.*)?$/.exec(link.name);
        if (m[2]) {
          // Found a conditional.
          
          var source = 'return ' + m[2].substring(2, m[2].length - 1);
          console.log('Found conditional ', source);
          
          link.name = m[1].trimEnd();
          link.condition = Parser.createJsFunction(source);
        }
        return link;
      });
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
    
    var commands = Parser.processScriptingBlocks(lines);    
    return commands;
  },
  
  extractConfigFromText: function(text) {
    return jsyaml.load(Parser.htmlDecode(text));
  },
  
  processScriptingBlocks: function(lines) {
    // Processes the "```" blocks
    return lines.reduce(function(o, s) {
      if (o.scriptType) {
        
        // We're within a code block
        
        if (s.startsWith("```")) {          
          // It's the end of a code block
          
          // Generate the function
          o.commands.push(Parser.processScriptingBlock(o.scriptType, o.scriptLines));
          
          // Exit code block
          o.scriptType = '';
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
        o.commands.push(Parser.htmlDecode(s));
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
      return Parser.createJsFunction(lines.join('\n'));
    } else if (scriptType === 'yaml') {
      return Parser.createObjectFromYAML(lines.join('\n'));
    } else {
      // TODO: Proper error handling.
      console.error('Unknown script type: ' + scriptType);
    }
  },
  
  htmlDecode: function(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;    
  },
    
  createJsFunction: function(source) {
      try {
        var decodedSource = Parser.htmlDecode(source);
        var compiledFunction = new Function('storage', decodedSource);
        return function monogataryCallWrapper() {
          var storage = monogatari.storage();
          var result = compiledFunction(storage);
          monogatari.storage(storage);
          return result;
        }
      } catch (e) {
        console.error('Error while compiling JS block. ', e, {source: source});
      }
  },
    
  createObjectFromYAML: function(source) {
      try {
        return jsyaml.load(source);
      } catch (e) {
        console.error('Error while compiling JS block. ', e, {source: source});
      }
  },
    
  convertPassage: function(passage) {
    var dict = passage;

    var links = Parser.extractConditionalFromLinks(dict.links);
    if (links) {
      dict.links = links;
    }

    var specialPassage = /^\s*\[(\w+)\]\s*/.exec(dict.name);
    if (specialPassage) {
      var config = Parser.extractConfigFromText(dict.text);
      if (config) {
        dict.configKey = specialPassage[1];
        dict.config = config;
      }
    } else {
      var commands = Parser.extractCommandsFromText(dict.text);
      if (commands) {
        dict.commands = commands;
      }
    }    

    return dict;
  },

  convertStory: function(story) {
    var convertedPassages = Array.prototype.slice.call(story.passages).map(Parser.convertPassage);

    var dict = {
      passages: convertedPassages.filter(p => p.commands),
      declarations: convertedPassages.filter(p => p.config).reduce((o, p) => {
        o[p.configKey] = p.config;
        return o;
      }, {})
    };

    return dict;
  },

  convert: function(storyData) {
    var storyData = document.getElementsByTagName("tw-storydata")[0];
    return Parser.convertStory(storyData);
  }
}

window.TwineMonogatari = {
  Parser: Parser
};

})();

'use strict';

(function(){
  
var ErrorHandler = {
   simpleError: (o, message, data) => {
     if (!o.errors) {
       o.errors = [];
     };
     
     o.errors.push(_.extend({
       message: message
     }, data || {}));
   }
};
  
var Parser = {
  extractConditionalFromLinks: function(links) {
      return links && links.map(function(link) {
        link.name = Parser.htmlDecode(link.name);
        
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
    var lines = text.split(/\r?\n/g)
      // Removes links and trailing spaces
      .map(function(s){ 
        return s.replace(/\[\[.*?\]\]/g, '').trimEnd();
      })
      // Turns into objects and adds line numbers
      .map(function(s, i){ 
        return {
          type: 'text',
          line: i + 1,
          source: Parser.htmlDecode(s)
        };
      })      
      // Removes empty lines and comments
      .filter(function(o) {
        return o.source && !o.source.startsWith('//');
      });
    
    var commands = Parser.processScriptingBlocks(lines);    
    return commands;
  },
  
  extractConfigFromText: function(text) {
    return jsyaml.load(Parser.htmlDecode(text));
  },
  
  processScriptingBlocks: function(lines) {
    // Processes the "```" blocks
    return lines.reduce(function(o, lin) {
      var s = lin.source;
      
      if (o.scriptType) {
        
        // We're within a code block
        
        if (s.startsWith("```")) {          
          // It's the end of a code block
          
          // Generate the function
          var block = {
            type: 'code',
            line: o.line,            
            scriptType: o.scriptType,
            source: o.scriptLines.join('\n')
          };
          
          try {
            block.content = Parser.processScriptingBlock(o.scriptType, o.scriptLines);
          } catch (e) {
            ErrorHandler.simpleError(block, 
              'Error parsing ' + o.scriptType + ' code block: ' + e, {e: e});
          }
          
          o.commands.push(block);
          
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
        
        o.line = lin.line;
      } else {        
        // Plain text
        o.commands.push(lin);
      }
      return o;
    }, {
      commands: [],
      line: 0,
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
      throw new Error('Unknown script type: ' + scriptType);
    }
  },
  
  htmlDecode: function(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;    
  },
    
  createJsFunction: function(source) {
      var compiledFunction = new Function('storage', source);
      return function monogataryCallWrapper() {
        var storage = monogatari.storage();
        var result = compiledFunction(storage);
        monogatari.storage(storage);
        return result;
      }
  },
    
  createObjectFromYAML: function(source) {
       return jsyaml.load(source);
  },
    
  convertPassage: function(passage) {
    var dict = passage;

    var links = Parser.extractConditionalFromLinks(dict.links);
    if (links) {
      dict.links = links;
    }

    var specialPassage = /^\s*\[(\w+)\]\s*/.exec(dict.name);
    if (specialPassage) {
      try {
        dict.configKey = specialPassage[1];
        var config = Parser.extractConfigFromText(dict.text);
        if (config) {
          dict.config = config;
        }
      } catch (e) {
        var data = {e: e};
        
        if (e.mark) {
          data.line = e.mark.line + 1;
        }
        
        dict.config = {};
        ErrorHandler.simpleError(dict.config, 
          'Error parsing config: ' + e, data);        
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
    var convertedPassages = story.passages.map(Parser.convertPassage);

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
    return Parser.convertStory(storyData);
  }
}

window.TwineMonogatari = {
  Parser: Parser,
  
  convert: function() {
    var twisonStory = Twison.convert();
    return TwineMonogatari.Parser.convert(twisonStory);
  }
};

})();

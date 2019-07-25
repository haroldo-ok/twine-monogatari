'use strict';

(function(){
  
var ErrorHandler = {
  
  TEMPLATE: _.template(
    '<li class="error">' +
			'<ul class="summary">' +
        '<li class="passage"><%=passage%></li>' +
        '<li class="message"><%=message%></li>' +
				'<li class="line">line <%=line%></li>' +
			'</ul>' +
		'</li>'),
  
  simpleError: (o, message, data) => {
    if (!o.errors) {
      o.errors = [];
    };
     
    o.errors.push(_.extend({
      message: message
    }, data || {}));
  },
  
  showError: error => {
    var html = ErrorHandler.TEMPLATE(_.extend({
      passage: '(Global)',
      message: '???',
      line: 0
    }, error));
    
    $('#tw-errors').addClass('has-errors')
      .find('.errors').append(html);
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
          try {
            link.condition = Parser.createJsFunction(source);
          } catch (e) {
            ErrorHandler.simpleError(link, 
              'Error parsing condition for link "' + link.name + '": ' + e, {link: link.name, e: e});
          }
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
    
    // Check if passage name has space anywhere in its name
    if (/\s/.test(dict.name)) {
      ErrorHandler.simpleError(dict, 
        'Passage name cannot contain whitespace.', 
        {type: 'passage', passage: dict.name});        
    }
        
    // Check if it is a special passage
    var specialPassage = /^\s*\[(\w+)\]\s*/.exec(dict.name);
    if (specialPassage) {
      // It is a config passage: parse it as a config object
      try {
        dict.configKey = specialPassage[1];
        var config = Parser.extractConfigFromText(dict.text);
        if (config) {
          dict.config = config;
        }
      } catch (e) {
        var data = {type: 'config', e: e};
        
        if (e.mark) {
          data.line = e.mark.line + 1;
        }
        
        dict.config = {};
        ErrorHandler.simpleError(dict.config, 
          'Error parsing config: ' + e, data);        
      }
    } else {
      // It is an ordinary passage: parse it into commands
      var commands = Parser.extractCommandsFromText(dict.text);
      if (commands) {
        dict.commands = commands;
      }
    }    

    return dict;
  },
  
  convertErrors: function(passages) {
    // Collect all the errors together into a single array
    return _(passages).flatMap(passage => {
      return _([passage, passage.links, passage.commands, passage.config])
        .flatten().compact().map(o => {
          // Has no errors: skip.
          if (!o || !o.errors) {
            return null;
          }
        
          // If it has type or line information, merge the info
          if (o.type || _.isNumber(o.line)) {
            return o.errors.map(e => {
              return _(o).pick(o, ['type', 'line', 'scriptType'])
                .extend(e).value();
            });
          }
        
          // Has just the errors.
          return o.errors;
        })
        .flatten().compact()
        .map(o => _.extend({passage: passage.name}, o)).value();
    }).compact().value();
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
    
    var errors = Parser.convertErrors(story.passages);
    if (errors && errors.length) {
      dict.errors = errors;
    }

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
    var monogatariStory = TwineMonogatari.Parser.convert(twisonStory);
    (monogatariStory.errors || []).forEach(ErrorHandler.showError);
    return  monogatariStory;
  }
};

})();

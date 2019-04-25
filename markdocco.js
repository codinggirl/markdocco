// Docco
// =====

// **Docco** is a quick-and-dirty documentation generator, written in
// [Literate CoffeeScript](http://coffeescript.org/#literate).
// It produces an HTML document that displays your comments intermingled with your
// code. All prose is passed through
// [Markdown](http://daringfireball.net/projects/markdown/syntax), and code is
// passed through [Highlight.js](http://highlightjs.org/) syntax highlighting.
// This page is the result of running Docco against its own
// [source file](https://github.com/jashkenas/docco/blob/master/docco.litcoffee).

// 1. Install Docco with **npm**: `sudo npm install -g docco`

// 2. Run it against your code: `docco src/*.coffee`

// There is no "Step 3". This will generate an HTML page for each of the named
// source files, with a menu linking to the other pages, saving the whole mess
// into a `docs` folder (configurable).

// The [Docco source](http://github.com/jashkenas/docco) is available on GitHub,
// and is released under the [Lil License](http://lillicense.org/v1.html).

// Docco can be used to process code written in any programming language. If it
// doesn't handle your favorite yet, feel free to
// [add it to the list](https://github.com/jashkenas/docco/blob/master/resources/languages.json).
// Finally, the ["literate" style](http://coffeescript.org/#literate) of *any*
// language listed in [languages.json](https://github.com/jashkenas/docco/blob/master/resources/languages.json) 
// is also supported — just tack an `.md` extension on the end:
// `.coffee.md`, `.py.md`, and so on.

// Partners in Crime:
// ------------------

// * If Node.js doesn't run on your platform, or you'd prefer a more
// convenient package, get [Ryan Tomayko](http://github.com/rtomayko)'s
// [Rocco](http://rtomayko.github.io/rocco/rocco.html), the **Ruby** port that's
// available as a gem.

// * If you're writing shell scripts, try
// [Shocco](http://rtomayko.github.io/shocco/), a port for the **POSIX shell**,
// also by Mr. Tomayko.

// * If **Python** is more your speed, take a look at
// [Nick Fitzgerald](http://github.com/fitzgen)'s [Pycco](https://pycco-docs.github.io/pycco/).

// * For **Clojure** fans, [Fogus](http://blog.fogus.me/)'s
// [Marginalia](http://fogus.me/fun/marginalia/) is a bit of a departure from
// "quick-and-dirty", but it'll get the job done.

// * There's a **Go** port called [Gocco](http://nikhilm.github.io/gocco/),
// written by [Nikhil Marathe](https://github.com/nikhilm).

// * For all you **PHP** buffs out there, Fredi Bach's
// [sourceMakeup](http://jquery-jkit.com/sourcemakeup/) (we'll let the faux pas
// with respect to our naming scheme slide), should do the trick nicely.

// * **Lua** enthusiasts can get their fix with
// [Robert Gieseke](https://github.com/rgieseke)'s [Locco](http://rgieseke.github.io/locco/).

// * And if you happen to be a **.NET**
// aficionado, check out [Don Wilson](https://github.com/dontangg)'s
// [Nocco](http://dontangg.github.io/nocco/).

// * Going further afield from the quick-and-dirty, [Groc](http://nevir.github.io/groc/)
// is a **CoffeeScript** fork of Docco that adds a searchable table of contents,
// and aims to gracefully handle large projects with complex hierarchies of code.

// Note that not all ports will support all Docco features ... yet.

// Main Documentation Generation Functions
// ---------------------------------------

// Generate the documentation for our configured source file by copying over static
// assets, reading all the source files in, splitting them up into prose+code
// sections, highlighting each file in the appropriate language, and printing them
// out in an HTML template.
var Docco, _, buildMatchers, commander, configure, defaults, document, format, fs, getLanguage, highlightjs, languages, marked, parse, path, run, version, write;

document = function(options = {}, callback) {
  var config;
  config = configure(options);
  return fs.mkdirs(config.output, function() {
    var complete, copyAsset, files, nextFile;
    callback || (callback = function(error) {
      if (error) {
        throw error;
      }
    });
    copyAsset = function(file, callback) {
      if (!fs.existsSync(file)) {
        return callback();
      }
      return fs.copy(file, path.join(config.output, path.basename(file)), callback);
    };
    complete = function() {
      return copyAsset(config.css, function(error) {
        if (error) {
          return callback(error);
        }
        if (fs.existsSync(config.public)) {
          return copyAsset(config.public, callback);
        }
        return callback();
      });
    };
    files = config.sources.slice();
    nextFile = function() {
      var source;
      source = files.shift();
      return fs.readFile(source, function(error, buffer) {
        var code, sections;
        if (error) {
          return callback(error);
        }
        code = buffer.toString();
        sections = parse(source, code, config);
        format(source, sections, config);
        write(source, sections, config);
        if (files.length) {
          return nextFile();
        } else {
          return complete();
        }
      });
    };
    return nextFile();
  });
};

// Given a string of source code, **parse** out each block of prose and the code that
// follows it — by detecting which is which, line by line — and then create an
// individual **section** for it. Each section is an object with `docsText` and
// `codeText` properties, and eventually `docsHtml` and `codeHtml` as well.
parse = function(source, code, config = {}) {
  var codeText, docsText, hasCode, i, isText, j, k, lang, len, len1, line, lines, match, maybeCode, save, sections;
  lines = code.split('\n');
  sections = [];
  lang = getLanguage(source, config);
  hasCode = docsText = codeText = '';
  save = function() {
    sections.push({docsText, codeText});
    return hasCode = docsText = codeText = '';
  };
  // Our quick-and-dirty implementation of the literate programming style. Simply
  // invert the prose and code relationship on a per-line basis, and then continue as
  // normal below.
  if (lang.literate) {
    isText = maybeCode = true;
    for (i = j = 0, len = lines.length; j < len; i = ++j) {
      line = lines[i];
      lines[i] = maybeCode && (match = /^([ ]{4}|[ ]{0,3}\t)/.exec(line)) ? (isText = false, line.slice(match[0].length)) : (maybeCode = /^\s*$/.test(line)) ? isText ? lang.symbol : '' : (isText = true, lang.symbol + ' ' + line);
    }
  }
  for (k = 0, len1 = lines.length; k < len1; k++) {
    line = lines[k];
    if (line.match(lang.commentMatcher) && !line.match(lang.commentFilter)) {
      if (hasCode) {
        save();
      }
      docsText += (line = line.replace(lang.commentMatcher, '')) + '\n';
      if (/^(---+|===+)$/.test(line)) {
        save();
      }
    } else {
      hasCode = true;
      codeText += line + '\n';
    }
  }
  save();
  return sections;
};

// To **format** and highlight the now-parsed sections of code, we use **Highlight.js**
// over stdio, and run the text of their corresponding comments through
// **Markdown**, using [Marked](https://github.com/chjj/marked).
format = function(source, sections, config) {
  var code, i, j, language, len, markedOptions, results, section;
  language = getLanguage(source, config);
  // Pass any user defined options to Marked if specified via command line option
  markedOptions = {
    smartypants: true
  };
  if (config.marked) {
    markedOptions = config.marked;
  }
  marked.setOptions(markedOptions);
  // Tell Marked how to highlight code blocks within comments, treating that code
  // as either the language specified in the code block or the language of the file
  // if not specified.
  marked.setOptions({
    highlight: function(code, lang) {
      lang || (lang = language.name);
      if (highlightjs.getLanguage(lang)) {
        return highlightjs.highlight(lang, code).value;
      } else {
        console.warn(`docco: couldn't highlight code block with unknown language '${lang}' in ${source}`);
        return code;
      }
    }
  });
  results = [];
  for (i = j = 0, len = sections.length; j < len; i = ++j) {
    section = sections[i];
    code = highlightjs.highlight(language.name, section.codeText).value;
    code = code.replace(/\s+$/, '');
    section.codeHtml = `<div class='highlight'><pre>${code}</pre></div>`;
    results.push(section.docsHtml = marked(section.docsText));
  }
  return results;
};

// Once all of the code has finished highlighting, we can **write** the resulting
// documentation file by passing the completed HTML sections into the template,
// and rendering it to the specified output path.
write = function(source, sections, config) {
  var css, destination, first, firstSection, hasTitle, html, relative, title;
  destination = function(file) {
    return path.join(config.output, path.dirname(file), path.basename(file, path.extname(file)) + '.html');
  };
  relative = function(file) {
    var from, to;
    to = path.dirname(path.resolve(file));
    from = path.dirname(path.resolve(destination(source)));
    return path.join(path.relative(from, to), path.basename(file));
  };
  // The **title** of the file is either the first heading in the prose, or the
  // name of the source file.
  firstSection = _.find(sections, function(section) {
    return section.docsText.length > 0;
  });
  if (firstSection) {
    first = marked.lexer(firstSection.docsText)[0];
  }
  hasTitle = first && first.type === 'heading' && first.depth === 1;
  title = hasTitle ? first.text : path.basename(source);
  css = relative(path.join(config.output, path.basename(config.css)));
  html = config.template({
    sources: config.sources,
    css,
    title,
    hasTitle,
    sections,
    path,
    destination,
    relative
  });
  console.log(`docco: ${source} -> ${destination(source)}`);
  return fs.outputFileSync(destination(source), html);
};

// Configuration
// -------------

// Default configuration **options**. All of these may be extended by
// user-specified options.
defaults = {
  layout: 'parallel',
  output: 'docs',
  template: null,
  css: null,
  extension: null,
  languages: {},
  marked: null
};

// **Configure** this particular run of Docco. We might use a passed-in external
// template, or one of the built-in **layouts**. We only attempt to process
// source files for languages for which we have definitions.
configure = function(options) {
  var config, dir;
  config = _.extend({}, defaults, _.pick(options, ..._.keys(defaults)));
  config.languages = buildMatchers(config.languages);
  // The user is able to override the layout file used with the `--template` parameter.
  // In this case, it is also neccessary to explicitly specify a stylesheet file.
  // These custom templates are compiled exactly like the predefined ones, but the `public` folder
  // is only copied for the latter.
  if (options.template) {
    if (!options.css) {
      console.warn("docco: no stylesheet file specified");
    }
    config.layout = null;
  } else {
    dir = config.layout = path.join(__dirname, 'resources', config.layout);
    if (fs.existsSync(path.join(dir, 'public'))) {
      config.public = path.join(dir, 'public');
    }
    config.template = path.join(dir, 'docco.jst');
    config.css = options.css || path.join(dir, 'docco.css');
  }
  config.template = _.template(fs.readFileSync(config.template).toString());
  if (options.marked) {
    config.marked = JSON.parse(fs.readFileSync(options.marked));
  }
  config.sources = options.args.filter(function(source) {
    var lang;
    lang = getLanguage(source, config);
    if (!lang) {
      console.warn(`docco: skipped unknown type (${path.basename(source)})`);
    }
    return lang;
  }).sort();
  return config;
};

// Helpers & Initial Setup
// -----------------------

// Require our external dependencies.
_ = require('underscore');

fs = require('fs-extra');

path = require('path');

marked = require('marked');

commander = require('commander');

highlightjs = require('highlight.js');

// Languages are stored in JSON in the file `resources/languages.json`.
// Each item maps the file extension to the name of the language and the
// `symbol` that indicates a line comment. To add support for a new programming
// language to Docco, just add it to the file.
languages = JSON.parse(fs.readFileSync(path.join(__dirname, 'resources', 'languages.json')));

// Build out the appropriate matchers and delimiters for each language.
buildMatchers = function(languages) {
  var ext, l;
  for (ext in languages) {
    l = languages[ext];
    // Does the line begin with a comment?
    l.commentMatcher = RegExp(`^\\s*${l.symbol}\\s?`);
    // Ignore [hashbangs](http://en.wikipedia.org/wiki/Shebang_%28Unix%29) and interpolations...
    l.commentFilter = /(^#![\/]|^\s*#\{)/;
  }
  return languages;
};

languages = buildMatchers(languages);

// A function to get the current language we're documenting, based on the
// file extension. Detect and tag "literate" `.ext.md` variants.
getLanguage = function(source, config) {
  var codeExt, codeLang, ext, lang, ref, ref1;
  ext = config.extension || path.extname(source) || path.basename(source);
  lang = ((ref = config.languages) != null ? ref[ext] : void 0) || languages[ext];
  if (lang && lang.name === 'markdown') {
    codeExt = path.extname(path.basename(source, ext));
    codeLang = ((ref1 = config.languages) != null ? ref1[codeExt] : void 0) || languages[codeExt];
    if (codeExt && codeLang) {
      lang = _.extend({}, codeLang, {
        literate: true
      });
    }
  }
  return lang;
};

// Keep it DRY. Extract the docco **version** from `package.json`
version = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'))).version;

// Command Line Interface
// ----------------------

// Finally, let's define the interface to run Docco from the command line.
// Parse options using [Commander](https://github.com/visionmedia/commander.js).
run = function(args = process.argv) {
  var c;
  c = defaults;
  commander.version(version).usage('[options] files').option('-L, --languages [file]', 'use a custom languages.json', _.compose(JSON.parse, fs.readFileSync)).option('-l, --layout [name]', 'choose a layout (parallel, linear or classic)', c.layout).option('-o, --output [path]', 'output to a given folder', c.output).option('-c, --css [file]', 'use a custom css file', c.css).option('-t, --template [file]', 'use a custom .jst template', c.template).option('-e, --extension [ext]', 'assume a file extension for all inputs', c.extension).option('-m, --marked [file]', 'use custom marked options', c.marked).parse(args).name = "docco";
  if (commander.args.length) {
    return document(commander);
  } else {
    return console.log(commander.helpInformation());
  }
};

// Public API
// ----------
Docco = module.exports = {run, document, parse, format, version};

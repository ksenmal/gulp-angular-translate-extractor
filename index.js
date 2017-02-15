/* inspired by grunt-angular-translate
* https://github.com/angular-translate/grunt-angular-translate - grunt plugin 
* Licensed under the MIT license.
*/
var through = require('through2'),
  gutil = require('gulp-util'),
  path = require('path'),
  _ = require('lodash'),
  fs = require('fs'),
  stringify = require('json-stable-stringify'),
  Translations = require('./lib/translations.js');

 
var _extractTranslation = function (regexName, regex, content, results) {
  var r;
  regex.lastIndex = 0;
  while ((r = regex.exec(content)) !== null) {
 
    // Result expected [STRING, KEY, SOME_REGEX_STUF]
    // Except for plural hack [STRING, KEY, ARRAY_IN_STRING]
    if (r.length >= 2) {
      var translationKey, evalString;
      var translationDefaultValue = "";
 
      switch (regexName) {
        case 'HtmlDirectivePluralFirst':
          var tmp = r[1];
          r[1] = r[2];
          r[2] = tmp;
        case 'HtmlDirectivePluralLast':
          evalString = eval(r[2]);
          if (_.isArray(evalString) && evalString.length >= 2) {
            translationDefaultValue = "{NB, plural, one{" + evalString[0] + "} other{" + evalString[1] + "}" + (evalString[2] ? ' ' + evalString[2] : '');
          }
          translationKey = r[1].trim();
          break;
        default:
          translationKey = r[1].trim();
      }
 
      // Avoid empty translation
      if (translationKey === "") {
        return;
      }
 
      switch (regexName) {
        case "commentSimpleQuote":
        case "HtmlFilterSimpleQuote":
        case "JavascriptServiceSimpleQuote":
        case "JavascriptServiceInstantSimpleQuote":
        case "JavascriptFilterSimpleQuote":
        case "HtmlNgBindHtml":
          translationKey = translationKey.replace(/\\\'/g, "'");
          break;
        case "commentDoubleQuote":
        case "HtmlFilterDoubleQuote":
        case "JavascriptServiceDoubleQuote":
        case "JavascriptServiceInstantDoubleQuote":
        case "JavascriptFilterDoubleQuote":
          translationKey = translationKey.replace(/\\\"/g, '"');
          break;
      }
      results[translationKey] = translationDefaultValue;
    }
  }
};
 
var escapeRegExp = function (str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var customStringify = function (val, stringifyOptions) {
  if (stringifyOptions) {
    return stringify(val, _.isObject(stringifyOptions) ? stringifyOptions : {
      space: '    ',
      cmp: function (a, b) {
        var lower = function (a) {
          return a.toLowerCase();
        };
        return lower(a.key) < lower(b.key) ? -1 : 1;
      }
    });
  }
  return JSON.stringify(val, null, 4);
};

var mergeTranslations = function (results, lang, options) {
    // Create translation object
    var _translation = new Translations({
        "safeMode": options.safeMode,
        "tree": options.tree,
        "nullEmpty": options.nullEmpty
      }, results),
      destFileName = options.dest + '/' + options.prefix + lang + options.suffix,
      isDefaultLang = (options.defaultLang === lang),
      translations = {},
      json = {},
      stats, statsString;

      try {
        var data = fs.readFileSync(destFileName);
        json = JSON.parse(data);
        translations = _translation.getMergedTranslations(Translations.flatten(json), isDefaultLang);
      }
      catch (err) {
        translations = _translation.getMergedTranslations({}, isDefaultLang);
      }
      stats = _translation.getStats();     
      statsString = lang + " statistics: " +
        " Updated: " + stats["updated"] +
        " / Deleted: " + stats["deleted"] +
        " / New: " + stats["new"];
      gutil.log(statsString);

    return translations;
};
 
function extract(options) {
  options = _.assign({
    startDelimiter: '{{',
    endDelimiter: '}}',
    defaultLang: 'en-US',
    lang: ['en-US', 'ru-RU'],
    dest: '.',
    prefix: '',
    suffix: '.json',
    stringifyOptions: false,
    safeMode: false,    //Translations options
    tree: false,
    nullEmpty: false
  }, options);

  var results = {}, firstFile, 
    regexs = {
      commentSimpleQuote: '\\/\\*\\s*i18nextract\\s*\\*\\/\'((?:\\\\.|[^\'\\\\])*)\'',
      commentDoubleQuote: '\\/\\*\\s*i18nextract\\s*\\*\\/"((?:\\\\.|[^"\\\\])*)"',
      HtmlFilterSimpleQuote: escapeRegExp(options.startDelimiter) + '\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(options.endDelimiter),
      HtmlFilterSimpleQuoteOnce: escapeRegExp(options.startDelimiter) + '::\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(options.endDelimiter),
      HtmlFilterSimpleQuoteValue: '\\(\'((?:\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*\\)',
      HtmlFilterDoubleQuote: escapeRegExp(options.startDelimiter) + '\\s*"((?:\\\\.|[^"\\\\\])*)"\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(options.endDelimiter),
      // HtmlDirective: '<[^>]*translate[^{>]*>([^<]*)<\/[^>]*>',
      HtmlDirectiveStandalone: 'translate="((?:\\\\.|[^"\\\\])*)"',
      HtmlDirectivePluralLast: 'translate="((?:\\\\.|[^"\\\\])*)".*angular-plural-extract="((?:\\\\.|[^"\\\\])*)"',
      HtmlDirectivePluralFirst: 'angular-plural-extract="((?:\\\\.|[^"\\\\])*)".*translate="((?:\\\\.|[^"\\\\])*)"',
      HtmlNgBindHtml: 'ng-bind-html="\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*"',
      JavascriptServiceSimpleQuote: '\\$translate\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptServiceDoubleQuote: '\\$translate\\(\\s*"((?:\\\\.|[^"\\\\])*)"[^\\)]*\\)',
      JavascriptServiceInstantSimpleQuote: '\\$translate\\.instant\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptServiceInstantDoubleQuote: '\\$translate\\.instant\\(\\s*"((?:\\\\.|[^"\\\\])*)"[^\\)]*\\)',
      JavascriptFilterSimpleQuote: '\\$filter\\(\\s*\'translate\'\\s*\\)\\s*\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptFilterDoubleQuote: '\\$filter\\(\\s*"translate"\\s*\\)\\s*\\(\\s*"((?:\\\\.|[^"\\\\\])*)"[^\\)]*\\)'
    };
 
 
  // gulp-related
  return through.obj(function (file, enc, cb) {
    if (file.isNull()) { // ignore empty files
      cb();
      return;
    }
    if (file.isStream()) {
      cb();
      return;
    }
    if (!firstFile) {
      firstFile = file;
    }
    var content = file.contents.toString(), _regex;
 
    for (var i in regexs) {
      _regex = new RegExp(regexs[i], "gi");
      switch (i) {
        // Case filter HTML simple/double quoted
        case "HtmlFilterSimpleQuote":
        case "HtmlFilterDoubleQuote":
        case "HtmlDirective":
        case "HtmlDirectivePluralLast":
        case "HtmlDirectivePluralFirst":
        case "JavascriptFilterSimpleQuote":
        case "JavascriptFilterDoubleQuote":
          // Match all occurences
          var matches = content.match(_regex);
          if (_.isArray(matches) && matches.length) {
            // Through each matches, we'll execute regex to get translation key
            for (var index in matches) {
              if (matches[index] !== "") {
                _extractTranslation(i, _regex, matches[index], results);
              }
            }
 
          }
          break;
        // Others regex
        default:
          _extractTranslation(i, _regex, content, results);
 
      }
    }
    cb();
  }, function (cb) {
    if (!firstFile) {
      cb();
      return;
    }
    var _this = this,
      translations = {},
      destFileName;
    options.lang.forEach(function (lang) {
      translations = mergeTranslations(results, lang, options);
      destFileName = options.prefix + lang + options.suffix;
      _this.push(new gutil.File({
        cwd: firstFile.cwd,
        base: firstFile.base,
        path: path.join(firstFile.base, destFileName),
        contents: new Buffer(customStringify(translations, options.stringifyOptions))
      }));
    });
    cb();
  });
}
 
module.exports = extract;

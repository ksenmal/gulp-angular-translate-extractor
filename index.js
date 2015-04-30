/* inspired by grunt-angular-translate
* https://github.com/angular-translate/grunt-angular-translate - grunt plugin
* Licensed under the MIT license.
*/
var through = require('through2'),
  gutil = require('gulp-util'),
  path = require('path'),
  _ = require('lodash'),
  stringify = require('json-stable-stringify'),
  translateExtractor = require('angular-translate-extractor');

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

function extract(options) {
  options = _.assign({
    startDelimiter: '{{',
    endDelimiter: '}}',
    defaultLang: 'en-US',
    lang: ['en-US', 'ru-RU'],
    dest: '.',
    customRegex: {},
    customTranslateMatch: 'translate',
    safeMode: false,
    stringifyOptions: false,
    logger: gutil
  }, options);

  var translateExtractorMethods = translateExtractor(options),
    extractor = translateExtractorMethods.extractor,
    mergeTranslations = translateExtractorMethods.mergeTranslations

  var firstFile,
    results = {};

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

    extractor(content, results)
    cb();
  }, function (cb) {
    if (!firstFile) {
      cb();
      return;
    }
    var _this = this;
    options.lang.forEach(function (lang) {
      var translations = mergeTranslations(results, lang, options);
      _this.push(new gutil.File({
        cwd: firstFile.cwd,
        base: firstFile.base,
        path: path.join(firstFile.base, lang + '.json'),
        contents: new Buffer(customStringify(translations, options.stringifyOptions))
      }));
    });
    cb();
  });
}

module.exports = extract;

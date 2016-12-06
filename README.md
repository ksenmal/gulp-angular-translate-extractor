# gulp-angular-translate-extractor
Gulp plugin extracts the translation keys for angular-translate.

# Install
via npm  
`npm install gulp-angular-translate-extractor`

# Important notice

This plugins supports extraction of attribute translations like `translate-attr="{attrname: 'translation_id'}"` with eval. Only use it on code you trust.

# Usage  
Example:
```
var extractTranslate = require('gulp-angular-translate-extractor');

gulp.task('taskName', function () {
  var i18nsrc = ['./index.html', './app.js'];  // your source files  
  var i18ndest = './src/assets/translations'; //destination directory
  return gulp.src(i18nsrc)
      .pipe(extractTranslate({
        defaultLang: 'en-US',         // default language
          lang: ['en-US', 'ru-RU'],   // array of languages
          dest: i18ndest,             // destination, default '.'
          prefix: 'prefix_',          // output filename prefix, default ''
          suffix: '.suffix',          // output filename suffix, default '.json'
          safeMode: false,            // do not delete old translations, true - contrariwise, default false
          stringifyOptions: true,     // force json to be sorted, false - contrariwise, default false
      }))
      .pipe(gulp.dest(i18ndest));
});
```
This task will parse your src files, extract all the translation keys and creares two files 'en-US.json' and 'ru-RU.json' in dest directory. For the default lang ('en_US.json') file will be formatted like:
```
{
    "1st Translation": "1st Translation",
    "2nd Translation": "2nd Translation",
    "3rd Translation": "3rd Translation",
    ...
}
```
For the non-default lang ('ru_RU.json') file will be formatted like:
```
{
    "1st Translation": "",
    "2nd Translation": "",
    "3rd Translation": "",
    ...
}
```

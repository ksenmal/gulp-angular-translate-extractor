# gulp-angular-translate-extractor
Gulp plugin extracts the translation keys for angular-translate.

# Install
via npm  
`npm install gulp-angular-translate-extractor`

# Usage  
Example:
```
var extractTranslate = require('gulp-angular-translate-extractor');

gulp.task('taskName', function () {
  var i18nsrc = '...'                 // your source files  
  var i18ndest = '...';               //destination directory
  return gulp.src(i18nsrc)
      .pipe(extractTranslate({
        defaultLang: 'en-US',         // default language
          lang: ['en-US', 'ru-RU'],   // array of languages
          dest: i18ndest,             // destination
          safeMode: false,            // do not delete old translations, true - contrariwise
          stringifyOptions: true,     // force json to be sorted, false - contrariwise
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

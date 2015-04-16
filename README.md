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

import gulp from 'gulp'
import postcss from 'gulp-postcss'

import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import postcssNested from 'postcss-nested'

gulp.task('postcss', () => {
	return gulp.src('src/css/index.css')
		.pipe(postcss([autoprefixer, postcssImport, postcssNested]))
		.pipe(gulp.dest('dist/'))
})

gulp.task('postcss:watch', () => {
	return gulp.watch('./src/css/**/*', gulp.parallel('postcss'))
})
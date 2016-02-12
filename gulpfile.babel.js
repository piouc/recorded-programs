import gulp from 'gulp'

import './gulp/tasks/postcss'
import './gulp/tasks/browserify'

gulp.task('default', gulp.parallel('browserify', 'postcss'))

gulp.task('watch',
	gulp.series(
		gulp.parallel('default', 'browserify:watch'),
		() => gulp.watch('./src/css/**/*', gulp.parallel('postcss'))
	)
)

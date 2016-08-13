import gulp from 'gulp'

import './gulp/tasks/static'
import './gulp/tasks/postcss'
import './gulp/tasks/browserify'

gulp.task('default', gulp.parallel('static', 'postcss', 'browserify'))

gulp.task('watch',
	gulp.series(
		'default',
		gulp.parallel(
			'static:watch',
			'postcss:watch',
			'browserify:watch'
		)
	)
)

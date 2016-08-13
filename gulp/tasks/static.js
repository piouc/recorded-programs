import gulp from 'gulp'
import {log, colors} from 'gulp-util'

import chokidar from 'chokidar'
import prettyTime from 'pretty-hrtime'

const src = 'src/static'
const dist = 'dist'

function copy(path){
	const start = process.hrtime()
	log(`Starting '${colors.cyan('copy')}' ...`)
	gulp.src(path, {base: src})
		.pipe(gulp.dest(dist))
		.on('end', () => log(`Finished '${colors.cyan('copy')}' after ${colors.magenta(prettyTime(process.hrtime(start)))}`))
}

gulp.task('static', () => {
	return gulp.src(`${src}/**/*`, {base: src})
		.pipe(gulp.dest(dist))
})

gulp.task('static:watch', () => {
	return chokidar.watch(`${src}/**/*`)
		.on('add', copy)
		.on('change', copy)
		.on('addDir', copy)
})
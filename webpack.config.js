const path = require('path')

module.exports = {
	mode: process.env.NODE_ENV || 'development',
	entry: {
		index: './src/js/index.ts'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: 'babel-loader'
			},
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							compilerOptions: {
								module: 'esNext'
							}
						}
					}
				],
			}
		]
	},
	resolve: {
		extensions: ['.js', '.ts', '.tsx']
	}
}
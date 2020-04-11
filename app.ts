import express, {Request, Response, NextFunction} from 'express'
import { createProxyMiddleware, Options } from 'http-proxy-middleware'
import createError from 'http-errors'
import morgan from 'morgan'

const app = express()

app.use(morgan('common'))

app.use('/api/*', createProxyMiddleware({target: process.env.CHINACHU_URL}))
app.use(express.static('dist'))

app.use((req, res, next) => {
  next(createError(404))
})

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const httpError = err instanceof createError.HttpError ? err : createError(500)
  res.status(httpError.status).send(`${httpError.status} ${httpError.message}`)
})

app.listen(Number(process.env.PORT || 80))
import express from 'express'
import usersRouter from '~/routes/users.routes'
import databaseService from '~/services/database.service'
import { defaultErrorHandler } from '~/middlewares/error.middleware'
import { initFolder } from './utils/file'
import mediasRouter from './routes/medias.route'
import staticRouter from './routes/static.routes'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import { config } from 'dotenv'
import tweetsRouter from './routes/tweets.route'
config()

databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexVideoStatus()
})

const app = express()
const port = 4000

initFolder()

app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/tweets', tweetsRouter)
// app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use('/static', staticRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

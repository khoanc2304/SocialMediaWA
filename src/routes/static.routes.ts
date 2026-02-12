import { wrapRequestHandler } from '~/utils/handlers'
import { Router } from 'express'
import { serveImageController, serveVideoStreamingController, serveM3u8Controller,  serveSegmentController } from '~/controllers/medias.controller'

const staticRouter = Router()

staticRouter.get('/image/:name', serveImageController)

// staticRouter.get('/video/:name', serveVideoController)
staticRouter.get('/video-stream/:name', serveVideoStreamingController)

staticRouter.get('/video-hls/:id/master.m3u8', serveM3u8Controller)

staticRouter.get('/video-hls/:id/:v/:segment', serveSegmentController)

export default staticRouter
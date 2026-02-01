import e, { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import mediaService from '~/services/media.service'
import fs from 'fs'
import mime from 'mime'
// console.log('Media controller loaded from', path.resolve('uploads'))

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadImage(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_IMAGE_SUCCESSFUL,
    result: url
  })
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadVideo(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_VIDEO_SUCCESSFUL,
    result: url
  })
}

export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadVideoHLS(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_VIDEO_HLS_SUCCESSFUL,
    result: url
  })
}

export const videoStatusController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const result = await mediaService.getVideoStatus(id as string)
  return res.json({
    message: USERS_MESSAGES.GET_VIDEO_STATUS_SUCCESSFUL,
    result: result
  })
}

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name + '.jpg'), (err) => {
    if (err) {
      if (res.headersSent) {
        return
      }
      return res.status((err as any).status || 404).send('Not found')
    }
  })
}

export const serveVideoStreamingController = async (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }
  const { name } = req.params
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name as string)

  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(HTTP_STATUS.NOT_FOUND).send('Video not found')
  }

  // dung luong video size (bytes)
  const videoSize = fs.statSync(videoPath).size
  // dung luong moi phan doan stream
  const chunkSize = 10 ** 6 // 1MB
  // get value tu range header (vd: bytes=1048576-)
  const start = Number(range.replace(/\D/g, ''))
  // get value byte end, vuot qua dung luong thi get video size - 1
  const end = Math.min(start + chunkSize, videoSize - 1)

  // dung luong thuc te cua phan doan video stream
  // thuong se la chunkSize, except doan cuoi cung
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}

export const serveM3u8Controller = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id as string, 'master.m3u8'), (err) => {
    if (err) {
      if (res.headersSent) {
        return
      }
      return res.status((err as any).status || 404).send('Not found')
    }
  })
}

export const serveSegmentController = async (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  // segment: 0.ts, 1.ts, ...
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id as string, v as string, segment as string), (err) => {
    if (err) {
      if (res.headersSent) {
        return
      }
      return res.status((err as any).status || 404).send('Not found')
    }
  })
}

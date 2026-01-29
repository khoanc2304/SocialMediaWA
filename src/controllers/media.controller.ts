import { handleUploadImage } from '~/utils/file'
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
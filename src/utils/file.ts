import fs from 'fs'
import path from 'path'
import { Request } from 'express'
import { File } from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // tao folder nested
      })
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    keepExtensions: true,
    maxFiles: 4,
    maxFileSize: 4000 * 1024, // 3MB
    maxTotalFileSize: 4000 * 1024 * 4, // 12MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('Invalid file type') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.image as File[])
    })
  })
}

export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const nanoId = (await import('nanoid')).nanoid
  const nameId = nanoId()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, nameId)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: path.resolve(folderPath),
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024, // 50MB
    maxTotalFileSize: 5 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('Invalid file type') as any)
      }
      return valid
    },
    filename: function () {
      return nameId
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
        video.filepath = video.filepath + '.' + ext
      })
      resolve(files.video as File[])
    })
  })
}

export const getNameFromFullNameFile = (fullName: string) => {
  const nameArr = fullName.split('.')
  nameArr.pop()
  return nameArr.join('')
}

export const getExtension = (fullName: string) => {
  const nameArr = fullName.split('.')
  return nameArr[nameArr.length - 1]
}

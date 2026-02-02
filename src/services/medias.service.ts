import { Request } from 'express'
import { getNameFromFullNameFile, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_IMAGE_TEMP_DIR } from '~/constants/dir'
import path from 'path'
import fs from 'fs'
import { config } from 'dotenv'
import { isProduction } from '~/constants/config'
import { EncodingStatus, MediaType } from '~/constants/enums'
import { Media } from '~/models/Others'
import databaseService from './database.service'
import VideoStatus from '~/models/schemas/videos.schema'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import fsPromise from 'fs/promises'
config()

class Queue {
  items: string[]
  encoding: boolean

  constructor() {
    this.items = []
    this.encoding = false
  }

  async enqueue(item: string) {
    this.items.push(item)
    const nameId = getNameFromFullNameFile(path.basename(item))
    console.log('Enqueue video for encoding HLS:', nameId)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: nameId,
        status: EncodingStatus.PENDING
      })
    )
    this.processQueue()
  }

  async processQueue() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const nameId = getNameFromFullNameFile(path.basename(videoPath))
      await databaseService.videoStatus.updateOne(
        {
          name: nameId
        },
        {
          $set: {
            status: EncodingStatus.PROCESSING
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        await fsPromise.unlink(videoPath) // Xoá file gốc sau khi đã encode HLS
        await databaseService.videoStatus.updateOne(
          {
            name: nameId
          },
          {
            $set: {
              status: EncodingStatus.SUCCESS
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`Encode video ${nameId} success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: nameId
            },
            {
              $set: {
                status: EncodingStatus.FAILED
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.error('Update video status to FAILED error', err)
          })
        console.error(`Encode video ${nameId} error`, error)
      }
      this.encoding = false
      this.processQueue()
    } else {
      console.log('Encode video queue is empty')
    }
  }
}

const queue = new Queue()
class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullNameFile(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath)
          .jpeg({
            quality: 60 // Có thể giảm xuống 60-70 để file nhỏ hơn
          })
          .toFile(newPath)
        fs.unlinkSync(file.filepath) // Xoá file tạm trong thư mục temp
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: MediaType.IMAGE
        }
      })
    )
    return result
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = files.map((file) => {
      return {
        url: isProduction
          ? `${process.env.HOST}/static/video/${file.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        type: MediaType.VIDEO
      }
    })
    return result
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullNameFile(file.newFilename)
        queue.enqueue(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${newName}.m3u8`
            : `http://localhost:${process.env.PORT}/static/video-hls/${newName}.m3u8`,
          type: MediaType.HLS
        }
      })
    )
    return result
  }

  async getVideoStatus(id: string) {
    const data = await databaseService.videoStatus.findOne({ name: id })
    return data
  }
}

const mediaService = new MediaService()
export default mediaService

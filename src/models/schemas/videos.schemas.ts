import { ObjectId } from 'mongodb'
import { EncodingStatus } from '~/constants/enums'

interface VideoStatusType {
  _id?: ObjectId
  status?: EncodingStatus
  name?: string
  message?: string
  created_at?: Date
  updated_at?: Date
}
export default class VideoStatus {
  _id?: ObjectId
  status?: EncodingStatus
  name?: string
  message?: string
  created_at?: Date
  updated_at?: Date

  constructor({ name, status, message, created_at, updated_at, _id }: VideoStatusType) {
    const date = new Date()
    this._id = _id
    this.status = status
    this.name = name
    this.message = message || ''
    this.created_at = created_at || date
    this.updated_at = updated_at || date
  }
}

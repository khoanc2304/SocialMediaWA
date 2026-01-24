import { Request} from 'express'
import { User } from '~/models/schemas/user.schema'
import { TokenPayload } from './models/requests/user.requests'

declare module 'express' {
  export interface Request {
    user?: User
    decoded_auth?: TokenPayload
    decored_refresh_token?: TokenPayload
  }
}

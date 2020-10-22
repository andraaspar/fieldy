import { MessageLevel } from './MessageLevel'

export interface Message {
	id: string
	level: MessageLevel
	message: string
}

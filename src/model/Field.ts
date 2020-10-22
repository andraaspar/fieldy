import { Format } from './Format'
import { Message } from './Message'
import { NumberType } from './NumberType'

export interface Field {
	id: string
	name: string
	expression: string
	value: string
	format: Format
	numberType: NumberType
	error?: boolean
	messages?: Message[]
	hasDecimalValue?: boolean
	hasFractionValue?: boolean
	hasNumberValue?: boolean
}

import { Decimal } from 'decimal.js'
import Fraction from 'fraction.js'
import { isFunction, isNumber } from 'lodash'
import { all, create } from 'mathjs'
import { v4 } from 'uuid'
import { Format } from '../model/Format'
import { Message } from '../model/Message'
import { MessageLevel } from '../model/MessageLevel'
import { NumberType } from '../model/NumberType'
import { FieldsStore } from '../store/FieldsStore'

type TScope = Record<string | number | symbol, unknown>

const PRECISION = 64
const EPSILON = 0.0000000001

const mathNumber = create(all, {
	precision: PRECISION,
	epsilon: EPSILON,
})
const mathDecimal = create(all, {
	number: 'BigNumber',
	precision: PRECISION,
	epsilon: EPSILON,
})
const mathFraction = create(all, {
	number: 'Fraction',
	precision: PRECISION,
	epsilon: EPSILON,
})
let messages: Message[] = []
for (const math of [mathNumber, mathDecimal, mathFraction]) {
	const t = math.typed as any
	t.conversions.unshift({
		from: 'Fraction',
		to: 'BigNumber',
		// eslint-disable-next-line
		convert(f: Fraction) {
			return fractionToDecimal(f)
		},
	})
	t.conversions.unshift({
		from: 'BigNumber',
		to: 'Fraction',
		// eslint-disable-next-line
		convert(d: Decimal) {
			return decimalToFraction(d)
		},
	})
	t.conversions.unshift({
		from: 'number',
		to: 'Fraction',
		// eslint-disable-next-line
		convert(n: number) {
			return numberToFraction(n)
		},
	})
	t.conversions.unshift({
		from: 'number',
		to: 'BigNumber',
		// eslint-disable-next-line
		convert(n: number) {
			return numberToDecimal(n)
		},
	})
	// t.conversions.unshift({
	// 	from: 'BigNumber',
	// 	to: 'number',
	// 	// eslint-disable-next-line
	// 	convert(d: Decimal) {
	// 		return decimalToNumber(d)
	// 	},
	// })
	// t.conversions.unshift({
	// 	from: 'Fraction',
	// 	to: 'number',
	// 	// eslint-disable-next-line
	// 	convert(f: Fraction) {
	// 		return fractionToNumber(f)
	// 	},
	// })
}

export function evaluateFields() {
	FieldsStore.update((s) => {
		const scope: TScope = {}
		for (const fieldId of s.fieldsOrder) {
			const field = s.fieldsById[fieldId]
			try {
				messages = []
				field.hasDecimalValue = false
				field.hasFractionValue = false
				field.hasNumberValue = false
				const name = field.name || field.id
				if (name in scope) {
					throw new Error(`Duplicate name: ${name}`)
				}
				if (field.expression) {
					const tempScope: TScope = { ...scope }
					const scopeProxy = new Proxy(tempScope, proxyHandler)
					const node = (field.numberType === NumberType.DECIMAL
						? mathDecimal
						: field.numberType === NumberType.FRACTION
						? mathFraction
						: mathNumber
					).parse?.(field.expression)
					if (node) {
						const constantNodes = node.filter((node) => node.isConstantNode)
						for (const constantNode of constantNodes) {
							if (isNumber(constantNode.value)) {
								field.hasNumberValue = true
							} else if (constantNode.value instanceof Decimal) {
								field.hasDecimalValue = true
							} else if (constantNode.value instanceof Fraction) {
								field.hasFractionValue = true
							}
						}
						const symbolNodes = node.filter((node) => node.isSymbolNode)
						for (const symbolNode of symbolNodes) {
							if (symbolNode.name === 'number') {
								field.hasNumberValue = true
							} else if (symbolNode.name === 'bignumber') {
								field.hasDecimalValue = true
							} else if (symbolNode.name === 'fraction') {
								field.hasFractionValue = true
							}
						}
						scope[name] = node.evaluate(scopeProxy)
					} else {
						scope[name] = 0
					}
				} else {
					scope[name] = 0
				}
				const value = scope[name]
				if (isFunction(value)) {
					field.value = `𝑓(${field.expression
						.replace(/.*\((.*?)\).+/m, '$1')
						.replace(/,\s*/g, ', ')})`
				} else if (value instanceof Fraction) {
					switch (field.format) {
						case Format.FRACTION:
							field.value = value.toFraction()
							break
						case Format.FRACTION_WITH_WHOLE:
							field.value = value.toFraction(true)
							break
						case Format.PERCENT:
							field.value = `${value.mul(100).round().valueOf()}%`
							break
						case Format.DECIMAL_WITH_REPEAT:
							field.value = value.toString()
							break
						case Format.DECIMAL:
						default:
							field.value = mathDecimal.format!(fractionToDecimal(value), {
								notation: 'fixed',
							})
							break
					}
				} else if (value instanceof Decimal) {
					switch (field.format) {
						case Format.FRACTION: {
							field.value = decimalToFraction(value).toFraction()
							break
						}
						case Format.FRACTION_WITH_WHOLE: {
							field.value = decimalToFraction(value).toFraction(true)
							break
						}
						case Format.PERCENT: {
							field.value = `${value.mul(100).round().valueOf()}%`
							break
						}
						case Format.DECIMAL_WITH_REPEAT: {
							field.value = decimalToFraction(value).toString()
							break
						}
						case Format.DECIMAL:
						default: {
							field.value = mathDecimal.format!(value, { notation: 'fixed' })
							break
						}
					}
				} else if (isNumber(value)) {
					switch (field.format) {
						case Format.FRACTION:
							field.value = new Fraction(value).simplify().toFraction()
							break
						case Format.FRACTION_WITH_WHOLE:
							field.value = new Fraction(value).simplify().toFraction(true)
							break
						case Format.PERCENT:
							field.value = `${Math.round(value * 100)}%`
							break
						case Format.DECIMAL_WITH_REPEAT:
							field.value = new Fraction(value).simplify().toString()
							break
						case Format.DECIMAL:
						default:
							field.value = value + ''
							break
					}
				} else {
					field.value = mathDecimal.format!(value)
				}
				delete field.error
			} catch (e) {
				field.value = ''
				field.error = true
				messages.push({
					id: v4(),
					level: MessageLevel.ERROR,
					message: (e + '').replace(/^(?:Type|Syntax)?Error:\s*/gi, ''),
				})
				// console.error(e)
			}
			field.messages = messages.length ? messages : undefined
		}
	})
}

const proxyHandler: ProxyHandler<TScope> = {
	set(target, name, newValue, receiver) {
		if (!(name in target)) return Reflect.set(target, name, newValue, receiver)
		const oldValue = target[name as any]
		if (oldValue === newValue) return true
		throw new Error(
			`Cannot redefine constant: ${typeof name === 'symbol' ? 'symbol' : name}`,
		)
	},
	deleteProperty(target, name) {
		if (!(name in target)) return true
		throw new Error(
			`Cannot delete constant: ${typeof name === 'symbol' ? 'symbol' : name}`,
		)
	},
}

function fractionToDecimal(f: Fraction): Decimal {
	messages.push({
		id: v4(),
		level: MessageLevel.WARNING,
		message: `Fraction → BigNumber conversion: potential loss of precision.`,
	})
	return mathDecimal.bignumber!(f)
}

function decimalToFraction(decimal: Decimal): Fraction {
	messages.push({
		id: v4(),
		level: MessageLevel.WARNING,
		message: `BigNumber → Fraction conversion: potential loss of precision.`,
	})
	return new Fraction(decimal.toNumber()).simplify()
}

function numberToDecimal(n: number): Decimal {
	messages.push({
		id: v4(),
		level: MessageLevel.WARNING,
		message: `Number → BigNumber conversion: potential loss of precision.`,
	})
	return new Decimal(n)
}

function numberToFraction(n: number): Fraction {
	messages.push({
		id: v4(),
		level: MessageLevel.WARNING,
		message: `Number → Fraction conversion: potential loss of precision.`,
	})
	return new Fraction(n)
}

// eslint-disable-next-line
function decimalToNumber(d: Decimal): number {
	messages.push({
		id: v4(),
		level: MessageLevel.WARNING,
		message: `Decimal → Number conversion: potential loss of precision.`,
	})
	return d.toNumber()
}

// eslint-disable-next-line
function fractionToNumber(f: Fraction): number {
	messages.push({
		id: v4(),
		level: MessageLevel.WARNING,
		message: `Fraction → Number conversion: potential loss of precision.`,
	})
	return f.valueOf()
}

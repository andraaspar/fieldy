import { v4 } from 'uuid'
import { Format } from '../model/Format'
import { inputAreaFocus, InputAreaFocusTarget } from '../model/inputAreaFocus'
import { NumberType } from '../model/NumberType'
import { FieldsStore } from '../store/FieldsStore'
import { evaluateFields } from './evaluateFields'

export function makeNewField() {
	FieldsStore.update((s, o) => {
		let format = Format.DECIMAL
		let numberType = NumberType.DECIMAL
		if (o.selectedFieldId) {
			const field = o.fieldsById[o.selectedFieldId]
			format = field.format
			numberType = field.numberType
		}
		const id = `field_${v4().replace(/-/g, '_')}`
		s.fieldsOrder.push(id)
		s.fieldsById[id] = {
			id: id,
			name: `r${s.nextFieldIndex++}`,
			value: '',
			expression: '',
			format: format,
			numberType: numberType,
		}
		s.selectedFieldId = id
	})
	evaluateFields()
	requestAnimationFrame(() => {
		inputAreaFocus?.(InputAreaFocusTarget.NAME)
	})
}

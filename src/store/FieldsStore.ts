import { Store } from 'pullstate'
import { Field } from '../model/Field'

export interface IFieldsStore {
	fieldsById: { [k: string]: Field }
	fieldsOrder: string[]
	selectedFieldId: string | undefined
	nextFieldIndex: number
}

export const FieldsStore = new Store<IFieldsStore>(
	loadFromHash() || {
		nextFieldIndex: 1,
		fieldsById: {},
		fieldsOrder: [],
		selectedFieldId: undefined,
	},
)

function loadFromHash(): IFieldsStore | null {
	try {
		return JSON.parse(decodeURIComponent(window.location.hash.slice(1)))
	} catch (e) {
		return null
	}
}

FieldsStore.subscribe(
	(s) => s,
	(s) => {
		window.history.replaceState(
			undefined,
			'',
			`#${encodeURIComponent(JSON.stringify(s))}`,
		)
	},
)

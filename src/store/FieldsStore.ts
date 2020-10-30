import { jsonFromUri, jsonToUri } from 'illa/JsonUtil'
import { Store } from 'pullstate'
import { Field } from '../model/Field'

export interface IFieldsStore {
	fieldsById: { [k: string]: Field }
	fieldsOrder: string[]
	selectedFieldId: string | undefined
	nextFieldIndex: number
}

export const FieldsStore = new Store<IFieldsStore>(loadFromHash())

function makeDefaultValue(): IFieldsStore {
	return {
		nextFieldIndex: 1,
		fieldsById: {},
		fieldsOrder: [],
		selectedFieldId: undefined,
	}
}

function loadFromHash(): IFieldsStore {
	try {
		return jsonFromUri(window.location.hash.slice(1)) || makeDefaultValue()
	} catch (e) {
		return makeDefaultValue()
	}
}

FieldsStore.subscribe(
	(s) => s,
	(s) => {
		window.history.replaceState(undefined, '', `#${jsonToUri(s)}`)
	},
)

window.addEventListener('hashchange', (e) => {
	FieldsStore.update(() => loadFromHash())
})

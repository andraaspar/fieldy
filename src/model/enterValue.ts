export let enterValue: ((v: string) => void) | null = null

export function setEnterValue(fn: ((v: string) => void) | null) {
	enterValue = fn
}

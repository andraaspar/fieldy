export enum InputAreaFocusTarget {
	NAME,
	EXP,
}

export type TInputAreaFocus = null | ((t: InputAreaFocusTarget) => void)

export let inputAreaFocus: TInputAreaFocus = null

export function setInputAreaFocus(v: TInputAreaFocus) {
	inputAreaFocus = v
}

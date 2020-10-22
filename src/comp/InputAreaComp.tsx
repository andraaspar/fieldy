import { css, cx } from 'emotion/macro'
import React, { RefObject, useLayoutEffect, useRef } from 'react'
import { evaluateFields } from '../fun/evaluateFields'
import { makeNewField } from '../fun/makeNewField'
import { setEnterValue } from '../model/enterValue'
import { Field } from '../model/Field'
import { Format } from '../model/Format'
import {
	InputAreaFocusTarget,
	setInputAreaFocus,
} from '../model/inputAreaFocus'
import { NumberType } from '../model/NumberType'
import { FieldsStore } from '../store/FieldsStore'
import { colAutoCss } from '../style/class/colCss'
import { rowAutoWrapCss } from '../style/class/rowCss'
import { FontSizeTiny, White6 } from '../style/styleConstants'

export interface InputAreaCompProps {}

export function InputAreaComp(props: InputAreaCompProps) {
	const nameFieldRef = useRef<HTMLInputElement>(null)
	const expFieldRef = useRef<HTMLInputElement>(null)
	const selectedFieldId = FieldsStore.useState((s) => s.selectedFieldId)
	const field = FieldsStore.useState(
		(s) => (selectedFieldId ? s.fieldsById[selectedFieldId] : undefined),
		[selectedFieldId],
	)
	function updateField<K extends keyof Field, V extends Field[K]>(
		key: K,
		value: V,
	) {
		if (selectedFieldId) {
			FieldsStore.update((s) => {
				const field = s.fieldsById[selectedFieldId]
				if (field) {
					field[key] = value
				}
			})
			evaluateFields()
		}
	}
	useLayoutEffect(() => {
		setInputAreaFocus(focus.bind(null, nameFieldRef, expFieldRef))
		return () => {
			setInputAreaFocus(null)
		}
	}, [])
	return (
		<div className={inputAreaCss}>
			<div className={labeledControlCss}>
				<div className={labelCss}>Name:</div>
				<input
					ref={nameFieldRef}
					disabled={field == null}
					className={nameFieldCss}
					value={field?.name ?? ''}
					onChange={(e) => {
						updateField(
							'name',
							e.currentTarget.value.replace(
								/[-+*\\/\s'"`%!=^(),.;?:[\]{}$#&@<>|~]/g,
								'_',
							),
						)
					}}
				/>
			</div>
			<div className={cx(labeledControlCss, expLabeledCss)}>
				<div className={labelCss}>Value:</div>
				<input
					ref={expFieldRef}
					disabled={field == null}
					className={expFieldCss}
					value={field?.expression ?? ''}
					onChange={(e) => {
						updateField('expression', e.currentTarget.value)
					}}
					onFocus={(e) => {
						setTimeout(() => {
							setEnterValue(enterValue.bind(null, expFieldRef))
						}, 1000)
					}}
					onBlur={(e) => {
						setTimeout(() => {
							setEnterValue(null)
						}, 1000)
					}}
					onKeyUp={(e) => {
						if (
							e.key === ')' &&
							hasLessOpeningBrackets(e.currentTarget.value)
						) {
							e.currentTarget.value = '(' + e.currentTarget.value
						} else if (e.key === 'Enter') {
							makeNewField()
						}
					}}
				/>
			</div>
			<div className={labeledControlCss}>
				<div className={labelCss}>Number type:</div>
				<select
					disabled={field == null}
					value={field?.numberType ?? NumberType.DECIMAL}
					onChange={(e) => {
						updateField('numberType', parseInt(e.currentTarget.value, 10))
					}}
				>
					<option value={NumberType.DECIMAL}>BigNumber</option>
					<option value={NumberType.FRACTION}>Fraction</option>
					<option value={NumberType.NUMBER}>Number</option>
				</select>
			</div>
			<div className={labeledControlCss}>
				<div className={labelCss}>Format:</div>
				<select
					disabled={field == null}
					value={field?.format ?? Format.DECIMAL}
					onChange={(e) => {
						updateField('format', parseInt(e.currentTarget.value, 10))
					}}
				>
					<option value={Format.DECIMAL}>0.0</option>
					<option value={Format.DECIMAL_WITH_REPEAT}>0.(0)</option>
					<option value={Format.FRACTION}>0/0</option>
					<option value={Format.FRACTION_WITH_WHOLE}>0 0/0</option>
					<option value={Format.PERCENT}>0%</option>
				</select>
			</div>
		</div>
	)
}

const inputAreaCss = cx(
	rowAutoWrapCss,
	css({
		padding: `1rem`,
		gap: `0.5rem`,
	}),
)

const nameFieldCss = css({
	fontFamily: 'monospace',
	overflow: 'hidden',
	maxWidth: `18rem`,
	textAlign: 'right',
})

const expLabeledCss = css({
	overflow: 'hidden',
	flex: '1',
	minWidth: 'min(100%, max(18rem, 33%))',
})

const expFieldCss = css({
	fontFamily: 'monospace',
	overflow: 'hidden',
	flex: '1',
})

const labeledControlCss = cx(
	colAutoCss,
	css({
		gap: `1px`,
	}),
)

const labelCss = css({
	fontSize: FontSizeTiny,
	color: White6,
})

function enterValue(expFieldRef: RefObject<HTMLInputElement>, v: string) {
	FieldsStore.update((s, o) => {
		if (expFieldRef.current && o.selectedFieldId) {
			const field = s.fieldsById[o.selectedFieldId]
			if (field) {
				const start = expFieldRef.current.selectionStart ?? 0
				const end = expFieldRef.current.selectionEnd ?? 0
				let value = expFieldRef.current.value
				value = value.slice(0, start) + v + value.slice(end)
				expFieldRef.current.value = value
				expFieldRef.current.focus()
				expFieldRef.current.setSelectionRange(
					start + v.length,
					start + v.length,
				)
				field.expression = value
			}
		}
	})
	evaluateFields()
}

function focus(
	nameFieldRef: RefObject<HTMLInputElement>,
	expFieldRef: RefObject<HTMLInputElement>,
	target: InputAreaFocusTarget,
) {
	switch (target) {
		case InputAreaFocusTarget.NAME:
			if (nameFieldRef.current) {
				nameFieldRef.current.focus()
				nameFieldRef.current.setSelectionRange(
					0,
					nameFieldRef.current.value.length,
				)
			}
			break
		case InputAreaFocusTarget.EXP:
			if (expFieldRef.current) {
				expFieldRef.current.focus()
				expFieldRef.current.setSelectionRange(
					0,
					expFieldRef.current.value.length,
				)
			}
			break
	}
}

function hasLessOpeningBrackets(s: string) {
	const openingCount = (s.match(/\(/g) || []).length
	const closingCount = (s.match(/\)/g) || []).length
	return openingCount < closingCount
}

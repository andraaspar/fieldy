import { css, cx } from 'emotion/macro'
import React from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { evaluateFields } from '../fun/evaluateFields'
import { enterValue } from '../model/enterValue'
import { ICON_SVG } from '../model/ICON_SVG'
import { inputAreaFocus, InputAreaFocusTarget } from '../model/inputAreaFocus'
import { MessageLevel } from '../model/MessageLevel'
import { FieldsStore } from '../store/FieldsStore'
import { rowAutoWrapCss } from '../style/class/rowCss'
import { Radius, White1, White4 } from '../style/styleConstants'
import { IconComp } from './IconComp'

export interface FieldCompProps {
	_fieldId: string
	_index: number
}

export function FieldComp(props: FieldCompProps) {
	const selectedFieldId = FieldsStore.useState((s) => s.selectedFieldId)
	const field = FieldsStore.useState((s) => s.fieldsById[props._fieldId])
	const name = field.name || field.id
	return (
		<Draggable draggableId={field.id} index={props._index}>
			{(provided, snapshot) => (
				<div
					ref={provided.innerRef}
					{...provided.draggableProps}
					className={cx(
						fieldCss,
						selectedFieldId === props._fieldId && fieldSelectedCss,
					)}
				>
					<div {...provided.dragHandleProps}>
						<IconComp _icon={ICON_SVG.grip} />
					</div>
					<button
						className={fieldNameCss}
						onClick={(e) => {
							if (enterValue && e.ctrlKey) {
								enterValue(name)
							} else {
								FieldsStore.update((s, o) => {
									s.selectedFieldId = props._fieldId
								})
								requestAnimationFrame(() => {
									inputAreaFocus?.(InputAreaFocusTarget.NAME)
								})
							}
						}}
					>
						{name}
					</button>{' '}
					={' '}
					<button
						className={valueCss}
						onClick={() => {
							FieldsStore.update((s, o) => {
								s.selectedFieldId = props._fieldId
							})
							requestAnimationFrame(() => {
								inputAreaFocus?.(InputAreaFocusTarget.EXP)
							})
						}}
					>
						{field.error ? 'ERROR' : field.value + '' || '–'}
					</button>
					<button
						onClick={() => {
							navigator.clipboard.writeText(field.value + '')
						}}
					>
						<IconComp _icon={ICON_SVG.copy} />
					</button>
					{field.hasDecimalValue && (
						<IconComp _icon={ICON_SVG.decimal} _title='Declares a BigNumber.' />
					)}
					{field.hasFractionValue && (
						<IconComp _icon={ICON_SVG.fraction} _title='Declares a Fraction.' />
					)}
					{field.hasNumberValue && (
						<IconComp _icon={ICON_SVG.number} _title='Declares a Number.' />
					)}
					{field.messages &&
						field.messages.map((message) => (
							<IconComp
								key={message.id}
								_icon={
									message.level === MessageLevel.ERROR
										? ICON_SVG.error
										: message.level === MessageLevel.WARNING
										? ICON_SVG.warning
										: ICON_SVG.info
								}
								_title={message.message}
								_className={
									message.level === MessageLevel.ERROR
										? errorCss
										: message.level === MessageLevel.WARNING
										? warningCss
										: undefined
								}
							/>
						))}
					<button
						style={{ marginLeft: 'auto' }}
						onClick={() => {
							FieldsStore.update((s, o) => {
								s.selectedFieldId = undefined
								delete s.fieldsById[field.id]
								const index = o.fieldsOrder.indexOf(field.id)
								if (index >= 0) s.fieldsOrder.splice(index, 1)
							})
							evaluateFields()
						}}
					>
						<IconComp _icon={ICON_SVG.delete} />
					</button>
				</div>
			)}
		</Draggable>
	)
}

const fieldCss = cx(
	rowAutoWrapCss,
	css({
		flex: 'none',
		borderRadius: `calc(${Radius} + 0.5rem)`,
		border: `1px solid ${White4}`,
		padding: `0.5rem`,
		gap: '0.5rem',
		alignItems: 'center',
	}),
)

const fieldSelectedCss = css({
	backgroundColor: White1,
})

const fieldNameCss = css({
	fontFamily: 'monospace',
	color: 'white',
	textAlign: 'left',
})

const valueCss = css({
	fontFamily: 'monospace',
	fontWeight: 'bold',
	color: 'white',
	textAlign: 'left',
})

const warningCss = css({
	color: 'peachpuff',
})

const errorCss = css({
	color: 'hotpink',
})

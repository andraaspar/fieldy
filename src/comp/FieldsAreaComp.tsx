import React, { useCallback, useState } from 'react'
import {
	DragDropContext,
	Droppable,
	OnDragEndResponder,
} from 'react-beautiful-dnd'
import { v4 } from 'uuid'
import { evaluateFields } from '../fun/evaluateFields'
import { makeNewField } from '../fun/makeNewField'
import { ICON_SVG } from '../model/ICON_SVG'
import { FieldsStore } from '../store/FieldsStore'
import { FieldComp } from './FieldComp'
import { IconComp } from './IconComp'

export interface FieldsAreaCompProps {}

export function FieldsAreaComp(props: FieldsAreaCompProps) {
	const [$id] = useState(() => v4())
	const fieldIds = FieldsStore.useState((s) => s.fieldsOrder)
	const onDragEnd = useCallback<OnDragEndResponder>((result) => {
		const oldIndex = result.source.index
		const newIndex = result.destination?.index
		if (newIndex != null) {
			FieldsStore.update((s, o) => {
				const item = s.fieldsOrder[oldIndex]
				if (item) {
					s.fieldsOrder.splice(oldIndex, 1)
					s.fieldsOrder.splice(newIndex, 0, item)
				}
			})
			evaluateFields()
		}
	}, [])
	return (
		<div className='p-col-auto' style={{ flex: `0px` }}>
			<div className='p-col-auto' style={{ padding: `1rem`, gap: `0.5rem` }}>
				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId={$id}>
						{(provided, snapshot) => (
							<div
								ref={provided.innerRef}
								className='p-col'
								style={{ gap: `0.5rem` }}
								// style={{ backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey' }}
								{...provided.droppableProps}
							>
								{fieldIds.map((fieldId, index) => (
									<FieldComp key={fieldId} _fieldId={fieldId} _index={index} />
								))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				</DragDropContext>
				<button onClick={makeNewField}>
					<IconComp _icon={ICON_SVG.add} />
				</button>
			</div>
		</div>
	)
}

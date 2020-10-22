import React from 'react'
import { FieldsAreaComp } from './FieldsAreaComp'
import { InputAreaComp } from './InputAreaComp'

export interface AppCompProps {}

export function AppComp(props: AppCompProps) {
	return (
		<div
			className='p-col-auto'
			style={{
				gap: `1px`,
				width: `100%`,
				height: `100%`,
			}}
		>
			<FieldsAreaComp />
			<InputAreaComp />
		</div>
	)
}

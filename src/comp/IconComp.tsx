import { css, cx } from 'emotion/macro'
import React, { FunctionComponent } from 'react'

export interface IconCompProps {
	_icon: FunctionComponent
	_title?: string
	_className?: string
}

export function IconComp(props: IconCompProps) {
	return (
		<i className={cx(iconCss, props._className)} title={props._title}>
			<props._icon />
		</i>
	)
}

const iconCss = css({
	display: 'inline-block',
	verticalAlign: `-3px`,
	width: '16px',
	height: '16px',

	svg: {
		fill: 'currentColor',
	},
})

import 'normalize.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { AppComp } from './comp/AppComp'
import * as serviceWorker from './serviceWorker'
import './style/index.css'

ReactDOM.render(
	<React.StrictMode>
		<AppComp />
	</React.StrictMode>,
	document.getElementById('root'),
)

serviceWorker.register()

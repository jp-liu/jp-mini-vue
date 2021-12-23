import App from './app.js'
import { createApp } from '../../lib/jp-liu-mini-vue.esm.js'

const rootContainer = document.getElementById('app')
const app = createApp(App).mount(rootContainer)

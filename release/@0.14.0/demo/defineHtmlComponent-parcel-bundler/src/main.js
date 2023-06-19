// import Clean.js
import {LE_InitWebApp, RenderApp} from 'cle.js/lib'

import { Homepage } from './app/pages/home.page.deps'

import csz from 'csz'

// fix csz to not use template literal
window.css = (v)=>csz([v]) 


// render app
LE_InitWebApp(async ()=>{ RenderApp(document.body, await Homepage() ) })

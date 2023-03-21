import { cle, RenderApp, remoteHtmlComponent } from "../../lib/caged-le.js"
import {default as csz} from 'https://unpkg.com/csz'

// setup csz lib 
window.css = (v)=>csz([v]) // fix to not use template literal

window.baseHref = "/src/demo/svelte-style" // tmp hack for this repo. in prod use absolute "/components/.."


  
RenderApp(document.body, cle.root({

  rootProp: 123,

},

  await remoteHtmlComponent(baseHref+"/components/demo", { component: "comp1", params: {hello: "world"}, state: {statevar: "private state namespace.."}, cache: true} ), // cache is default

))

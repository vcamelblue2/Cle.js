import { cle, RenderApp, remoteHtmlComponent } from "../../lib/caged-le.js"
import {default as csz} from 'https://unpkg.com/csz'

// setup csz lib 
window.css = (v)=>csz([v]) // fix to not use template literal

// tmp hack for this repo. in prod use absolute "/components/.." or window.localImport provided in index.html
window.baseHref = "/src/demo/svelte-style" 

// simulate inject component as deps
const InjectedComponentFromExternal = { div: { text: "Hello from DepsInj component!"}}


RenderApp(document.body, cle.root({

  rootProp: 123,

},

  await remoteHtmlComponent(baseHref+"/components/demo", { component: "comp1", params: {hello: "world"}, state: {statevar: "private state namespace.."}, DepsInj: {InjectedComponentFromExternal}, cache: true} ), // cache is default

))

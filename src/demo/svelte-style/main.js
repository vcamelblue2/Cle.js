import { cle, LE_InitWebApp, RenderApp, remoteHtmlComponent } from "../../lib/caged-le.js"

window.baseHref = "/src/demo/svelte-style" // tmp hack for this repo. in prod use absolute "/components/.."


LE_InitWebApp(async ()=>{ RenderApp(document.body, cle.root({

    rootProp: 123,

  },

    await remoteHtmlComponent(baseHref+"/components/demo", { component: "comp1", params: {hello: "world"}, state: {statevar: "private state namespace.."}, cache: true} ), // cache is default

))})

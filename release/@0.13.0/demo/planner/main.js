import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../../lib/caged-le.js"

import {InitRouter, Router} from "./router/routing.js"

import {HomePage} from "./pages/home.js"

LE_InitWebApp(async ()=>{

  await Promise.all([
    LE_LoadCss("https://fonts.googleapis.com/css?family=Inconsolata"),
    LE_LoadCss("https://fonts.googleapis.com/icon?family=Material+Icons"),
    LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"),
  ])

  await Promise.all([
    // LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.10.4/dayjs.min.js", {attr: { crossorigin:"anonymous"}}),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.10.4/locale/it.min.js", {attr: { crossorigin:"anonymous"}}),
  ])

  await InitRouter({

    pages: {
      "home": HomePage
    },
  
    defaultRoute: "home"
  })

})

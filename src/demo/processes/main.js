import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../../lib/caged-le.js"

import {InitRouter, Router} from "./router/routing.js"

import {HomePage} from "./pages/home.js"
import {DetailsPage} from "./pages/details.js"

LE_InitWebApp(async ()=>{

  await LE_LoadCss("https://unpkg.com/wingcss") 

  await InitRouter({

    pages: {
      "home": HomePage,
      "details": DetailsPage,
    },
  
    defaultRoute: "home"
  })

})

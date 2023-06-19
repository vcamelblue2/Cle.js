import { defineHtmlComponent } from "cle.js/lib/caged-le"

import { Clock } from "../components/clock.component.deps"


import html from "bundle-text:./home.page.ui.html"

// version: define "def" here instead of "script" in html (for parceljs compiler/bundler static analysis)
// export const Homepage = defineHtmlComponent(html, { isRemote: false, def: async (Cle, params, state, style, DepsInj)=>[
// { 
//  
//     id: "home",
//
//     let: {
//         myVar: "hi to all",
//         name: "user1"
//     }
//
// },
// { 
//     deps: { Clock: await Clock() }
// }
// ]})


// version: inject deps only (for parceljs compiler/bundler static analysis)
export const Homepage = defineHtmlComponent(html, { isRemote: false, defArgMapper: async (params, state, DepsInj)=>({ params, state, 
    DepsInj: {
      Clock: await Clock(), 
      ...DepsInj

      // Clock: await Clock(pass, pass, {CustomHeader: {b: {}}} ), ...DepsInj
    }
  })
})
    
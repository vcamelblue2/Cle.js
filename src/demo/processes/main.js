import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../../lib/caged-le.js"

import {RoutingTable, InitRouter, Router} from "./router/routing.js"

import {HomePage} from "./pages/home.js"
import {DetailsPage} from "./pages/details.js"

//   // PAGES
//   const Page1 = async (state)=>({ div: {
//     text: [
//       "page 1",
//       smart({button: "go to page 2"}, {handle: {onclick: $=>Router.navigate("page2/page2", {page:"2"})}}),
//       smart({button: "go to page 3"}, {handle: {onclick: $=>Router.navigate("page3/page3", {page:"3"})}}),
//       { div: { meta: {forEach: "el", of: $=>[1,2,3,4,5,6,7,8,9,10]}, text: $=>$.meta.el}}
//     ]
//   }})

// const Page2 = async (state)=>({ div: {
//   text: [
//     "page 2",
//     smart({button: "go to page 1"}, {handle: {onclick: $=>Router.navigate("?page1/page1", {page:"1"})}}),
//     smart({button: "go to page 3"}, {handle: {onclick: $=>Router.navigate("?page3/page3", {page:"3"})}}),
//     { div: { meta: {forEach: "el", of: $=>[1,2,3,4,5,6,7,8,9,10]}, text: $=>$.meta.el}}
//   ]
// }})

// const Page3 = async (state)=>({ div: {
//   text: [
//     "page 3",
//     smart({button: "go to page 1"}, {handle: {onclick: $=>Router.navigate("?page1/page1", {page:"1"})}}),
//     smart({button: "go to page 2"}, {handle: {onclick: $=>Router.navigate("?page2/page2", {page:"2"})}}),
//     { div: { meta: {forEach: "el", of: $=>[1,2,3,4,5,6,7,8,9,10]}, text: $=>$.meta.el}}
//   ]
// }})

LE_InitWebApp(async ()=>{

  await LE_LoadCss("https://unpkg.com/wingcss") 

  InitRouter({

    pages: {
      "home": HomePage,
      "details": DetailsPage,


      // "page1/page1": Page1,
      // "page2/page2": Page2,
      // "page3/page3": Page3
    },
  
    defaultPage: "home"
  })

})

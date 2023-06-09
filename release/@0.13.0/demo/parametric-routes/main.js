import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, cle} from "../../lib/caged-le.js"

import {InitRouter, Router, RedirectTo} from "../../routing/lite_routing.js"



export const HomePage = async (state, params)=>{
  console.log(state, params)

  return cle.root({}, 
    cle.div({
      onclick: $=>Router.navigate("/details/det_123")
    }, "HELLO FROM HOME"),
  )
}

export const DetailPage = async (state, params)=>{
  console.log(state, params)
  
  return cle.root({}, 
    cle.div({
      onclick: $=>Router.navigate("/details/"+params.detail_id+"/subdetails")
    }, "HELLO FROM DETAIL", " => ", params.detail_id),
  )
}

export const SubDetailsPage = async (state, params)=>{
  console.log(state, params)
  
  return cle.root({}, 
    cle.div({
      onclick: $=>Router.navigate("/details/"+params.detail_id+"/subdetails/"+1000)
    }, "HELLO FROM SUBDETAILs", " => ", params.detail_id ),
  )
}
export const SubDetailPage = async (state, params)=>{
  console.log(state, params)
  
  return cle.root({}, 
    cle.div({
      onclick: $=>Router.navigate("/")
    }, "HELLO FROM SUBDETAIL", " => ", params.detail_id, "/", params.subdetail_id),
  )
}

LE_InitWebApp(async ()=>{

  await InitRouter({

    pages: {
      "/": RedirectTo("/home"),

      "/home": HomePage,
      "/details/:detail_id": DetailPage,
      "/details/:detail_id/subdetails": SubDetailsPage,
      "/details/:detail_id/subdetails/:subdetail_id": SubDetailPage,

    },
  
    defaultRoute: "/"
  })

})

import {RenderApp} from "../../../lib/caged-le.js"

  // ROUTING
export const RoutingTable = {
  pages: {},
  defaultPage: "/",

  activeApp: undefined
}

export const HistoryApi = {
  pushState: (url, state, fullRefresh=false)=>{
    
    if (!url.startsWith("?")){
      url = "?"+url
    }

    if(fullRefresh){
      window.location.href=url
    }
    else{
      history.pushState(state, "", url)
      setTimeout(()=>window.onpushstate({state:state}), 1)
    }
  }
}

export const Router = {
  navigate: (url, state, fullRefresh=false)=>HistoryApi.pushState(url, state, fullRefresh)
}


const onPageChanged = async (location, state)=>{
  console.log("page changed")
  RoutingTable.activeApp && RoutingTable.activeApp?.destroy()

  // or maybe use href search only
  let page = location.search.split("?")[1]
  
  if(!(page in RoutingTable.pages)){
    console.log("to default page", page)
    Router.navigate(RoutingTable.defaultPage)
  }
  else {
    console.log("to page", page)
    RoutingTable.activeApp = RenderApp(document.body, (await RoutingTable.pages[page](state ? state : undefined)))
  }

}

history.scrollRestoration = "auto"

window.onpopstate = window.onpushstate = async function(event) {
  console.log(`location: ${document.location}, state: ${JSON.stringify(event.state)}`)
  await onPageChanged(document.location, event.state)
}

export const InitRouter = async (config=undefined)=>{
  if (config){
    RoutingTable.pages = config.pages
    RoutingTable.defaultPage = config.defaultPage
  }

  await onPageChanged(document.location)
}


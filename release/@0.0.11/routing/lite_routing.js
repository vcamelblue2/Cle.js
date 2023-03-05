import {RenderApp} from "../lib/caged-le.js"

export const DEBUG_SETTINGS = {
  DEBUG_ENABLED: false
}

const _debug = { log: (...args)=> DEBUG_SETTINGS.DEBUG_ENABLED && console.log(...args) }


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

// rename
export const Router = {
  navigate: HistoryApi.pushState
}



export const InitRouter = async (config=undefined, {scrollRestoration="auto"}={})=>{


  const RoutingTable = {
    pages: {},
    defaultRoute: "/",

    activeApp: undefined
  }

  const onPageChanged = async (location, state)=>{
    
    _debug.log("page changed")

    RoutingTable.activeApp && RoutingTable.activeApp?.destroy()

    // or maybe use href search only
    let page = location.search.split("?")[1]
    
    if(!(page in RoutingTable.pages)){
      _debug.log("to default page", page)
      Router.navigate(RoutingTable.defaultRoute)
    }
    else {
      _debug.log("to page", page)
      RoutingTable.activeApp = RenderApp(document.body, (await RoutingTable.pages[page](state ? state : undefined)))
    }

  }


  history.scrollRestoration = scrollRestoration

  window.onpopstate = window.onpushstate = async function(event) {
    
    _debug.log(`location: ${document.location}, state: `, event.state)

    await onPageChanged(document.location, event.state)
  }

  if (config){
    RoutingTable.pages = config.pages
    if (config.defaultRoute !== undefined) { RoutingTable.defaultRoute = config.defaultRoute }
  }

  await onPageChanged(document.location)
}


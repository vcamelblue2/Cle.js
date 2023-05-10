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


class _RedirectTo {constructor(redirect){this.redirect=redirect}}
export const RedirectTo = (to)=>new _RedirectTo(to);


const checkIsParametricRoute = (pages, currentUrl)=>{

  const checkMatch = (pageUrl, currentUrl) => {
    if (pageUrl === undefined || currentUrl === undefined){
      return {match: false, paramsMap: undefined}
    }

    let correctedPageUrl = (pageUrl.endsWith("/") ? pageUrl.substr(0, pageUrl.length-1) : pageUrl);
        correctedPageUrl = (correctedPageUrl.startsWith("/") ? correctedPageUrl.substr(1) : correctedPageUrl);

    let correctedCurrentUrl = (currentUrl.endsWith("/") ? currentUrl.substr(0, currentUrl.length-1) : currentUrl);
        correctedCurrentUrl = (correctedCurrentUrl.startsWith("/") ? correctedCurrentUrl.substr(1) : correctedCurrentUrl);

    let pageUrlComponents = correctedPageUrl.split("/");
    let currentUrlComponents = correctedCurrentUrl.split("/");

    if (pageUrlComponents.length !== currentUrlComponents.length){
      return {match: false, paramsMap: undefined}
    }

    let paramsMap = {}
    let match = true

    for (let i = 0; i < pageUrlComponents.length; i++){
      if (pageUrlComponents[i].startsWith(":")){
        paramsMap[pageUrlComponents[i].substr(1)] = currentUrlComponents[i]
        match = match && true
      } else if (pageUrlComponents[i] === currentUrlComponents[i]){
        match = match && true
      }
      else {
        match = match && false
      }
    }

    return {match, paramsMap}
  }

  _debug.log("check is parametric route:", pages, currentUrl)

  for (let [pageUrl, page] of Object.entries(pages)){
    let {match, paramsMap} = checkMatch(pageUrl, currentUrl)
    if (match){
      return {page, paramsMap}
    }
  }

  return {page: undefined, paramsMap: undefined}
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
    
    if(page in RoutingTable.pages){
      if (RoutingTable.pages[page] instanceof _RedirectTo){
        _debug.log("redirect to page", RoutingTable.pages[page].redirect, page)
        Router.navigate(RoutingTable.pages[page].redirect, state)
      } else {
        _debug.log("to page", page)
        RoutingTable.activeApp = RenderApp(document.body, (await RoutingTable.pages[page](state ? state : undefined)))
      }
    }
    else {
      let parametricRouteMatch = checkIsParametricRoute(RoutingTable.pages, page)
      
      if (parametricRouteMatch.page !== undefined){
        if (parametricRouteMatch.page instanceof _RedirectTo){
          _debug.log("redierect to page", parametricRouteMatch.page.redirect)
          Router.navigate(parametricRouteMatch.page.redirect, state)
        }
        else{
          _debug.log("to parametric page", page)
          RoutingTable.activeApp = RenderApp(document.body, (await parametricRouteMatch.page(state ? state : undefined, parametricRouteMatch.paramsMap)))
        }
      } else {
        _debug.log("to default page", page)
        Router.navigate(RoutingTable.defaultRoute, state)
      }
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


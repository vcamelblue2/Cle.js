import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../../lib/caged-le.js"
const range = (start, end, increment=1)=>{let res = [];for (let i=start; i<end; i+=increment){ res.push(i) };return res}


// https://developer.mozilla.org/en-US/docs/Web/API/History_API
// https://developer.mozilla.org/en-US/docs/Web/API/History
// https://developer.mozilla.org/en-US/docs/Web/API/History/scrollRestoration
// https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API

const VERSON_1 = ()=>{

  history.scrollRestoration = "auto"

  // necessario un wrapper di pushstate affinchè possa intercettare l'evento di push..altrimenti funziona solo col pop!

  // PAGES
  const Page1 = ()=>({ div: {
    text: [
      "page 1",
      smart({button: "go to page 2"}, {handle: {onclick: $=>HistoryApi.pushState("?page2/page2", {page:"2"})}}),
      smart({button: "go to page 3"}, {handle: {onclick: $=>HistoryApi.pushState("?page3/page3", {page:"3"})}}),
      { div: { meta: {forEach: "el", of: $=>range(0,200)}, text: $=>$.meta.el}}
    ]
  }})

  const Page2 = ()=>({ div: {
    text: [
      "page 2",
      smart({button: "go to page 1"}, {handle: {onclick: $=>HistoryApi.pushState("?page1/page1", {page:"1"})}}),
      smart({button: "go to page 3"}, {handle: {onclick: $=>HistoryApi.pushState("?page3/page3", {page:"3"})}}),
      { div: { meta: {forEach: "el", of: $=>range(0,200)}, text: $=>$.meta.el}}
    ]
  }})

  const Page3 = ()=>({ div: {
    text: [
      "page 3",
      smart({button: "go to page 1"}, {handle: {onclick: $=>HistoryApi.pushState("?page1/page1", {page:"1"})}}),
      smart({button: "go to page 2"}, {handle: {onclick: $=>HistoryApi.pushState("?page2/page2", {page:"2"})}}),
      { div: { meta: {forEach: "el", of: $=>range(0,200)}, text: $=>$.meta.el}}
    ]
  }})


  // ROUTING
  const RoutingTable = {
    "page1/page1": Page1,
    "page2/page2": Page2,
    "page3/page3": Page3,
  }

  const DefaultPage = "page1/page1"



  // framework
  const HistoryApi = {
    pushState: (url, state, fullRefresh=false)=>{
      if(fullRefresh){
        window.location.href=url
      }
      else{
        history.pushState(state, "", url)
        setTimeout(()=>window.onpushstate({state:state}), 1)
      }
    }
  }

  let app = undefined

  const onPageChanged = (location, state)=>{
    console.log("page changed")
    app && app?.destroy()

    if (state){  // use state
      let page = "page"+state.page+"/page"+state.page
      page =  page in RoutingTable ? page : DefaultPage
      app = RenderApp(document.body, RoutingTable[page]())
    }
    else { // or maybe use href search only
      let page = location.search.split("?")[1] || DefaultPage
      console.log("to page", page)
      app = RenderApp(document.body, RoutingTable[page]())
    }
  }

  window.onpopstate = window.onpushstate = function(event) {
    console.log(`location: ${document.location}, state: ${JSON.stringify(event.state)}`)
    onPageChanged(document.location, event.state)
  }
  

  LE_InitWebApp(async ()=>{

    console.log("LE Init Web App")

    console.log(`location: ${document.location}, state: ${JSON.stringify(event.state)}`)
    onPageChanged(document.location, event.state)

  })

}

VERSON_1()
import {LE_LoadCss, LE_InitWebApp} from "../../lib/caged-le.js"

export const mountPath = "/src/demo/blog"
export const appPath = window.location.pathname.replace(mountPath, '')
export const isHomePath = appPath === '/'

// run live server with fallback on index.html! 
// npx http-server ./ -p 4050 -c-1 -P "http://localhost:4050/src/demo/blog/?"
LE_InitWebApp(async ()=>{

  await LE_LoadCss("https://unpkg.com/wingcss") 

  console.log(mountPath, appPath, appPath === '/')
  if (isHomePath){
    try{ await import("./pages/home.js") }
    catch(e){ console.log(e) }
  }
  else {
    try{ await import("."+appPath+".js") }
    catch(e){ console.log(e) }
  }


})

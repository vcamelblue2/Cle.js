import {RenderApp, cle} from "../../../lib/caged-le.js"

RenderApp(document.body, { div: {
  id: "app",

  '': [

    cle.h2("Home"),

    cle.a({a_href:"./pages/article"}, "go to article")

  ]

}})
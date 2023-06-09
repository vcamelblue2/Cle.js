import {cle, Placeholder, pass, none, Use, RenderApp} from "../../../lib/caged-le.js"

export const ArticleTitle = (text)=>cle.h2({}, text)
export const ArticleText = (text)=>cle.div({}, text)
export const ArticleNavLink = (href, text)=>cle.a({a_href: href}, text)

const Article = cle.div({},
  Placeholder('title', {default_component: cle.h2({}, 'Title')}),
  Placeholder('text', {default_component: cle.div({}, 'text')}),
  Placeholder('nav_link', {default_component: ArticleNavLink('../', 'go to home')})
)

export const ArticlePage = (substitutions)=>{
  RenderApp(document.body, { div: {
    id: "app",

    '': Use(Article, pass, {inject: substitutions})

  }})
}
import { Extended, Placeholder, f, cle, ExternalProp } from "../../lib/caged-le.js"

const input = (def, val) => ({['let_'+def]:val})
const output = (sig_name, def='stream => void') =>({['s_'+sig_name]:def})

export const Tabs = (extradef={}, ...tabs) => {
  const hasLeForTab = tabs.find(t=>t.meta?.of !== undefined) !== undefined

  let Headers = tabs.map(t => ({ div: { ...( t.meta ? { meta: t.meta } : {}),
      let_tabIndex: undefined,
      let_isActive: $ => $.scope.activeTabIndex === $.this.tabIndex,
      let_restyle: t.labelRestyle || (()=>($=>{})),

      onInit: $ => { $.this.tabIndex = $.scope.registerTabHeader($.this) },
      h_onclick: $ => $.scope.activateTab($.this.tabIndex),

      '': t.label,

      a_style: $ => ({ 
        display: "inline-block", 
        borderBottom: $.this.isActive ? '1px solid black' : 'unset',
        cursor: "pointer",
        padding: "5px 10px", ...$.this.restyle($)
      }), 
      a_class: $=> "tab-header" + ( $.this.isActive ? " tab-header-active" : ''),
      a_tabIndex: $ => $.this.tabIndex
  }}))

  let Contents = tabs.map(t => ({ div: { ...( t.meta ? { meta: t.meta } : {}),
      let_tabIndex: undefined,
      let_isActive: $=>$.scope.activeTabIndex === $.this.tabIndex,
      let_restyle: t.contentRestyle || (()=>($=>{})),

      onInit: $ => { $.this.tabIndex = $.scope.registerTabContent($.this); $.scope.correctIndexesOfLeForElements() },
      ...(t.meta ? { onUpdate: $=> $.scope.correctIndexesOfLeForElements()} : {}),
      ...(t.meta ? { onDestroy: $=> $.scope.removeTabHeaderAndRecomputeIndexes($.this.tabIndex)} : {}),

      '': t.content,

      a_style: $ => ({
        ...( $.this.isActive ? 
          { position: 'relative', width: '100%', /* padding: "5px 10px"*/ ...$.this.restyle($) } : { position: 'absolute', width: '0px', overflow: 'hidden', ...$.this.restyle($) }
        ),
      }), 
      a_class: $=> "tab-content" + ( $.this.isActive ? " tab-content-active" : ''), 
      a_tabIndex: $ => $.this.tabIndex,

      ...(t.extraDef ? t.extraDef : {}),
  }}))

  return { div: {
    signals:{
      tabChanged: "stream => void",
      tabsRecomputed: "stream => void"
    },

    props: {
      tabHeaderComponents: [],
      tabContentComponents: [],
      activeTabIndex: 0,
      tabsNum: $ => $.this.tabContentComponents.length,
      _recomputeIndexTimeout: undefined
    },

    def: {
      registerTabHeader: ($, th) => { $.this.tabHeaderComponents.push(th); return $.this.tabHeaderComponents.length - 1},
      registerTabContent: ($, tc) => { $.this.tabContentComponents.push(tc); return $.this.tabContentComponents.length - 1},
      activateTab: ($, idx) => { $.this.activeTabIndex = idx; $.this.tabChanged.emitLazy(10, idx) },
      removeTabHeaderAndRecomputeIndexes: ($, idx) => {
        // console.log("removing idx: ", idx, "actual: ", $.this.tabHeaderComponents.map((_,i)=>[i, _.tabIndex]) )

        $.this.tabHeaderComponents = $.this.tabHeaderComponents.filter((_, i)=>i !== idx)
        $.this.tabContentComponents = $.this.tabContentComponents.filter((_, i)=>i !== idx)
        
        $.this.tabHeaderComponents.forEach((th, i)=>{th.tabIndex = i})
        $.this.tabContentComponents.forEach((tc, i)=>{tc.tabIndex = i})
        
        hasLeForTab && $.this.correctIndexesOfLeForElements()

      },
      correctIndexesOfLeForElements: $=>{
        clearTimeout($.this._recomputeIndexTimeout)
        $.this._recomputeIndexTimeout = setTimeout(()=>{

          let headersEl = [...$.this.el.querySelectorAll(".tab-header-wrapper")[0].children]
          let contentsEl = [...$.this.el.querySelectorAll(".tab-content-wrapper")[0].children]
          // console.log("headersel", headersEl, $.this.tabHeaderComponents.map(el=>[el, headersEl.indexOf(el.el)]))
          $.this.tabHeaderComponents = $.this.tabHeaderComponents.sort((a,b)=>headersEl.indexOf(a.el)-headersEl.indexOf(b.el))
          $.this.tabContentComponents = $.this.tabContentComponents.sort((a,b)=>contentsEl.indexOf(a.el)-contentsEl.indexOf(b.el))
  
          $.this.tabHeaderComponents.forEach((th, i)=>{th.tabIndex = i})
          $.this.tabContentComponents.forEach((tc, i)=>{tc.tabIndex = i})

          $.this.tabsRecomputed.emitLazy()

        }, 10)
      }
    },
    
    ...extradef,

    '': [
      cle.div({ a_style: "display: block", a_class: "tab-header-wrapper" }, ...Headers),
      cle.div({a_style: "display: block", a_class: "tab-content-wrapper" }, ...Contents)
    ],

    css: [
      ` .tab-content-active {padding: 5px 10px}`
    ]

  }}
}

export const Tab = (x)=>x

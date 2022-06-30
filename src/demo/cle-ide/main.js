import {pass, none, smart, f, fArgs, Use, Extended, Placeholder, Bind, Alias, SmartAlias, Switch, Case, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../../lib/caged-le.js"

import { UseAnchors, UseAnchorsRoot, AnchorsSystmeRootStyle, AnchorsSystemInit } from "./app/anchors.js"

import { Model } from "./app/model.js"
import { RootView } from "./app/rootView.js"
import { ChildsView } from "./app/childsView.js"
import { ConnectionsView } from "./app/connectionsView.js"
import { AceEditor } from "./app/aceEditorView.js"

import { onclick } from "./app/utils.js"


LE_InitWebApp(async ()=>{


  // ACE EDITOR LIB
  await LE_LoadScript("https://ajaxorg.github.io/ace-builds/src-min-noconflict/ace.js")


  let app = RenderApp(document.body, { div: {
    
    id: "app",

    props: {
      multiplier: "1.0",
      ...UseAnchorsRoot,
      width: $=>window.innerWidth * Math.max(1, ($.this.multiplier.length>0 ? parseFloat($.this.multiplier) : 1)),
    },
    attrs: {id: "app", style: AnchorsSystmeRootStyle },
    onInit: $ => {

      // From:  AnchorsSystemInit($); (edited for multiplier..)
      window.onresize = () => {
        $.this.width = window.innerWidth * Math.max(1, ( $.this.multiplier.length>0 ? parseFloat($.this.multiplier) : 1));
        $.this.height = window.innerHeight;
      };
      document.body.style.padding = "0px";
      document.body.style.margin = "0px";

      // prevent back to exit..
      window.onbeforeunload = function(evt){
        evt.returnValue = "Sicuro di voler uscire?";
        return "Sicuro di voler uscire"
      }
    },

    css: [`
      * { box-sizing: border-box !important;}
      body { padding: 0px; margin: 0px; }
      .shadow{
        -webkit-box-shadow: 0px 6px 50px -1px rgb(0 0 0 / 72%);
        -moz-box-shadow: 0px 6px 50px -1px rgb(0 0 0 / 72%);
        box-shadow: 0px 6px 50px -1px rgb(0 0 0 / 72%);
      }
    `],


    "=>": [

      Model,

      RootView,
      
      ChildsView,

      ConnectionsView,

      { div: {
        a_style: "width: 200px; height: 50%; position: absolute",
        '': [

          { button: { text: "Save", a:{ style: "display: block"}, handle: {[onclick]: $=>$.le.model.storage.saveDef()} }},
          { button: { text: "Load", a:{ style: "display: block"}, handle: {[onclick]: $=>$.le.model.storage.loadDef()}, onInit: $=>setTimeout(()=>$.le.model.storage.loadDef(), 1)}},

          { br: {}},
          { br: {}},

          { button: { text: "Reset Demo", a:{ style: "display: block"}, handle: {[onclick]: $=>$.le.model.storage.resetToDemo()} }},
          { button: { text: "Reset Empty", a:{ style: "display: block"}, handle: {[onclick]: $=>$.le.model.storage.resetToEmpty()}}},

          { br: {}},
          { br: {}},

          { button: { 
            text: "Global Def", 
            a:{ style: "display: block;"}, 
            handle: { [onclick]: $=>{
              $.le.globalDef.visible = true
            }} 
          }},

          { button: { 
            text: "Show App", 
            a:{ style: "display: block"}, 
            handle: { [onclick]: $=>{
              let recomposed = $.le.model.recompose()
              // console.log(recomposed)
              $.le.preview.code = `setTimeout(async ()=>{try{window.renderized_app.destroy()}catch{}; ${$.le.model.globalDef}; window.renderized_app = RenderApp(document.getElementById('app-preview'), ${recomposed});}, 1)`
              $.le.preview.visible = true
            }} 
          }},


          { br: {}},
          { br: {}},

          {div: "Zoom "},
          { input: { ha_value: Bind(f`@multiplier`), a_style: "width: 50px"}}

        ]
      }},


      // click blocker
      { div: {
        id: "click_captur",

        props: {
          ...UseAnchors(),
          visible: false, // $=>$.le.preview.visible || $.le.globalDef.visible,

          width: $ => $.this.visible? $.parent.Width : 0,
          height: $ => $.this.visible? $.parent.Height : 0,

        },
        on: {le: {
          preview: {visibleChanged: $=>{
            $.this.visible = $.le.preview.visible
          }},
          globalDef: {visibleChanged: $=>{
            $.this.visible = $.le.globalDef.visible
          }},
        }},

        handle: { [onclick]: ($, e)=>{
          e.preventDefault(); e.stopPropagation();
        }},

        attrs: { 
          style: $ => ({ ...$.this.Anchors, backgroundColor: "#00000077", zIndex: "998", visibility: $.this.visible ? "visible" : "hidden" }) 
        },
      }},


      // preview
      { div: {
        id: "preview",

        props: {
          ...UseAnchors(),
          width: $ => $.parent.Width-100,
          height: $ => $.parent.Height-100,
          left: 50,
          top: 50,

          visible: false,
          code: ""
        },
      
        attrs: { 
          class: "shadow", 
          style: $ => ({ ...$.this.Anchors, backgroundColor: "white", zIndex: "999", border: "2px solid black", visibility: $.this.visible ? "visible" : "hidden" }) 
        },

        "=>": [

          { button: { 
            text: "x", 
            props: { ...UseAnchors(), left: 0, top: -35, width: 30, height: 30}, 
            attrs: { style: $ => ({ ...$.this.Anchors, zIndex: "1000" }) }, 
            handle: {[onclick]: $=>{try{window.renderized_app.destroy()}catch{}; $.le.preview.visible = false; $.le.preview.code = ""} } 
          }},

          { div: {

            props: {
              ...UseAnchors(),
              width: $ => $.parent.Width,
              height: $ => $.parent.Height,

              latestApp: undefined
            },
          
            attrs: { id: "app-preview", style: $ => ({ ...$.this.Anchors, zIndex: "1", overflow: "auto" }) },

            on: { parent: { codeChanged: ($, code)=>{
              // $.this.latestApp!==undefined && $.this.latestApp?.destroy() // buggato ora..perchè con async e set timeout non restituisco l'app! (window.renderized_app)
              if (code.length > 0){
                $.this.latestApp = eval(code) 
                // console.log($.this.latestApp)
                // setTimeout(() => {
                //   console.log(window.renderized_app)
                // }, 1000);
              }
            }}}
          }}
        ]

      }},


      // globalDef
      { div: {
        id: "globalDef",

        props: {
          ...UseAnchors(),
          width: $ => $.parent.Width-100,
          height: $ => $.parent.Height-100,
          left: 50,
          top: 50,

          visible: false,
        },
      
        attrs: { 
          class: "shadow", 
          style: $ => ({ ...$.this.Anchors, backgroundColor: "white", zIndex: "999", border: "2px solid black", display: $.this.visible ? "unset" : "none" }) 
        },

        "=>": [

          { button: { 
            text: "x", 
            props: { ...UseAnchors(), left: 0, top: -35, width: 30, height: 30}, 
            attrs: { style: $ => ({ ...$.this.Anchors, zIndex: "1000" }) }, 
            handle: {[onclick]: $=>{$.scope.visible = false} } 
          }},

          Use(AceEditor, {
            props: {
              ...UseAnchors(),
              width: $ => $.parent.Width,
              height: $ => $.parent.Height,
              
              initialCode: $=>$.le.model.globalDef
            },
                    
            on_s: {
              this: {
                codeChanged: ($, new_code)=>{
                  $.le.model.globalDef = new_code
                },
                saveRequest: $=>{
                  $.le.model.storage.saveDef()
                }
              }
            },

          })
        ]

      }}

    ]

  }})

})
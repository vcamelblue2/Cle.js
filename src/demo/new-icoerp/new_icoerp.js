import {pass, none, smart, Use, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp} from "../../lib/caged-le.js"

const GlobalCss = {
    Style: {
    id: "global_css",

    css: `
        * { box-sizing: border-box !important; }
        
        html, body { height: 100% }
        
        .shadow{
            border-radius: 55px;
            -webkit-box-shadow: 0px 6px 32px -1px rgb(0 0 0 / 42%);
            -moz-box-shadow: 0px 6px 32px -1px rgb(0 0 0 / 42%);
            box-shadow: 0px 6px 32px -1px rgb(0 0 0 / 42%);
        }

        .active-shadow{
            border-radius: 55px;
            -webkit-box-shadow: 0px 6px 32px -1px rgb(0 0 200 / 32%);
            -moz-box-shadow: 0px 6px 32px -1px rgb(0 0 200 / 32%);
            box-shadow: 0px 6px 32px -1px rgb(0 0 200 / 32%);
        }

        .hand-pointer{
            cursor:pointer
        }

        @keyframes kf-animate-my-scale {
            from {transform: scale(1)}
            to {transform: scale(1.05)}
        }

        .animate-my-scale{
            animation-name: kf-animate-my-scale;
            animation-duration: 1.4s;
            animation-iteration-count: infinite;
            animation-direction: alternate;
        }
    `
    }
}

const Clock = ()=>({
    span: {  
        id: "page_nav_clock",

        data: {
        _interval: undefined,
        formattedTime: dayjs(new Date()).format('dddd[,] DD/MM/YYYY HH:mm:ss'),
        },

        attrs: { class: "breadcrumb"},

        text: $ => $.this.formattedTime,

        onInit: $ => {
        $.this._interval = setInterval(()=> $.this.formattedTime = dayjs(new Date()).format('dddd[,] DD/MM/YYYY HH:mm:ss'),500)
        },

        onDestroy: $ => {
        clearInterval($.this._interval)
        $.this._interval = undefined
        }
    }
})

const NavBar = (components_injection=[pass])=>({ 
  div: { 

    id: "navbar",

    attrs: {class: "navbar-fixed"} , 
    "=>":{ 
      nav: { 
        "=>":{ 
          div: { 
            attrs: { class: "nav-wrapper grey darken-4" }, 
            "=>":{ 
              div: { 
                attrs: { class: "row" }, 
                "=>":[

                  { div: { 
                    attrs: { class: "col", style: "margin-left: 15px;" }, 
                    "=>": {
                      a: { 
                        attrs: {href:"/", class: "breadcrumb hand-pointer"},  
                        text: "NEW ICOERP!"
                    }}
                  }},

                  { div: { 
                    attrs: {class: "col right", style: "margin-right: 15px;"}, 
                    "=>": Clock()
                  }},

                  ...components_injection,

              ].filter(c=>c!==pass)}
          }
          }
      }
      }
  }  
  }
})

LE_InitWebApp( async ()=>{


  await Promise.all([
    LE_LoadCss("https://fonts.googleapis.com/css?family=Inconsolata"),
    LE_LoadCss("https://fonts.googleapis.com/icon?family=Material+Icons"),
    LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"),
  ])

  await Promise.all([
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.10.4/dayjs.min.js", {attr: { crossorigin:"anonymous"}}),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.10.4/locale/it.min.js", {attr: { crossorigin:"anonymous"}}),
  ])
  

  RenderApp(document.body, { 
    div: {
      id: "app_root",

      "=>": [
        GlobalCss,

        NavBar()
        
      ]
    }
  })

})

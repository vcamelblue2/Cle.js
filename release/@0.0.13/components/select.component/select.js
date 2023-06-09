import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf} from "../../lib/caged-le.js"

export const Select = cle.div({ class: "cle-select-wrapper",
    ...input(str.values, []),
    ...input(str.selected, undefined),
    ...input(str.disabled, false),
    ...input(str.value_prop, "code"),
    ...input(str.label_prop, "desc"),
    ...input(str.placeholder, "Select a value"),

    ...input(str.demoBootstrapIcons, false),

    props:{
      selectOpen: false,
    },

    s_css: {
      ".cle-select-wrapper": [{position: "relative"}],
      
      ".cle-select-output": [{ width: '100%', padding: "5px 10px", border: '1px solid black', cursor: "pointer", display: "flex", justifyContent: 'space-between', alignItems: 'center'}],
      ".cle-select-output.placeholder": [{ color: "#888888", }],
      ".cle-select-output.disabled": [{ background: "#cdcdcd", color: "gray", cursor: "unset"}],

      ".cle-select-selectable-wrapper": [{ position: "absolute", width: '100%', maxHeight: "500px", border: '1px solid black', overflowY: 'auto', background: "white", zIndex: "2"}],
      ".cle-select-selectable-wrapper-defocus": [{ position: "fixed", top: "0", left: "0", width: '100%', height: "100%", zIndex: "1"}],
      
      ".cle-select-selectable-value": [{ width: "100%", padding: "5px 10px", cursor: "pointer" }],
      ".cle-select-selectable-value.disabled": [{ background: "#cdcdcd", color: "gray", cursor: "unset" }]
    }

  },
    
    cle.div({ class: $=>"cle-select-output" + clsIf($.scope.selected === undefined, 'placeholder') + clsIf($.scope.disabled, 'disabled'),
      h_onclick: f`{ !@disabled && (@selectOpen = !@selectOpen) }`,
    }, 
      f`@selected === undefined ? @placeholder : @selected[@label_prop]`,
      
      cle.div({ css: ['@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css")'], meta: {if: f`@demoBootstrapIcons`}}, 
        cle.i({ a_class:"bi-caret-down-fill"})
      )
    ),

    cle.div({ class: "cle-select-selectable-wrapper-defocus",  meta: { if: f`@selectOpen`},
      h_onclick: fArgs("e")`{ e.stopPropagation(); @selectOpen = false }`,
    }),

    cle.div({ class: "cle-select-selectable-wrapper", meta: { if: f`@selectOpen`} }, 

      cle.div({ class: $=>"cle-select-selectable-value" + clsIf($.scope.disabled || $.meta.value.disabled, 'disabled'), meta: { forEach: 'value', of: f`@values`},

        h_onclick: ($,e)=>{ e.stopPropagation(); if(!$.scope.disabled && !$.meta.value.disabled) { $.scope.selected = $.meta.value; $.scope.selectOpen = false} }

      }, Placeholder("valueTemplate", { default_component: f`@value[@label_prop]`}))
    )
)

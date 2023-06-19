import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf} from "../../lib/caged-le.js"

export const MatInput = cle.div({ class: "cle-mat-input",
  ...input("text", ""),
  ...input("label", "Label"),

  props: {
    focused: false,
  },

  s_css: {
    ".cle-mat-input": [{position: 'relative', height: '2rem', fontSize: '1rem'}],
    ".cle-mat-input-ipt":[{border: 'none', borderBottom: '1px solid black', height: '1rem', lineHeight: "2rem", marginTop: "0.7rem", paddingBottom: "0.3rem"}],
    ".cle-mat-input-ipt:focus":[{
      border: "none",
      borderBottom: '1.5px solid blue',
      outline: 'none !important', 
      outlineWidth: '0 !important',
      boxShadow: 'none',
      "::-moz-box-shadow": 'none',
      "::-webkit-box-shadow": 'none'
    }]
  }
  
}, 
  cle.span({ meta: { if: f`@label !== undefined && @label.length > 0` }, 
    a_style: $=>({position: 'absolute', left: $.focused || $.text.length > 0 ? '0.1rem' : '0.2rem', top: $.focused || $.text.length > 0 ? '-0.5rem' : '0.7rem', fontSize: $.focused || $.text.length > 0 ? '0.75rem' : '1rem', transition: "0.1s ease-out"})
  }, f`@label`),
  
  cle.input({
    a_class: "cle-mat-input-ipt",

    ha_value: Bind(f`@text`),

    when_focusin: $ => {
      $.scope.focused = true
    },
    when_focusout: $ => {
      $.scope.focused = false
    }
  }),
)
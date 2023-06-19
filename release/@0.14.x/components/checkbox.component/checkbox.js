import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf} from "../../lib/caged-le.js"

export const Checkbox = cle.div({ class: $=>"cle-checkbox-wrapper" + clsIf($.scope.disabled, 'disabled'),
  ...input(str.selected, undefined),
  ...input(str.label, ""),
  ...input(str.fontSize, "1rem"),
  ...input(str.disabled, false),
  
  s_css: {
    ".cle-checkbox-wrapper": [$=>({display: "flex", alignItems: 'center', fontSize: $.scope.fontSize, cursor: 'pointer', gap: '0.4rem', color: 'black'})],
    ".cle-checkbox-wrapper.disabled": [{ cursor: 'unset', color: 'gray' }],

    ".cle-checkbox-box": [$=>({ width: $.scope.fontSize, height: $.scope.fontSize, background:"white", border: '1px solid black'})],
    ".cle-checkbox-box.disabled": [{ border: "1px solid gray" }],

    ".cle-checkbox-box-content": [$=>({ width: "calc(100% - 0.3rem)", height: "calc(100% - 0.3rem)", background: "black", margin: "0.15rem"})],
    ".cle-checkbox-box-content.disabled": [{ background: "gray" }],

    ".cle-checkbox-label": [{ 
      '::-webkit-user-select': 'none',  /* Chrome all / Safari all */
      '::-moz-user-select': 'none',     /* Firefox all */
      '::-ms-user-select': 'none',      /* IE 10+ */
      '::user-select': 'none'
    }],
    ".cle-checkbox-label.disabled": [{ color: 'gray' }],
  },

  h_onclick: { if: f`!@disabled`, use: f`{ @selected = !@selected }` }
}, 
  cle.div({class: $=>"cle-checkbox-box" + clsIf($.scope.disabled, 'disabled'),
  },
    cle.div({class: $=>"cle-checkbox-box-content" + clsIf($.scope.disabled, 'disabled'), meta: {if: f`@selected`}})
  ),  
  cle.span({class: $=>"cle-checkbox-label" + clsIf($.scope.disabled, 'disabled')}, f`@label`)
)
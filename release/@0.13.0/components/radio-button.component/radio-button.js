import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf} from "../../lib/caged-le.js"


export const RadioButton = cle.div({ class: $=>"cle-radio-button-wrapper" + clsIf($.scope.groupDisabled || $.scope.disabled, 'disabled'),
  ...input(str.value, ''),
  ...input(str.label, ""),
  ...input(str.disabled, false),

  h_onclick: { if: f`!@groupDisabled && !@disabled`, use: f`{ @selected !== @value && (@selected = @value) }` }
}, 
  cle.div({class: $=>"cle-radio-button-box" + clsIf($.scope.groupDisabled || $.scope.disabled, 'disabled')},
    cle.div({class: $=>"cle-radio-button-box-content" + clsIf($.scope.groupDisabled || $.scope.disabled, 'disabled'), meta: {if: f`@selected === @value`}})
  ),  
  cle.span({class: $=>"cle-radio-button-label" + clsIf($.scope.groupDisabled || $.scope.disabled, 'disabled')}, f`@label`)
)

export const RadioButtonsGroup = ({selectedValue=undefined, groupDisabled=false}={}, ...buttons)=>{

  return cle.div({class: $=>"cle-radio-buttons-group"  + clsIf($.this.groupDisabled, 'disabled'),
    ...input(str.selected, selectedValue),
    ...input(str.fontSize, "1rem"),
    ...input(str.groupDisabled, groupDisabled),
    
    s_css: {
      ".cle-radio-buttons-group": [$=>({display: "flex", alignItems: 'center', fontSize: $.scope.fontSize, gap: '0.4rem', color: 'black'})],
      ".cle-radio-buttons-group.disabled": [{color: 'gray' }],
      
      ".cle-radio-button-wrapper": [$=>({display: "flex", alignItems: 'center', fontSize: $.scope.fontSize, cursor:'pointer', gap: '0.4rem'})],
      ".cle-radio-button-wrapper.disabled": [$=>({cursor: 'unset'})],
      
      ".cle-radio-button-box": [$=>({ width: $.scope.fontSize, height: $.scope.fontSize, background:"white", border: $.scope.groupDisabled ? '1px solid gray' : '1px solid black', borderRadius: $.scope.fontSize})],
      ".cle-radio-button-box.disabled": [{ border: '1px solid gray'}],
      
      ".cle-radio-button-box-content": [$=>({ width: "calc(100% - 0.3rem)", height: "calc(100% - 0.3rem)", background: $.scope.groupDisabled ? 'gray' : "black", margin: "0.15rem", borderRadius: $.scope.fontSize})],
      ".cle-radio-button-box-content.disabled": [{ background: 'gray' }],
      
      ".cle-radio-button-label": [{
        '::-webkit-user-select': 'none',  /* Chrome all / Safari all */
        '::-moz-user-select': 'none',     /* Firefox all */
        '::-ms-user-select': 'none',      /* IE 10+ */
        '::user-select': 'none'
      }],
      ".cle-radio-button-label.disabled": [{ color: "gray" }],
    },
  }, ...buttons)

}
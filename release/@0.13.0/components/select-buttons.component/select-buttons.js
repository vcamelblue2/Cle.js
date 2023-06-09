import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf} from "../../lib/caged-le.js"

export const SelectButtons = cle.div({ class: "cle-select-buttons-wrapper",
    ...input(str.values, []),
    ...input(str.selected, undefined),
    ...input(str.multiple, false),
    ...input(str.value_prop, "code"),
    ...input(str.label_prop, "desc"),
    ...input(str.fontSize, "1rem"),

    props:{
      minPxWidth: f`(@values.length * 80) + 'px'`
    },

    s_css: {
      ".cle-select-buttons-wrapper": [$=>({ fontSize: $.scope.fontSize, display: 'inline-flex', overflow: "hidden", minWidth: $.scope.minPxWidth, cursor: 'pointer'})],
      ".cle-select-buttons-button": [{ background: "#cdcdcd", borderRight: "1px solid black", borderTop: "1px solid black", borderBottom: "1px solid black", padding: "5px", flex: '1 1 auto', textAlign: "center" }],
      ".cle-select-buttons-button:first-of-type": [{ borderTopLeftRadius: "5px", borderBottomLeftRadius: "5px", borderLeft: "1px solid black"}],
      ".cle-select-buttons-button:last-of-type": [{ borderTopRightRadius: "5px", borderBottomRightRadius: "5px"}],
      ".cle-select-buttons-button.active": [{ background: "gray", color: "white"}]
    }
  }, 
    
    cle.div({ meta: {forEach: "value", of: f`@values`}, 

      let_isSelected: $=> $.scope.multiple ? $.scope.selected?.includes($.meta.value[$.scope.value_prop]) : $.scope.selected === $.meta.value[$.scope.value_prop],
      class: $=> "cle-select-buttons-button" + clsIf($.scope.isSelected, 'active'),

      h_onclick: ($,e)=>{
        let val = $.meta.value[$.scope.value_prop]
        if ($.scope.multiple){
          if (Array.isArray($.scope.selected)){
            if ($.scope.selected.includes(val)){
              $.scope.selected = $.scope.selected.filter(v=>v!==val)
            } else { 
              $.scope.selected = [...$.scope.selected, val]
            }
          }
          else {
            $.scope.selected = [val]
          }
        } 
        else { 
          if ($.scope.selected === val){
            $.scope.selected = undefined
          } else {
            $.scope.selected = val
          }
        }
      }

    }, Placeholder("valueTemplate", { default_component: f`@value[@label_prop]`}))
)
import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf} from "../../lib/caged-le.js"

import { BootstrapIcon } from "../vendor-dependent/bootstrap-icon.component/bootstrap-icon.js"

const ElementInterfaceSample = [
  {label: "Element 1", isOpen: true, childs: ['...']}
]

const DynamicTreeNavElement = ($parent, state, {depth=0, parentElement, elements=[]})=>{

  return cle.div({ meta: {forEach: "element", of: elements}, 
      style: {
        marginLeft: depth === 0 ? 'unset' : '25px',
      }
  }, 
    
    cle.div({
      h_onclick: $=>{
        $.scope.element.isOpen = !$.scope.element.isOpen
        $.scope._mark_element_as_changed()
      },
      style: {
        marginBottom: "5px",
        display: "flex",
        cursor: "pointer"
      }
    }, 
      Use(BootstrapIcon, {...input("icon", f`@element.isOpen ? 'bi-caret-down-fill' : 'bi-caret-right-fill'`), meta: {if: $=>$.scope.element?.childs?.length > 0}, a_style: "margin-top: -1.5px"}),
      cle.span({style: "margin-left: 5px"}, f`@element.label`)
    ),

    cle.div({ meta: { if: $=>(parentElement || {isOpen: true})?.isOpen && $.scope.element.isOpen},
      onInit: $=>{
        if (elements.length > 0){
            $.u.clearLazyRender()
            $.u.lazyRender(DynamicTreeNavElement, pass, {depth: depth+1, parentElement: $.scope.element, elements: $.scope.element?.childs})
        }
      },
      onDestroy: $=>{
        $.u.clearLazyRender()
      }
    }),
  )
}

export const TreeNav = cle.div({ //class: "cle-treenav-wrapper",
    ...input(str.elements, []),
    ...input(str.fontSize, "1rem"),

    // todo: classi e styling decente
  },

    DynamicTreeNavElement(pass, pass, {elements: $=>$.parent.elements})
)
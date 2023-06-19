import {f, cle, Bind, SmartAlias, str, input, toInlineStyle} from "../../lib/caged-le.js"

export const AutoCompleteField = cle.div({
    ...input(str.text, ""),
    ...input(str.autocompleteValues, []),
    ...input(str.minLen, 0),
    ...input(str.maxNumValues, 10),
  
    props:{ 
      realText: SmartAlias(`@text`),
      filteredValues: [],
      autocompleteVisible: false
    },

    a_class: "cle-autocomplete-wrapper",

    s_css: {
      
      ".cle-autocomplete-wrapper": [{position: "relative"}],

      ".cle-autocomplete-input": [{
        width: '100%'
      }],

      ".cle-autocomplete-value-list-wrapper": [{
        border: '1px solid black', position: "absolute", width: "100%", verflowY: 'auto', background: "white", zIndex: "2"
      }],

      ".cle-autocomplete-value-list-value": [{
        width: '100%'
      }],

    },
  }, 

    cle.input({
      
      ha_value: Bind(f`@realText`),

      def_filterValues: ($, text) => {
        if(text.length >= $.scope.minLen){
          $.scope.filteredValues = $.scope.autocompleteValues.filter(
            v=>v.toLowerCase().startsWith(text.toLowerCase())
          ).filter((_,i)=>i < $.scope.maxNumValues)
        }
        else {
          $.scope.filteredValues = []
        }
      },
      
      handle_oninput: ($, e)=>{
        $.this.filterValues(e.target.value)
      },

      when_focusin: $=>{
        $.this.filterValues($.scope.realText)
        $.scope.autocompleteVisible = true
      },

      when_focusout: $=>{ // when use under the hood "addEventListener"..on chrome the handle (that use obj.onxxx = ()=>{}) is buggy for some evt!
        setTimeout(() => {
          $.scope.autocompleteVisible = false
        }, 300);
      },
      
      a_class: "cle-autocomplete-input"
    }),

    cle.div({ meta: { if: $=>$.scope.autocompleteVisible && $.scope.filteredValues.length > 0},
      a_class: "cle-autocomplete-value-list-wrapper" 
    }, 

      cle.div({ meta: {forEach: "val", of: f`@filteredValues`},

        handle_onclick: ($, e)=>{ 
          e.stopPropagation();
          console.log("new value clicked!!")
          $.scope.realText = $.scope.val
          $.scope.autocompleteVisible = false // implicito?
        },

        // when_focusin: $=>{
        //   $.scope.autocompleteVisible = false
        // },

        a_class: "cle-autocomplete-value-list-value"

      }, 
        f`@val`
      )
    )
  )
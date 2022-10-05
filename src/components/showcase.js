import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS} from "../lib/caged-le.js"

import { Table } from "./table.component/table.js"
import { Tab, Tabs } from "./tab.component/tab.js"
import { AutoCompleteField } from "./autocomplete.component/autocomplete.js"

const useMilligram = false


const DemoTable = [
  cle.div( useMilligram ? {a_style: "padding: 5px"} : {},
    Use(Table, {

      let_pagination_enabled: true,
      let_pageSize: 5,

      onInit: async $=>{
        let table = {
        columns: ["col1", "col2"],
        data: [
            {col1: 1, col2: "hello"},
            {col1: 2, col2: "world"},
            {col1: 3, col2: "!!"},
            {col1: 1, col2: "hello"},
            {col1: 2, col2: "world"},
            {col1: 3, col2: "!!"},
            {col1: 1, col2: "hello"},
            {col1: 2, col2: "world"},
            {col1: 3, col2: "!!"},
            {col1: 1, col2: "hello"},
            {col1: 2, col2: "world"},
            {col1: 3, col2: "!!"},
          ]
        }

        $.this.setData(table, false)
      },

      on_dbus_changeTableData: ($, table)=>{
        $.this.setData(table, false)
      }
    })
  ),

  /* TableButtonConnector = */ { Connector: {

    dbus_signals: {
      changeTableData: "stream => new_table"
    },

  }},

  cle.button({
    text: "change data",

    h_onclick: $=>$.dbus.changeTableData.emit({
      columns: ["cola", "colb"],
      data: [
          {cola: "a", colb: "b"},
          {cola: "a2", colb: "b2"},
          {cola: "a3", colb: "b3"},
          {cola: "a4", colb: "b4"},
        ]
      })
  }),
]


const DemoTabs = Tabs( {  let_testFor: [2,3,4],   let_testIf: false,   afterChildsInit: $ => { /* simulate changes */ setTimeout(() => { $.this.testIf=true }, 2000);  setTimeout(() => { $.this.testFor=[7,8,9] }, 4000); } },

  Tab({ 
    label: "Tab 1",
    content: { div: { text: "Content 1" }}
  }),

  Tab({ meta: {forEach: "tab", of: $=>$.scope.testFor },
    label: $=>`Tab ${ $.scope.tab }`,
    content: { div: { text: $=>`Content ${ $.scope.tab }`, a_style: $=>$.scope.tab % 2 === 0 ? "padding: 25px" : null,}}
  }),

  Tab({ meta: { if: $=>$.scope.testIf},
    label: "Tab IF",
    labelRestyle: ()=>$=>({color: $.this.isActive ? "red" : "grey" }), // width: "100px", textAlign: "right"
    content: { div: { text: "Content IF", h_onclick: $=>{$.scope.testIf = false}}}
  }),

)


const DemoAutoCompleteField = cle.div({ 
  let_final_text: "",
  on_this_final_textChanged: ($,v)=>console.log("final text changed!", v)
}, 
  Use(AutoCompleteField, { 
    let_text: "", 
    let_autocompleteValues: ["hello", "hey", "hi", "world", "wow", "wonder"],
    let_maxNumValues: 5,

    on_this_textChanged: ($, v) => { $.scope.final_text = v },

    s_css: { 
      ".cle-autocomplete-wrapper": [{width: "50%"}],
      ".cle-autocomplete-value-list-value": [ExtendSCSS, {fontWeight: "600"}] 
    }
  })
)


LE_InitWebApp(async ()=>{

  if (useMilligram){
    await Promise.all([
      LE_LoadCss('https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic'),
      LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css'),
      LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css'),
    ])
  }

  RenderApp(document.body, { div: { '': [
    
    ...DemoTable,

    cle.hr({}),
    
    DemoTabs,

    DemoAutoCompleteField

  ]}})
})
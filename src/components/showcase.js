import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../lib/caged-le.js"

import { Table } from "./table.component/table.js"


const TableButtonConnector = { Connector: {

    dbus_signals: {
      changeTableData: "stream => new_table"
    },

}}

LE_InitWebApp(async ()=>{


  RenderApp(document.body, { div: { '': [
    

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
    }),

    TableButtonConnector,

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


  ]}})
})
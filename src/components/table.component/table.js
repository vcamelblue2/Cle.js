const range = (start, end, increment=1)=>{
  let res = []
  for (let i=start; i<=end; i+=increment){
    res.push(i)
  }
  return res
}

export const Table = {
  div: {

    props: {
      columns: [], // ["col1", "col2", "col3"],
      data: [],
      // [
      //   {col1: 1, col2: 2, col3: 3},
      //   {col1: 4, col2: 5, col3: 6},
      //   {col1: 7, col2: 8, col3: 9},
      //   {col1: 10, col2: 11, col3: 12},
      // ],

      cell_width: $=>({ size: ($.this.columns.length > 8 ? 100*($.this.columns.length/8) : 100)/$.this.columns.length, unit: "%" }),
      width: $=>$.this.cell_width.unit==="%" ? "100%" : undefined,

      // sorting
      latest_sorted_by_col: undefined,
      latest_sorted_method: undefined,

      // pagination
      pagination_enabled: false,
      pageSize: 25,
      pageIndex: 0,
      numPages: $=>Math.ceil($.this.data.length / $.this.pageSize)+1,

      // DONT OVERWRITE!
      converted_data: $=>$.this.data.length > 0 && $.this.columns?.map(c=>({column: c, data: ($.this.pagination_enabled ? $.this.data.slice($.this.pageIndex*$.this.pageSize, ($.this.pageIndex+1)*$.this.pageSize) : $.this.data).map(d=>d[c]) })),

      data_ready: false
    },

    def: {
      setData: ($, table, autopagination=false) => {
          $.this.data_ready = false

          if(autopagination){
            $.this.pagination_enabled = table.data.length > 50
          }
          // console.log((new Date()).getTime())
          $.this.columns = table.columns
          // console.log((new Date()).getTime())
          $.this.data = table.data
          // console.log((new Date()).getTime())
          $.this._mark_numPages_as_changed() // fix le if problem
          // console.log((new Date()).getTime())
          
          $.this.latest_sorted_by_col = undefined
          $.this.latest_sorted_method = undefined

          if ($.this.pagination_enabled){
            $.this.pageIndex = 0
          }
          
          $.this.data_ready = true
      },
      sortBy: ($, col) => {
        let is_same_column = $.this.latest_sorted_by_col === col

        let ascending_ordering = (a, b) => a[col] === b[col] ? 0 : (a[col] > b[col] ? 1 : -1)
        let descending_ordering = (a, b) => a[col] === b[col] ? 0 : (a[col] > b[col] ? -1 : 1)

        let sorting_function = is_same_column && $.this.latest_sorted_method==="asc" ? descending_ordering : ascending_ordering

        $.this.data = $.this.data.sort(sorting_function)
        $.this._mark_data_as_changed()
        $.this._mark_converted_data_as_changed()
        $.this.latest_sorted_by_col = col
        $.this.latest_sorted_method = $.this.latest_sorted_method === "asc" ? "desc" : "asc"
      }
    },

    a_style: $=>({display: "inline-block", overflowY:"auto", overflowX:"auto", whiteSpace: "nowrap", width: $.this.width, border: "1px solid gray"}),

    "=>": [
      // avoid multiple rendering during data switch
      { div: { meta: { if: $ => $.scope.data_ready },
        '=>': [
            
          // table
          { div: { meta: {forEach: "data_col", of: $=>$.scope.converted_data, define: {index: "col_idx", last: "isLastCol"}},
              a_style: $=>({display: "inline-block", width: $.scope.cell_width.size+$.scope.cell_width.unit, borderRight: $.meta.isLastCol ? undefined : "1px solid gray"}), //$.scope.columns.lenght

              "=>": [
                // header
                { div: {
                    a_style: $=>({ 
                      backgroundColor: "#dddddd", borderBottom: "1px solid gray",
                      color: $.meta.data_col.column === $.scope.latest_sorted_by_col ? 'green' : 'unset',
                      fontWeight: "600"
                    }),

                    text: [
                      $=>$.meta.data_col.column,
                      $=>$.meta.data_col.column === $.scope.latest_sorted_by_col ? (({'asc': ' (asc)', 'desc': ' (desc)'})[$.scope.latest_sorted_method]) : ''
                    ],

                    h_onclick: $=>{
                      $.scope.sortBy($.meta.data_col.column)
                    }
                }},

                // rows (by column)
                { div: { meta: { forEach: "value", of: $=>$.meta.data_col.data, define: {index: "row_idx", last: "isLastRow"} },
                    a_style: $=>({ backgroundColor: $.meta.row_idx % 2 === 0 ? "#ffffff" : "#f3f3f3", borderBottom: $.meta.isLastRow ? undefined : "1px solid gray"}), //$.scope.columns.lenght
                    text: $=>$.meta.value
                }}
              ]
          }},

          // pagination
          { div: { meta: { if: $=>$.scope.pagination_enabled},

            a_style: {maxWidth: "100%", overflowY: "auto"},

            "=>": [

              {br:{}},

              "Pages: ",

              { button: {
                text: "<<",
                h_onclick: $=>{
                  $.scope.pageIndex = Math.max(0, $.scope.pageIndex-10)
                }
              }},
              { button: {
                text: "<",
                h_onclick: $=>{
                  $.scope.pageIndex = Math.max(0, $.scope.pageIndex-1)
                }
              }},

              $=>" "+($.scope.pageIndex+1)+"/"+($.scope.numPages-1)+" ",

              { button: {
                text: ">",
                h_onclick: $=>{
                  $.scope.pageIndex = Math.min($.scope.pageIndex+1, $.scope.numPages-2)
                }
              }},
              { button: {
                text: ">>",
                h_onclick: $=>{
                  $.scope.pageIndex = Math.min($.scope.pageIndex+10, $.scope.numPages-2)
                }
              }},

              // { span: { meta: { forEach: "page", of: $=>range(0, $.scope.numPages-1), define: {index: "idx", last: "isLast"}},
              //   text: $=>($.meta.page+1)+($.meta.isLast?"":", "),
              //   h_onclick: $=>{ $.scope.pageIndex = $.meta.page }
              // }}
            ]
          }},
      ]}}

    ]
  }
}


// usage example

// Use(Table, {
//   onInit: async $=>{
//     let table = {
//       columns: ["col1", "col2"],
//       data: [
//         {col1: 1, col2: "hello"},
//         {col1: 2, col2: "world"},
//         {col1: 3, col2: "!!"},
//       ]
//     }
//     $.this.setData(table)
//   }
// })
import { Placeholder } from "../../../lib/caged-le.js"

const range_0_to = (to)=>[...Array(to).keys()]

export const Steps = {
  div: {

    props: {
      num_steps: 1,
      step_idx: 0,

      completed_color: "#27ae60",
      to_be_completed_color: "#c0392b",

      show_percentage: true,

      size: 100
    },

    "=>":[
      { div: { meta: { forEach: "step", of: $=>range_0_to($.scope.num_steps), define: {last: "isLast"}},
      
        props: {
          is_completed: $=>$.meta.step < $.scope.step_idx
        },
        
        a: { style: $=>({
          width: ($.scope.size/$.scope.num_steps)+"px", 
          height: "10px", 
          backgroundColor: $.this.is_completed ? $.scope.completed_color : $.scope.to_be_completed_color,
          borderRight: $.meta.isLast ? null : "0.25px solid #ffffff33",
          display: "inline-block"
        })}

      }},

      Placeholder("percentage", { default_component: { span: { meta: {if: $=>$.scope.show_percentage},
        attrs: { style: "margin-left: 10px" },
        text: $=>$.scope.step_idx / $.scope.num_steps + "%" 
      }} })
    ]
  }
}


// Extended(Steps, {
//   props: {
//     num_steps: $=>$.meta.instance.todo,
//     step_idx: $=>$.meta.instance.done,
//   },
//   a: { style: {display: "inline-block", margin: "0 10px"}}
// }),



export const SimpleSteps = { div: {

  props: {
    num_steps: 1,
    step_idx: 0,

    show_percentage: true,

    style_width: "100%",
    style_height: "10px",

    style_completed_color: "#27ae60",
    style_to_be_completed_color: "#c0392b",

    style_extra: {},
  },

  "=>": [

    { div: {

      attrs: { style: $=>({
        width: $.scope.style_width,
        height: $.scope.style_height,
        backgroundColor: $.scope.style_to_be_completed_color,
        display: "inline-block",
        ...$.scope.style_extra
      })},

      "=>": [

        { div: { 
          attrs: { style: $=>({
            width: ($.scope.step_idx/$.scope.num_steps * 100) + "%",
            height: $.scope.style_height,
            backgroundColor: $.scope.style_completed_color
          })},
        }},

      ]
    }},

    Placeholder("percentage", { default_component: { span: { meta: {if: $=>$.scope.show_percentage},
      attrs: { style: "margin-left: 10px;" },
      text: $=>Math.round($.scope.step_idx / $.scope.num_steps * 100) + "%" 
    }} })
  ]

}}

      
// Extended(SimpleSteps, { 
//   props: { 
//     num_steps: 100,
//     step_idx: 20,

//     style_width: "calc(100% - 100px)", 
//     style_extra: {display: "inline-block"},
//   }
// })
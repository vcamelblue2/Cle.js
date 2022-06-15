import {pass, none, smart, Use, f, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, Alias} from "../../../lib/caged-le.js"
import { NavSidebarLayout } from "../../../layouts/layouts.js"
import { ganttModelApi } from "../model/api.js"

const Navbar = (navbarContents={ div: { text: "Nav", 'ha.style.fontSize': "2rem" }})=>({ div: {

    'a.style': {
        backgroundColor: "#2d3436", //"#2d3436",
        color: "#dddddd",
        height: "60px",
        padding: "10px 1rem"
    },

    text: navbarContents
}})

const Sidebar = (sidebarContents)=>({ div: {

    'a.style': {
        backgroundColor: "#2d3436",
        color: "#dddddd",
        minHeight: "100%",
        borderRight: "0.25px solid #aaaaaa",
        padding: "10px 1rem"
    },
    
    "=>": [
        { div: { 'a.style': {fontWeight: "100", fontSize: "1.9rem", paddingBottom: "0px", paddingLeft: "10px", backgroundColor: "#f1c40f", color: "white", display: "flex", justifyContent: "center", position: "sticky", top: "10px"}, text: "Gantt Logo"}},
        
        ...sidebarContents,
    ]
}})

const MainContent = (Components)=>({ div: {
    'a.style': {
        minHeight: "calc(100vh - 60px)",
        backgroundColor: 'white',
        padding: "10px"
    },

    "=>": Components
}})

const MainLayout = ({NavbarContents, SidebarComponents, MainContentComponents}={})=>Extended(NavSidebarLayout({
    navbar: Navbar(NavbarContents),
    sidebar: Sidebar(SidebarComponents),
    main_content: MainContent(MainContentComponents)
}))


const NUM_DAYS = 365*2
const DAY_SIZE_PX = 18
const HEDADER_WIDTH = 300
const GRAPH_WIDTH = ((NUM_DAYS*DAY_SIZE_PX)+(HEDADER_WIDTH)+20)

const getCalendar = (today_date = new Date(), num_days=NUM_DAYS, group_by_year_month=false)=>{
  const ONE_DAY = 24*60*60*1000

  let today_date_as_millis = today_date.getTime()
  let today_day = today_date.getDate()
  let first_day_as_millis = today_date_as_millis - ((today_day-1) * (ONE_DAY))
  let first_day_date = new Date(first_day_as_millis)

  let actual_date = first_day_date
  let result = []

  for (let i of [...Array(num_days).keys()]){
    result.push({date: actual_date, date_str: (actual_date.getFullYear()-2000) + "-" + (actual_date.getMonth()+1) + "-" + actual_date.getDate()})
    actual_date = new Date(actual_date.getTime()+ONE_DAY)
  }
  
  if (!group_by_year_month){
    return result
  }
  else {
    let groups = {}
    for (let res of result){
      let group_key = (res.date.getFullYear()-2000) + "-" + (res.date.getMonth()+1)
      if( group_key in groups){
        groups[group_key].push(res)
      }else{
        groups[group_key] = [res]
      }
    }
    return Object.entries(groups).map(([g,v])=>({month:g, days: v}))
  }
}


// $$ means sub app / new dynamic render
const $$GanttActivityEditor = ({parent, activity, onConfirm, onCancel, onDelete}={})=>({ div: {

  props: {
    parent: parent, 
    name: activity.name,
    color: activity.color,
    start: activity.start,
    len: activity.len,

    days: getCalendar(new Date("2022-06-01"), NUM_DAYS, false)
  },

  handle: { onclick: ($, evt) => { evt.stopPropagation(); onCancel() } },

  '':[

    { div: {

      handle: { onclick: ($, evt) => { evt.stopPropagation(); } },

      '': [

        { h5: { text: "Activity" }},
        { input: { 
          'ha.value': Bind($ => $.scope.name)
        }},

        { h5: { text: "Color" }},
        { input: { 
          'ha.value': Bind($ => $.scope.color)
        }},
        { div: { text: "", a_style: $=>({backgroundColor: $.scope.color, width: "40px", height: "20px"}) }},

        { h5: { text: "Start" }},
        { input: { 
          'ha.value': Bind($ => $.scope.start)
        }},
        { div: $=>"20"+$.scope.days[$.scope.start].date_str.replaceAll("-", "/")},

        { h5: { text: "Len" }},
        { input: { 
          'ha.value': Bind($ => $.scope.len)
        }},
        { div: $=>"20"+$.scope.days[parseInt($.scope.start)+parseInt($.scope.len)].date_str.replaceAll("-", "/")},

        { br: {}},
        { br: {}},

        { button: { text: "Cancel", handle: { onclick: $=>onCancel() }}},
        { button: { text: "Delete", handle: { onclick: $=>onDelete() }, meta: {if: $=>onDelete !== undefined}}},
        { button: { text: "Confirm", handle: { onclick: $=>onConfirm({name: $.scope.name, color: $.scope.color, start: $.scope.start, len: $.scope.len}) }}}
      ],

      a_style: `
        width: 50%;
        height: 90%;
        position: relative;
        background: white;
        top: 5%;
        left: 25%;
        border: 3px solid black;
        border-radius: 25px;
        padding: 25px;
      `,

    }}
    
  ],

  a_style: `
    width: 100%;
    height: 100%;
    position: fixed;
    background: #00000033;
    top: 0px;
    left: 0px;
    z-index: 9999;
  `,
  
}})
const openActivityEditor = $=>{

  let app;

  let onConfirm = (edits)=>{
    $.le.api.editActivity($.scope.project.id, $.scope.activity, edits)
    app.destroy()
    app = undefined
  }
  let onCancel = ()=>{
    app.destroy()
    app = undefined
  }
  let onDelete = ()=>{
    $.le.api.deleteActivity($.scope.project.id, $.scope.activity.id)
    app.destroy()
    app = undefined
  }
  app = RenderApp(document.body, $$GanttActivityEditor({parent: $.this, activity: $.scope.activity, onConfirm: onConfirm, onCancel: onCancel, onDelete: onDelete}))
}


// $$ means sub app / new dynamic render
const $$GanttSubTaskEditor = ({parent, subtask, onConfirm, onCancel}={})=>({ div: {

  props: {
    parent: parent, 
    idx: subtask.idx,
    name: subtask.name,
    description: subtask.description,
  },

  handle: { onclick: ($, evt) => { evt.stopPropagation(); onCancel() } },

  '':[

    { div: {

      handle: { onclick: ($, evt) => { evt.stopPropagation(); } },

      '': [

        { h5: { text: "SubTask" }},
        { input: { 
          'ha.value': Bind($ => $.scope.name)
        }},

        { h5: { text: "Description" }},
        { textarea: { 
          'ha.value': Bind($ => $.scope.description),  a_style: "height: 100px"
        }},
        { br: {}},
        { br: {}},

        { button: { text: "Cancel", handle: { onclick: $=>onCancel() }}},
        { button: { text: "Confirm", handle: { onclick: $=>onConfirm({idx: $.scope.idx, name: $.scope.name, description: $.scope.description}) }}}
      ],

      a_style: `
        width: 50%;
        height: 50%;
        position: relative;
        background: white;
        top: 25%;
        left: 25%;
        border: 3px solid black;
        border-radius: 25px;
        padding: 25px;
      `,

    }}
    
  ],

  a_style: `
    width: 100%;
    height: 100%;
    position: fixed;
    background: #00000033;
    top: 0px;
    left: 0px;
    z-index: 9999;
  `,
  
}})
const openSubTaskEditor = $=>{

  let app;

  let onConfirm = (edits)=>{
    $.le.api.editSubTask($.scope.project.id, $.scope.activity, $.scope.subtask, edits, true)
    app.destroy()
    app = undefined
  }
  let onCancel = ()=>{
    app.destroy()
    app = undefined
  }
  app = RenderApp(document.body, $$GanttSubTaskEditor({parent: $.this, subtask: $.scope.subtask, onConfirm: onConfirm, onCancel: onCancel}))
}


const GanttRowActivityHeader = { div: {
  let_buttons_visible: false,

  handle_onmouseenter: $=>{
    $.this.buttons_visible = true
  },
  handle_onmouseleave: $=>{
    $.this.buttons_visible = false
  },

  '': [
    { span: { 
      '': [
        
        { span: { 

          def_openActivityEditor: openActivityEditor,

          handle_onclick: $=>$.this.openActivityEditor(),

          text: f`@activity.name`, 
          a_style: "overflow-y: auto; max-width: "+(2*HEDADER_WIDTH/3)+"px; overflow-wrap: anywhere; display: inline-table;"
        }},

        { span: {   meta: { if: f`@buttons_visible`},

          '': [

            { button: {

              text: "-",

              handle_onclick: async $=> await $.le.api.decrementActivityLen($.scope.project.id, $.scope.activity),

              a_style: "width: 25px; margin-left: 5px; border: 1px solid #dddddd; border-radius: 20px; background: none; cursor: pointer"
            }},

            { button: {

              text: "<",

              handle_onclick: async $=> await $.le.api.moveActivityLeft($.scope.project.id, $.scope.activity),

              a_style: "width: 25px; margin-left: 5px; border: 1px solid #dddddd; border-radius: 20px; background: none; cursor: pointer"
            }},

            { button: {

              text: "^",

              handle_onclick: async $=> await $.le.api.moveActivityUp($.scope.project.id, $.scope.activity_idx),

              a_style: "width: 25px; margin-left: 5px; border: 1px solid #dddddd; border-radius: 20px; background: none; cursor: pointer"
            }},

            { button: {

              text: "v",

              handle_onclick: async $=> await $.le.api.moveActivityDown($.scope.project.id, $.scope.activity_idx),

              a_style: "width: 25px; border: 1px solid #dddddd; border-radius: 20px; background: none; cursor: pointer"
            }},

            { button: {

              text: ">",

              handle_onclick: async $=> await $.le.api.moveActivityRight($.scope.project.id, $.scope.activity),

              a_style: "width: 25px; margin-left: 5px; border: 1px solid #dddddd; border-radius: 20px; background: none; cursor: pointer"
            }},

            { button: {

              text: "+",

              handle_onclick: async $=> await $.le.api.incrementActivityLen($.scope.project.id, $.scope.activity),

              a_style: "width: 25px; margin-left: 5px; border: 1px solid #dddddd; border-radius: 20px; background: none; cursor: pointer"
            }},
          
          ]
        }}

      ],

      a_style: "display: flex; justify-content: space-between;", 

    }}
  ],

  a_style: "width: "+HEDADER_WIDTH+"px; display: inline-block"

}}
const GanttRowActivityGraph = { div: {

  def_completeMoove: async $=>{
    let new_start =  Math.max(0, $.scope.activity.start+ Math.round($.this.tmp_offset/DAY_SIZE_PX))
    await $.le.api.editActivity($.scope.project.id, $.scope.activity, {...$.scope.activity, start: new_start})
  },

  let_tmp_offset: 0,
  let_drag_enabled: false,
  let_has_edits: false,
  let_initial_X: 0,
  let_latest_offset: 0,
  handle_onmousedown: ($, e)=>{$.this.tmp_offset=0; $.this.latest_offset=0; $.this.initial_X=e.screenX; $.this.has_edits=false; $.this.drag_enabled=true},
  handle_onmouseup: $=>{$.this.latest_offset = $.this.tmp_offset; $.this.drag_enabled=false; $.this.has_edits && $.this.completeMoove()},
  handle_onmouseleave: $=>{if ($.this.drag_enabled){$.this.latest_offset = $.this.tmp_offset; $.this.drag_enabled=false; $.this.has_edits && $.this.completeMoove()}},
  handle_onmousemove: ($, e)=>{
    if($.this.drag_enabled){
      let new_offset = $.this.latest_offset + e.screenX - $.this.initial_X
      if (new_offset !== $.this.tmp_offset && Math.abs(new_offset) > 10){
        $.this.tmp_offset = new_offset
        $.this.has_edits = true
      }
      // console.log(Math.floor($.this.tmp_offset/DAY_SIZE_PX))
    }
  },


  let_subtasks: Alias($=>$.scope.activity.subtasks, ($,v)=>{$.scope.activity.subtasks=v}),
  let_subtask_position: DAY_SIZE_PX,

  def_addOrRemoveSubtask: ($, idx, isMilestone=false)=>{
    if ($.this.subtasks.find(s=>s.idx===idx) !== undefined){
      $.this.subtasks = $.this.subtasks.filter(s=>s.idx!==idx)
    }
    else {
      $.this.subtasks = [...$.this.subtasks, {idx: idx, name: isMilestone ? "M" : "T", description: ""}]
    }
    // $.scope.activity.subtasks = $.this.subtasks // in caso di no alias..mettere poi false in api qui.. 
    $.le.api.editSubTasks($.scope.project.id, $.scope.activity, $.scope.activity.subtasks, true)
  },

  handle_onclick: ($, e)=>{
    console.log(e)
    if(!$.this.has_edits){
      $.this.addOrRemoveSubtask(Math.floor((e.clientX-$.this.el.getBoundingClientRect().left)/DAY_SIZE_PX)*DAY_SIZE_PX, e.metaKey || e.altKey || e.ctrlKey)
    }
  },

  '': [

    { span: { 

      def_openActivityEditor: openActivityEditor,

      handle_onclick: ($, e)=>{ e.stopPropagation(); $.this.openActivityEditor()},

      text: f`@activity.name`, 
    }},

    { div: { meta: { forEach: "subtask", of: f`@subtasks`},

      handle_oncontextmenu: ($,e)=>{
        openSubTaskEditor($)
        e.preventDefault();
        return false;
      },

      text: f`@subtask.name`,

      a_style: $=>({
        width: DAY_SIZE_PX+"px",  
        height: "30px", 
        marginLeft: $.scope.subtask.idx + "px", 
        position: "absolute", 
        top: "0px", 
        padding: "4px", 
        backgroundColor: $.scope.subtask.name === "M" ? 'red' : "orange", 
        textAlign: "center"
      })
    }}
  ],

  a_style: $=>({
    marginLeft: ($.this.tmp_offset+$.scope.activity.start * DAY_SIZE_PX) + "px",
    width: ($.scope.activity.len*DAY_SIZE_PX)+"px",
    height: "30px",
    display: "inline-block",
    backgroundColor: $.scope.activity.color || "green",
    color: "white",
    textAlign: "center",
    overflow: "auto",
    userSelect: "none",
    position: "relative"
  })

}}
const GanttRow = { div: {   meta: {forEach: "activity", of: f`@activities || []`, define: {index: "activity_idx", first: "isFirst", last: "isLast"}},

  '': [
    GanttRowActivityHeader,
    GanttRowActivityGraph
  ],

  a_style: $=>({
    width: "100%",
    // height: $.meta.isLast ? "40px" : "30px",
    display: "flex",
    alignItems: "center",
    // marginBottom: "10px",
    borderTop: "0.5px solid black",
    borderBottom: $.meta.isLast ? "0.5px solid black" : "none",
    paddingTop: "5px",
    paddingBottom: "5px",
  })

}}
const GanttRows  = { div: {

  '': [
    GanttRow,

    { button: {

      text: "Add",

      def_openActivityCreator: $=>{
        let app;

        let onConfirm = (edits)=>{
          $.le.api.addActivity($.scope.project.id, edits.name, edits.color, edits.start, edits.len)
          app.destroy()
          app = undefined
        }
        let onCancel = ()=>{
          app.destroy()
          app = undefined
        }
        app = RenderApp(document.body, $$GanttActivityEditor({parent: $.this, activity: {name: "New..", color: "green", start: 0, len: 5}, onConfirm: onConfirm, onCancel: onCancel}))
      },
      handle_onclick: $=>$.this.openActivityCreator(),

      a_style: "width: "+(HEDADER_WIDTH-5)+"px; margin-top: 5px"
    }}
  ],

  a_style: "width: 100%; display: block; padding-top: 55px; position: relative"
}}


const GanttHeader = { div: {    meta: { if: $=>$.scope.project!==undefined},
  '': [

    { div: {
      text: f`@project?.name`,
      a_style: "width: "+HEDADER_WIDTH+"px; heigth: 100%; display: inline-block; font-weight: 600; font-size: 1.9rem",
    }},
    
    // { div: {   meta: {forEach: "day", of: $=>getCalendar(new Date($.scope.project?.startDate), NUM_DAYS)},

    //   text: f`@day.date.getDate()`,

    //   a_style: "width: "+DAY_SIZE_PX+"px; height: 100%; display: inline-block; font-size: 10px; border-left: 1px dashed #00000055",
    // }},
    
    { div: {   meta: {forEach: "month", of: $=>getCalendar(new Date($.scope.project?.startDate), NUM_DAYS, true)},

      '': [
        { div: {
          text: f`20+@month.month`,

          a_style: "text-align: center"
        }},

        { div: {    meta: {forEach: "day", of: f`@month.days`},
        
          text: f`@day.date.getDate()`,

          a_style: $=>({
            width: DAY_SIZE_PX+"px",
            height: "100%",
            display: "inline-block",
            fontSize: "9px",
            borderLeft: $.scope.today === $.scope.day.date_str ? "2px solid orange" : "0.5px dashed #00000055",
            color: ([0,6].includes($.scope.day.date.getDay()) ? 'orange' : 'black'),
            fontWeight: $.scope.today === $.scope.day.date_str ? "900" : "unset",
            backgroundColor: ([0,6].includes($.scope.day.date.getDay()) ? '#eeeeee' : 'white')
          }),
        }}

      ],

      a_style: "height: 100%; display: inline-block; border-left: 0.5px solid #00000055",

    }}

  ],
  a_style: "width: "+GRAPH_WIDTH+"px; height: 100vh; display: block; position: absolute;"
}}


const Gantt = { div: {

  let_activities: $=>($.scope.project?.activities || []),

  on_this_activitiesChanged: $=>{
    console.log("activites changed!", $.this.activites)
  },

  '': [
    GanttHeader,
    GanttRows
  ],

  a_style: "width: "+GRAPH_WIDTH+"px"

}}

const Api = { Controller: {

  id: "api",

  onInit: async $ => {
    await $.this.getProjects()
    await $.this.getProject()
    console.log($.this.project)
  },

  def: {
    getProjects: async ($)=>{
      $.scope.projects = await ganttModelApi.getProjects()
    },
    getProject: async ($, id='p0')=>{
      $.scope.project = await ganttModelApi.getProject(id)
    },

    editActivity: async ($, project_id, activity, edits)=>{
      await ganttModelApi.editActivity(project_id, activity, edits)
      await $.this.getProject()
    },
    addActivity: async ($, project_id, name, color, start, len)=>{
      await ganttModelApi.addActivity(project_id, {name: name, color: color, start: start, len: len})
      await $.this.getProject()
    },
    deleteActivity: async ($, project_id, activity_id)=>{
      await ganttModelApi.deleteActivity(project_id, activity_id)
      await $.this.getProject()
    },

    moveActivityUp: async ($, project_id, activity_idx)=>{
      await ganttModelApi.moveActivityUp(project_id, activity_idx)
      await $.this.getProject()
    },
    moveActivityDown: async ($, project_id, activity_idx)=>{
      await ganttModelApi.moveActivityDown(project_id, activity_idx)
      await $.this.getProject()
    },
    moveActivityLeft: async ($, project_id, activity)=>{
      await ganttModelApi.moveActivityLeft(project_id, activity)
      await $.this.getProject()
    },
    moveActivityRight: async ($, project_id, activity)=>{
      await ganttModelApi.moveActivityRight(project_id, activity)
      await $.this.getProject()
    },
    incrementActivityLen: async ($, project_id, activity)=>{
      await ganttModelApi.incrementActivityLen(project_id, activity)
      await $.this.getProject()
    },
    decrementActivityLen: async ($, project_id, activity)=>{
      await ganttModelApi.decrementActivityLen(project_id, activity)
      await $.this.getProject()
    },

    editSubTasks: async ($, project_id, activity, subTasks, fullRefresf=false)=>{
      await ganttModelApi.editSubTasks(project_id, activity, subTasks)
      if(fullRefresf){
        await $.this.getProject()
      }
    },
    editSubTask: async ($, project_id, activity, subtask, edits, fullRefresf=false)=>{
      await ganttModelApi.editSubTask(project_id, activity, subtask, edits)
      if(fullRefresf){
        await $.this.getProject()
      }
    },
  }
}}


export const HomePage = async (state)=>{ return { 
  div: {

    id: "app",

    let_projects: undefined,
    let_project: undefined,
    let_today: (()=>{ let d = new Date; return (d.getFullYear()-2000) +"-"+ (d.getMonth()+1) +"-"+ (d.getDate())})(),

    def_editActivity: async ($, project_id, activity, edits)=>{
      await ganttModelApi.editActivity(project_id, activity, edits)
      $.this.project = await ganttModelApi.getProject()
    },


    '':[
      
      Api,

      MainLayout({

        NavbarContents:[

          { span: {
            text: "Gantt Chart",
            'a.style': "font-size: 1.9rem; margin-left: 15px; margin-right: 15px;"
          }}

        ], 
        SidebarComponents:[
          { div: { a_style: "width: 200px", '': [
            { h4: "Projects"},
            { h5: {   meta: { forEach: "proj", of: f`@projects || []`},
              text: f`'- '+@proj.name`,
              a_style: "margin-left: 25px"
            }}
          ]}}
        ], 
        MainContentComponents:[
          Gantt
        ]
      }),


      // CSS overwriter 
      { Css: { css: [
        '.grid-layout {grid-template-columns: auto auto auto auto auto auto;} ',
        '.navbar {position: sticky; top: 0px; z-index: 1000; }'
      ]}}
    ],

    attrs: { style: "width: 100%; height: 100%; padding: 0px; margin: 0px;" },
    css: [ `* { box-sizing: border-box !important;} body { padding: 0px; margin: 0px; }` ],
  }
}}

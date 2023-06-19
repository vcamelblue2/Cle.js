import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../../../lib/caged-le.js"
import {Router} from "../router/routing.js"

import { NavSidebarLayout } from "../../../layouts/layouts.js"

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
        { div: { 'a.style': {fontWeight: "100", fontSize: "1.9rem", paddingBottom: "0px", paddingLeft: "10px", backgroundColor: "#f1c40f", color: "white", display: "flex", justifyContent: "center", position: "sticky", top: "10px"}, text: "Planner Logo"}},
        
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


export const MainLayout = ({NavbarContents, SidebarComponents, MainContentComponents}={})=>Extended(NavSidebarLayout({
    navbar: Navbar(NavbarContents),
    sidebar: Sidebar(SidebarComponents),
    main_content: MainContent(MainContentComponents)
}))






const range = (start, end, increment=1)=>{
  let res = []
  for (let i=start; i<=end; i+=increment){
    res.push(i) 
  }
  return res
}

const getMonthDays = (today_date = new Date())=>{
  let today_date_as_millis = today_date.getTime()
  let today_day = today_date.getDate()
  let first_day_as_millis = today_date_as_millis - ((today_day-1) * (24*60*60*1000))
  let first_day_date = new Date(first_day_as_millis)
  
  let first_day_week_day = first_day_date.getDay()
  first_day_week_day = first_day_week_day === 0 ? 6 : first_day_week_day-1
  while(first_day_week_day !== 0){

    first_day_as_millis = first_day_date - (24*60*60*1000)
    first_day_date = new Date(first_day_as_millis)
    
    first_day_week_day = first_day_date.getDay()
    first_day_week_day = first_day_week_day === 0 ? 6 : first_day_week_day-1
    // console.log(first_day_date)
  }

  let next_date = new Date(first_day_date.getTime())

  let result = []
  if (today_date.getMonth() === 0){ // Gen!
    while( (next_date.getMonth() >= 11 || next_date.getMonth() <= today_date.getMonth() || next_date.getDay()!==1) && result.length < 42){ //cerco lunedì in eng version
      result.push(next_date.getFullYear() + "-" + (next_date.getMonth()+1) + "-" + next_date.getDate())
      next_date = new Date(next_date.getTime() + (24*60*60*1000))
    }
  }
  else if (today_date.getMonth() === 11){ // Dec!
    while( (next_date.getMonth() >= 11 || (next_date.getFullYear() === today_date.getFullYear() && next_date.getMonth() <= today_date.getMonth()) || next_date.getDay()!==1) && result.length < 42){ //cerco lunedì in eng version
      result.push(next_date.getFullYear() + "-" + (next_date.getMonth()+1) + "-" + next_date.getDate())
      next_date = new Date(next_date.getTime() + (24*60*60*1000))
    }
  }
  else {
    while( (next_date.getMonth() <= today_date.getMonth() || next_date.getDay()!==1) && result.length < 42){ //cerco lunedì in eng version
      result.push(next_date.getFullYear() + "-" + (next_date.getMonth()+1) + "-" + next_date.getDate())
      next_date = new Date(next_date.getTime() + (24*60*60*1000))
    }
  }

  return result

}


const Slot = { div: { meta: {forEach:"slot", of: $=>$.scope.slots, define: {index: "idx", last:"isLast"}},

  props: {color: $=>["9-10", "14-15"].includes($.meta.slot) ? "orange" : "#aaaaaa"},
  
  a: { style: $=>({
    width: "100%", minHeight: $.scope.slotHeight+"px", zIndex:1,
    color: $.this.color, 
    borderTop: "0.5px dashed "+($.this.color || "#aaaaaa"),
    // borderBottom: $.meta.isLast ? "0.5px solid #aaaaaa" : undefined,
    paddingBottom: $.meta.isLast ? "10px" : undefined,
  })},
  
  handle: {
    ondragover: ($, ev)=>{ ev.preventDefault() },
    ondrop: ($, ev)=>{
      ev.preventDefault()

      let old_mooving_plan = $.scope.moovingPlan

      let isNextSlotEmpty = $.scope.planned.filter(p=>p!==$.scope.moovingPlan.plan).filter(p=>p.slot_idx === $.meta.idx+1).length === 0
      console.log(isNextSlotEmpty)

      if ("new_plan" in old_mooving_plan){
        $.scope.planned = [...$.scope.planned, {slot_idx: $.meta.idx, len: isNextSlotEmpty ? Math.min(2, $.scope.slots.length - $.meta.idx) : 1, project: old_mooving_plan.plan.project}]
        $.scope.moovingPlan = undefined
        return;
      }
      
      let old_plan = old_mooving_plan.plan
      let available_len = Math.min($.scope.getMaxLenAvailable(old_plan, $.meta.idx), $.scope.slots.length - $.meta.idx)
      
      let new_planned = [...$.scope.planned]
      
      if (!$.scope.isDuplicateRequest){
        if ($.meta.day === old_mooving_plan.day){ // stesso day aka stesso planned!
          new_planned = new_planned.filter(p=>p!==old_plan)
        }
        else {
          $.scope.editPlan(old_mooving_plan.day, old_mooving_plan.planned.filter(p=>p!==old_plan))
        }
      }
      
      new_planned.push({slot_idx: $.meta.idx, len: isNextSlotEmpty ? Math.min(available_len, old_plan.len) : 1, project: old_plan.project})
      
      $.scope.planned = new_planned // $.scope.resolve_plan_conflicts(new_planned)
      
      $.scope.moovingPlan = undefined
      $.scope.isDuplicateRequest = false
    }
  },
  
  text: $=>$.meta.slot
  //, {hr:{ meta: {if: $=>$.meta.isLast}, a: {style:{height:"1px", margin:0, marginTop:"10px"}}}}],
  
}}

const PlannedPlan = { div: { meta: {forEach:"plan", of: $=>$.scope.planned},

  a: { 
    style: $=>({
      position: "absolute", width: "calc(100% - 40px)", height: ($.meta.plan.len*$.scope.slotHeight)+"px", left:"35px", top: ($.meta.plan.slot_idx*$.scope.slotHeight)+"px",
      backgroundColor: $.meta.plan.project.color,
      borderRadius: "7px",
      textAlign: "center",
      //border: "0.5px solid #dddddd",
      //paddingTop: "10%",
      border: "3px solid #ffffffee",
      color: "white"
    }),
    draggable:"true",
  },
  
  handle: {
    // on drag
    ondragstart: ($, evt)=>{
      //console.log(evt)
      setTimeout(()=>{
        $.this.el.style.opacity = 0
        $.this.el.style.height = "1px"
      }, 100)
      $.scope.isDuplicateRequest = evt.altKey
      $.scope.moovingPlan = { plan: $.meta.plan, planned: $.scope.planned, day: $.meta.day }
    },
    ondragend: ($, ev)=>{
      setTimeout(()=>{
        $.this.el.style.opacity = 1;
        $.this.el.style.height = ($.meta.plan.len*$.scope.slotHeight)+"px"
      }, 1)
      
    },
    // on drop
    ondragover: ($, ev)=>{ 
      if ($.scope.moovingPlan.day === $.meta.day || $.scope.moovingPlan.new_plan){ // switch consentito solo intra-day
        ev.preventDefault() 
      }
    },
    ondrop: ($, ev)=>{ // switch plan! (only for existing plan..)
      ev.preventDefault()

      let old_mooving_plan = $.scope.moovingPlan
      let thisPlan = $.meta.plan

      // replace with nel plan
      if ("new_plan" in old_mooving_plan){
        $.scope.planned = [...$.scope.planned.filter(p=>p !== thisPlan), {slot_idx: thisPlan.slot_idx, len: thisPlan.len, project: old_mooving_plan.plan.project}]
        $.scope.moovingPlan = undefined
        return;
      }
      else { // switch plan
        [old_mooving_plan.plan.slot_idx, old_mooving_plan.plan.len, thisPlan.slot_idx, thisPlan.len] = [thisPlan.slot_idx, thisPlan.len, old_mooving_plan.plan.slot_idx, old_mooving_plan.plan.len]
        $.scope.planned = [...$.scope.planned]
        $.scope.isDuplicateRequest = false // todo: support duplication
      }
      
    },
    onclick: ($, evt)=>{
      //console.log(evt)
      const isIncrement = !evt.metaKey
      const amount = 1
      if (isIncrement){
        if ($.meta.plan.slot_idx + $.meta.plan.len + amount <= $.scope.slots.length + 0.1 && $.scope.canIncrementPlan($.meta.plan, amount)){
          $.meta.plan.len += amount
          $.scope.planned = [...$.scope.planned]
        }
      }
      else {
        if ($.meta.plan.len >= 1 && $.meta.plan.len - amount > 0){
          $.meta.plan.len -= amount
          $.scope.planned = [...$.scope.planned]
        }
      }
    }
  },
  
  text: [ 
    { div: { 
      a:{ style:"width: 100%; height: 100%; display:flex; justify-content: center; align-items: center"}, 
      text: $=>$.meta.plan.project.name
    }},
    
    { div: { 
      a:{ style:"font-size: 9px; top: -2px; right: 2px; position: absolute; text-align: right"},  
      handle: {
        onclick: ($, evt)=>{
            evt.stopPropagation()
            evt.preventDefault()
            $.scope.planned = $.scope.planned.filter(p=>p!==$.meta.plan)
        }}, 
      text: "x"
    }}
  ]
}}

const Day = { div: { meta: {forEach: "day", of: $=>$.scope.days, define: {index: "date_idx"}},
  // id: "calendar_item",
  
  onInit: $=>{ 
    $.this.updateDetached = true; 
    $.this.planned = $.scope.plans[$.meta.day] || []; 
    $.this.updateDetached = false;  
  },
  on: { 
    scope: { 
      plannedDayEdited: ($, day, new_plan)=>{ 
        // console.log("plans!", $.meta.day, day, new_plan)
        $.meta.day === day && !$.this.updateDetached && ($.this.planned = new_plan)
        // if ($.scope.plans[$.meta.day] !== $.this.planned ){ $.this.setupPlan() }
        console.log("planned changed")
      }
    },
    this: {
      plannedChanged: ($, plan, old_plan)=> {
        // console.log("changed")
        if (!$.this.updateDetached){ // aka non è una init
          $.this.updateDetached = true
          $.scope.editPlan($.meta.day, plan)
          $.this.updateDetached = false
        }
      }
    }
  },
  
  props: {
    updateDetached: false,
    day: $=>$.meta.day, //"2022-4-1",
    slots: [
      "9-10", "10-11", "11-12", "12-13", 
      "14-15", "15-16", "16-17", "17-18"
    ],
    slotHeight: 25,
    planned: [],
    isDuplicateRequest: false
  },
  
  def: {
    resolve_plan_conflicts: ($, planned)=>{
      let replanned = []
      for(let plan of planned){
        let _plan = {...plan}
        let found_conflict = planned.filter(p=>p!==plan && plan.slot_idx < p.slot_idx+p.len && plan.slot_idx > p.slot_idx)
        if (found_conflict.length > 0){
          let new_start = found_conflict[0].slot_idx+found_conflict[0].len
          let new_len = Math.max(0.5, _plan.len - (new_start-_plan.slot_idx))
          _plan.slot_idx = new_start
          _plan.len = new_len 
          console.log("p", _plan)
        }
        replanned.push(_plan)
      }
      return replanned
    },

    canIncrementPlan: ($, plan, amount)=>{
      let nextSlotIndex = plan.slot_idx + plan.len + amount - 1
      return $.scope.planned.filter(p=>p.slot_idx === nextSlotIndex).length === 0
    },

    getMaxLenAvailable: ($, plan, new_slot_idx)=>{
      let nextOccupedSlots = $.scope.planned.filter(p=>p!==plan).filter(p=>p.slot_idx > new_slot_idx).sort((a,b)=>a-b) // trova il prossimo e ordina per lo slot più piccolo

      if (nextOccupedSlots.length > 0) {
        let max_len = nextOccupedSlots[0].slot_idx - new_slot_idx
        console.log(max_len)
        return max_len
      }
      else {
        let max_len = $.scope.slots.length - new_slot_idx
        console.log(max_len)
        return max_len
      }
    }
  },
  
  a: { style: $=>({
    width: "calc(100vw / 9)", fontSize:"11px", display:"inline-block", border: "0.5px solid #cccccc", borderRadius: "5px",
    backgroundColor: (($.meta.date_idx+1)%7 === 0) || (($.meta.date_idx+2)%7 === 0) ? "#ecf0f1" : "white", 
    opacity: $.scope.viewDay.getMonth()+1 != $.meta.day.split("-")[1] ? 0.3 : undefined,
  })},

  "=>": [

    smart({ div: $=>$.meta.day.split("-").slice(1,3).reverse().map(s=>s.padStart("2", '0')).join("/")}, {'ha.style.marginLeft': '5px', 'ha.style.paddingLeft': '5px', 'ha.style.marginBottom': '5px', 'ha.style.fontSize': '14px', 'ha.style.fontWeight': $=>$.scope.today.getMonth()+1 == $.meta.day.split("-")[1] && $.scope.today.getDate()  == $.meta.day.split("-")[2] ? '900':'inherit'}),

    { div: {
      a: { style: {position: "relative", width: "100%", paddingLeft: "5px", paddingRight: "5px",  marginLeft: "5px", fontSize:"11px"}},

      "=>":[
        Slot,
        
        PlannedPlan,
      ]
    }}

  ]
}}

const Calendar = { div: {
  id: "calendar",
  
  a: {style: {marginTop: "25px"}},

  "=>": { div: {

    a: {style: {marginTop: "25px", display: "grid", gridTemplateColumns: "auto auto auto auto auto auto auto", gridTemplateRows: "auto auto auto auto auto auto", gap: "10px" }},

    "=>": [

      { div: { meta: { forEach: "weekDay", of: $ => ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"] },
        
        attrs: { 
          style: $=>({ 
            display: "inline-block", 
            padding:"5px", 
            border: ["Sabato", "Domenica"].includes($.meta.weekDay) ? "0.75px solid #ecf0f1" : "0.75px solid #eeeeee", 
            backgroundColor: ["Sabato", "Domenica"].includes($.meta.weekDay)?"#ecf0f1":"white", 
            overflow: "hidden", 
            borderRadius:"7px",
            textAlign: "center"
          })
        }, 
        "=>": $=>$.meta.weekDay
      }},

      Day 
    ]
  }}
  
}}

// $$ means sub app / new dynamic render
const $$ProjectEditor = ({parent, project, onConfirm, onCancel, onDelete}={})=>({ div: {

  props: {
    parent: parent, 
    projectName: project.name,
    projectColor: project.color,
  },

  a: { style: `
    width: 100%;
    height: 100%;
    position: fixed;
    background: #00000033;
    top: 0px;
    left: 0px;
    z-index: 9999;`
  },

  handle: { onclick: ($, evt) => { evt.stopPropagation(); onCancel() } },

  '=>':[

    { div: {

      a: { style: `
        width: 50%;
        height: 50%;
        position: relative;
        background: white;
        top: 25%;
        left: 25%;
        border: 3px solid black;
        border-radius: 25px;
        padding: 25px;`
      },

      handle: { onclick: ($, evt) => { evt.stopPropagation(); } },

      '=>': [

        { h5: { text: "Project" }},
        { input: { 
          'ha.value': Bind($ => $.scope.projectName)
        }},

        { h5: { text: "Color" }},
        { input: { 
          'ha.value': Bind($ => $.scope.projectColor)
        }},

        { br: {}},
        { br: {}},

        { button: { text: "Cancel", handle: { onclick: $=>onCancel() }}},
        { button: { text: "Delete", handle: { onclick: $=>onDelete() }}},
        { button: { text: "Confirm", handle: { onclick: $=>onConfirm({name: $.scope.projectName, color: $.scope.projectColor}) }}}
      ]
    }}
    
  ]
  
}})

const ProjectsToolbar = { div: { meta: {forEach: "project", of: $=>$.scope.projects},
  attrs: { 
    style: $=>({
      display: "inline-block",
      width: "100%", height: "40px",
      backgroundColor: $.meta.project.color,
      color: "white"
    }),
    draggable:"true",
  },

  def: {
    openProjectEditor: $=>{
      let app;

      let onConfirm = (edits)=>{
        $.scope.editProject($.meta.project, edits)
        app.destroy()
        app = undefined
      }
      let onCancel = ()=>{
        app.destroy()
        app = undefined
      }
      let onDelete = ()=>{
        $.scope.deleteProject($.meta.project)
        app.destroy()
        app = undefined
      }
      app = RenderApp(document.body, $$ProjectEditor({parent: $.this, project: $.meta.project, onConfirm: onConfirm, onCancel: onCancel, onDelete: onDelete}))
    }
  },
  
  handle: {
    ondragstart: ($, evt)=>{
      $.scope.moovingPlan = { new_plan: true, plan: { project: $.meta.project } }
    },
    onclick: $=>{
      $.this.openProjectEditor()
    }
  },
  
  '=>': { div: { 
    'a.style': "width: 100%; height: 100%; display:flex; justify-content: center; align-items: center", 
    text: $=>$.meta.project.name
  }}
}}


export const HomePage = async (state)=>{ return { 
  div: {
    id: "app",

    attrs: { style: "width: 100%; height: 100%; padding: 0px; margin: 0px;" },
    css: [ `* { box-sizing: border-box !important;} body { padding: 0px; margin: 0px; }` ],


    props: {
      today: new Date(),
      viewDay:  state !== undefined ? new Date(state.viewDay) : new Date(),
      monthLabelMapping: {"1":"Gennaio","2":"Febbraio", "3":"Marzo", "4":"Aprile", "5":"Maggio", "6":"Giugno", "7":"Luglio", "8":"Agosto", "9":"Settembre", "10":"Ottobre", "11":"Novembre", "12":"Dicembre"},

      days: getMonthDays(state !== undefined ? new Date(state.viewDay) : new Date()),//["2022-4-1", "2022-4-2", "2022-4-3", "2022-4-4", "2022-4-5"],
      plans: state !== undefined ? state.plans : {},//{
        // "2022-4-1":[
        //   { slot_idx: 0, len: 2, project: { name: "proj1", color: "#f1c40f"} },
        //   { slot_idx: 2, len: 2, project: { name: "proj2", color: "#1abc9c"} }
        // ], 
        // "2022-4-2":[], "2022-4-3":[], "2022-4-4":[], "2022-4-5":[]
      //},
      projects: state !== undefined ? state.projects : [], //[
      //   { id: "proj1", name: "Project 1", color: "#f1c40f"},
      //   { id: "proj2", name: "Project 2", color: "#1abc9c"},
      //   { id: "proj3", name: "Project 3", color: "#e74c3c"},
      //   { id: "proj4", name: "Project 4", color: "#2ecc71"}
      // ],
      projectUUID: state !== undefined ? state.projectUUID : -1,// 4,
      moovingPlan: undefined,

      storageInLoading: false,
    },

    onInit: $=>{
      if(state === undefined){
        $.this.storageInLoading = true
        try{
          $.this.storage.load()
        }catch (e){
          console.log(e)
          $.this.projectUUID = 4,
          $.this.projects = [
            { id: "proj1", name: "Project 1", color: "#f1c40f"},
            { id: "proj2", name: "Project 2", color: "#1abc9c"},
            { id: "proj3", name: "Project 3", color: "#e74c3c"},
            { id: "proj4", name: "Project 4", color: "#2ecc71"}
          ],
          $.this.plans = {}
        }
        $.this.storageInLoading = false
      }
    },

    signals: {
      plannedDayEdited: "stream => day, plan"
    },

    def: {
      editPlan: ($, day, new_plan)=>{
        $.this.plans[day] = new_plan
        $.this.storage.save()
        // $.this._mark_plans_as_changed() // inutile per la logica attuale
        $.this.plannedDayEdited.emit(day, new_plan)
      },

      createNewProject: $=>{
        $.this.projectUUID++
        $.this.projects = [...$.this.projects, { id: "proj"+$.this.projectUUID, name: "Project "+$.this.projectUUID, color: "#353535"}]
      },

      editProject: ($, projectRef, edits)=>{
        let {name, color} = edits
        projectRef.name = name
        projectRef.color = color
        $.scope.projects = [...$.scope.projects]
        $.scope.days = [...$.scope.days]
      },
      
      deleteProject: ($, project)=>{
        $.scope.projects = $.scope.projects.filter(p=>p!==project)
        $.scope.days = [...$.scope.days]
      },

      storage: {
        save: $=>{
          localStorage.setItem("demo.cle.planner2.projectUUID", JSON.stringify({val: $.scope.projectUUID}))
          localStorage.setItem("demo.cle.planner2.projects", JSON.stringify({val: $.scope.projects}))
          localStorage.setItem("demo.cle.planner2.plans", JSON.stringify({val: $.scope.plans}))
          console.log("writing", $.scope.plans)
        },
        getOrError: ($, prop)=>{
          let data = JSON.parse(localStorage.getItem(prop))
          console.log("readed..", data)
          if (data !== null && data !== undefined){
            return data.val
          }
          throw Error("prop not found")
        },
        load: $=>{
          console.log("load..")
          $.scope.projectUUID = $.this.storage.getOrError("demo.cle.planner2.projectUUID")
          $.scope.projects = $.this.storage.getOrError("demo.cle.planner2.projects")
          $.scope.plans = $.this.storage.getOrError("demo.cle.planner2.plans")
        }
      }
    },

    on: { this: {
      plansChanged: $=>{if (!$.this.storageInLoading) {$.this.storage.save(); console.log("Plans changed!!")}},
      projectsChanged: $=>{if (!$.this.storageInLoading) {$.this.storage.save(); console.log("Projects changed!!")}},
    }},


    "=>": [ MainLayout({

      NavbarContents: [
        
        { div: { 

          'a.style': "display: flex; justify-content: center;",

          "=>": [
            smart({button: "<"}, {handle: {onclick: $=>{
              let previusMonth = new Date($.scope.viewDay)
              previusMonth.setDate(Math.min(28, new Date().getDate()))
              if (previusMonth.getMonth() === 0){
                previusMonth.setMonth(11)
                previusMonth.setFullYear(previusMonth.getFullYear()-1)
              }else {
                previusMonth.setMonth(previusMonth.getMonth()-1)
              }
              Router.navigate("home", {viewDay: previusMonth, plans: $.scope.plans, projects: $.scope.projects, projectUUID: $.scope.projectUUID})
            } }, 'a.style': { background: 'transparent', border: 'none', color: '#dddddd', cursor: 'pointer', fontSize: '1.9rem', fontWeight: 100} }),

            { span: {
              text: $=>$.scope.monthLabelMapping[$.scope.viewDay.getMonth()+1] + " " + $.scope.viewDay.getFullYear(),
              'a.style': "font-size: 1.9rem; margin-left: 15px; margin-right: 15px;"
            }},

            smart({button: ">"}, {handle: {onclick: $=>{
              let nextMonth = new Date($.scope.viewDay)
              nextMonth.setDate(Math.min(28, new Date().getDate()))
              if (nextMonth.getMonth() === 11){
                nextMonth.setMonth(0)
                nextMonth.setFullYear(nextMonth.getFullYear()+1)
              }else {
                nextMonth.setMonth(nextMonth.getMonth()+1)
              }
              Router.navigate("home", {viewDay: nextMonth, plans: $.scope.plans, projects: $.scope.projects, projectUUID: $.scope.projectUUID})
            } }, 'a.style': { background: 'transparent', border: 'none', color: '#dddddd', cursor: 'pointer', fontSize: '1.9rem', fontWeight: 100} }),
          ]
        }}
      ],

      SidebarComponents: [
        
        { div: {
          'a.style': { position: 'sticky', top: "75px"},

          "=>":[
            { div: { text: "Projects", 'ha.style.marginTop': '25px', 'ha.style.fontSize': '1.6rem', 'ha.style.marginBottom': '15px'  }}, 

            { button: {
              text: "+",

              'a.class': "waves-effect waves-light btn",
              'a.style': "width: 100%; margin-bottom: 15px",

              handle: { onclick: $=>{
                $.scope.createNewProject()
              }}
            }},

            ProjectsToolbar,
          ]
        }},

        // { div: { 'a.style': {fontWeight: "600", fontSize: "1.9rem", border: "0.25px solid #dddddd", paddingBottom: "0px", paddingLeft: "10px", paddingRight: "10px", position: 'fixed', bottom: "0px"}, text: "User Info"}},
      ],

      MainContentComponents: [
        Calendar
      ]
    }),


    // CSS overwriter 
    { Css: { css: [
      '.grid-layout {grid-template-columns: auto auto auto auto auto auto;} ',
      '.navbar {position: sticky; top: 0px; z-index: 1000; }'
    ]}}
    ]
    
  }
}}

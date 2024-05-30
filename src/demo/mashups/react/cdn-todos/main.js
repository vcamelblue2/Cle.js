
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Import cle lib
import * as cle_lib from 'https://cdn.jsdelivr.net/npm/cle.js@0.0.12/lib/caged-le-module-to-global.js';
// Import cle-react mashup utils
import * as react_in_cle from 'https://cdn.jsdelivr.net/npm/cle.js@0.0.12/mashup/react/lib/react-in-cle.js';
import * as cle_in_react from 'https://cdn.jsdelivr.net/npm/cle.js@0.0.12/mashup/react/lib/cle-in-react.js';
// Import css-in-js via csz
import css from 'https://unpkg.com/csz';

cle_lib.CLE_FLAGS.LOG_WARNING_ENABLED = false

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Import React
const { useState, useRef, useEffect } = React;

// Import Primereact - console.log(primereact)
const { Button, InputText, InputTextarea, Checkbox, Divider, MultiSelect, Dropdown, Accordion, AccordionTab, TabView, TabPanel } = primereact;

// Import cle lib
const { RenderApp, cle, html, f, fArgs, pass, LE_LoadCss, Use, Bind, Alias, asFunc, Switch, Case } = cle_lib // import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf}

// Import cle-react mashup utils
const { ReactInCle, UseReact, UseReactMixin, useCleProp, useCleProps, fReact, r, rc } = react_in_cle;
const { UseSubCle } = cle_in_react;

const UseReactNP = (f)=>UseReact(({$})=>f($)) // shortcuts

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const generateUUID = () => new Date().getTime()+(Math.round(Math.random()*1000));

const CommonStyles = {
  spaceBetween: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  }
}


const ROOT_DEF = {

		id: "app",

		todos: undefined, // {todo: string, done: boolean}[]

    days: undefined,

    categories: [
      { name: "Urgent - Important", code: "U-I" },
      { name: "Urgent - NOT Important", code: "U-NI" },
      { name: "NOT Urgent - Important", code: "NU-I" },
      { name: "NOT Urgent - NOT Important", code: "NU-NI" }
    ],

		onInit: $ => { $.this.db.load() },

		on_this_todosChanged: ($, _, old_v)=>{old_v !== undefined && $.this.db.store()}, // is an init?
		on_this_daysChanged: ($, _, old_v)=>{old_v !== undefined && $.this.db.store()}, // is an init?

		def: {

			db: {
				store: $ => {
					localStorage.setItem("cle.todo-plan.data", JSON.stringify({ todos: $.this.todos, days: $.this.days }))
				},
				load: $ => {
					let loaded = localStorage.getItem("cle.todo-plan.data")
					try{ 
            loaded = JSON.parse(loaded)
            $.this.todos = loaded.todos
            $.this.days = loaded.days
          } 
					catch { 
            $.this.todos = []
            $.this.days = [
              // { id: generateUUID(), name: "Lun", slots: [
              //     { id: generateUUID(), time: "18:00", tasks: [] }
              // ]},
              // { id: generateUUID(), name: "Mar", slots: [
              //     { id: generateUUID(), time: "18:00", tasks: [] }
              // ]},
              // { id: generateUUID(), name: "Mer", slots: [
              //     { id: generateUUID(), time: "18:00", tasks: [] }
              // ]},
              // { id: generateUUID(), name: "Gio", slots: [
              //     { id: generateUUID(), time: "18:00", tasks: [] }
              // ]},
              // { id: generateUUID(), name: "Ven", slots: [
              //     { id: generateUUID(), time: "18:00", tasks: [] }
              // ]},
              // { id: generateUUID(), name: "Sab", slots: [
              //     { id: generateUUID(), time: "18:00", tasks: [] }
              // ]},
              // { id: generateUUID(), name: "Dom", slots: [
              //     { id: generateUUID(), time: "18:00", tasks: [] }
              // ]},
            ]
          }
				}
			},

			create: ($, todo) => {
				return {id: generateUUID(), todo: todo, done: false}
			},

			add: ($, todo) => {
				$.todos = [...$.todos, todo]
			},

			remove: ($, todo) => {
        console.log("REMOVING:", todo)
        $.detachRemovedTodo(todo)
				$.todos = $.todos.filter(t=>t.id !== todo.id)
			},

      detachRemovedTodo: ($, todo) => {
        $.days.forEach(day => day.slots.forEach(slot => { slot.tasks = slot.tasks.filter(task => task.id !== todo.id) }))
        $.days = [...$.days]
        console.log($.days)
      }
		},

		// a_style: { marginLeft: "25%", marginRight: "25%", marginTop: "25px", padding: "25px", border: "0.5px solid #dedede", minHeight: "540px" , fontFamily: "var(--font-family)"},
		// class: css`margin-left: 25%; margin-right: 25%; margin-top: 25px; padding: 25px; border: 0.5px solid #dedede; min-height: 540px ; font-family: var(--font-family)`
    class: css`
      margin: 0px; padding: 0px; /*display: flex;*/
      :global(html, body){font-size: 14px}
    `
	
}

const DEBUGGER = cle.Controller({
  on_le_app_todosChanged: $ => console.log("aaaaa todos changed!"),
  on_le_app_daysChanged: $ => console.log("aaaaa days changed!")
})



const BigTitle = (title)=>cle.h1({
  text: title,
  a_style: { textAlign: "center", fontSize: "3.5rem"}
})

const UseDivider = UseReact(({$})=> <Divider /> )

const EditableLabel = cle.span({
  in_edit: false,
  
  val: "",
  setVal: asFunc(($, v) => {}),
  // on_valChanged: ()=>{},

  normal_style: { margin: "3px 0px 0px 15px;", cursor: "pointer" },
  in_edit_style: { margin: "3px 0px 0px 15px;" },
},
  ...Switch(
    
    Case(f`!@in_edit`,

      cle.label({
        text: f`@val`,
        style: $ => $.normal_style,
        h_onclick: f`{ @in_edit = true }`
      })
    ),

    Case(f`@in_edit`,
        
      cle.input({

        new_val: Alias(f`@val`, fArgs('v')`{ @setVal(v) }`), // alias with custom setter required here to pushback text change

        ha_value: Bind(f`@new_val`, {event: "change"}),
        style: $ => $.in_edit_style,

        onInit: $ => $.this.el.focus(),
        h_onblur: f`{ @in_edit = false }`,
        h_onkeypress: fArgs('e')`{ if(e.key === 'Enter') { e.preventDefault(); @el.blur() }}`, // must remove onblur event before delete or reuse that!!
        onDestroy: $ => { $.el.onblur = undefined }
      })
    )
  )
)



const Slot = cle.div({ meta: {forEach: "slot", of: f`@day.slots`},
  
},

  cle.h5({
    style: { textAlign: "left", ...CommonStyles.spaceBetween }
  },   
    Use(EditableLabel, { 
      val: f`@slot.time`,
      setVal: asFunc(($, v) => { $.slot.time = v;  $.day = {...$.day, slots: [...$.day.slots]} })
    }),

    UseReact(({$})=>(
      <Button className={"p-button-rounded p-button-text "  + css`margin-left: 15px;`} 
        icon="pi pi-times"
        // label="Remove" 
        onClick={()=>{
          $.day.slots = $.day.slots.filter(s=>s.id!==$.slot.id)
          $.day = {...$.day}
        }}
      />
    ))
  ),

  UseReact(({$})=>{
    useCleProps($, "$.le.app.todos", "days", "slot")

    return <MultiSelect
        value={$.slot.tasks} options={$.le.app.todos} onChange={(e) => {$.slot.tasks = e.value; $.day = {...$.day}} } optionLabel="todo" display="chip" //  optionValue="todo"
        className={css`
          min-width: 100%;
          .p-multiselect-label { display: flex; white-space: break-spaces; flex-wrap: wrap; row-gap: 9px;} 
        `}
    ></MultiSelect>
  }),
)

const Day = cle.day({ meta: {forEach: "day", of: f`@days`}

},
  cle.h4({
    style: { textAlign: "left", ...CommonStyles.spaceBetween }
  },
    // f`@day.name`,

    Use(EditableLabel, { 
      val: f`@day.name`,
      setVal: asFunc(($, v) => { $.day.name = v;  $.day = {...$.day} })
    }),

    UseReact(({$})=>(
      <Button label="Slot" 
        icon="pi pi-plus"
        onClick={()=>{
          $.day.slots = [...$.day.slots, { id: generateUUID(), time: "HH:MM", tasks: [] }]
          $.day = {...$.day}
        }}
      />
    ))

  ),

  Slot,

  UseDivider,
  
)

const Days = cle.days({

  id: "plan",

},

  Day

)



const InputBar = cle.div({ // input bar
  ctx_id: "input", 
  
  let_text: "",

  a_style: { display: "flex", gap: "10px" },
},

  // this 2 components can be made of 1 react component..
  UseReact(({$})=>{

    useCleProps($, "text")

    return <InputText className={css`width: 100%`}  value={$.text}  onChange={(e) => $.text = e.target.value}
      onKeyPress={ e => {
        if(e.key === "Enter" && $.text !== undefined && $.text.length > 0) {
          console.log("add", $.text)
          $.add($.create($.text))
          $.text = ""
        }
      }}
    />

  }, pass, pass, {a_style: 'flex-grow: 1'}), 

  UseReact(({$})=>(
    <Button className={css`min-width: 120px`} 
      label="Add" 
      onClick={()=>{
        $.add($.create($.ctx.input.text))
        $.ctx.input.text = ""
      }}
    />
  ))

)



const TodosView = cle.div({
  a_style: { overflowY: "auto", height: "310px", overflowY: "auto", display: 'flex', flexDirection: 'column', gap: '10px', marginRight: '-18px', paddingRight: '18px'}
}, 

  cle.div({ meta: {forEach: "todo", of: f`@todos`, optimized: true},
    let_in_edit: false,
  },
    
    // Todo with checkbox row
    cle.div({
      style: { display: "flex", justifyContent: "space-between", alignItems: "center" }
    },
        
      cle.span({ a_style: { display: "flex", marginLeft: "2px", alignItems: 'baseline' }},

        UseReact(({$})=>{
          useCleProps($, "todo")

          const switchTodo = fReact($)`{ @todo = {...@todo, done: !@todo.done} }`

          return ( //"field-checkbox "+
            <div className={css`height: 3rem, width: 3rem`} >
              <Checkbox inputId="todo" checked={$.todo.done} onChange={switchTodo} />
              {/* <label htmlFor="todo">$.todo</label> */}
            </div>
        )}),

        Use(EditableLabel, {
          val: f`@todo.todo`,
          setVal: asFunc(($, v) => { $.todo = {...$.todo, todo: v } })
        }),
        
      ),



      UseReact(({$})=>{
        useCleProps($, "$.le.app.todos", "todo", "$.le.app.categories")

        return (
          
          <Button className={"p-button-rounded p-button-text "  + css`margin-left: 15px;`} 
            icon="pi pi-times"
            // label="Remove" 
            onClick={fReact($)`@remove(@todo)`}
          />
        )
      })

    ),

    cle.div({
      style: { display: "flex", justifyContent: "space-between", alignItems: "center" }
    }, 
      // UseReactNP( $ => (
      //   <Dropdown
      //     value={$.todo.category} options={$.le.app.categories} onChange={(e) => {$.todo.category = e.value; $.todo = {...$.todo}} } optionLabel="name" display="chip" //  optionValue="todo"
      //     className={css`
      //       .p-multiselect-label { display: flex; white-space: break-spaces; flex-wrap: wrap; row-gap: 9px;} 
      //     `}
      //   ></Dropdown>
      // ))

      UseReact( ({$}) => (
        <Dropdown
          value={$.todo.category} options={$.le.app.categories} onChange={(e) => {$.todo.category = e.value; $.todo = {...$.todo}} } optionLabel="name" display="chip" //  optionValue="todo"
          className={css`
            .p-multiselect-label { display: flex; white-space: break-spaces; flex-wrap: wrap; row-gap: 9px;} 
          `}
        ></Dropdown>
      ))
    )
  
  )
)

const JsonData = UseReact(({$})=>{
  useCleProps($, '$.le.app.todos')

  return <InputTextarea 
    value={"DATA: "+JSON.stringify($.le.app.todos, pass, 2)} 
    className={css`position: relative; width: 100%; height: 110px; font-size: 0.7rem`}
  />
})



const TodoListCard = cle.div({
  class: css`flex: 1; font-family: var(--font-family)` //  padding: 25px; border: 0.5px solid #dedede; min-height: 540px ;
},
  
  BigTitle("To Do List"),

  UseDivider,

  InputBar,

  UseDivider,
  
  TodosView,

  // JsonData,

)

const PlanCard = cle.div({
  class: css`flex: 1; font-family: var(--font-family)` //  padding: 25px; border: 0.5px solid #dedede; min-height: 540px ;
},
  
  BigTitle("Planner"),

  UseDivider,

  Days,

)

const MySVG = ({ shape, fill, stroke, strokeWidth }) => {
  let shapeElement;
  let styleProps = {};
  
  // const [rotation, setRotation] = useState(0);
  
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRotation(rotation => rotation + 10);
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  if (shape === 'circle') {
    shapeElement = <circle cx="50" cy="50" r="40" />;
  } else if (shape === 'triangle') {
    shapeElement = (
      <polygon points="50 10 90 90 10 90" />
    );
  } else {
    shapeElement = <rect x="10" y="10" width="80" height="80" />;
  }

  if (fill) {
    styleProps.fill = fill;
  }
  if (stroke) {
    styleProps.stroke = stroke;
  }
  if (strokeWidth) {
    styleProps.strokeWidth = strokeWidth;
  }

  // styleProps.transform = `rotate(${rotation}deg)`;

  return (
  <svg width="100" height="100">
    {React.cloneElement(shapeElement, { style: styleProps })}
  </svg>
  );
};

// (TMP = cle.div({
//   id: "test",

//   var1: {h1: "hello", lastupdate: new Date().getTime()},
//   cachable_var: (()=>{
//     let data = {}

//     const clone = (what)=>JSON.parse(JSON.stringify(what))

//     return $ => { 
//       if (data.lastupdate === $.var1.lastupdate) {
//         console.log("GET CACHED DATA")
//         return data
//       }
//       else {
//         console.log("GET DATA UPDATED")
//         return data = clone($.var1)
//       }
//     }
//   })(),


//   bigarray: [1,2,3,4,5,6,7,8,9,10],
//   bigarrayfilter: 5,
//   partialarray: (()=>{
//     const clone = (what)=>JSON.parse(JSON.stringify(what))
//     let cache = {bigarray, bigarrayfilter, filtered}

//     return $ => { 
//       if (cache.bigarrayfilter === $.bigarrayfilter && cache.bigarray.length === $.bigarray.length) {
//         console.log("GET CACHED DATA")
//       }
//       else {
//         console.log("GET DATA UPDATED")
//         cache = {bigarray: clone($.bigarray), bigarrayfilter: $.bigarrayfilter, filtered: $.bigarray.filter(v=>v >= $.bigarrayfilter)}
//       }
//       return cache.filtered
//     }
//   })(),


// }
// )),


RenderApp(document.getElementById("root"), cle.div(ROOT_DEF,

  // TodoListCard,

  // PlanCard,

  UseReact(({$})=>{
    const [activeIndex, setActiveIndex] = useState(0);

    return (
    <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        
      <TabPanel header="To do">
        <UseSubCle $={$} def={ TodoListCard }/>
      </TabPanel>

      <TabPanel header="Plan">
        <UseSubCle $={$} def={ PlanCard }/>
      </TabPanel>

      <TabPanel header="Plan 2">
        <Accordion multiple className={css`display: flex; flex-wrap: wrap; .p-accordion-tab{ flex-basis: 50%; }`}>
          <AccordionTab header="Header I">

            <UseSubCle $={$} def={ 
              cle.div({}, 
                UseReact(({$})=>(
                  <span>
                    <i>hi im subnesting</i>
                    <b>
                      <UseSubCle $={$} def={ 
                        cle.div({}, 
                          UseReact(({$})=>(
                            <span>hi im sub-subnesting</span>
                          ))
                        )
                      }/>
                    </b>

                  </span>
                ))
              )
            }/>
          </AccordionTab>
          <AccordionTab header="Header II">
              Content II
          </AccordionTab>
          <AccordionTab header="Header III">
              Content III
          </AccordionTab>
          <AccordionTab header="Header IV">
              <MySVG 
                shape="rectangle"
                fill="red"
                stroke="red"
                strokeWidth={2}
              />
          </AccordionTab>
        </Accordion>
      </TabPanel>

    </TabView>
  )}),

  // DEBUGGER

))


// // REQUIRED ONLY FOR BABEL (to parse as jsx instead of js)
const exports = {}
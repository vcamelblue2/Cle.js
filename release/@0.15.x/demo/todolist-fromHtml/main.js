import { Alias, Bind, BindToProp, Case, cle, DefineSubprops, Extended, ExtendSCSS, ExternalProp, f, fArgs,  asFunc, LE_InitWebApp, LE_BackendApiMock, LE_LoadCss, LE_LoadScript, pass, Placeholder, RenderApp, smart, SmartAlias, str, Switch, toInlineStyle, Use, useExternal, html } from "../../lib/caged-le.js"
import * as Cle from "../../lib/caged-le.js"
window.Cle = Cle


LE_InitWebApp(async ()=>{ RenderApp(document.body, cle.root({},
  
  html( 
  
  /*html*/`
  <div class="base">
  <!-- [|deps|] ##aaaa hook-oninit="console.log($)" -->
    <div>
      <h3> 📝 To do list </h3>
      <h3 class="function-btn-container">
        <b> 
          <div class="function-btn" (onclick)="@reorderTodoBy('priority', true)">High Priority</div> 
            <span>|</span>
          <div class="function-btn" (onclick)="@reorderTodoBy('priority', false)">Low Priority</div>
            <span>|</span>
          <div class="function-btn" (onclick)="@reorderTodoBy('done', false)">Move Done</div>
            <span>|</span>
          <div class="function-btn" (onclick)="@removeTodoDone()">Remove Done</div>
        </b>
      </h3>
    </div>
    <hr/>
    <!-- ________________________________________________ -->
    <ul style="position: relative">
      <li style="height: 45px; position: absolute; top: -45px; width: 100%;" [let-placeholder_for_drop_on_first]="true" [let-subrender]="undefined"  (ondragover)="@dragAndDrop.onDragOver($, evt)" (ondrop)="@dragAndDrop.onDrop($, evt)"  (on-removesubrender)="{ $.subrender = undefined; $.u.clearLazyRender() }"> </li>
      <li meta-foreach="todoEl of @todolist" meta-define-index="i" meta-define-first="first"  [let-subrender]="undefined" draggable="true" (ondragstart)="@dragAndDrop.onDragStart($, evt)" (ondragover)="@dragAndDrop.onDragOver($, evt)" (ondrop)="@dragAndDrop.onDrop($, evt)" (on-removesubrender)="{ $.subrender = undefined; $.u.clearLazyRender() }">
        <input type="checkbox" [ha-checked]="@todoEl.done" (onchange)="@toggleTodo(@i)" >
        <!-- <span [class]="@todoEl.done ? 'done-status' : ''">{{@i+1}}.</span> -->
        <span [class]="'content ' + (@todoEl.done ? 'done' : '')"  (onclick)="@toggleTodo(@i)">
          <div [class]="'priority-div priority-value-'+@todoEl.priority">{{@todoEl.priority}}</div> 
          <span>{{@todoEl.todo}}<span>
          <div meta-if="@todoEl.due_to ? true : false" class="due-to-div"> due to: {{@utils.humanDate(@todoEl.due_to)}}</div>
          <div meta-if="@todoEl.due_to ? true : false" class="due-to-div remaning-time">{{@utils.getRemaningTime(@todoEl.due_to)}}</div>
          <div class="due-to-div remove-button" (onclick)="evt.stopPropagation(), @removeTodo(@i)">✖️</div>
        </span>
        <hr/>
      </li>

    </ul>
    
    <div meta-if="@todolist.length === 0"> .. Olè! Non hai nulla da fare! 😊 </div>

    <!-- ________________________________________________ -->
    <hr/>
    <h4 style="margin-bottom: 5px"> Add To-do </h4>
    <h6 style="margin-bottom: 5px; margin-top: 10px"> Description </h6>
    <input 
      #name="todoinputbar" 
      let-text="" [raw-def-a_value]="Cle.Bind($=>$.this.text)"
      
      (onkeypress)="{ evt.key === 'Enter' && @insertTodo(@text, $.ref.priorityinputbar.text, $.ref.duetoinputbar.text) }"
      (on-reset_input_fields)="{ @text = ''} "
      
      class="add-todo-ipt"

      >
      
    <!-- things that can be done: -->

      <!--  [let-prop-important1]="({ 
              val: 'demo multi line', stringval: 123
            })"
            hook-oninit="console.log(@propImportant1)" -->
      <!-- (on-text-changed)="console.log('aaaaa')" -->
      <!-- [raw-defs]="({ a_value: Cle.Bind($=>$.this.text) })" -->
      <!-- hook-oninit="console.log($.ref.input)" -->

    <h6 style="margin-bottom: 5px; margin-top: 10px"> Priority (0-10) </h6>

    <input 
      #name="priorityinputbar" 
      let-text="" [raw-def-a_value]="Cle.Bind($=>$.this.text)"

      (onkeypress)="{ evt.key === 'Enter' && @insertTodo($.ref.todoinputbar.text, @text, $.ref.duetoinputbar.text) }"
      (on-reset_input_fields)="{ @text = ''} "
      
      class="add-todo-ipt"
    >

    <h6 style="margin-bottom: 5px; margin-top: 10px"> Due To </h6>

    <input 
      #name="duetoinputbar" 
      let-text="" [raw-def-a_value]="Cle.Bind($=>$.this.text)"

      (onkeypress)="{ evt.key === 'Enter' && @insertTodo($.ref.todoinputbar.text, $.ref.priorityinputbar.text, @text) }"
      (on-reset_input_fields)="{ @text = ''} "
      
      class="add-todo-ipt"
    >

    <!-- use raw def! -->
    <!-- <input 
      [raw-defs]="({
        name: 'duetoinputbar',
        let_text: '',
        a_value: Cle.Bind($=>$.this.text),
        h_onkeypress: ($, evt) => { evt.key === 'Enter' && @insertTodo($.ref.todoinputbar.text, $.ref.priorityinputbar.text, @text) },
        on_s_reset_input_fields: $ => { @text = ''},
        class: 'add-todo-ipt'
      })"
    > -->

  </div>
  `,{

    let: {
      todolist: [
        { "todo": "style div priorita", "done": false, "priority":10, "due_to": new Date().getTime() + (1000 * 60 * 60 * 12)  //12h
        },
        { "todo": "style div due to, durata task opzionale e pipe con timer", "done": false, "priority":9, "due_to": new Date().getTime() + (1000 * 60 * 60 * 24) 
        },
        { "todo": "bugfix toggle done todo", "done": false, "priority":5, "due_to":new Date().getTime() + (1000 * 60 * 60 * 24 * 2) // 2 gg
        },
        { "todo": "settings, input e ordinamento, msg 7:42, loclstorage, fast command concat..pipe?..", "done": false, "priority":3, "due_to": new Date().getTime() + (1000 * 60 * 60 * 24 * 3) 
        },
        { "todo": "todo base component (gia fatto) :)", "done": true, "priority":2, "due_to": new Date().getTime() + (1000 * 60 * 60 * 12) 
        },
        { "todo": "man - help command..senza due to!", "done": true, "priority":7, "due_to": null},
      ]
    },

    signals: {
      removesubrender: "stream => void",
      reset_input_fields: "stream => void"
    },

    childsRef: {
      todoinputbar: "single",
      priorityinputbar: "single"
    },

    tmp_latest_render: undefined,

    def: {

      toggleTodo($, idx){
        // $.this.editRefVal.todolist(l=>{
        //   l[idx].done = !l[idx].done
        // })
        $.todolist[idx].done = !$.todolist[idx].done
        $.todolist = [...$.todolist]
      },

      reorderTodoBy($, field, descending){
        $.todolist = [...$.todolist.sort((a,b)=>a[field]<b[field] ? (descending ? 1 : -1) : (a[field]>b[field] ? (descending? -1:1):0))]
      },
      
      removeTodoDone($){
        $.todolist = $.todolist.filter(t=>!t.done)
      },
      
      removeTodo($, idx){
        $.todolist = $.todolist.filter((t, i)=> i !== idx)
      },

      insertTodo($, todo, priority="5", due_to=undefined){
        $.todolist = [...$.todolist, 
          { todo, done: false, priority: parseInt(priority), due_to: due_to !== undefined ? Date.parse(due_to) : null},
        ]
        $.reset_input_fields.emit()
      },

      dragAndDrop:{
        onDragStart($, target$, evt){
          // console.log(target$.el.innerHTML)

          target$.el.style.opacity = 0.5
          target$.el.style.backgroundColor = "white"
          evt.dataTransfer.setData('idx', target$.i)
          evt.dataTransfer.setData('resetStyle', ()=>{
            target$.el.style.opacity = null
            target$.el.style.backgroundColor = null
            target$.el.style.display = null
          })
          $.tmp_latest_render = '<div style="width: 100%; height: 40px; background-color: #dddddd"></div>' //target$.el.innerHTML
          setTimeout(() => {
            target$.el.style.display = 'none'
          }, 400); 
        },

        onDragOver($, target$, evt){
          evt.preventDefault();
          // if ('placeholder_for_drop_on_first' in target$.scope){

          // } else {
            // console.log(target$, evt)
            // target$.i != evt.dataTransfer.getData("idx") &&
            if (target$.subrender === undefined){
              $.removesubrender.emit()
              target$.u.clearLazyRender()
              // target$.subrender = target$.u.lazyRender(()=>({div: { style: "color: red", text: "aaaa"}}))
              // console.log(evt, evt.dataTransfer.getData("idx"))
              target$.subrender = target$.u.lazyRender(()=>(html($.tmp_latest_render)))

            }
          // }
        },
        onDrop($, target$, evt){
          evt.preventDefault();
          // console.log("DROP",target$,  target$?.placeholder_for_drop_on_first)
          if ('placeholder_for_drop_on_first' in target$.scope){
            let draggedIdx = parseInt(evt.dataTransfer.getData("idx"))
            let draggedTodo = $.todolist[draggedIdx]

            let reordered = $.todolist.filter(x=>x !== draggedTodo)
            $.removesubrender.emit()
            $.tmp_latest_render = undefined
            $.todolist = [draggedTodo, ...reordered]
          } else {
            // console.log("DROP!!", evt.dataTransfer.getData("htmlel"))
            let draggedIdx = parseInt(evt.dataTransfer.getData("idx"))
            let draggedTodo = $.todolist[draggedIdx]
            let targetIdx = target$.i
            let targetTodo = $.todolist[targetIdx]
            if (draggedIdx !== targetIdx){

              console.log(draggedIdx, targetIdx, draggedTodo, targetTodo)

              let reordered = $.todolist.filter(x=>x !== draggedTodo)
              reordered.splice(reordered.indexOf(targetTodo)+1, 0, draggedTodo)
              $.removesubrender.emit()
              $.tmp_latest_render = undefined
              $.todolist = [...reordered]

              // let realReordered = []
              // for (let idx = 0; idx < reordered.length; idx++){
                
              // }
            }
            else {
              evt.dataTransfer.getData("resetStyle")()
            }

          }
        },
      },

      utils: {

        humanDate($, date){
          let d = new Date(date)
          
          return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth()+1).toString().padStart(2, "0")}/${d.getFullYear().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
          // return new Date(date).toString() // 'dd MMM yyyy, HH:mm'
        },

        getRemaningTime($, el_due_to){
          if (el_due_to != undefined){
            const now = Date.now()
            let diff = el_due_to - now
            // console.log(el_due_to, diff)
            if( diff > 0){
              const diff_as_date = new Date(diff)
              //todo, ora valuto solo i gg, ma se supero il mese/anno non mi dice il tempo corretto.
              const rem = {
                dd: diff_as_date.getUTCDate() > 1 ? (diff_as_date.getUTCDate()-1) + " giorn" + (diff_as_date.getUTCDate() > 2 ? "i":"o") : "",
                hh: diff_as_date.getUTCHours() > 0 ? " " + diff_as_date.getUTCHours() + " or" + (diff_as_date.getUTCHours() > 1 ? "e":"a") : "",
                mm: diff_as_date.getMinutes() > 0 ? " " + diff_as_date.getMinutes() + " minut" + (diff_as_date.getMinutes() > 1 ? "i":"o") : "",
                ss: diff_as_date.getSeconds() > 0 ? " " + diff_as_date.getSeconds() + " second" + (diff_as_date.getSeconds() > 1 ? "i":"o") : ""
              }

              return rem.dd + rem.hh + rem.mm
            }
            return "passed!"
          }
          return null;

        }
      }

    }
  
  })

))})

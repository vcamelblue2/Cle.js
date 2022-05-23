
import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "../lib/caged-le.js"
import { NavSidebarLayout } from "../layouts/layouts.js"

const app0 = ()=>{

  // LIB COMPONENTS
  const Timer = {
    Model: {

      data: {
        interval: 1000,
        running: false,
        
        __interval: undefined
      },

      def: {
        onTriggered: $=>{},

        start: $=>{
          $.this.__interval = setInterval(()=>$.this.onTriggered(), $.this.interval)
        },
        stop: $=>{
          clearInterval($.this.__interval)
          $.this.__interval = undefined
        },
        completeAndStop: $=>{
          $.this.stop();
          $.this.onTriggered();
        }
      },

      afterInit: $=>{
        if ($.this.running){
          $.this.start()
        }
      },

      onDestroy: $=>{
        $.this.stop()
      },

      on: { this: {
        __intervalChanged: ($, newInterval)=>{
          $.this.running = newInterval === undefined ? false : true
        },
        runningChanged: ($, newRunning, oldRunning) => {
          if (newRunning !== oldRunning){
            if (newRunning && $.this.__interval === undefined) {
              $.this.start()
            } else if (!newRunning && $.this.__interval !== undefined) {
              $.this.stop()
            }
          }
        },
        intervalChanged: $ =>{
          if($.this.running) {
            $.this.stop();
            $.this.start();
          }
        }
      }}
    }
  }

  /** Directives Demo */
  const $D = {
    onKeyPressed: (key, $funcToExec)=> ({onkeypress: ($, e)=>{ if (e.key === key) {$funcToExec($, e)} } })
  }


  const InputComponent = { 
    input: {
      id: "myInput",

      data: { text: "Hello!" },

      signals: {
        newInputConfirmed: "stream => (text: string)"
      },

      on: { this: {
        textChanged: $=>console.log("text changeeeeeeddddd")
      }},

      attrs: {
        value: $ => $.this.text
      },
      handle: {
        oninput: ($, e) => { console.log("ipt!!!"); $.this.text = e.target.value },
        
        // onkeypress: ($, e) => { if (e.key === "Enter") { console.log("sono child, sto per emettere il segnale!"); $.this.newInputConfirmed.emit($.this.text) } },
        // DEMO DIRECTIVES
        ...$D.onKeyPressed("Enter", 
            ($, e) => { console.log("sono child, sto per emettere il segnale!"); $.this.newInputConfirmed.emit($.this.text) } 
        )
      },


    }
  }

  const CtxEnabledComponent = {
    div: { 
      ctx_id: "myCtxRoot",

      data: {
        todo: ["todo1", "todo2", "todo3"]
      },

      "=>" : [

        { button: { 
          ctx_id: "removeBtn",

          text: "remove final todo",

          def: {
            removeLastTodo: $ => {
              if ($.ctx.myCtxRoot.todo.length > 0) {
                let copy = [...$.ctx.myCtxRoot.todo]
                copy.pop()
                $.ctx.myCtxRoot.todo = copy
              }
            }
          },

          handle: { 
            onclick: $ => $.this.removeLastTodo() 
          }

        }},

        { div: { 
            ctx_id: "listPresenter",

            text: $ => "--" + $.ctx.myCtxRoot.todo.toString(),

            on: { // demo di _root_ e _ctxroot_
              ctx: {"_ctxroot_": {
                todoChanged: $=> console.log(" heeey sto puntanto al _ctxroot_ e ai sui aggiornamenti di todo!!")
              }},
              le: {"_root_": {
                counterChanged: $=> console.log(" heeey sto puntanto al _root_ e ai sui aggiornamenti di counter!! essendo un componente è possibile che vengano lanciati più segnli")
              }}
            },
            
            onInit: $ => {
              console.log("heeeeeey sono visibile solo nel contestooooo", $.ctx, $.ctx.myCtxRoot, $.le)
            }
        }}

      ]

    }
  }

  const EditableComponent = {
    div: {
      attrs: { style: "margin-top: 25px; width: 100%; height: 50px; background-color:black; color: white" },
      "=>": [
        "Hello ",
        Placeholder("name", {default_component: "World!"}),
        { button: { text: "click me", attrs: {style: "margin-left: 15px; margin-right: 15px"},  handle: {onclick: $=>$.parent.el.style.backgroundColor = "black"}}},
        { span: { "=>": { span: { text: "subchild,"} } }},
        { span: { text: "subchild v2," }},
        { span: { "=>": 
          [ 
            { span: { text: "subchild"} }, 
            "--",
            Placeholder("button_2"),
          ] 
        }},
        Placeholder("button_2"),
        Placeholder("any_component"),
        Use({span: {"=>": Placeholder("button_2", {default_component: "CANNOT SUBINJECT IN USE"}) }})
      ]
    }
  }

  const app_root = RenderApp(document.body, {
      div: { 
          data: { counter: 10 },

          signals: { 
            "counterIs20": "stream => (void)"
          },

          def: {
            incCounter: $ => $.this.counter = $.this.counter+2,
            beautifyCounterStatus: $ => "the counter is: " + $.this.counter + " (testing def deps in text [for now])"
          },

          handle: { 
            onclick: ($, e)=> $.this.incCounter()
          },

          on: { this: { 
            counterChanged: ($, v)=> {
              console.log("il counter è cambiato!! ora è:", v);
              if ($.this.counter === 20){$.this.counterIs20.emit()}
            }
          } },

          on_s: { le: { myInput: {
            newInputConfirmed: ($, newText) => console.log("sono parent, ho ricevuto un segnale da input!", newText)
          }}},

          ["=>"]: [ 

              "hello World!", $=>" -> "+$.this.counter, $=>"!!",

              { br: {} }, { br: {} },
              
              $ => $.this.beautifyCounterStatus(),
              { br: {} }, { br: {} },

              { div: {} }, // empty div
              { div: {text: "hello! world!"} }, { div: {text: $ => $.parent.counter+20} }, { div: {text: "!!"} },

              { div: { 
                id: "future_counter",

                data: {
                  futureCounter: $ => $.parent.counter + 100
                },

                ["=>"]: { 
                  div: { text: $ => $.parent.futureCounter, onInit:$=>console.log("ecco la visibilità dello scope:", $.scope, $.scope.futureCounter, $.scope.counter) }
                }
              }},

              { div: {

                data: {
                  bgColor: "red",
                },
                handle: { 
                  onclick: ($, e) => { $.this.bgColor = $.this.bgColor === "red" ? "blue" : "red"; e.stopPropagation();}
                },
                attrs: {
                  style: $ => ($.parent.counter % 11 !== 0 ? {
                    width: 100,
                    height: ( $.parent.counter * 2 )  + "px",
                    backgroundColor: $.this.bgColor
                  } : undefined)
                },
                text: "gooo",
              }},

              Use(
                InputComponent
              ),
              Use(
                InputComponent, {
                  id: "myInput2",

                  data: { text: "Hello from ipt2!" },

                  on: { this: {
                    textChanged: $=>{ console.log("text cambiatoooo by ipt2!", $.le); $.le.myInput.newInputConfirmed.emit("oh no! hacked!") }
                  }}
              }, {strategy: "override"}),

              Use(
                InputComponent, {
                  id: "myInput3",

                  data: { text: "Hello from ipt3!" },

                  on: { this: {
                    textChanged: $=>{ console.log("text cambiatoooo by ipt3!", $, $.le); $.le.myInput.newInputConfirmed.emit("oh no! hacked!"); $.this.myFunc1() }
                  }},
                  def: {
                    myFunc1: $=>console.log("hellooooo sono un func merged")
                  }
              }, {strategy: "merge"}),

              $ => $.le.myInput3.text,


              { Model: {
                data: {prop1: 23},
                afterInit: $ => console.log($.this.el),
                ["=>"]: [

                  { Model: { // sub model/obj
                    data: {prop2: 25},
                    afterInit: $ => console.log($.this.el),
                    text: "oleeeee",
                  }
                },
                ]
              }},

              Use(
                Timer, {
                  id: "myTimer",
                  data: {
                                
                    interval: 1000,
                    running: true,

                    count: 0,
                  },

                  def: {

                    onTriggered: $=>{
                      console.log("heeeeey..sono timer!!!")
                      $.this.count += 1
                      if ($.this.count === 5){
                        $.le.future_counter.futureCounter = 0
                      }
                      if ($.this.count > 10){
                        $.this.stop()
                        $.le.future_counter.futureCounter = $ => $.parent.counter + 100
                      }
                    },
                  }
                }
              ), // default is merge strategy!

              Use(
                CtxEnabledComponent,
                { id: "nowIsGlobalComponent1" }
              ),
              Use(
                CtxEnabledComponent,
                { id: "nowIsGlobalComponent2" }
              ),
              
              // demo visible parent chain
              { div: { "=>": { div: { "=>": { div: { "=>": {div: { 
                on: {
                  scope: {
                    counterIs20: $ => console.log("sono una ON_S via scope, il counter è 20!! => ", $.scope.counter),
                    counterChanged: $ => console.log("sono una ON via scope, il counter è: ", $.scope.counter)
                  }
                },
                afterInit: $ => { console.log($); console.log("ooooooooooooooooo", $.this, $.this.parent.parent.parent.parent.counter, $.this, $.parent.parent.parent.parent.counter)} 
              }}}}}}}},


              { div: {
                hattrs: {
                  "style.cssText": $=>toInlineStyle({
                    color: "blue"
                  }), // this works only because exec order is mantained!
                  "style.backgroundColor": $=> $.parent.counter === 10 ? "red" : "white",
                  // textContent: $ => $.parent.counter // NEVER DO THIS!
                },
                text: $ => $.parent.counter
              }},

              Use( EditableComponent, pass, { inject: {
                  "button_2": { button: { text: "injected button!", attrs: {style: " color: red; margin-right: 15px"}, handle: {onclick: $=>$.parent.el.style.backgroundColor = "gray"}}},
                  "any_component": { input: { attrs: {value: "any stuff injected!", style: "margin-left: 5px;" }}},
                }
              }),
              
              // test strange composition..
              Use({ div: { meta: {forEach: "num", of: $ => [1,2,3,4,5]},

                "=>": [ 
                  $ => $.meta.num, ")", 
                  { span: { meta: { if: $ => $.meta.num % 2 !== 0 },
                    data: {myVar: 123},
                    "=>":[ 
                      Placeholder("select_button"), Placeholder("deselect_button") 
                    ],
                    onInit:$=>console.log("ecco la visibilità dello scope da un le-for con use! ", $.scope, $.scope.myVar, $.scope.counter)
                  }}
                ]
              }}, pass, { inject: {
                "select_button": { button: { text: "select", attrs: {style: "color: red; margin-left: 15px"}, handle: {onclick: $=>$.parent.el.style.backgroundColor = "gray"}}},
                "deselect_button": { button: { text: "deselect", attrs: {style: "color: red; margin-left: 15px; margin-right:15px"}, handle: {onclick: $=>$.parent.el.style.backgroundColor = "white"}}},
              }})

          ] 
      }
  })

  console.log(app_root)
}
  


const test2way = ()=>{ console.log(
  RenderApp(document.body, { 
    div: {
      "=>": [
        
        { input: {
          id: "myInput",
      
          data: { text: "Hello!" },
      
          on: { this: {
            textChanged: ($, newText, oldText)=>console.log("text changeeeeeeddddd", newText, oldText) // le: { mySelect: {selectedChanged: ($, sel)=>$.this.text = sel}}},
          }}, 
      
          attrs: {
            id: "myInput",
            value: Bind($ => $.this.text)
          },
      
        }},

        { select: {
          id: "mySelect",
      
          data: { selected: "pirelli" },

          on: { this: {
            selectedChanged: ($, _new, _old)=>console.log("select changeeeeeeddddd", _new, _old)
          }},

          attrs: {
            value: Bind($ => $.this.selected)
          },
          "=>": [
            { option: { attrs: {value: "pirelli"}, text:"Pirelli"}},
            { option: { attrs: {value: "dunlop"}, text:"Dunlop"}},
            { option: { attrs: {value: "michelin"}, text:"Michelin"}},
          ],

          afterInit: $ => $.this._mark_selected_as_changed()
        }},

        { select: {
          id: "mySelectAdvanced",

          data: { 
            options: [
              {val:"-", label:"-"}, 
              {val:"pirelli", label:"Pirelli"}, 
              {val:"dunlop", label:"Dunlop"}, 
              {val:"michelin", label:"Michelin"}
            ], 
            selected: undefined 
          },
      
          on: { this: {
            selectedChanged: ($, _new, _old)=>console.log("select advanced changeeeeeeddddd", _new, _old)
          }},
      
          attrs: {
            value: Bind($ => $.this.selected?.val,  { 
                    remap: ($, v)=>$.this.options.find(o=>o.val===v) 
            })
          },

          "=>": [
            ...[0,1,2,3].map( i => ( // stupid generator untill le for
              { option: { attrs: { value: $ => $.parent.options[i].val }, text: $ => $.parent.options[i].label}}
            ))
          ],

          afterInit: $ => $.this.selected = $.this.options[1],

        }},

        { form: { 
          "=>": { 
            fieldset: { // fieldset solo per farlo più carino..l'importante è la form..per fare .value e non pippe strane di filtering del checked..
              id: "myRadio",
          
              data: { selected: "dunlop" },

              on: { this: {
                selectedChanged: ($, _new, _old)=>{ console.log("radio changeeeeeeddddd", _new, _old)}
              }},

              // 2 way data binding con la proprietà "value" di una form della parte del gruppo dei soli radio button, che mi da il selected attuale!
              hattrs: {
                "@lazy:form.elements.company.value": Bind($ => $.this.selected, { event: "change" }) // lazy necessario..altriemnti non riesco ad accedere a "company"
              },

              "=>": [
                { legend: { text: "Select Company"}},
                { input: { attrs: {type:"radio", name:"company", value: "pirelli"}}}, {label: { text: "Pirelli"}},
                { input: { attrs: {type:"radio", name:"company", value: "dunlop"}}}, {label: { text: "Dunlop"}},
                { input: { attrs: {type:"radio", name:"company", value: "michelin"}}}, {label: { text: "Michelin"}},
              ],

              // afterInit: $ => $.this._mark_selected_as_changed()
            }
          } 
        }},

        { div: { 
            id: "myRadio2",
        
            data: { selected: "dunlop" },

            on: { this: {
              selectedChanged: ($, _new, _old)=>{ console.log("radio changeeeeeeddddd", _new, _old)}
            }},

            "=>": [
              { legend: { text: "Select Company"}},

              ...[
                    ["pirelli", "Pirelli"], 
                    ["dunlop", "Dunlop"], 
                    ["michelin", "Michelin"]

              ].flatMap( ([val, label])=>[
                  
                  { input: { 

                    attrs: {
                      type:"radio", name:"company", value: val
                    }, 
                    hattrs: { // must be hattrs to update prop
                      checked: $ => $.parent.selected === val
                    }, 
                    handle: {
                      onclick: $=>{ $.parent.selected = val}
                    }
                  }}, 

                  {label: { text: label}}

                ]
              )
            ],

            // afterInit: $ => $.this._mark_selected_as_changed()
          }
        },

        { button: {

          text: "reset",
          
          on: { le: { 
            myInput: {
              textChanged: $ => console.log("sono button, è cambiato il text in input!!")
            },
            mySelect: {
              selectedChanged: $ => console.log("sono button, è cambiato il selected in input!!")
            },
            mySelectAdvanced: {
              selectedChanged: $ => console.log("sono button, è cambiato il selected advanced in input!!")
            },
            myRadio: {
              selectedChanged: $ => console.log("sono button, è cambiato il radio in input!!")
            },
            myRadio2: {
              selectedChanged: $ => console.log("sono button, è cambiato il radio2 in input!!")
            }
          }},

          handle: {
            onclick: $ => {
              $.le.myInput.text = "resetted!"
              $.le.mySelect.selected = "dunlop"
              $.le.mySelectAdvanced.selected = $.le.mySelectAdvanced.options.find(o=>o.val === "dunlop")
              $.le.myRadio.selected = "dunlop"
              $.le.myRadio2.selected = "dunlop"
            }
          }
        }}
      ]
    }
  })
)}


// TODO LIST DEMO
const appTodolist = ()=> {

  const TodoListModel = { 
    Model: {
      id: "model",

      data: {
        todolist: []
      },

      def: {
        add: ($, todo) =>{
          $.this.todolist = [...$.this.todolist, todo]
        },
        remove: ($, todo) =>{
          $.this.todolist = $.this.todolist.filter(t=>t !== todo)
        }
      },
    }
  }

  const TodoListController = {
    Controller: {
      id: "controller",

      def: {
        addTodoFromInput: $ => { 
          $.le.model.add($.le.input.text);
          $.le.input.text = ""
        }
      },
      
      on_s: { le: { input: {
        newInputConfirmed: $ => $.this.addTodoFromInput()
      }}}
    }
  }

  const TodoInput = { 
    input: {
      id: "input",

      data: { 
        text: "" 
      },

      signals: {
        newInputConfirmed: "stream => (text: string)"
      },

      hattrs: {
        value: Bind($ => $.this.text)
      },

      handle: {
        onkeypress: ($, e) => { e.key === "Enter" && $.this.newInputConfirmed.emit($.this.text) },
      },

    }
  }

  const AddTodoButton = { 
    button: {  text: "Add Todo",  handle: { onclick: $ => $.le.controller.addTodoFromInput() }  }
  }


  const ReGenTodoView = $ => {

      let $$ = $

      $.this.oldRenderized?.destroy()
      $.this.el.innerText = "" // simple clear all content..[without remove handlers etc..] to be sure all is clear!

      $.this.oldRenderized = RenderApp($$.this.el, {
        
        div: { 
          ["=>"]: $.le.model.todolist.map( todo => ( {
            
            div: { 
              ["=>"]: [

                { button: {  text: "remove",  handle: { onclick: $ => $$.le.model.remove(todo) }  }},

                { span: {text: todo, attrs: { style: {marginLeft:"15px"}}}}

            ]}

          })) 
        }
      })
  }
  const TodoListContainer_v0 = { 
    div: {
      id: "todoContainer",

      data: {
        oldRenderized: undefined
      },

      on: { le: { model: {
        todolistChanged: ReGenTodoView
      }}}
    }
  }


  const TodoListItems_v1 = { 
    div: {  // { meta: { forEach: "todo", of: $ => $.le.model.todolist } }

      "=>": [
        { button: {  text: "remove",  handle: { onclick: $ => $.le.model.remove($.meta.todo) }  }},

        { span: {text: $ => $.meta.todo, attrs: { style: {marginLeft:"15px"}}}}
      ]
    }
  }

  const TodoListContainer_v1 = { 
    div: {
      id: "todoContainer_with_lefor",

      "=>": Use(TodoListItems_v1,  { meta: { forEach: "todo", of: $ => $.le.model.todolist } } )
    }
  }


  const app_root = RenderApp(document.body, {
    div: {
      id: "appRoot",

      ["=>"]: [

        // Model & Controller
        Use(TodoListModel),
        Use(TodoListController),

        // Gui
        Use(TodoInput, { 
          attrs: { style: {width: "calc(100% - 90px)"} }
        }),

        Use(AddTodoButton, { 
          attrs: { style: {width: "80px"}} 
        }),
        
        { hr: {} },

        Use(TodoListContainer_v0),



        // Testing le IF
        { div: {   meta: { if: $ => $.le.model.todolist.length <= 0 },

          text: $ => "Hurraa! Non ci sono todo! (" + $.le.model.todolist.length + ")"

        }},

        { div: {   meta: { if: $ => $.le.model.todolist.length >= 5 },

          "=>": { span: { text: [ 
            "Oh no! hai molti todo! (",  {b: { text: $ => $.le.model.todolist.length}},  ")"
          ]}}
        }},

        $ => "---" // simple text node to dimostrate that le-if works as expected (keeping order)


        // Testing le for
        ,{ div: { meta: {forEach:"todo", of: $ => $.le.model.todolist}, 
          text: $ => $.meta.todo
        }},
        
        $ => "---", // simple text node to dimostrate that le-for works as expected (keeping order)
        
        Use(TodoListContainer_v1),

        $ => "---", // simple text node to dimostrate that le-for works as expected (keeping order)

        // testing nested le-for
        { Model: { id: "test_lefor", data: { arr:[1,2,3] }}},

        { div: {   meta: {forEach:"arr_val", of: $ => $.le.test_lefor.arr}, 
          "=>": { div: {   meta: {forEach:"todo", of: $ => $.le.model.todolist}, 
            text: $ => $.meta.arr_val + ") " + $.meta.todo
          }}
        }},

        // here testing component "meta" sapeartion
        { div: {   meta: {forEach:"arr_val", of: $ => $.le.test_lefor.arr}, 

          "=>": Use({ div: {   meta: {forEach:"todo", of: $ => $.le.model.todolist}, 
            text: $ => $.meta.arr_val + ") " + $.meta.todo + " (undefined is normal)"
          }})
        }},

      ]
    }
  })

  console.log(app_root)

}

const appNestedData = ()=>{

  const CssEngine = { 
    Style: { meta: {if: $=>$.le.appRoot.counter  <= 0 || $.le.appRoot.counter >= 5},

    id: "css_engine",
    
    data: {
      colors: ["red", "orange"],
      colors_idx: 0
    },
    
    css: {
      r0: ".test { background-color: red }",
      r1: $ => ".test2 { background-color: " + $.this.colors[$.this.colors_idx] + "}",
      r2_conditional: $ => $.this.colors_idx === 0 ? "" : ".test-font { font-size: 30px }"
    },
    
    // css: [
    //   ".test { background-color: red }",
    //   $ => ".test2 { background-color:" +$.this.fruits[0].name + "}"
    // ],

  }}

  const app_root = RenderApp(document.body, {
    div: {
      id: "appRoot",

      data: {
        fruits:[
          {name: "orange", tags: ["orange", "agrume", "sphere"]},
          {name: "strawberry", tags: ["red"]},
          {name: "lemon", tags: ["yellow", "agrume"]}
        ],

        counter: 0
      },

      handle: {
        onclick: $=>$.this.counter += 1
      },

      ["=>"]: [

        Use(CssEngine),

        { div: {  meta: { forEach: "fruit", of: $ => $.parent.fruits },
            "=>": { 

              div: {
                text: [

                  "- name:", $ => $.meta.fruit.name, " ",
                  { br:{} },

                  "--> [", 
                    { b: {  meta: { forEach: "tag", of: $ => $.meta.fruit.tags,   define: { last: "isLast", first: "isFirst" } },
                    
                      text: $ => ($.meta.isFirst ? " (#" : "(#") + $.meta.tag + ( $.meta.isLast ? ") " : "), " ), 
                      handle: {
                        onclick: ($,e)=> {
                          console.log("heeey! hai scelto il tag: " + $.meta.tag );

                          e.stopPropagation()
                          $.le.css_engine.colors_idx = ($.le.css_engine.colors_idx + 1 )%2 // demo direct change css
                        }
                      },
                      attrs: {
                        class: "test2 test-font"
                      }
                    }}, 
                  "]"
                ]
              }
            }
          }
        },

        { br:{} },
        // test key/value
        { div: {  meta: { forEach: "fruit_entries", of: $ => Object.entries($.parent.fruits[0]) },
          text: $ => $.meta.fruit_entries.join(":") + "..", 
        }}
      ]

    }
  })
}


// TODO LIST DEMO STABLE
const appTodolistv2 = ()=> {

  const TodoListModel = { 
    Model: {
      id: "model",

      data: {
        _todo_id_gen: 0,
        todolist: [], /* {_id: number, todo: string, done: boolean}*/
      },

      def: {
        add: ($, todoText, done=false) =>{
          $.this.todolist = [...$.this.todolist, { _id: $.this._todo_id_gen++, todo: todoText, done: done } ]
        },
        remove: ($, todo) =>{
          $.this.todolist = $.this.todolist.filter(t=>t._id !== todo._id)
        },
        chnageDoneStatus: ($, todo) => {
          todo.done = !todo.done
          $.this.todolist = [...$.this.todolist]
        }
      },

      on: { this: {
        todolistChanged: $ => {
          localStorage.setItem("le-todolist-example-data", JSON.stringify({
            _todo_id_gen: $.this._todo_id_gen, 
            todolist: $.this.todolist
          }))
        }
      }},

      onInit: $ => {
        let loaded = localStorage.getItem("le-todolist-example-data")
        console.log("model init!", loaded)


        try{

          loaded = JSON.parse(loaded)
          $.this._todo_id_gen = loaded._todo_id_gen
          $.this.todolist = loaded.todolist

        } catch {

          let force_init = true
          if ($.this.todolist.length === 0 || force_init){
            $.this.add("Some stuff..", true)
            $.this.add("Other things")
            $.this.add("Kind of magic!", true)
          }
        }

      }
    }
  }

  const TodoListController = {
    Controller: {
      id: "controller",

      def: {
        addTodoFromInput: $ => { 
          $.le.model.add($.le.input.text);
          $.le.input.text = ""
        }
      },
      
      on_s: { le: { input: {
        newInputConfirmed: $ => $.this.addTodoFromInput()
      }}}
    }
  }

  // View
  const TodoInput = { 
    input: {
      id: "input",

      data: { 
        text: "" 
      },

      signals: {
        newInputConfirmed: "stream => (text: string)"
      },

      hattrs: {
        value: Bind($ => $.this.text)
      },

      handle: {
        onkeypress: ($, e) => { e.key === "Enter" && $.this.newInputConfirmed.emit($.this.text) },
      },

    }
  }

  const AddTodoButton = { 
    button: {  text: "Add Todo",  handle: { onclick: $ => $.le.controller.addTodoFromInput() }  }
  }



  const TodoListItem = { 
    div: {  // { meta: { forEach: "todo", of: $ => $.le.model.todolist } }

      "=>": [
        // todo with checkbox
        { span: {
          "=>": [
            { input: { hattrs: { type: "checkbox", checked: $ => $.meta.todo.done, name: $ => $.meta.todo._id}, handle: {onchange: $ => $.le.model.chnageDoneStatus($.meta.todo) } }}, 
            
            { label: { 
              "=>": [  // si poteva fare anche con style..
                { span: { meta: {if: $ => !$.meta.todo.done}, 
                  text: $ => $.meta.todo.todo
                }}, 
                { s: { meta: {if: $ => $.meta.todo.done}, 
                  text: $ => $.meta.todo.todo 
                }},
              ], 
              hattrs: {for: $ => $.meta.todo._id} 
            }}
          ] 
        }},
        // remove button
        { button: {  
          text: "remove", 
          handle: { 
            onclick: $ => $.le.model.remove($.meta.todo) 
          }, 
          attrs: { 
            style: {position: "absolute", right:"2px"}
          }  
        }},
      ]
    }
  }

  const TodoListContainer= { 
    div: {
      id: "todoContainer_with_lefor",

      "=>": Use(TodoListItem,  { meta: { forEach: "todo", of: $ => $.le.model.todolist } } )
    }
  }

  const TodoRecap = {
    div: {
      "=>": [

        { div: {   meta: { if: $ => $.le.model.todolist.length <= 0 },
          text: $ => "Hurraa! Non ci sono todo!"
        }},

        { div: {   meta: { if: $ => $.le.model.todolist.length > 0 },

          "=>": { span: { text: [ 
            "Ci sono ",  {b: { text: $ => $.le.model.todolist.length}}, " To-Do"
          ]}}
        }}
      ]
    }
  }

  const app_root = RenderApp(document.body, {
    div: {
      id: "appRoot",

      attrs: {
        style: {
          width: "75%",
          minHeight: "50vh",
          overflowY: "auto",
          margin: "auto",
          position: "relative",
          marginTop: "25vh", //"calc(calc(100% - 50vh) / 5)",
          border: "1px solid black"
        }
      },

      ["=>"]: [

        // Model & Controller
        Use(TodoListModel),
        Use(TodoListController),

        // Gui
        Use(TodoInput, { 
          attrs: { style: {width: "calc(100% - 90px)"} }
        }),

        Use(AddTodoButton, { 
          attrs: { style: {width: "80px"}} 
        }),
        
        { hr: {} },

        Use(TodoListContainer),

        { hr: {} },

        Use(TodoRecap, { attrs: {style: {marginLeft: "5px", textAlgin:"right"}}}),

      ],
    }
  })

  console.log(app_root)

}


// test parent to "no name child"
const appPrantToChildComm = ()=>{

  const Dbus = {
    Signals: {
      id: "dbus",

      signals: {
        changeNestedText: "stream => (string)",
        changeParentText: "stream => (string)",
        // reset: "stream => (void)",
      }
    }
  }

  const app_root = RenderApp(document.body, {
    div: {
      id: "appRoot",

      "=>": [

        Use(Dbus),

        { div: {

          data: {
            parentText: "parent!"
          },

          // recive msg from "unknown" client
          on_s: { le: { dbus: {
            changeParentText: ($, newText) => $.this.parentText = newText,

            // reset: $ => $.this.parentText = "parent!"
          }}},

          // stupid reset
          handle: {
            onclick: $ => {
              $.le.dbus.changeNestedText.emit("- nested!");
              $.this.parentText = "parent!"
            }
          },

          "=>": [
            
            smart({ div: "esempio di componente 'smart', e di sistema di comunicazione tra elementi senza nome!" }, {attrs: {style: {fontSize: "25px"}}} ),

            $ => $.this.parentText,

            { div: {

              data: {
                testo: "- nested!"
              },

              text: $ => $.this.testo,

              // recive msg from "unknown" client
              on_s: { le: { dbus: {
                changeNestedText: ($, newText) => $.this.testo = newText,

                // reset: $ => $.this.testo = "- nested!"
              }}},

              // send message to "unknown" parent
              handle: {
                onclick: ($, e) => { $.parent.parentText = "parent edited by nested!"; e.stopPropagation()}
              },

              // or send message to "unknown" reciver on text change!
              on: { this: { testoChanged: ($, newText) =>  $.le.dbus.changeParentText.emit("parent edited by nested by external changes!")}},
              // on: { this: { testoChanged: ($, newText) => newText !== "- nested!" && $.le.dbus.changeParentText.emit("parent edited by nested by external changes!")}},

            }}
          ]
          
        }},

        { div: {
          text: "on click i will change the nested el text",

          handle: {
            onclick: $ => $.le.dbus.changeNestedText.emit("- changed!")
          }
          
        }},

        // smart({ button: "reset" }, { handle: { onclick: $ => $.le.dbus.reset.emit() }} )

      ]
    }
  })

  console.log(app_root)
}


const appTestCssAndPassThis = ()=>{

  const app_root = RenderApp(document.body, {
    div: {
      id: "appRoot",

      css: [
        // "[leName=hfkw4td] button{ color: green }",
        "button[leName=hfkw4td]{ color: green }", // todo: nota bene: affinchè funzioni alla angular maniera devi andare a definire un attr custom s tutti gli elementi dello stesso componente..qui però si evince una differenza tra angular e il mio..è a livello di componente (ctx) o di elemento? a rigor di logica il primo..ergo vado a usarlo per inserire nel css (via un replacer) il fatto che la regola è solo del component..farlo manualmente non è semplice..dovrei studiare bene i selettori, ma a occhio e croce dovrebbe essere solo alla fine (prima della graffa) e per gli el con virgola prima di ognuna (per ogni el insomma..)
        ".toEdit button{ color: red }",  // es di replacer "button @ctx { color: green }" (devo fare il replace di " @ctx ")
      ], 

      data: {
        selected: undefined
      },

      "=>": [
        { div: {
          attrs: { name: "hfkw4td" },
          "=>": [
            { div: {
              "=>": [
                { div: {
                  "=>": [
                    { button: {
                      attrs: { leName: "hfkw4td" },
                      text: "btn1"

                      ,data: {message: "btn1"}, def: {getMsg: $ => "!!" + $.this.message + "!!"}, handle: { onclick: $ => $.le.appRoot.selected = $.this }
                    }},

                    { div: {
                      attrs: { leName: "wwwjj3d" },
                      "=>": [
                        { div: {
                          "=>": [
                            { div: {
                              "=>": [
                                { button: {
                                  text: "btn1.1"

                                  ,data: {message: "btn1.1"}, def: {getMsg: $ => "!!" + $.this.message + "!!"}, handle: { onclick: $ => $.le.appRoot.selected = $.this }
                                }}
                              ]
                            }}
                          ]
                        }}
                      ]
                    }}

                  ]
                }}
              ]
            }}
          ]
        }},
        
        { div: {
          attrs: { class: "toEdit" },
          "=>": [
            { div: {
              "=>": [
                { div: {
                  "=>": [
                    { button: {
                      text: "btn2"

                      ,data: {message: "btn2"}, def: {getMsg: $ => "!!" + $.this.message + "!!"}, handle: { onclick: $ => $.le.appRoot.selected = $.this }
                    }}
                  ]
                }}
              ]
            }}
          ]
        }},

        { div: {
          // attrs: { class: "notToEdit" },
          "=>": [
            { div: {
              "=>": [
                { div: {
                  "=>": [
                    { button: {
                      text: "btn3"

                      ,data: {message: "btn3"}, def: {getMsg: $ => "!!" + $.this.message + "!!"}, handle: { onclick: $ => $.le.appRoot.selected = $.this }
                    }}
                  ]
                }}
              ]
            }}
          ]
        }},

        smart({ div: $ => ($.le.appRoot.selected?.message || "") + " " + ($.le.appRoot.selected?.getMsg() || "") })
      ]
    }
  })
}

const appTestSuperCtxProblem = ()=>{

  const app_root = RenderApp(document.body, {
    div: {
      id: "ctx0",

      props: {
        elements: [[1,10],[2,20],[3,30]]
      },

      "=>": [
        Use({ div: {
          ctx_id: "ctx1",

          data: { counter: 0 },

          handle: {
            onclick: $ => { $.this.counter += 1 }
          },
              
          "=>": [
              
            $ => "counter: " + $.ctx.ctx1.counter,

            // pass, // todo: pass/undefined/null must be skipped..

            Use({ div: {
              ctx_id: "ctx2",

              text: $ => "counter: " + $.parent.counter // non posso usare $.ctx.ctx1.counter...
            }})
          ]
        }}),

        smart({span: $=>"elements: "+JSON.stringify($.parent.elements)}),

        // testing del problema di accesso al "super-meta", superato con una clone del meta as props(ovviamente qui bastava un parent al posto di scope, ma nei sotto elementi si)
        Use({ div: { meta: {forEach: "tuple", of: $=>$.parent.elements},

          props: {
            meta_tuple: $=>$.meta.tuple
          },

          "=>":[
            smart({h6: $=>"il meta vale: "+$.meta.tuple}),
            smart({h6: $=>"il this vale: "+$.parent.meta_tuple}),
            smart({h6: $=>"il scope vale: "+$.scope.meta_tuple}),

            Use({ div: { meta: {forEach: "element", of: $=>$.scope.meta_tuple},

              props: {
                meta_element: $=>$.meta.element
              },

              "=>":[
                smart({h6: $=>"-il meta vale: "+$.meta.element}),
                smart({h6: $=>"-il this vale: "+$.parent.meta_element}),
                smart({h6: $=>"-il scope vale: "+$.scope.meta_element}),

                smart({h6: $=>"-via meta vale: "+$.meta.meta_tuple}, {ha:{"style.color":"red"}}),
                smart({h6: $=>"-via scope vale: "+$.scope.meta_tuple}, {ha:{"style.color":"green"}}),
                
                smart({ p: $=>"--element:"+$.meta.element}),
                smart({ p: $=>"--element:"+$.scope.meta_element}),
                smart({ p: $=>"--element:"+$.parent.meta_element})
              ]

            }}),

            {hr:{}}

          ]

        }})
      ]
    }
  })
}


const appTestAnchors = ()=>{

  const app_root = RenderApp(document.body, {
    div: {
      id: "root",

      props: {
        width: 0, height: 0, x:0, y:0
      },
      attrs: {style: "width:100%; height:100%; padding: 0px; margin: 0px; position: relative"},
      onInit: $ => {
                
        function resetRootWindowSize() {
          $.this.width = window.innerWidth;
          $.this.height = window.innerHeight;
        }

        window.onresize = resetRootWindowSize;
        document.body.style.padding = "0px"
        document.body.style.margin = "0px"
        resetRootWindowSize()
      },

      "=>": [

        { div: {
          id: "navbar",

          props: { width: $ => $.parent.width, height: 64, fontSize: 24 },

          attrs: { style: $ => ({ width: $.this.width+"px", height: $.this.height+"px", backgroundColor: "black", color: "white", fontSize: $.this.fontSize+"px", position: "absolute" })},

          // text: "Bar"

          "=>": [
            { div: {
              id: "nav_left_text",

              props: { width: $ => $.parent.width / 3, left: 15, top: $ => ($.parent.height / 2) - ($.parent.fontSize / 2) - ($.parent.fontSize / 10)},

              attrs: { style: $ => ({ width: $.this.width+"px", top: $.this.top+"px", left: $.this.left+"px",  position: "absolute" })},

              text: "Hello Anchors!"

            }},

            { div: {
              id: "nav_second_text",

              props: { width: $ => $.parent.width / 3, left: $ => $.le.nav_left_text.width + $.le.nav_left_text.left + 15, top: $ => ($.parent.height / 2) - ($.parent.fontSize / 2) - ($.parent.fontSize / 10)},

              attrs: { style: $ => ({ width: $.this.width+"px", top: $.this.top+"px", left: $.this.left+"px",  position: "absolute", textAlign:"center"})},

              text: "un testo secondario!"

            }},

            { div: {
              id: "nav_right_text",

              props: { width: $ => $.parent.width / 3, right: 15, top: $ => ($.parent.height / 2) - ($.parent.fontSize / 2) - ($.parent.fontSize / 10)},

              attrs: { style: $ => ({ width: $.this.width+"px", top: $.this.top+"px", right: $.this.right+"px",  position: "absolute", textAlign:"right" })},

              text: "A right Text"

            }},

          ]

        }},


        // demo follow by content!
        { div: {
          id: "content_text_left",

          props: { width: undefined, height: 200, left: 150, top: $ => $.le.navbar.height + 15},

          afterInit: $ => {
            $.this.width = $.this.el.getBoundingClientRect().width
          },

          attrs: { style: $ => ({height: $.this.height+"px",  width: $.this.width? $.this.width+"px" : undefined, top: $.this.top+"px", left: $.this.left+"px",  position: "absolute" })},

          text: "Hello Contents!!"

        }},

        { div: {
          id: "content_text_left_after",

          props: { width: 200, height: 200, left: $=>$.le.content_text_left.width + $.le.content_text_left.left + 15, top: $ => $.le.navbar.height + 15},


          attrs: { style: $ => ({height: $.this.height+"px",  width: $.this.width+"px", top: $.this.top+"px", left: $.this.left+"px",  position: "absolute" })},

          text: "i always follow content!"

        }},

      ]
    }
  })
}


const appTestBetterAnchors = ()=>{
  const notnulls = (...args)=>args.reduce((a,b)=>a && (b !== undefined), true)
  const firstDefined = (...args)=>args.find(x=>x!==undefined)

  const AnchorsSystmeRootStyle = {position:"relative", width: "100%", height:"100%", padding: "0px", margin: "0px"}
  const AnchorsSystemInit = $ => {
    // resetRootWindowSize
    window.onresize = () => {
      $.this.width = window.innerWidth;
      $.this.height = window.innerHeight;
    }
    document.body.style.padding = "0px"
    document.body.style.margin = "0px"
  }

  const UseAnchors = (positioning = "absolute") => {
    return {
      // props to define
      width: undefined, height: undefined, left: 0, top: 0, right: undefined, bottom: undefined,

      // solito problema di castare nei childs e rimappare..

      // props to use in other component
      Width: $ => $.this.width || ( notnulls($.this.left, $.this.right) && $.this.right-$.this.left ) || 0,
      Height: $ => $.this.height || ( notnulls($.this.top, $.this.bottom) && $.this.bottom-$.this.top ) || 0,
      Left: $ => $.this.left || (notnulls($.this.width, $.this.right) && $.this.right-$.this.width ) || 0,
      Top: $ => $.this.top || (notnulls($.this.height, $.this.bottom) && $.this.bottom-$.this.height ) || 0,
      Right: $ => $.this.right || (notnulls($.this.width, $.this.left) && $.this.left+$.this.width ) || undefined,
      Bottom: $ => $.this.bottom || (notnulls($.this.height, $.this.top) && $.this.top+$.this.height ) || undefined,
      HorizontalCenter: $ => $.this.Width / 2, 
      VerticalCenter: $ => $.this.Height / 2, 

      // as child
      Height_: $ => $.this.Height,
      Width_: $ => $.this.Width,
      Left_: $ => 0,
      Top_: $ => 0,
      Right_: $ => $.this.Width,
      Bottom_: $ => $.this.Height,
      HorizontalCenter_: $ => $.this.Width / 2, 
      VerticalCenter_: $ => $.this.Height / 2, 

      // f to recall in style
      Anchors: $ => ({
        position: positioning, // con "fixed", in realtà rimuoveremmo il problema del ricavare il sistema di riferimento ma in realtà poi toccal al dev sobbarcarsi di mettere sempre top e left..
        width: $.this.Width+"px",
        height:  $.this.Height+"px",
        top: $.this.Top+"px", 
        left: $.this.Left+"px",
      })
    }
  }

  const app_root = RenderApp(document.body, {
    div: {
      id: "root",

      props: {
        ...UseAnchors(),
        width: window.innerWidth,
        height: window.innerHeight,
      },

      attrs: {style: AnchorsSystmeRootStyle },
      onInit: $ => AnchorsSystemInit($),

      "=>": [

        { div: {
          id: "navbar",

          props: { ...UseAnchors(), 
            width: $ => $.parent.Width, 
            height: 64, 
            fontSize: 24 
          },

          attrs: { style: $ => ({ ...$.this.Anchors, backgroundColor: "black", color: "white", fontSize: $.this.fontSize+"px"})},

          // text: "Bar"

          "=>": [
            { div: {
              id: "nav_left_text",

              props: { ...UseAnchors(), 
                width: $ => $.parent.Width / 3, 
                top: $ => ($.parent.VerticalCenter) - ($.parent.fontSize / 2) - ($.parent.fontSize / 10)
              },

              attrs: { style: $ => ({ ...$.this.Anchors })},

              text: "Hello Anchors!"

            }},

            { div: {
              id: "nav_second_text",

              props: { ...UseAnchors(), 
                width: $ => $.parent.Width / 3, 
                left: $ => $.le.nav_left_text.Right,  
                top: $ => ($.parent.VerticalCenter) - ($.parent.fontSize / 2) - ($.parent.fontSize / 10)
              },

              attrs: { style: $ => ({ ...$.this.Anchors, textAlign:"center"})},

              text: "un testo secondario!"

            }},

            { div: {
              id: "nav_right_text",

              props: { ...UseAnchors(), 
                width: $ => $.parent.Width / 3, 
                left: $ => $.le.nav_second_text.Right, 
                top: $ => ($.parent.VerticalCenter) - ($.parent.fontSize / 2) - ($.parent.fontSize / 10) 
              },

              attrs: { style: $ => ({ ...$.this.Anchors, textAlign:"right" })},

              text: "A right Text"

            }},

          ]

        }},

        { div: {
          id: "container",

          props: { ...UseAnchors(), 
            width: $=>$.parent.Width - 30, 
            top: $=>$.le.navbar.Bottom + 15, 
            bottom: $=>$.parent.Bottom - 15,
            left: 15,
          },
          attrs: { style: $=>({...$.this.Anchors, backgroundColor: "gray"}) },

          "=>": [

            { div: {
              id: "rect1",
    
              props: { ...UseAnchors(), 
                width: $=>$.this.isSmall ? 200 : 400,
                height: $=>$.this.isSmall ? 200 : 400,
                left: 15,
                top: 15,

                // in caso di uso di fixed!
                // ...UseAnchors("fixed"), 
                // width: $=>$.this.isSmall ? 200 : 400,
                // height: $=>$.this.isSmall ? 200 : 400,
                // left: $=>$.parent.Left + 15, 
                // top: $=>$.parent.Top + 15 // in caso di uso di fixed

                isSmall: true
              },
              attrs: { style: $=>({...$.this.Anchors, backgroundColor: "red", transition: "left 0.3s, top 0.3s, height 0.3s, width 0.3s ease-in-out"}) },
              handle: {
                onclick: $=> $.this.isSmall = !$.this.isSmall
              }
            }},

            { div: {
              id: "rect2",
    
              props: { ...UseAnchors(), 
                width: $=>$.le.rect1.Width,
                height: $=>!$.le.rect1.isSmall && $.le.lateral_menu.isExpanded ? undefined : $.le.rect1.Height,
                left: $=>$.le.rect1.Right,
                top: $=>$.le.rect1.Bottom,
                bottom: $=>!$.le.rect1.isSmall && $.le.lateral_menu.isExpanded ? $.le.mooving_rect.Top - 15 : undefined // qui trovato bug in framework..non riesco a registrarmi a proprietà di elementi futuri! pechè ancora non esistono..
              },
              attrs: { style: $=>({...$.this.Anchors, backgroundColor: "red", transition: "left 0.3s, top 0.3s, height 0.3s, width 0.3s ease-in-out"}) },
              // on: {
              //   this: { 
              //     heightChanged: $=>console.log("heigth changeeed", $.this.height),
              //     // bottomChanged: $=>console.log("bottom changeeed", $.this.bottom)
              //   },
              //   le: { 
              //     // mooving_rect: {TopChanged: $=>console.log("top changeeeeedddddd", $.le.mooving_rect.Top, $.this.bottom)},
              //     lateral_menu: {isExpandedChanged: $=>console.log("isExpanded changeeeeedddddd", $.le.lateral_menu.isExpanded, $.this.bottom)},
              //     rect1: {isSmallChanged: $=>console.log("isSamll changeeeeedddddd", $.le.rect1.isSmall, $.this.bottom)}
              //   }
              // }
            }},

            { div: {
              id: "rect3",
    
              props: { ...UseAnchors(), 
                width: $=>$.le.rect1.isSmall ? $.le.rect1.Width : undefined,
                height: $=>$.le.rect1.Height,
                left: $=>$.le.rect2.Right,
                bottom: $=>$.le.rect2.Top,
                right: $=>$.le.rect1.isSmall ? 0 : $.le.lateral_bar.Left - 15
              },
              attrs: { style: $=>({...$.this.Anchors, backgroundColor: "red", transition: "left 0.3s, top 0.3s, height 0.3s, width 0.3s ease-in-out"}) },
            }},


            { div: {
              id: "lateral_menu",
    
              props: { 
                ...UseAnchors("absolute"), 
                top: 15,
                right: $=>$.parent.Right_ - 15, 
                bottom: $=>$.this.isExpanded ? $.parent.Bottom_ - 15 : undefined,
                width: $=>$.parent.Width / 3,
                height: $=>$.this.isExpanded ? undefined : 100,
                // senza usare l'as child:
                // right: $=>$.parent.Right - $.parent.Left - 15, // necessario risolvere il solito problema del sistema di riferimento..
                // bottom: $=>$.this.isExpanded ? $.parent.Bottom - $.parent.Top - 15 : undefined,

                // ...UseAnchors("fixed"), 
                // right: $=>$.parent.Right - 15, 
                // top: $=>$.parent.Top + 15,
                // bottom: $=>$.this.isExpanded ? $.parent.Bottom - 15 : undefined,
                // width: $=>$.parent.Width / 3,
                // height: $=>$.this.isExpanded ? undefined : 100,

                isExpanded: true
              },
              attrs: { style: $=>({...$.this.Anchors, backgroundColor: $.this.isExpanded ? "green" : "orange", transition: "height 0.3s ease-in-out"}) },

              handle: {
                onclick: $=>$.this.isExpanded = !$.this.isExpanded
              }
            }},

            { div: {
              id: "lateral_bar",

              props: {
                ...UseAnchors(),
                right: $=>$.le.lateral_menu.Left - 15, 
                top: $=>$.le.lateral_menu.Top,
                width: 60,
                height: $=>$.le.lateral_menu.Height, 
              },

              attrs: { style: $=>({...$.this.Anchors, backgroundColor: "yellow", transition: "height 0.3s ease-in-out"}) },
            }},


            { div: {
              id: "mooving_rect",
              
              props: {
                ...UseAnchors(),
                // $.le.lateral_menu.isExpanded ? 
                left: $=>($.le.lateral_menu.isExpanded ? $.parent.Left_ +15 : $.le.lateral_bar.Left),
                right: $=>($.le.lateral_menu.isExpanded ? $.le.lateral_bar.Left : $.parent.Right_)-15,
                top: $=>$.le.lateral_menu.isExpanded ? undefined : $.le.lateral_menu.Bottom+15,
                bottom: $=>$.parent.Bottom_ - 15,
                height: $=>$.le.lateral_menu.isExpanded ? 200 : undefined,

              },

              attrs: { style: $=>({...$.this.Anchors, backgroundColor: "blue", transition: "left 0.3s, top 0.3s, height 0.3s, width 0.3s ease-in-out"}) },
            }}
            
          ]
        }}

      ]
    }
  })
}

const appStupidFunction = ()=>{

  // el per definire un el come: el("div alias MyDiv", { ...standard def } )
  const el = (name, def)=>{
    let [_id, _type] = name.split(" as ")
    return {[_type]: {id: _id, ...def}}
  }

  // slim per usare dot notation ed evitare di essere prolissi in definition, es: div: {blabla, ...slim({ "on.le.MyDiv.propChanged": $=>dosomethign() }) }
  const slim = (def)=>{
    let res = {}
    
    Object.entries(def).forEach(([k,v])=>{
      let pointer = res
      
      k.split(".").forEach((ref_lvl, idx, arr)=>{
        if (idx < arr.length-1) { // is last
          if (pointer[ref_lvl] === undefined) { pointer[ref_lvl] = {} }
          pointer = pointer[ref_lvl]
        }
        else {
          pointer[ref_lvl] = v
        }
      })
    })
    
    return res
  }
  // slim_ per usare dot notation ed evitare di essere prolissi in definition, ma come array (a coppie di 2), es: div: {blabla, ...slim("on.le.MyDiv.propChanged", $=>dosomethign()) }
  const slim_ = (...arr)=>{
    let paramForSlim = {}
    for (let i=0; i<arr.length; i+=2){
      paramForSlim[arr[i]] = arr[i+1]
    }
    return slim(paramForSlim)
  }

  // ...Reuse("attrs").From(MyComponent) --> Reuse("a.b.0.c").From({div: {a: {b: [{c: 123}, {d: 456}]}}})
  const Reuse = (what) => {
    if (what.includes(".")){
      return { 
        From: (componenent)=>{
          let pointer = Object.values(componenent)[0]
          for (let part of what.split(".")){
            pointer = pointer[part]
          }
          return {[part]: pointer}
        } 
      }
    }
    else {
      return { From: (componenent)=>({[what]: Object.values(componenent)[0][what]}) }
    }
  }




}


const appDemoStockApi = ()=>{

  const SERVER_SCRAPE_TIME = 250 //500

  const DEFAULT_REFRESH_RATE = [250, 500, 1000][0]
  const DEFAULT_INITIAL_BALANCE = 2000

  const COMMISSIONS_ENABLED = false

  const GRAPH_BIG_MIN = 60
  const GRAPH_SMALL_MIN = 10


  const app_root = RenderApp(document.body, {
    div: {
      id: "appRoot",

      data: {
        fullInitialStockData: [],

        stockData: {price: 0, date: 0, volume: 0, bid:0, ask:0 },
        oldStockData: {price: 0, date: 0, volume: 0, bid:0, ask:0 },

        maxPercObserved: 0,
        minPercObserved: 0,
        avgPercObserved: 0,
        totalPercObserved: 0,

        slidingWindowMaxPercObserved: 0,
        slidingWindowMinPercObserved: 0,
        slidingWindowAvgPercObserved: 0,
        slidingWindowTotalPercObserved: 0,

        refreshRateMs: DEFAULT_REFRESH_RATE,

        running: false,
      },

      "=>": [

        { Controller: {
          id:"controller",

          def: {
            loadStockData: async $ => {
              try {
                let res = await axios.get('http://localhost:4512/api/stock-data')

                $.parent.oldStockData = $.parent.stockData
                $.parent.stockData = { price: res.data.price, date: res.data.date, volume: res.data.volume, bid: res.data.bid, ask: res.data.ask  } 
                // console.log(res)
              } catch (e) { console.log(e)}
            },

            loadFullStockData: async $ => {
              try {
                let res = await axios.get('http://localhost:4512/api/full-stock-data')

                $.parent.fullInitialStockData = res.data

                console.log("full", res)
              } catch (e) { console.log(e)}
            },

            getStockPriceChanges: $ => {
              let actual = $.le.appRoot.stockData
              let old = $.le.appRoot.oldStockData

              let diff = actual.price - old.price
              let neg_diff = old.price - actual.price
              let abs_diff = Math.abs(diff)

              let is_neg = diff < 0

              let perc = is_neg ? (neg_diff / actual.price) * 100 : (diff / actual.price) * 100

              return {diff: diff, perc: perc}
            }

          },

        }},

        { Model: {
          id: "wallet",

          data: {
            balance: DEFAULT_INITIAL_BALANCE,
            open_order: undefined,

            unreal_balance: $ => {
              if($.this.open_order === undefined) {
                return "No Open Orders"
              }
              else {
                if ($.this.open_order.type === "long"){
                  let new_balance = ($.this.open_order.qty * (1-$.this.sell_commission)) * $.le.appRoot.stockData.bid // venderò a bid
                  let profit = new_balance - $.this.open_order.invested
                  let perc = (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1  : (new_balance / $.this.open_order.invested)-1 ) * 100
                  return profit.toFixed(2) + "€ | " + perc.toFixed(5) + "% | " + new_balance.toFixed(4) + "€"
                }
                else if ($.this.open_order.type === "short"){
                  let new_balance =  $.this.open_order.invested + (($.this.open_order.qty * $.this.open_order.open_price ) -  (($.this.open_order.qty * (1-$.this.buy_commission)) * $.le.appRoot.stockData.ask)) // comprerò ad ask
                  let profit = new_balance - $.this.open_order.invested
                  let perc = (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1  : (new_balance / $.this.open_order.invested)-1 ) * 100
                  return profit.toFixed(2) + "€ | " + perc.toFixed(5) + "% | " + new_balance.toFixed(4) + "€"
                }
              }
              return ""
            },

            history: [],

            buy_commission: COMMISSIONS_ENABLED ? 0.075/100 : 0,
            sell_commission: COMMISSIONS_ENABLED ? 0.075/100 : 0,

            leverage: 1 // todo, leverage

          },
          
          on: {
            this: {
              balanceChanged: $ => {
                localStorage.setItem("demo-le-stock:balance", JSON.stringify({balance: $.this.balance}))
              }
            }
          },

          onInit: $ => {
            let retrivedBalance = localStorage.getItem("demo-le-stock:balance")
            if (retrivedBalance !== undefined && retrivedBalance !== null){
              let balance = JSON.parse(retrivedBalance).balance 
              if(balance > 0){
                $.this.balance = balance
              }
            }
          },

          def: {
            can_open_position: $ => {
              return $.this.open_order === undefined
            },
            go_long: $ => {
              if ($.this.balance > 0 && $.this.can_open_position()){ //compro ad ask
                $.this.open_order = {qty: ($.this.balance * (1-$.this.buy_commission)) / $.le.appRoot.stockData.ask, invested: $.this.balance, open_commission: $.this.balance * $.this.buy_commission,  open_price: $.le.appRoot.stockData.bid, open_time: new Date(), type: "long"}
                $.this.balance = 0
              }
            },
            go_short: $ => {
              if ($.this.balance > 0 && $.this.can_open_position()){ // vendo a bid
                $.this.open_order = {qty: ($.this.balance * (1-$.this.sell_commission))/ $.le.appRoot.stockData.bid, invested: $.this.balance, open_commission: $.this.balance * $.this.sell_commission, open_price: $.le.appRoot.stockData.ask, open_time: new Date(), type: "short"}
                $.this.balance = 0
              }
            },
            close: $ => {
              if ($.this.open_order !== undefined){
                if ($.this.open_order.type === "long"){
                  let sell_price = $.le.appRoot.stockData.bid
                  let new_balance = ($.this.open_order.qty * (1-$.this.sell_commission)) * sell_price
                  let order = {...$.this.open_order,  close_commission: new_balance * $.this.sell_commission, final_balance: new_balance, close_price: sell_price, close_time: new Date(), difference: new_balance - $.this.open_order.invested, difference_perc: (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1 : (new_balance / $.this.open_order.invested)-1 )*100}
                  $.this.balance = new_balance
                  $.this.open_order = undefined
                  $.this.history = [order, ...$.this.history]
                }
                else if ($.this.open_order.type === "short"){
                  let buy_price = $.le.appRoot.stockData.ask
                  let new_balance = $.this.open_order.invested + (($.this.open_order.qty * $.this.open_order.open_price ) -  (($.this.open_order.qty * (1-$.this.buy_commission)) * buy_price))
                  let order = {...$.this.open_order,  close_commission: new_balance * $.this.buy_commission, final_balance: new_balance, close_price: buy_price, close_time: new Date(), difference: new_balance - $.this.open_order.invested, difference_perc: (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1 : (new_balance / $.this.open_order.invested)-1 )*100}
                  $.this.balance = new_balance
                  $.this.open_order = undefined
                  $.this.history = [order, ...$.this.history]
                }
              }
            },
            resetBalance: $ => {
              if( !$.this.can_open_position){
                $.this.close()
              }
              $.this.balance = DEFAULT_INITIAL_BALANCE
            }
          }
        }},

        { div: { meta: { if: $=>$.le.appRoot.running },

          id: "order_controls",

          attrs: { style: $=>({position:"fixed", width:"400px", height:"300px", right:"0px", bottom:"0px", border: "1px solid black", backgroundColor:"white", zIndex:"1000", overflowY:"auto"}) },

          "=>":[
            { button: {
              text: "Buy",
              hattrs: {style: "width: 50%; color: green"},
              handle: {  onclick: $ => $.le.wallet.go_long()  }
            }},

            { button: {
              text: "Sell",
              hattrs: {style: "width: 50%; color: red"},
              handle: {  onclick: $ => $.le.wallet.go_short()  }
            }},
            
            {br:{}},

            { button: {
              text: "Close Position",
              hattrs: {style: "width: 100%"},
              handle: {  onclick: $ => $.le.wallet.close()  }
            }},

            {br:{}},

            { div: {
              text: [ "Balance: ", $ => $.le.wallet.balance, "€" ]
            }},

            { div: {
              text: [ "Unreal Balance: ", $ => $.le.wallet.unreal_balance ]
            }},

            { div: {
              text: [ "Price: ", $ => $.le.appRoot.stockData.price, " -  Ask: ", $ => $.le.appRoot.stockData.ask, " - Bid: ", $ => $.le.appRoot.stockData.bid]
            }},

            { div: {
              text: [ "Spread: ", $ => $.le.appRoot.stockData ? ((($.le.appRoot.stockData.ask / $.le.appRoot.stockData.bid)-1) * 100).toFixed(4) : " - ", "%"]
            }},

            { div: {
              text: [ "Open Price: ", $ => $.le.wallet.open_order? $.le.wallet.open_order.open_price : "-"]
            }},

            "Position: ",
            { div: {
              text: $ => JSON.stringify( $.le.wallet.open_order )
            }},

            "Histroy: ",
            { div: {
              text: $ => JSON.stringify( $.le.wallet.history )
            }},

            { button: {
              text: "Reset",
              hattrs: {style: "width: 100%"},
              handle: {  onclick: $ => $.le.wallet.resetBalance()  }
            }},
          ]

        }},

        { button: {
          text: "run",

          data: {
            intervall: undefined
          },
          
          handle: { 
            onclick: async $ => {
              if ($.this.intervall === undefined) {
                console.log("running full call..")
                await $.le.controller.loadFullStockData()
                console.log("runnong intervall call")
                $.le.controller.loadStockData()
                $.this.intervall = setInterval(()=>$.le.controller.loadStockData(), $.parent.refreshRateMs)
                setTimeout(() => {$.parent.running = true}, $.parent.refreshRateMs * 2);
              } else {
                clearInterval( $.this.intervall )
                $.this.intervall = undefined
              }
            } 
          }
        }},

        { div: {
          text: [
            $ => "Refrsh Rate (sec): " + $.parent.refreshRateMs/DEFAULT_REFRESH_RATE,
            {br:{}},

            $ => "Price: " + $.parent.stockData?.price.toFixed(2), " - ",
            $ => " Volumes: " + $.parent.stockData?.volume.toFixed(5), " - ",
            { span: { 
              def: { getFormattedStockPriceChanges: $ =>{
                let {diff, perc} = $.le.controller.getStockPriceChanges()
                return "Diff: " + diff.toFixed(4) + "; Perc: " + perc.toFixed(4) +"%"
              }},
              text: $ => $.le.appRoot.stockData === undefined ? "" : $.this.getFormattedStockPriceChanges()  // l'autoupdate qui funziona solo perchè al momento sto puntanto alle vere deps!
            }},

            {hr: {}},
            {br: {}},
            $ => "avg obs: " + $.parent.avgPercObserved.toFixed(5)+"%", " - ",
            $ => "avg obs: " + $.parent.avgPercObserved.toFixed(5)+"%", " - ",
            // $ => "min obs: " + $.parent.minPercObserved.toFixed(5)+"%", " - ",
            $ => "max obs: " + $.parent.maxPercObserved.toFixed(5)+"%", " - ",
            $ => "total obs: " + $.parent.totalPercObserved.toFixed(5)+"%",

            {br: {}},
            $ => "avg obs (sl wiw): " + $.parent.slidingWindowAvgPercObserved.toFixed(5)+"%", " - ",
            // $ => "min obs (sl wiw): " + $.parent.slidingWindowMinPercObserved.toFixed(5)+"%", " - ",
            $ => "max obs (sl wiw): " + $.parent.slidingWindowMaxPercObserved.toFixed(5)+"%", " - ",
            $ => "sum obs (sl wiw): " + $.parent.slidingWindowTotalPercObserved.toFixed(5)+"%", 


            {hr: {}},
            {br: {}},
            $ => "avg obs (5x leverage): " + ($.parent.avgPercObserved*5).toFixed(5)+"%", " - ",
            // $ => "min obs (5x leverage): " + ($.parent.minPercObserved*5).toFixed(5)+"%", " - ",
            $ => "max obs (5x leverage): " + ($.parent.maxPercObserved*5).toFixed(5)+"%", " - ",
            $ => "total obs (5x leverage): " + ($.parent.totalPercObserved*5).toFixed(5)+"%",

            {br: {}},
            $ => "avg obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowAvgPercObserved*5).toFixed(5)+"%", " - ",
            // $ => "min obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowMinPercObserved*5).toFixed(5)+"%", " - ",
            $ => "max obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowMaxPercObserved*5).toFixed(5)+"%", " - ",
            $ => "total obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowTotalPercObserved*5).toFixed(5)+"%",
            
          ]
        }},

        
        { canvas: { 
          id: "chartjs",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_BIG_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_BIG_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          def: {
            computeAvgPercObserved: ($, limitToSlidingWindow=false) => {
              // console.log("datasetsss", $.this.chart.data.datasets[0].data)

              let data = $.this.chart.data.datasets[0].data
              if (limitToSlidingWindow){
                data = data.length > $.this.slidingWindowsPoints ? data.slice((data.length-$.this.slidingWindowsPoints), data.length) : data
              }
              let count = data.length

              let sum = 0
              let min = Number.MAX_SAFE_INTEGER
              let max = Number.MIN_SAFE_INTEGER
              for (let i=0; i<count-1; i++){
                let _old = data[i]
                let _new = data[i+1]

                let abs_diff = Math.abs(_new - _old)

                let perc = (abs_diff / _new) * 100
                // console.log()
                perc < min && min > 0 && (min = perc)
                perc > max && (max = perc)
                sum = sum + perc
              }
              return {total: sum, avg: sum/count, min: min, max: max}

              //   let perc = (abs_diff / _new) * 100

              //   sum += abs_diff
              // }
              // return ((sum/count) / _new) * 100

            }
          },
          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.price);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.price);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                let observedPerc = $.this.computeAvgPercObserved()

                $.le.appRoot.totalPercObserved = observedPerc.total
                $.le.appRoot.avgPercObserved = observedPerc.avg
                $.le.appRoot.minPercObserved = observedPerc.min
                $.le.appRoot.maxPercObserved = observedPerc.max

                let slidingWindowObservedPerc = $.this.computeAvgPercObserved(true)

                $.le.appRoot.slidingWindowTotalPercObserved = slidingWindowObservedPerc.total
                $.le.appRoot.slidingWindowAvgPercObserved = slidingWindowObservedPerc.avg
                $.le.appRoot.slidingWindowMinPercObserved = slidingWindowObservedPerc.min
                $.le.appRoot.slidingWindowMaxPercObserved = slidingWindowObservedPerc.max

                // console.log("avg", $.le.appRoot.avgPercObserved)
                
                $.this.chart.config.options.plugins.annotation = {
                  annotations: {
                    bid: {
                      type: 'line',
                      yMin: newData.bid,
                      yMax: newData.bid,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    },
                    ask:{
                      type: 'line',
                      yMin: newData.ask,
                      yMax: newData.ask,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    }
                  }
                }
                
                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSContainer",  width: "1024", height: "600" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.price)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                  responsive: false, //true,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  // animation: { // new animation!
                  //     duration: 800,
                  //     easing: 'linear',
                  //     // from: 1,
                  //     // to: 0,
                  //     loop: false
                  // },

                  stacked: false,
                  plugins: {
                    title: {
                    display: true,
                    text:  GRAPH_BIG_MIN + ' Min Chart'
                    },

                    tooltip: {
                      callbacks: {
                        footer: (tooltipItems) => {
                        
                          let long = (100 - ((tooltipItems[0].parsed.y / $.le.appRoot.stockData.price) * 100))
                          let short = ((100 - (($.le.appRoot.stockData.price / tooltipItems[0].parsed.y ) * 100)))

                          return  '[from here]\n' + 'Long: ' + long.toFixed(3) + "%" + "\nShort: " + short.toFixed(3) + "%\n" +        '\n' + 'Long (5x): ' + (long*5).toFixed(3) + "%" + "\nShort(x5): " + (short*5).toFixed(3) + "%\n"
                        }
                      }
                    },

                    annotation: {
                      annotations: {
                        // bid: {
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // },
                        // ask:{
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // }
                      }
                    }

                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      ticks: {
                        color: 'rgb(255, 99, 132)',
                      },
                      
                          
                      title: {
                        color: 'rgb(255, 99, 132)',
                        display: true,
                        text: 'Dataset 1'
                      }
                    }
                  }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSContainer').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},


        { canvas: { 
          id: "chartjsVolumes",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_BIG_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_BIG_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.volume);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.volume);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSVolumesContainer",  width: "1024", height: "350" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.volume)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                responsive: false, //true,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                // animation: { // new animation!
                //     duration: 800,
                //     easing: 'linear',
                //     // from: 1,
                //     // to: 0,
                //     loop: false
                // },
                stacked: false,
                plugins: {
                  title: {
                  display: true,
                  text: 'Volumes'
                  }
                },
                scales: {
                  y: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  ticks: {
                    color: 'rgb(255, 99, 132)',
                  },
                  x: {
                    display: false
                  },
                  
                      
                  title: {
                    color: 'rgb(255, 99, 132)',
                    display: true,
                    text: 'Dataset 2'
                  }
                  }
                }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSVolumesContainer').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},



        
        { canvas: { 
          id: "chartjs5Min",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_SMALL_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_SMALL_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          def: {
            computeAvgPercObserved: ($, limitToSlidingWindow=false) => {
              // console.log("datasetsss", $.this.chart.data.datasets[0].data)

              let data = $.this.chart.data.datasets[0].data
              if (limitToSlidingWindow){
                data = data.length > $.this.slidingWindowsPoints ? data.slice((data.length-$.this.slidingWindowsPoints), data.length) : data
              }
              let count = data.length

              let sum = 0
              let min = Number.MAX_SAFE_INTEGER
              let max = Number.MIN_SAFE_INTEGER
              for (let i=0; i<count-1; i++){
                let _old = data[i]
                let _new = data[i+1]

                let abs_diff = Math.abs(_new - _old)

                let perc = (abs_diff / _new) * 100
                // console.log()
                perc < min && min > 0 && (min = perc)
                perc > max && (max = perc)
                sum = sum + perc
              }
              return {total: sum, avg: sum/count, min: min, max: max}

              //   let perc = (abs_diff / _new) * 100

              //   sum += abs_diff
              // }
              // return ((sum/count) / _new) * 100

            }
          },
          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.price);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.price);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                $.this.chart.config.options.plugins.annotation = {
                  annotations: {
                    bid: {
                      type: 'line',
                      yMin: newData.bid,
                      yMax: newData.bid,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    },
                    ask:{
                      type: 'line',
                      yMin: newData.ask,
                      yMax: newData.ask,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    }
                  }
                }

                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSContainer5min",  width: "1024", height: "600" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.price)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                  responsive: false, //true,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  // animation: { // new animation!
                  //     duration: 800,
                  //     easing: 'linear',
                  //     // from: 1,
                  //     // to: 0,
                  //     loop: false
                  // },

                  stacked: false,
                  plugins: {
                    title: {
                    display: true,
                    text: GRAPH_SMALL_MIN + 'Min Chart'
                    },

                    tooltip: {
                      callbacks: {
                        footer: (tooltipItems) => {
                        
                          let long = (100 - ((tooltipItems[0].parsed.y / $.le.appRoot.stockData.price) * 100))
                          let short = ((100 - (($.le.appRoot.stockData.price / tooltipItems[0].parsed.y ) * 100)))

                          return  '[from here]\n' + 'Long: ' + long.toFixed(3) + "%" + "\nShort: " + short.toFixed(3) + "%\n" +        '\n' + 'Long (5x): ' + (long*5).toFixed(3) + "%" + "\nShort(x5): " + (short*5).toFixed(3) + "%\n"
                        }
                      }
                    },

                    annotation: {
                      annotations: {
                        // bid: {
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // },
                        // ask:{
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // }
                      }
                    }
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      ticks: {
                        color: 'rgb(255, 99, 132)',
                      },
                      
                          
                      title: {
                        color: 'rgb(255, 99, 132)',
                        display: true,
                        text: 'Dataset 1'
                      }
                    }
                  }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSContainer5min').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},


        { canvas: { 
          id: "chartjsVolumes5min",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_SMALL_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_SMALL_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.volume);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.volume);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSVolumesContainer5min",  width: "1024", height: "350" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.volume)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                responsive: false, //true,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                // animation: { // new animation!
                //     duration: 800,
                //     easing: 'linear',
                //     // from: 1,
                //     // to: 0,
                //     loop: false
                // },
                stacked: false,
                plugins: {
                  title: {
                  display: true,
                  text: 'Volumes'
                  }
                },
                scales: {
                  y: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  ticks: {
                    color: 'rgb(255, 99, 132)',
                  },
                  x: {
                    display: false
                  },
                  
                      
                  title: {
                    color: 'rgb(255, 99, 132)',
                    display: true,
                    text: 'Dataset 2'
                  }
                  }
                }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSVolumesContainer5min').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},

      ],

    }
  })
}


const appSimpleCalendarOrganizer = async ()=>{

  const range = (start, end, increment=1)=>{
    let res = []
    for (let i=start; i<=end; i+=increment){
      res.push(i) 
    }
    return res
  }
  
  // https://www.w3schools.com/html/html5_draganddrop.asp

  const DraggableEl = { 
    div: {
      // id: "draggable",

      props: {
        color: "yellow",
      },

      attrs: { 
        style: $=>({ position:"absolute", display: "inline-block", backgroundColor: $.this.color, width: "80px", height: "80px", textAlign:"center"}),
        draggable:"true", 
      },

      handle: {
        ondragstart: ($, ev)=>{
          console.log("draggin now! my parent is:", $.parent, "has day:", $.meta.day )
          ev.dataTransfer.setData("old_day", $.meta.day)
        }
      },

      text: "draggable"

    }
  }

  const Calendar = { 
    div: { meta: { forEach: "day", of: $ => $.le.app.days },

      props: {
        day: $=>$.meta.day // todo: bug da risolvere..a quanto pare i $.meta.xxx non funzionano bene se usati in le-if dentro un le-for
      },
      
      attrs: { 
        style: { display: "inline-block", width: (100/7)+"%", height: 0, margin:"0px", paddin:"0px", paddingBottom: (100/7)+"%", border: "1px solid gray"}, // dynamic width and equal height: https://stackoverflow.com/a/13625843
      }, 

      handle: {
        ondragover: ($, ev)=>{
          ev.preventDefault()
        },
        ondrop: ($, ev)=>{
          ev.preventDefault()

          let old_day = parseInt(ev.dataTransfer.getData("old_day"))
          $.le.app.actual_multi_drag_container = [...$.le.app.actual_multi_drag_container.filter(x=>x!==old_day), $.this.day ]
          console.log("ricevuto", old_day)
          console.log($.le.app.actual_multi_drag_container)

        }
      },

      "=>": [

        $ => $.meta.day,

        Use(DraggableEl, { meta: { if: $=>$.le.app.actual_multi_drag_container.includes($.meta.day) },  text: "Multi Drag", props:{color: "red"}  }).computedTemplate //computed template per non creare un nuovo meta..direttamente
        
      ],

    }
  }

  RenderApp(document.body, { 
    div: {
      id: "app",

      props: { 
        days: range(1,31),

        actual_multi_drag_container: [],
        
      },

      attrs: { style: "width: 100%; height: 100%; padding: 0px; margin: 0px;" },

      css: [
        `* { box-sizing: border-box !important;}`, 
        'body {padding: 0px; margin: 0px; }'
      ],

      "=>": [

        Use(Calendar),


        Use(DraggableEl, { text: "Multi Drag" })

      ]

    }
  })
  
}

const appCalendarOrganizer = async ()=>{

  const range = (start, end, increment=1)=>{
    let res = []
    for (let i=start; i<=end; i+=increment){
      res.push(i) 
    }
    return res
  }

  const getMonthDays = ()=>{
    let today_date = new Date() //"04/1/22")
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
      console.log(first_day_date)
    }

    let next_date = new Date(first_day_date.getTime())

    let result = []
    
    while(next_date.getMonth() <= today_date.getMonth() || next_date.getDay()!==1){ //cerco lunedì in eng version
      result.push((next_date.getMonth()+1) + "-" + next_date.getDate())
      next_date = new Date(next_date.getTime() + (24*60*60*1000))
    }

    return result

  }
  

  await Promise.all([
    LE_LoadCss("https://fonts.googleapis.com/css?family=Inconsolata"),
    LE_LoadCss("https://fonts.googleapis.com/icon?family=Material+Icons"),
    LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"),
  ])

  await Promise.all([
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.10.4/dayjs.min.js", {attr: { crossorigin:"anonymous"}}),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.10.4/locale/it.min.js", {attr: { crossorigin:"anonymous"}}),
  ])


  // https://www.w3schools.com/html/html5_draganddrop.asp

  const Model = {
    Model: {
      id: "model",

      data: {
        today: new Date(), //"04/1/22"),
        dates: getMonthDays(),//range(1,31).map(x=>String(x)),
        monthLabelMapping: {"1":"Gennaio","2":"Febbraio", "3":"Marzo", "4":"Aprile", "5":"Maggio", "6":"Giugno", "7":"Luglio", "8":"Agosto", "9":"Settembre", "10":"Ottobre", "11":"Novembre", "12":"Dicembre"},
        
        slots: ["9-11", "11-13", "14-16", "16-18"],
        slot_size_in_hh: 2,

        colors: ["#f1c40f", "#e67e22", "#e74c3c", "#2ecc71", "#1abc9c", "#3498db", "#9b59b6"],
        
        projects_progressive: 0,
        projects: [ 
          {project_id:"project1", label:"Project 1", color:"#f1c40f", tasks: []}, 
          {project_id:"project2", label:"Project 2", color:"#e74c3c", tasks: []},
          {project_id:"project3", label:"Project 3", color:"#2ecc71", tasks: []},
          {project_id:"project4", label:"Project 4", color:"#3498db", tasks: []},
          // {project_id:"project5", label:"Project 5", color:"#8e44ad", tasks: []},
        ],
        tasks_progressive: 0,

        // plans_progressive: 0,
        plans: [], //[ {project_id:"project1", date:"1", slot:"9-11", tasks_id:[]} ],

        selectedPlan: undefined

      },

      def: {
        getProjectByPlan: ($, plan) => $.this.projects.find(x=>x.project_id === plan.project_id),
        setPlans: ($, plans) => { $.this.plans = plans },
        getNextTaskProgressive: $=>{
          $.this.tasks_progressive = $.this.tasks_progressive + 1
          return $.this.tasks_progressive
        }
      },

      // auto local storage
      on: {
        this: {
          plansChanged: $ => {
            localStorage.setItem("caged-le-demo.calendar.plans", JSON.stringify($.this.plans))
          },
          projectsChanged: $ => {
            localStorage.setItem("caged-le-demo.calendar.projects", JSON.stringify($.this.projects))
          },
          tasks_progressiveChanged: $ => {
            localStorage.setItem("caged-le-demo.calendar.tasks_progressive", JSON.stringify($.this.tasks_progressive))
          }
        }
      },

      onInit: $=>{
        let tasks_progressive_on_disk = localStorage.getItem("caged-le-demo.calendar.tasks_progressive")
        let projects_on_disk = localStorage.getItem("caged-le-demo.calendar.projects")
        let plans_on_disk = localStorage.getItem("caged-le-demo.calendar.plans")

        if (tasks_progressive_on_disk){
          $.this.tasks_progressive = JSON.parse(tasks_progressive_on_disk)
        }
        if (projects_on_disk){
          $.this.projects = JSON.parse(projects_on_disk)
        }
        if (plans_on_disk){
          $.this.plans = JSON.parse(plans_on_disk)
        }
      }

    }
  }


  const Project = { 
    div: {

      props: {
        plan: undefined,//{project_id:"project1", date:"1", slot:"9-11", tasks_id:[]},
        project: undefined,// $=>$.le.model.projects[0],
        isSource: $=>$.this.plan === undefined,
      },

      attrs: { 
        style: $=>({ 
          position: $.this.isSource ? "relative" : "absolute", 
          display: $.this.isSource ? "flex" : "inline-block", 
          flex: $.this.isSource ? "1 1 auto" : undefined,
          backgroundColor: $.this.project?.color, 
          width: $.this.isSource ? "160px" : "100%", 
          height: $.this.isSource ? "80px" : undefined, 
          borderRadius: $.this.isSource ? undefined : "10px",
          top: $.this.isSource ? undefined : "35px",
          bottom: $.this.isSource ? undefined : "5px"
        }),
        draggable:"true", 
      },

      handle: {
        ondragstart: ($, ev)=>{
          // console.log("draggin now! my parent is:", $.parent, "has date:", $.meta.date )
          ev.dataTransfer.setData("old_date", $.meta.date)
          ev.dataTransfer.setData("old_slot", $.meta.slot)
          ev.dataTransfer.setData("project_id", $.this.project.project_id)
        }
      },

      "=>": [
        { div: {
          
          props: { plan: $=>$.parent.plan, project: $=>$.parent.project, isSource: $=>$.parent.isSource },

          attrs: {style: "width: 100%; height: 100%; display:flex; justify-content: center; align-items: center; color: #ffffff"},
          
          "=>":[

            // NOT SOURCE
            { div: { meta: { if: $=>!$.parent.isSource},
              
              props: { plan: $=>$.parent.plan, project: $=>$.parent.project, isSource: $=>$.parent.isSource },

              text: [
                
                $=>$.parent.project?.label,

                { div: { 

                  props: {
                    todo_count: $=> $.parent.plan !== undefined ? $.parent.plan.tasks_id.length : 0,
                    done_count: $=> $.parent.plan !== undefined ? $.parent.plan.tasks_id.length-$.parent.project.tasks.filter(t=>!t.done && $.parent.plan.tasks_id.includes(t.todo_id )).length : 0,
                    all_done: $=>$.this.todo_count === $.this.done_count,
                  },

                  attrs: { style: $=>({
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    width: "1.5rem",
                    fontSize: "0.7rem",
                    textAlign: "center",
                    borderRadius: "50px",
                    background: $.this.all_done ? "#ffffff55" : "#55555599",
                  })},
                  // todo: migliorare, troppo onerosa!
                  // text: $=>$.parent.plan !== undefined && $.parent.project.tasks.filter(t=>$.parent.plan.tasks_id.includes(t.todo_id )).length > 0 ? $.parent.plan.tasks_id.length-$.parent.project.tasks.filter(t=>!t.done && $.parent.plan.tasks_id.includes(t.todo_id )).length + "/" + $.parent.plan.tasks_id.length: ""
                  text: $=>$.this.todo_count > 0 ? $.this.done_count + "/" + $.this.todo_count : ""
                }}
              ]
            }},

            // IS SOURCE
            { input: { meta: { if: $=>$.parent.isSource},

              attrs: { style: "margin-left: 5px; margin-right: 5px; text-align: center; border-bottom:none; color: #ffffff; font-size: 1.25rem;"},

              hattrs: { 
                value: $ => $.parent.project?.label
              },
              
              handle: {
                onchange: ($, e)=>{
                  $.parent.project.label = e.target.value
                  $.le.model._mark_projects_as_changed()
                }
              }

            }},
            { div: { meta: { if: $=>$.parent.isSource},

              props: {
                todo_count: $=> $.parent.project?.tasks.length,
                done_count: $=> $.parent.project?.tasks.filter(t=>t.done).length,
                all_done: $=> $.this.todo_count === $.this.done_count
              },

              attrs: { style: $=>({
                position: "absolute",
                top: "5px",
                right: "5px",
                width: "1.5rem",
                fontSize: "0.7rem",
                textAlign: "center",
                borderRadius: "50px",
                background: $.this.all_done ? "#ffffff55" : "#55555599",
              })},
              text: $=>$.this.todo_count > 0 ? $.this.done_count + "/" + $.this.todo_count : ""
            }}
          ]
        }}
      ]

    }
  }



  const ProjectToolbar = { div: {

    attrs: {style: {width:"100%", marginBottom: "10px",  display: "flex", justifyContent: "center"}},

    "=>":[
      // "Project", 

      Use(Project, { meta: {forEach: "project", of: $=>$.le.model.projects }, props: { project: $=>$.meta.project }}),
    ]
  }}



  const CalendarDaySlot = { div: { meta: {forEach: "slot", of: $ => $.le.model.slots},

    props: {
      isToday: $=>$.parent.isToday,
      plan: $=>$.le.model.plans.find(x=>x.date===$.meta.date && x.slot===$.meta.slot),
      project: $=>$.this.plan !== undefined ? $.le.model.projects.find(x=>x.project_id === $.this.plan.project_id) : undefined
    },

    attrs: { 
      style: { position: "relative", display: "inline-block", width: (100/2)+"%", height: 0, margin:"0px", paddin:"0px", paddingBottom: (100/2)+"%", border: "1px solid #dddddd"}, // dynamic width and equal height: https://stackoverflow.com/a/13625843
    }, 

    handle: {
      ondragover: ($, ev)=>{ ev.preventDefault() },
      ondrop: ($, ev)=>{
        ev.preventDefault()

        let old_date = ev.dataTransfer.getData("old_date")
        let old_slot = ev.dataTransfer.getData("old_slot")
        let project_id = ev.dataTransfer.getData("project_id")

        let old_tasks = $.le.model.plans.find(
          x=>(x.date==old_date && x.slot==old_slot)
        )

        // console.log("old tasks!!!!", old_date, old_slot, old_tasks)
        if (old_tasks !== undefined){
          old_tasks = [...old_tasks.tasks_id]
        }

        $.le.model.plans = [
          ...$.le.model.plans.filter(
            x=>!(x.date==old_date && x.slot==old_slot) && !(x.date==$.meta.date && x.slot==$.meta.slot)
          ), 
          {project_id: project_id, date: $.meta.date, slot: $.meta.slot, tasks_id: old_tasks || []} 
        ]
      }
    },

    "=>": [
      { b: { meta:{if: $=>$.meta.slot === "11-13"}, 
        attrs: { 
          style:$=>"margin-top: -3px; font-size:24px; position: absolute; right: 7px; z-index:1; color:"+($.parent.isToday ? "#f39c12" : "black"), 
          // class: $=>$.parent.isToday ? "active-text-shadow" : "text-shadow"
        }, 
        text: $=>$.meta.date.split("-")[1]
      }}, 

      { i: {attrs: {style: {position: "absolute", marginLeft: "5px", marginTop: "7px", fontSize:"10px"}}, text: $=>" (" + $.meta.slot + ")"}},

      { br: {}},
    
      Extended(Project, { meta: { if: $=>$.parent.plan !== undefined },

        props:{
          plan: $ => $.parent.plan,
          project: $ => $.parent.project
        },

        handle: {
          ondblclick: $=>{
            $.le.model.plans = $.le.model.plans.filter(x=>x!==$.this.plan)
          },
          onclick: $=>{
            $.le.model.selectedPlan = $.this.plan
          }
        }

      }) // per non creare un nuovo meta..direttamente
      
    ]

  }}

  const CalendarDay = { div: { meta: { forEach: "date", of: $ => $.le.model.dates, define:{index:"date_idx"} },

    props: {
      isToday: $=>(($.le.model.today.getMonth()+1) + "-" +$.le.model.today.getDate()) == $.meta.date,
    },
        
    attrs: { 
      style: $=>({ 
        display: "inline-block", 
        width: "calc("+(100/7)+"% - 10px)", 
        height: 0, 
        margin:"2.5px 5px", 
        paddin:"0px", 
        paddingBottom: "calc("+(100/7)+"% - 10px)", 
        border: $.this.isToday ? "3px solid  orange" : "1px solid #dddddd", 
        backgroundColor: (($.meta.date_idx+1)%7 === 0) || (($.meta.date_idx+2)%7 === 0) ?"#bdc3c7" : "#ecf0f1", 
        opacity: $.le.model.today.getMonth()+1 != $.meta.date.split("-")[0] ? 0.3 : undefined,
        overflow: "hidden", 
        borderRadius:"15px"
      }), // dynamic width and equal height: https://stackoverflow.com/a/13625843
    }, 

    "=>": [

      CalendarDaySlot
      
    ],

  }}

  const Calendar = { div: {
    "=>":[

      { div: { meta: { forEach: "weekDay", of: $ => ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"] },
        
        attrs: { 
          style: $=>({ 
            display: "inline-block", 
            width: "calc("+(100/7)+"% - 10px)", 
            // height: "50px", 
            margin:"-2px 5px", 
            padding:"5px", 
            border: "1px solid #dddddd", 
            backgroundColor: ["Sabato", "Domenica"].includes($.meta.weekDay)?"#bdc3c7":"#ecf0f1", 
            overflow: "hidden", 
            borderRadius:"15px",
            textAlign: "center"
          })
        }, 
        "=>": $=>$.meta.weekDay
      }},

      CalendarDay

    ]
  }}



  const TodoInput = { 
    input: {

      ctx_id: "todo_input",

      data: { 
        text: "" 
      },

      signals: {
        newInputConfirmed: "stream => (text: string)"
      },

      hattrs: {
        value: Bind($ => $.this.text)
      },

      handle: {
        onkeypress: ($, e) => { e.key === "Enter" && $.this.newInputConfirmed.emit($.this.text) },
      },

    }
  }

  const TodoListItem = { 
    div: {

      props: { isPlanSpecific: false, disabled: $=>!$.this.isPlanSpecific && $.parent.todos_id.includes($.meta.todo.todo_id) },

      attrs: { style: $=>({ marginTop: "15px", opacity: $.this.disabled ? 0.3 : undefined}), class:"todolist-item"},

      "=>": [
        // todo with checkbox
        { label: { 
          "=>": [  // si poteva fare anche con style..
            
            { input: { 

              attrs: { type: "checkbox"},

              hattrs: { 
                // type: "checkbox", 
                checked: $ => $.meta.todo.done, 
                name: $ => $.meta.todo.todo_id
              }, 

              handle: { onchange: $ => {
                $.ctx.todolist_container.changeTodoStatus($.meta.todo.todo_id)
              }}

            }}, 
            
            { span: {

              attrs: { style: { color: "white" }},

              "=>": [ 

                {span: { meta: {if: $ => !$.meta.todo.done},
                  text: $ => $.meta.todo.todo
                }},
                    
                { s: { meta: {if: $ => $.meta.todo.done}, 
                  text: $ => $.meta.todo.todo 
                }}, 
              ]
            }}, 

          ], 
          hattrs: {for: $ => $.meta.todo.todo_id} 
        }},

        // move button
        { a: {  
          props: { isPlanSpecific: $=>$.parent.isPlanSpecific },

          attrs: { 
            style: {position: "absolute", right:"70px", color: "#565656", backgroundColor:"transparent"},
            class: "waves-effect waves-teal btn-flat"
          },

          handle: { 
            onclick: $ => $.parent.isPlanSpecific ? $.ctx.todolist_container.removeFromPlan($.meta.todo.todo_id) : $.ctx.todolist_container.addToPlan($.meta.todo.todo_id) 
          }, 
          
          text: { i: { attrs: {style: {color: "white"}, class: "material-icons"}, text: $=>$.parent.isPlanSpecific ? "arrow_downward" : "arrow_upward"}}
        }},

        // remove button
        { a: {  
          
          attrs: { 
            style: {position: "absolute", right:"20px", color: "#565656", backgroundColor:"transparent"},
            class: "waves-effect waves-teal btn-flat"
          },

          handle: { 
            onclick: $ => {
              let response = prompt("Are you sure do you whant to delete this task? This operation cannot be reversed! (y/n)", "n")
              if (response === "y"){
                $.ctx.todolist_container.deleteTodo($.meta.todo.todo_id)
              }
            }
          }, 
          
          text: { i: { attrs: {style: {color: "white"}, class: "material-icons"}, text: "close"}}
        }},
      ]
    }
  }

  const TodoListContainer = { div: {

    css: [
      '.todolist-item [type="checkbox"]+span:not(.lever):before, .todolist-item [type="checkbox"]:not(.filled-in)+span:not(.lever):after{border: 2px solid white;}',
      '.todolist-item [type="checkbox"]:checked+span:not(.lever):before{border-top: 2px solid transparent;border-left: 2px solid transparent;border-right: 2px solid black; border-bottom: 2px solid black;}'
    ],

    "=>": [
      Use({ div: { 

        ctx_id: "todolist_container",

        props: {
          todos_id: $=>[...($.le.lateral_menu_controller.selectedPlan !== undefined ? $.le.lateral_menu_controller.selectedPlan.tasks_id : [])],
          todos: $=> $.le.lateral_menu_controller.selectedProject!==undefined && $.this.todos_id.length>0 ? $.le.lateral_menu_controller.selectedProject.tasks.filter(t=>$.ctx.todolist_container.todos_id.includes(t.todo_id)).sort((a,b)=>(a.done?1:0)-(b.done?1:0)) : [],
          full_todos: $=> $.le.lateral_menu_controller.selectedProject!==undefined ? $.le.lateral_menu_controller.selectedProject.tasks : [],
          not_in_this_plan_todos: $=> $.le.lateral_menu_controller.selectedProject!==undefined ? $.le.lateral_menu_controller.selectedProject.tasks.filter(t=>!$.ctx.todolist_container.todos_id.includes(t.todo_id)).sort((a,b)=>(a.done?1:0)-(b.done?1:0)) : []
        },

        def: {
          insertTodo: $=>{
            let todo_id = $.le.model.getNextTaskProgressive()

            $.le.lateral_menu_controller.selectedProject.tasks.push({ todo_id: todo_id, todo: $.ctx.todo_input.text, done: false })
            $.le.lateral_menu_controller.selectedPlan.tasks_id.push(todo_id) 

            $.le.model._mark_projects_as_changed()
            $.le.model._mark_plans_as_changed()

            $.ctx.todo_input.text = ""
          },

          deleteTodo: ($, todo_id) =>{

            $.le.lateral_menu_controller.selectedPlan.tasks_id = $.le.lateral_menu_controller.selectedPlan.tasks_id.filter(t=>t!==todo_id)
            $.le.lateral_menu_controller.selectedProject.tasks = $.le.lateral_menu_controller.selectedProject.tasks.filter(t=>t.todo_id !== todo_id)
            $.le.model.plans.forEach(p=>p.tasks_id = p.tasks_id.filter(t=>t !== todo_id)) // rimuovo anche da qualsiasi altro plan!

            $.le.model._mark_plans_as_changed()
            $.le.model._mark_projects_as_changed()

          },

          changeTodoStatus: ($, todo_id) =>{

            $.le.lateral_menu_controller.selectedProject.tasks = $.le.lateral_menu_controller.selectedProject.tasks.map(t=>t.todo_id === todo_id ? {...t, done: !t.done } : t)

            $.le.model._mark_projects_as_changed()
            $.le.model._mark_plans_as_changed()

          },

          addToPlan: ($, todo_id)=>{

            if (!$.le.lateral_menu_controller.selectedPlan.tasks_id.includes(todo_id)){

              $.le.lateral_menu_controller.selectedPlan.tasks_id.push(todo_id) 
              $.le.model._mark_plans_as_changed()
              $.le.model._mark_projects_as_changed()
            }

          },

          removeFromPlan: ($, todo_id)=>{

            $.le.lateral_menu_controller.selectedPlan.tasks_id = $.le.lateral_menu_controller.selectedPlan.tasks_id.filter(t=>t!==todo_id)

            $.le.model._mark_plans_as_changed()
            $.le.model._mark_projects_as_changed()

          }
        },

        on_s: { ctx: { 
          todo_input: {
            newInputConfirmed: $=> $.this.insertTodo()
          }

        }},


        "=>": [ // gen new meta..


          Extended(TodoInput, {attrs: {style: "width: calc(100% - 165px)"}}),

          { button: { 

            text: "Add Task", 

            attrs: {style: "margin-left: 15px; width: 150px; color: #565656; background-color: #ecf0f1", class: "btn"}, 

            handle: { onclick: $ => $.ctx.todolist_container.insertTodo() },

          }},

          { h4: {text: "Slot Activites", meta: {if: $=>$.parent.todos?.length>0} }},

          Extended(TodoListItem,  { meta: { forEach: "todo", of: $ => $.parent.todos }, props: {isPlanSpecific: true} } ),


          { hr: {meta: {if: $=>$.parent.todos?.length>0}, attrs: {style: {marginTop:"15px"}}} },

          { h4: {text: "Project Activites", meta: {if: $=>$.parent.full_todos?.length>0} }},
          { h4: {text: "No Project Activites", meta: {if: $=>$.parent.full_todos?.length===0} }},

          Extended(TodoListItem,  { meta: { forEach: "todo", of: $ => $.parent.not_in_this_plan_todos }, props: {isPlanSpecific: false} }),

          // { h5: {text: "Assigned To Slot", meta: {if: $=>$.parent.todos?.length>0} }},
          { hr: {meta: {if: $=>$.parent.todos?.length>0}, attrs: {style: {marginTop:"15px"}}} },

          Extended(TodoListItem,  { meta: { forEach: "todo", of: $ => $.parent.todos }, props: {isPlanSpecific: false} })

        ]
      }})
    ]

  }}

  const LateralMenuController = { Controller: {
    id: "lateral_menu_controller",

    props: {
      isOpened: false,
      selectedPlan: $=>$.le.model.selectedPlan,
      selectedProject: $=>$.this.selectedPlan !== undefined ? $.le.model.projects.find(x=>x.project_id === $.this.selectedPlan.project_id) : undefined
    },

    on: { this: {
      selectedProjectChanged: $=>{
        $.this.isOpened = $.this.selectedProject !== undefined
      }
    }}

  }}

  const LateralMenu = { div: {

    id: "lateral_menu",

    attrs: { 
      style: $=>({
        // visibility: $.le.lateral_menu_controller.isOpened ? null : "hidden",
        opacity: $.le.lateral_menu_controller.isOpened ? 1 : 0.75,
        // position: "absolute",
        backgroundColor: $.le.lateral_menu_controller.selectedProject?.color || "white",
        borderRadius: "25px",
        top: "25px",
        // right: "25px",
        // bottom: "25px",
        // left: $.le.lateral_menu_controller.isOpened ? "65%" : "calc(100% - 25px)",
        left: $.le.lateral_menu_controller.isOpened ? "65%" : "100%",
        width: $.le.lateral_menu_controller.isOpened ? "calc(35% - 25px)" : 0,
        position: "fixed", 
        height: "calc(100vh - 50px)",

        zIndex: "2",
        overflow: "hidden",
        overflowY: "auto",
        padding: $.le.lateral_menu_controller.isOpened ? "25px" : "0",
        transition: "left 0.3s, width " + ($.le.lateral_menu_controller.isOpened ? 0.3 : 0.6) + "s, padding 0.3s, opacity 0.3s, background-color 0.3s ease-in-out"
      }),
      class: "shadow"
    },

    on: { le: { lateral_menu_controller: {
      isOpenedChanged: $=>{
        if(!$.le.lateral_menu_controller.isOpened) {
          setTimeout(()=>{
            $.this.el.style.visibility="hidden"
          }, 290)
        }
      }
    }}},

    "=>":[
      //  $=>$.le.lateral_menu_controller.selectedProject?.label,

        { h2: {
          attrs: {style: {marginTop:"5px"}},
          text: $=> $.le.lateral_menu_controller.selectedProject?.label,
        }},

        { h4: {
        text: $=> $.le.lateral_menu_controller.selectedPlan!==undefined ? $.le.lateral_menu_controller.selectedPlan.date.split("-")[1] +" "+ $.le.model.monthLabelMapping[$.le.lateral_menu_controller.selectedPlan.date.split("-")[0]] : "-",
        }},

        { button: {
          
          attrs: {
            style: $=>({position: "absolute", right: "20px", top: "40px", color: "#565656", backgroundColor:"#ecf0f1"}),
            class: "btn-floating material-icons"
          },

          handle: {
            onclick: $=>{
              $.le.lateral_menu_controller.isOpened = false
            }
          },

          text: "close",

        }},

        // todo list container
        TodoListContainer

    ]

  }}


  RenderApp(document.body, { 
    div: {
      id: "app",

      attrs: { style: "width: 100%; height: 100%; padding: 0px; margin: 0px;" },

      css: [
        `
        * { box-sizing: border-box !important;}

        body { padding: 0px; margin: 0px; }

        .text-shadow{
          text-shadow: 0px 3px 15px rgb(50 50 50 / 32%);
        }
        .active-text-shadow{
          text-shadow: 0px 3px 19px rgb(25 25 25 / 40%);
        }

        .shadow{
            border-radius: 55px;
            -webkit-box-shadow: 0px 6px 32px -1px rgb(0 0 0 / 42%);
            -moz-box-shadow: 0px 6px 32px -1px rgb(0 0 0 / 42%);
            box-shadow: 0px 6px 32px -1px rgb(0 0 0 / 42%);
        }

        .active-shadow{
            border-radius: 55px;
            -webkit-box-shadow: 0px 6px 32px -1px rgb(0 0 200 / 32%);
            -moz-box-shadow: 0px 6px 32px -1px rgb(0 0 200 / 32%);
            box-shadow: 0px 6px 32px -1px rgb(0 0 200 / 32%);
        }`
      ],

      "=>": [

        Use(Model),

        { h1: {
          props: { monthLabel: $=>$.le.model.monthLabelMapping },
          attrs: {style: {width:"100%", margin: "10px 0 ",  display: "flex", justifyContent: "center"}},
          text: $=>($.this.monthLabel[$.le.model.today.getMonth()+1] + " " + $.le.model.today.getFullYear())
        }},

        ProjectToolbar,


        Use(Calendar),


        // lateral menu
        LateralMenuController,

        LateralMenu

      ]

    }
  })

  // todo: fare che posso avere delle note e che esiste semore una dib "generic" che si comporta diversamente..in pratica in quello slot di 2 h riutilizzo il concetto di ico-export..quindi ho una zona in cui mettere manualmente come l'app attuale

  
}

const appCachedProperties = async ()=>{
  // spiegazione, la funzione iniziale autoeseguite serve solo per incastonare la ctx in un contesto a se :D 
  // quello che si ottiene in realtà è poter usare .value in un oggetto definito as copy per avere il valore coipato, e aggiornarlo a mano in una on tramite .updateVal ..
  // con .liveValue posso invece accedere al valore sempre aggiornato (ovvio, a patto che non punti a un altro valore copy :D)
  // ovviamente funziona perchè al posto di eseguire ogni volta la prop lambda in realtà mi copio il valore solo quando chiesto con la update ref o all'inizio..
  let CopyValueOnce = (()=>{ 
    let ctx = {}

    return (propLambda)=>{
      let key = String(propLambda)

      let update = ()=>{
        ctx[key] = propLambda()
      }

      if (!(key in ctx)){
        update()
      }

      return {value: ctx[key], updateVal: update, get liveValue (){return propLambda()}}
    }
  })()

  await LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css")
  
  RenderApp(document.body, { div: {
    id: "app",

    props: { 
      array: [1,2,3],
    },

    "=>": [

      "dovresti clickare 3 volte per aggiornare..",

      { div: {
        props: {
          filteredData: $=>CopyValueOnce(()=>$.scope.array.filter(x=>x>1))
        },

        on: {
          scope: {
            arrayChanged: $=>{ 
              console.log("arr changed", $.scope.array)
              // if condition ..
              if ($.scope.array.length % 3 === 0){
                $.this.filteredData.updateVal()
              }
            }
          },
          this: {
            filteredDataChanged: $=>{
              console.log("filterd data changed!")

              // $.this.filteredData.updateVal()  // potresti anche auto aggiornarti quando cambi..cosa significa sta cosa? semplicemente che non ricalcoli il valore ad ogni get! ma solo quando cambia!
            }
          }
        },

        text: $=>$.this.filteredData.value
      }},

      { button: {
        text: "randomize",
        handle: { onclick: $=>{
          $.scope.array.push(10)
          $.scope.array = [...$.scope.array]
        }}
      }}
    ]
  }})
}

const appTestAttrsShortcuts = ()=>{
  
  const MyElement = {div: {

    attrs: { style: { width: "33%"} },
    "a.class": "my-class", // occhio che se provo a fare a.style sostituisco in blocco!!

    hattrs: {"style.fontSize": "25px"},
    "ha.style.color": "green",
    "ha.style.backgroundColor": "black",

    text: "helllo"
  }}

  RenderApp(document.body, { div: {
    
    text: Use(MyElement, { // ora posso sostituire..in ha anche in profondità! (visto che tanto non uso obj ma dot notation)
      "a.class": "my-new-class",
      "ha.style.color": "yellow",
    })
  }})

}

const appTestLayouts = async ()=>{
  let test = false

  if (test){
    RenderApp(document.body, { div: {
      id: "app",

      a: {style: "padding: 0px; margin: 0px"},
      css: ['body {padding: 0px; margin: 0px}'],

      "=>": Extended(NavSidebarLayout({testing: true,
        main_content: 
          { div: {
            a: {style: "height: 500px"},
            text: "Main Content"
          }}
      }))
    }})
  }

  
  else {
    
    await LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.min.css") 

    const Navbar = { div: {

      'a.style': {
        backgroundColor: "white", //"#2d3436",
        // color: "#dddddd",
        color: "rgb(97, 97, 97)",
        height: "60px",
        padding: "10px 2rem",

      },

      text: [
        { div: { text: "Nav", 'ha.style.fontSize': "3rem" }}
      ]
    }}

    const Sidebar = { div: {

      'a.style': {
        backgroundColor: "white",
        // color: "#dddddd",
        color: "rgb(97, 97, 97)",
        minHeight: "100%",
        borderRight: "0.25px solid #aaaaaa",
        padding: "10px 2rem"
      },
      
      "=>": [
        {div: { 'a.style': {fontWeight: "500", fontSize: "3rem", border: "0.25px solid #dddddd", paddingBottom: "0px", marginBottom: '50px'}, text: "Logo"}},
        ...[1,2,3,4,5].map(n=>smart({h6:[ "Content "+n, smart({li:"Item "+(n*2)}) ]}, {'ha.style.fontWeight': "500"}))
      ]
    }}

    const MainContent = { div: {
      'a.style': {
        minHeight: "calc(100vh - 60px)",
        backgroundColor: '#b2bec3',
        padding: "10px"
      },

      "=>": { div: {
        'ha.style.margin': "50px",
        'ha.style.backgroundColor': "white",
        'ha.style.width': "calc(100% - 100px)",
        'ha.style.height': "calc(100vh - 180px)",
        'ha.style.border': " 1px dashed #bbbbbb",

        text: "Main Content"
      }}
    }}


    RenderApp(document.body, { div: {
      id: "app",

      a: {style: "padding: 0px; margin: 0px"},
      css: [
        'body {padding: 0px; margin: 0px} * { box-sizing: border-box !important;}'
      ],

      "=>": Extended(NavSidebarLayout({
        navbar: Navbar,
        sidebar: Sidebar,
        main_content: MainContent
      }))
    }})

  }

}

const appRecursiveTodo = async ()=>{

  const TasksStatus = {
    NotStarted: { label: "Not Started", description: "not-started", color: "red" },
    InProgress: { label: "In Progress", description: "in-progrss", color: "yellow" },
    Done: { label: "Done", description: "done", color: "green" },
  }

  const BaseComponent = (extra_buttons_before=[], extra_buttons_after=[])=>({ span: { 
    // handle: {
    //   onclick: ($, evt)=>{
    //     evt.stopPropagation(); 
    // }}, 
    props: { inEdit: false},

    "a.style": "display: flex; justify-content: space-between; margin-bottom: 5px;",

    "=>": [
      { span: {
        "a.style": "display: flex; justify-content: left; align-items: center;",

        "=>":[

          // { span: { }},
          // status
          { div: {

            props: { 
              color: $=>$.meta.task.status.color
            },

            'a.style': $=>({
              marginLeft: $.meta.parentPath.length > 1 ? "5px" : "", marginRight: "10px", width: "1rem", height: "1rem",  borderRadius: "5px", background: $.this.color,

            }),
            'a.class': $=> $.meta.parentPath.length > 1 ? "subrow" : "",

            handle: { onclick: $=>{
              if ($.meta.task.status === TasksStatus.NotStarted){
                $.meta.task.status = TasksStatus.InProgress
              }
              else if ($.meta.task.status === TasksStatus.InProgress){
                $.meta.task.status = TasksStatus.Done
              }
              else if ($.meta.task.status === TasksStatus.Done){
                $.meta.task.status = TasksStatus.NotStarted
              }

              $.this._mark_color_as_changed()
              
            }},
          }},

          // todo - edit
          { input: { meta: { if: $=>$.scope.inEdit || $.scope.toFocus === $.meta.task}, 

            props: { text: $=>$.meta.task.name },

            on: { this: { 
              textChanged: $=>{ $.meta.task.name = $.this.text }
            }},

            handle: { 
              onkeypress: ($, evt)=>{ 
                if (evt.key==='Enter') { 
                  if ($.scope.toFocus === $.meta.task){
                    $.scope.toFocus = undefined
                  }
                  else {
                    $.scope.inEdit=!$.scope.inEdit 
                  }
                }
              },
              onkeyup: ($, evt)=>{ 
                if (evt.key === 'Escape' && $.this.text.length === 0){
                  $.scope.toFocus = undefined
                  $.scope.removeChilds($.meta.task)
                }
              },
              onblur: $=>{
                if ($.this.text.length === 0 && $.meta.task.subtasks.length <= 0){ 
                  $.scope.toFocus = undefined
                  $.scope.removeChilds($.meta.task)
                }
              }
            },

            'ha.value': Bind($=>$.this.text),
            // 'ha.style.width': "60px",
            onInit: $=>{$.this.el.focus(); $.this.el.select();}
          }},

          // todo - no edit view
          { span: { meta: { if: $=>!$.scope.inEdit && $.scope.toFocus !== $.meta.task}, 
            text: $=>$.meta.task.name,
            // 'ha.style.width': "60px",
            handle: {
              onclick: ($, evt)=>{
                evt.stopPropagation(); 
                $.scope.inEdit=!$.scope.inEdit
              }
            }, 
          }},
        ]
      }},


      // toolbar
      { div: {

        "=>": [
          ...extra_buttons_before,

          { button: {
            'a.class': "activity-button",
            text: "e", 
            handle: {
              onclick: ($, evt)=>{
                evt.stopPropagation(); 
                if ($.scope.toFocus === $.meta.task){
                  $.scope.toFocus = undefined
                }
                else {
                  $.scope.inEdit=!$.scope.inEdit 
                }
              }
            }, 
          }},
          { button: {
            'a.class': "activity-button",
            text: "+", 
            handle: {
              onclick: ($, evt)=>{
                evt.stopPropagation(); 
                $.scope.childsVisible=true
                $.scope.toFocus = {status: TasksStatus.NotStarted, name: "", subtasks: []}
                $.meta.task.subtasks.push($.scope.toFocus); 
                $.scope.activity = [...$.scope.activity]
            }}, 
          }},
          { button: {
            'a.class': "activity-button",
            text: "x", 
            handle: {
              onclick: ($, evt)=>{
                evt.stopPropagation(); 
                $.scope.removeChilds($.meta.task)
            }}, 
          }},

          ...extra_buttons_after
        ]
      }}

    ]
  }})
  
  const RecursiveComponent = (i=0, maxLen=7)=> ({ 
    div: { meta: {forEach: "task", of: $=>$.meta.task.subtasks, define: {index: "idx", iterable: "tasks", parentTask: $=>$.meta.task, parentPath: ($, $child)=>[...($.meta.parentPath || []), $child.meta.idx] }},

      def: {
        removeChilds: ($, task)=>{
          // $.meta.tasks.splice([].indexOf(task), 1)
          console.log($.meta.parentTask, $.meta.task, task)
          $.meta.parentTask.subtasks = $.meta.parentTask.subtasks.filter(t=>t!==task)
          $.scope.activity = [...$.scope.activity]
        }
      },

      'a.style': "padding: 5px;  border-radius: 5px; ", // border: 0.25px dashed #dddddd;

      onInit: $=>console.log($.meta.parentPath, $.meta.task),

      "=>": [

        { div: {
          props: { childsVisible:  $=>$.scope.actualVisibilities.get($.meta.task) || $.scope.myParentIsVisible }, 
          on: { this: {childsVisibleChanged: ($, v, _oldv)=>{
            if (v!==_oldv){
              $.scope.actualVisibilities.set($.meta.task, $.this.childsVisible)
              $.scope._mark_actualVisibilities_as_changed()
              // nella remove va eliminata la entry..
            }
          }}},
          
          'ha.style.marginLeft': "15px",

          "=>": [
            BaseComponent([
              { button: { meta: {if: $=>$.meta.task.subtasks.length > 0},  
                'a.class': "activity-button",
                text: "v", 
                handle: { onclick: ($, evt)=>{ evt.stopPropagation(); $.scope.childsVisible = !$.scope.childsVisible}}
              }}
            ]),  

            { div: { meta: { if: $=>$.scope.childsVisible },
              "=>": i >= maxLen ? 
                //{ div: { meta: {forEach: "task", of: $=>$.meta.task.subtasks}, "=>": BaseComponent() }} : 
                "Max activity reached" : 
                RecursiveComponent(i+1, maxLen)
            }}
          ]
        }},

      ]
    }
  })

  const RecursiveTodoList = {div: {
    props: {
      activity: [
        {status: TasksStatus.NotStarted, name: "todo1", subtasks: []},
        {status: TasksStatus.NotStarted, name: "todo2", subtasks: [
          {status: TasksStatus.NotStarted, name: "subtodo2.1", subtasks: []},
          {status: TasksStatus.NotStarted, name: "subtodo2.2", subtasks: []},
        ]},
        {status: TasksStatus.NotStarted, name: "todo3", subtasks: [
          {status: TasksStatus.InProgress, name: "subtodo3.1", subtasks: [
            {status: TasksStatus.Done, name: "subsubtodo3.1", subtasks: []},
            {status: TasksStatus.InProgress, name: "subsubtodo3.2", subtasks: []},
            {status: TasksStatus.NotStarted, name: "subsubtodo3.3", subtasks: []},
          ]},
        ]},
      ],
      myParentIsVisible: false,
      actualVisibilities: new Map(),
      toFocus: undefined
    },

    css: [`
      .subrow:before{
        content: ""; 
        display: flex;
        width: 15px;
        height: 13px;
        border-bottom-left-radius: 6px;
        border-left: 1px solid #e9ebf0;
        border-bottom: 1px solid #e9ebf0;
        margin-top: -5px;
        margin-left: -20px;
        pointer-events: none;
        background: transparent;
      }
      .activity-button {
        border: none;
        color: #555555;
        border-radius: 5px;
        font-size: 0.8rem;
      }
    `],

    "=>": Extended(RecursiveComponent(0, 7), {meta: {forEach: "task", of: $=>$.scope.activity, 
      // define: {index: "idx"},
      define: {index: "idx", parentTask: $=>$.scope.activity, parentPath: ($, $child)=>[$child.meta.idx]}
    }})

  }}


  await Promise.all([
    LE_LoadCss("https://fonts.googleapis.com/css?family=Inconsolata"),
    LE_LoadCss("https://fonts.googleapis.com/icon?family=Material+Icons"),
    LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css"),
  ])

  await Promise.all([
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js"),
  ])


  let app = RenderApp(document.body, { 
    div: {
      id: "app",

      attrs: { style: "width: 100%; height: 100%; padding: 0px; margin: 0px;" },
      css: [ `* { box-sizing: border-box !important;} body { padding: 0px; margin: 0px; }` ],

      "=>": [
        { div: {
          'a.style': "border: 1px solid black; width: 67%; margin-left: 15.5%; padding: 25px",
          "=>": RecursiveTodoList
        }}
        
      ]

  }})

}

const appScopeOptions = async ()=>{

  RenderApp(document.body, { div: {
    id: "app",

    props: {
      prop1: "Parent: 123"
    },

    "=>": [

      { div: {
        text: $=>$.scope.prop1
      }},
      
      { hr: {}},

      { div: { meta: {forEach:"num", of: [9,8,7]},
        text: $=>$.scope.prop1
      }},

      { hr: {}},

      { div: {
        props: {
          prop1: "Child: 456"
        },

        text: $=>$.scope.prop1 + " - dovrebbe essere 456"
      }},

      { hr: {}},

      { div: { meta: {noThisInScope: true},
        props: {
          prop1: "Child: 456"
        },

        text: $=>$.scope.prop1 + " - dovrebbe essere 123"
      }},

      { hr: {}},

      { div: { meta: {noThisInScope: true},
        props: {
          prop1: "Child: 456"
        },

        text: [
          { div: { meta: {noThisInScope: true},
            props: {
              prop1: "Child Child: 321"
            },

            text: $=>$.scope.prop1 + " - dovrebbe essere 456"
          }},
        ]
      }},

      { hr: {}},
    ]

  }})

  try{
    RenderApp(document.body, { div: {
      id: "app",

      props: {
        prop1: 123
      },

      "=>": [

        { div: { meta: {newScope: true},
          text: $=>$.scope.prop1
        }},

        { hr: {}},
      ]

    }})
  }
  catch (e){
    console.log("ok! error as expected! :)")
  }


  try{
    RenderApp(document.body, { div: {
      id: "app",

      props: {
        prop1: 123
      },

      "=>": [

        { div: { meta: {forEach:"num", of: [9,8,7], newScope: true},
          text: $=>$.scope.prop1
        }},

        { hr: {}},

      ]

    }})
  }
  catch (e){
    console.log("ok! error as expected! :)")
  }
  

}

const appTestTreeComponent = async ()=>{

  const TreeMenu = { div: {

    props: {
      default_tree_menu: [
        { label: "Safilus", route: "", isActive: false, isOpened: false, isSection: true, isDone: true, childs: [
          { label: "Competitors", route: "", isActive: false, isDone: true },
          { label: "Survey", route: "", isActive: false, isDone: true }
        ]},
        { label: "Carrerum", route: "", isActive: false, isOpened: true, isSection: false, isDone: false, childs: [
          { label: "Competitors", route: "", isActive: true, isDone: false },
          { label: "Survey", route: "", isActive: false, isDone: false }
        ]},
        { label: "Clustering", route: "", isActive: false, isOpened: false, isSection: true, isDone: true, childs: []}
      ],

      tree_menu: $=>$.this.default_tree_menu, // DEFAULT

      // VIEWFUNC
      $rootHasActiveChild: $=>( root=>root.childs.filter(c=>c.isActive).length > 0 )
    },

    ['a.class']: "tree-component",
    ['a.style']: "margin-left: 25px",

    '=>': [

      { div: { meta: {forEach: "root", of: $=>$.scope.tree_menu, define: {first:"first", last:"last"}},

        ['a.class']: "tree-root",
        ['a.style.marginBottom']: $=>$.meta.last ? "15px" : "20px",

        '=>': [

          { hr: { meta: { if: $=>$.meta.root.isSection && !$.meta.first } }},

          { h4: {

            ['a.style']: "margin-bottom: 12px",
            ["ha.style.backgroundColor"]: $=>$.meta.root.isActive ? "#e4e8ed" : "unset",
            ["ha.style.color"]: $=>$.scope.$rootHasActiveChild($.meta.root) ? "blue" : "unset",

            handle: { 
              onclick: $=>{ $.meta.root.isOpened=!$.meta.root.isOpened; $.scope.tree_menu = [...$.scope.tree_menu]; } 
            },
            
            '=>': [
              $=> $.meta.root.isDone ? 'V' : 'O', " - ", $=>$.meta.root.label
            ]
          }},

          { div: { meta: { if: $=>$.meta.root.isOpened },

            ['a.style']: "margin-left: 25px",
            ["ha.style.marginBottom"]: $=>$.meta.last ? "20px" : "15px",

            '=>': 

              { div: { meta: { forEach: "child", of: $=>$.meta.root.childs },

                ['a.class']: "tree-root",

                '=>': 
                
                  { div: {
                    ['a.style']: "border-radius: 25px; padding: 5px 10px",
                    ["ha.style.backgroundColor"]: $=>$.meta.child.isActive ? "#e4e8ed" : "unset",
                    ["ha.style.color"]: $=>$.meta.child.isActive ? "blue" : "unset",

                    '=>': [
                      $=> $.meta.child.isDone ? 'V' : 'O', " - ", $=>$.meta.child.label
                    ]
                  }}
                
              }}

          }}

        ]

      }}

    ]
  }}

  RenderApp(document.body, { div: {
    id: "app",

    "=>": [
      TreeMenu
    ]

  }})
}

const appMetaInScopeAndLowCodeTest = async ()=>{

  const f1 = (code)=>{
    code=code.replaceAll("@m ", "$.meta.").replaceAll("@s ", "$.scope.").replaceAll("@p ", "$.parent.").replaceAll("@t ", "$.this.").replaceAll("@le ", "$.le.").replaceAll("@ctx ", "$.ctx.").replaceAll("@ ", "$.scope.")
    code=code.replaceAll(":m:", "$.meta.").replaceAll(":s:", "$.scope.").replaceAll(":p:", "$.parent.").replaceAll(":t:", "$.this.").replaceAll(":l:", "$.le.").replaceAll(":c:", "$.ctx.").replaceAll("::", "$.scope.")
    if (code.includes("return ")){
      return new Function("$", code)
    } else {
      return new Function("$", "return "+code)
    }
  }

  const f2 = (code)=>{
    code=code.replaceAll("meta.", "$.meta.").replaceAll("scope.", "$.scope.").replaceAll("parent.", "$.parent.").replaceAll("this.", "$.this.").replaceAll("le.", "$.le.").replaceAll("ctx.", "$.ctx.").replaceAll("::", "$.scope.")
    if (code.includes("return ")){
      return new Function("$", code)
    } else {
      return new Function("$", "return "+code)
    }
  }

  const f3 = (code)=>{
    code=code.replaceAll("@m.", "$.meta.").replaceAll("@s.", "$.scope.").replaceAll("@p.", "$.parent.").replaceAll("@t.", "$.this.").replaceAll("@l.", "$.le.").replaceAll("@c.", "$.ctx.").replaceAll("@d", "$.dbus.").replaceAll("@", "$.scope.")
    code=code.replaceAll(":m:", "$.meta.").replaceAll(":s:", "$.scope.").replaceAll(":p:", "$.parent.").replaceAll(":t:", "$.this.").replaceAll(":l:", "$.le.").replaceAll(":c:", "$.ctx.").replaceAll(":d:", "$.dbus.").replaceAll(":::", "$.meta.").replaceAll("::", "$.scope.")
    if (code.includes("return ")){
      return new Function("$", code)
    } else {
      return new Function("$", "return "+code)
    }
  }

  const f = (strings)=>{
    return f3(strings[0])
  }


  RenderApp(document.body, { div: { 
    id: "app",

    props: {
      mytodo: {
        text: "chiamare xyz", done: false
      },

      todos: [
        { text: "chiamare thl", done: false },
        { text: "chiamare fhc", done: true },
      ]
      ,todo: "this ha prevalso su meta nello scope!",
    },

    "=>": 
    [
      f1('@ mytodo.text'), " - ", f1('@ mytodo.done'),
      { br: {}},

      f1('::mytodo.text + " - " + ::mytodo.done'),
      { br: {}},

      { div: { "meta": { forEach: "todo", of: f1('::todos') },

        text: f1(':m:todo.text + " - " + :m:todo.done'),
      }},


      // ---------------------- //
      { hr: {}},

      f`@mytodo.text`, ' - ', f`@mytodo.done`,
      { br: {}},


      { div: { "meta": { forEach: "todo", of: f`@todos` },

        onInit: f`console.log(@todo)`,
        
        text: [
          f`@m.todo.text + " - " + @m.todo.done`,
          " --- ",
          smart({ span: f`JSON.stringify(@todo)`}),
          " --- ",
          { span: { meta: {noMetaInScope: true} ,
            text: f`JSON.stringify(@todo)`
          }}
        ]
      }},

      f`::mytodo.text + " - " + ::mytodo.done`,
      { br: {}},

      { div: { "meta": { forEach: "todo", of: f`::todos` },
        text: [
          f`:::todo.text + " - " + :::todo.done`,
        ]
      }},
    ]

  }})

}

const appDemoDbus = async ()=>{

  RenderApp(document.body, { div: {

    dbus_signals: {
      test_dbus_signal_1: "stream => void"
    },

    onInit: $=>{
      setTimeout(() => {
        $.dbus.test_dbus_signal_1.emit(1234, "abc")
      }, 3000);
    },

    '=>': [

      { div: {

        dbus_signals: {
          test_dbus_signal_1: "stream => void"
        },
    
        onInit: $=>{
          setTimeout(() => {
            $.dbus.test_dbus_signal_1.emit("changed!")
          }, 6000);
        },

      }},

      { div: {
        data: { recived: "..."},
        on: { dbus: { 
          test_dbus_signal_1: ($, ...args)=>{$.this.recived = "aaaa "+args} 
        }},
        onInit: $=>{
          console.log($.dbus)
        },
        handle: {onclick: $=>$.dbus.test_dbus_signal_1.emit("...")},
        text: $=>$.this.recived
      }}
    ]
  }})
}

// app0()
// test2way()
// appTodolist()
// appTodolistv2()
// appNestedData()
// appPrantToChildComm()
// appTestCssAndPassThis()
// appTestSuperCtxProblem()
// appTestAnchors()
// appTestBetterAnchors()
// appSimpleCalendarOrganizer()
// appCalendarOrganizer()
// appCachedProperties()
// appTestAttrsShortcuts
// appTestLayouts()
// appRecursiveTodo()
// appScopeOptions()
// appTestTreeComponent()
appMetaInScopeAndLowCodeTest()
// appDemoDbus()

// appDemoStockApi()

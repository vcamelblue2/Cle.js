import { CLE_FLAGS,  Alias, Bind, BindToProp, Case, cle, svg, DefineSubprops, Extended, ExtendSCSS, ExternalProp, useState, useStateWithSignal, f, fArgs,  asFunc, LE_BackendApiMock, LE_LoadCss, LE_LoadScript, pass, Placeholder, RenderApp, smart, SmartAlias, str, Switch, toInlineStyle, Use, useExternal, html, LazyComponent, remoteHtmlComponent, fromHtmlComponentDef, UseShadow } from "../lib/caged-le.js"
import { NavSidebarLayout } from "../layouts/layouts.js"
import { App, Button, H2, Div, Textarea, Service } from "../extra/smart-alias.js"
import { useProtocols, defineProtocols, ServerProtocol, PROTOCOL } from "../extra/protocols.js"
import { self, T, get, set, fun } from "../extra/lang.js"


const NEW_APP_TEMPLATE = async ()=>{

  RenderApp(document.body, { div: {
    id: "app",

    '': [

    ]

  }})
}



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
      // ctx_id: "root" -> ALWAYS

      data: {
        todo: ["todo1", "todo2", "todo3"]
      },

      "=>" : [

        { button: { 
          ctx_id: "removeBtn",

          text: "remove final todo",

          def: {
            removeLastTodo: $ => {
              if ($.ctx.root.todo.length > 0) {
                let copy = [...$.ctx.root.todo]
                copy.pop()
                $.ctx.root.todo = copy
              }
            }
          },

          handle: { 
            onclick: $ => $.this.removeLastTodo() 
          }

        }},

        { div: { 
            ctx_id: "listPresenter",

            text: $ => "--" + $.ctx.root.todo.toString(),

            on: { // demo di root e ctxroot
              ctx: { root: {
                todoChanged: $=> console.log(" heeey sto puntanto al ctxroot e ai sui aggiornamenti di todo!!")
              }},
              le: { root: {
                counterChanged: $=> console.log(" heeey sto puntanto al root e ai sui aggiornamenti di counter!! essendo un componente è possibile che vengano lanciati più segnli")
              }}
            },
            
            onInit: $ => {
              console.log("heeeeeey sono visibile solo nel contestooooo", $.ctx, $.ctx.root, $.le)
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

          "=>": Use({ div: {   meta: {forEach:"todo", of: $ => $.le.model.todolist, newScope: true}, 
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
        // BREAKING CHANGES v0.0.10: now here you should not duplicate meta intoprops to sub use (beacuse meta is NOT blocked by ctx anymore!)
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

                smart({h6: $=>"-via meta vale: "+$.meta.tuple}, {ha:{"style.color":"red"}}),
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

  const getMonthDays = ()=>{ // MOCK
    let today_date = new Date("04/1/22")
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

        console.log(
          "--- DATA ---\n",
          "today: ", $.today,
          "dates: ", $.dates,
          "monthLabelMapping: ", $.monthLabelMapping,
          "slots: ", $.slots,
          "slot_size_in_hh: ", $.slot_size_in_hh,
          "colors: ", $.colors,
          "projects_progressive: ", $.projects_progressive,
          "projects: ", $.projects,
          "tasks_progressive: ", $.tasks_progressive,
          "plans: ", $.plans,
          "selectedPlan: ", $.selectedPlan,
        )
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
        // BREAKING CHANGES v0.0.10: now here Extended is not required (beacuse meta is NOT blocked by ctx anymore!)

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

    def: {
      closeRoot: fArgs("root", "mark_root_as_changed")`{ root.isOpened = !root.isOpened; mark_root_as_changed() }` // @tree_menu = [...@tree_menu]
    },

    ['a.class']: "tree-component",
    ['a.style']: "margin-left: 25px",

    '=>': [

      { div: { meta: {forEach: "root", of: f`@tree_menu`, define: {first:"first", last:"last"}}, // $=>$.scope.tree_menu

        ['a.class']: "tree-root",
        ['a.style.marginBottom']: $=>$.meta.last ? "15px" : "20px",

        '=>': [

          { hr: { meta: { if: f`@root.isSection && @first` } }}, // $=>$.meta.root.isSection && !$.meta.first

          { h4: {

            ['a.style']: "margin-bottom: 12px",
            ["ha.style.backgroundColor"]: $=>$.meta.root.isActive ? "#e4e8ed" : "unset",
            ["ha.style.color"]: $=>$.scope.$rootHasActiveChild($.meta.root) ? "blue" : "unset",

            handle: { 
              // onclick: $=>{ $.meta.root.isOpened=!$.meta.root.isOpened; $.scope.tree_menu = [...$.scope.tree_menu]; } 
              onclick: $=>{ $.scope.closeRoot($.meta.root, $.meta._mark_root_as_changed); } 
            },
            
            '=>': [
              $=> $.meta.root.isDone ? 'V' : 'O', " - ", $=>$.meta.root.label
            ]
          }},

          { div: { meta: { if: f`@root.isOpened`  }, // $=>$.meta.root.isOpened

            ['a.style']: "margin-left: 25px",
            ["ha.style.marginBottom"]: $=>$.meta.last ? "20px" : "15px",

            '=>': 

              { div: { meta: { forEach: "child", of: f`@root.childs` }, //$=>$.meta.root.childs

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

          // super meta?
          Use({ span: { // meta: {newScope: true}, // BREAKING CHANGES v0.0.10: now here now this works! (beacuse meta is NOT blocked by ctx anymore!)
            props: { scoped_todo: $=>$.scope.todo},
            text: $=>" -- testin super meta, ecco il todo: " + $.this.scoped_todo.text
          }}),

          Use({ span: { meta: {newScope: true},
            constructor: ($, {scoped_todo})=>{
              console.log("mi hanno passato: ", scoped_todo)
              $.this.scoped_todo = scoped_todo
            },
            props: { scoped_todo: undefined },
            text: $=>" -- testin super meta, ma con new scope ecco il todo: " + $.this.scoped_todo.text
          }}, undefined, {init: {scoped_todo: $=>{  console.log("chiamato!!"); return $.scope.todo}}} ),
        ]
      }},


      // DEMO ALIAS
      { div: {

        props: { 
          todo_text: Alias($=>$.scope.todos[0].text, ($, v)=>{
            console.log("sono stato chiamato..", $, v)
            $.scope.todos[0].text=v; $.scope.todos = [...$.scope.todos] // qui colpa dei foreach e la mark as changed che non funge
          })
        },

        text: f`'todo: ' + @todo_text`,

        handle: { onclick: $=>{
          console.log("aaaa")
          $.this.todo_text = "oleeeee" + 1
        }}
      }},

      { div: {

        props: { 
          todo_text: Alias($=>$.scope.mytodo.text, ($, v)=>{
            console.log("sono stato chiamato..", $, v)
            $.scope.mytodo.text=v;
            $.scope._mark_mytodo_as_changed()
          })
        },

        text: f`'todo: ' + @todo_text`,

        handle: { onclick: $=>{
          console.log("aaaa")
          $.this.todo_text = "goooo" + 1
        }}
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

const appDemoAlias = async ()=>{
  // novità: $.u.changed('values', 'entries') per markare as changed (solo in scope) cose senza _mark..

  const MyInput = { 
    input: {

      data: { 
        text: "" 
      },

      hattrs: {
        value: Bind($ => $.this.text)
      }
  }}

  RenderApp(document.body, { div: {

    data: {
      rootText: "hellooo",
      rootText2: "world",
    },

    on: {
      this: {
        rootTextChanged: $=>console.log("rt1, sono cambiato!!", $.this.rootText),
        rootText2Changed: $=>console.log("rt2, sono cambiato!!", $.this.rootText2)
      }
    },

    '=>': [
      Extended(MyInput, { data: { text: Alias($=>$.scope.rootText, ($, v)=>$.scope.rootText=v) }} ),
      Extended(MyInput, { data: { text: SmartAlias(`@rootText2`) }} ),
    ]

  }})
}

const appResolveMultiCssProblem = async ()=>{

  const Css = { Model: {
      id: "cssEngine",

      props: {
        cssRules: [{rule: " /*CssEngin*/ ", refCounter: 1}],
      },

      def: {
        ruleGen: ($, rule)=>({rule: rule, refCounter: 1}),
        getRule: ($, rule) => {
          return $.this.cssRules.find(r=>r.rule === rule)
        },
        add: ($, rule)=>{
          let found = $.this.getRule(rule)
          if (found){
            found.refCounter += 1
          }
          else {
            $.this.cssRules.push($.this.ruleGen(rule))
          }
          $.this._mark_cssRules_as_changed()
        },
        remove: ($, rule)=>{
          let found = $.this.getRule(rule)
          if (found){
            if (found.refCounter >= 2){
              found.refCounter -= 1
            }
            else {
              $.this.cssRules.splice($.this.cssRules.indexOf(found), 1)
              $.this._mark_cssRules_as_changed()
            }
          } else {
            console.log("hai provato ad eliminare una regola inesistente..")
          }
        }
      },

      css:  [
        $=>{
          let res = $.this.cssRules.map(r=>r.rule.replaceAll("\n", "").replaceAll("\t", " ").replaceAll("   ", "").replaceAll("  ", " ")).join(" ")
          console.log("RULES:", res)
          console.log("RULES:", $.this.cssRules)
          return res
        }
      ]
    }
  }

  const myDiv = { div: {
    props: {
      cssDef:`
        .myDiv { background: red; width: 50px; height: 50px; border: 1px solid black}
      `
    },

    'a.class': "myDiv",

    onInit: $=>{
      $.le.cssEngine.add($.this.cssDef)
    },
    onDestroy: $=>{
      $.le.cssEngine.remove($.this.cssDef)
    }
  }}

  RenderApp(document.body, { div: {

    data: {
      elements: [1,2,3]
    },

    '=>': [
      Css,

      myDiv,

      { div: { meta: { forEach: "element", of: f`@elements`, define: {index: "index"}},
        text: Extended( myDiv, {
          handle: { onclick: f`{ @elements.splice(@index, 1); @elements = [...@elements]}`}
        })
      }},

      { button: { handle: { onclick: f`@elements = [...@elements, 0]` }, text: "inc" }},
    ]

  }})
}

const appDemoNewShortcuts = async ()=>{
  
  let NEW_SHORTCUTS = true

  if (!NEW_SHORTCUTS){

    RenderApp(document.body, { div: {

      data: {
        text: "hellooo",
      },

      '': [

        { h1: "Test!"},

        { h5: { text: "Hello World Shortcuts!" }},

        { div: {
          '': { div: {
            '': { div: {
              text: "i'm a super nested div"
            }}
          }}
        }},

        { input: {

          hattrs: {
            value: Bind($ => $.scope.text)
          },

          attrs: {
            style: "color: red"
          }

        }},

        { input: {

          ha_value: Bind( $ => $.scope.text),

          a_style: "color: red",

        }},

        { input: {

          let_myText: Alias($ => $.scope.text + "---", ($,v)=>$.scope.text=v),

          ha_value: Bind( $ => $.scope.myText),

          a_style: "color: red",

          handle_onclick: $=> (console.log("clicked!"), $.dbus.iptClicked.emit()),

          dbus_signal_iptClicked: "stream => void"

        }},

        { div: {
          on_dbus_iptClicked: $=>console.log("sono dbus, ipt clicked!")
        }},
        
        { div: {
          '': [
            { i: {'': "I'm a I"}}, { b: { '': "I'm a B" }}, { span: {'': "I'm a SPAN"}}
          ]
        }}

      ]

    }})
    
  }


  else {
    // test inline dynamic with separation view/model and optional DY registration
    const CLE = new Proxy({}, {

    get: (_, componentNameForDY, __)=>{
      return (modelDef={}, root='div', viewDef={}, ...childs)=>{
        let parsedModelDef = {}; Object.entries(modelDef).forEach(([k,v])=>{ parsedModelDef[k.replaceAll(" ", "_")]=v;})
        let parsedViewDef = {}; Object.entries(viewDef).forEach(([k,v])=>{ parsedViewDef[k.replaceAll(" ", "_")]=v;})
        return {[root]:{...parsedModelDef, ...parsedViewDef, '': childs}}
      }
    },

    set: function(_target, prop, value) {}
    })
    const root = new Proxy({}, {

      get: (_, prop, __)=>{
        return prop
      },

      set: function(_target, prop, value) {}
    })

    const str = new Proxy({}, { get: (_, prop, __)=>{ return prop },set: function(_target, prop, value) {} })
    console.log(str.this_is_a_string, "..", str.hello, "!")


    RenderApp(document.body, { div: { '': [
      
      // NO DOUBLE OBJ
      cle.button({
        text: "change data",

        h_onclick: $=>console.log("bla bla, do something")

      }),


      // INLINE OBJ DECLARATION WITH DY & Sepration
      CLE.myComponent(
        
        // Model
        { 
          ['let content']: "Hello World",  // ==> props: { content: "Hello World" },

          onInit: $=>{
            console.log("hello world! the content is: ", $.this.content )       // todo: this.content), //meta: { thisAs: "scope" },
          }
        },

        // View
        root.div, {  a_style: {width: "200px", height: "200px", backgroundColor: "red"}  },
        ...[
          "Content: ", $=>$.scope.content
        ]
        
      )

    ]}})

  }

}

const appDemoSocialNetworkReactStyle = async () => {
  
  class FeedModelApi extends LE_BackendApiMock{

    constructor(apiSpeed=50){
      super(apiSpeed)
      this.users = [...Array(10).keys()].map(i=>({ uid: '00000'+i, name: 'user '+i }))
      this.feed = [...Array(10).keys()].map(i=>({ id: "post_id_"+i, text: "Post n."+i, like: [...Array(i).keys()].map(l=>'user '+l+1 ), comments: 0, user: { uid: '00000'+i, name: 'user '+i }}))
      this.feed_id = 10
    }
    _getUserByName(usr){
      return this.users.find(u=>u.name==usr)
    }
    login(usr, pwd){
      return this.response(this._getUserByName(usr))
    }
    getFeed(usr){
      return this.response(this.feed.map(p=>({...p, like: p.like.length, user_like: p.like.includes(usr)}) ))
    }
    publishNewPost(text, usr){
      this.feed_id += 1
      this.feed.reverse().push({ id: "post_id_"+this.feed_id, text: text, like: [], comments: 0, user: this._getUserByName(usr)})
      this.feed.reverse()
      return this.response({})
    }
    likePost(usr, post_id){
      let post = this.feed.find(p=>p.id === post_id)
      !post.like.includes(usr) && post.like.push(usr)
      return this.response({})
    }
    
  }
  const feedModelApi = new FeedModelApi()


  const FeedPost = { div: { meta: { forEach: "post", of: f`@feed`},

    handle_onclick: $=>{ // DO NOT UPDATE ALL THE FEED! set and continue..
      if(!$.meta.post.user_like){
        $.scope.likePost($.meta.post.id)
        $.meta.post.like +=1
        $.meta.post.user_like = true
        $.meta._mark_post_as_changed()
      }
    },

    a_style: { border: "1px solid black", width: "80%", margin: "0px 10%"  },

    '': [
      { h4: { text: f`@post.user.name`, a_style: "margin: 5px 0px"}},
      { div: { text: f`@post.text`, a_style: "padding: 20px 0px;"}},
      { div: [
        f`'like: ' + @post.like`, ' - ', f`'Comments: ' + @post.comments`,
      ]}
    ]
  }}


  const NewPostInput = { div: {
    let_text: "",

    on_dbus_newPostPublishRequest: f`@text = ''`,

    '': [
      { textarea: {
        ha_value: Bind(f`@text`),
        a_style: "width: 100%; heigth: 200px",
        handle_onkeypress: ($, e)=>{if(e.key === "Enter") {$.dbus.newPostPublishRequest.emit($.scope.text); e.preventDefault()}}
      }},
      { button: {
        handle_onclick: $=>$.dbus.newPostPublishRequest.emit($.scope.text),
        text: "Publish"
      }}
    ]
  }}
  const NewPostController = { Controller: {
    on_dbus_newPostPublishRequest: async ($, text)=>{
      await feedModelApi.publishNewPost(text, $.scope.user.name)
      await $.scope.loadFeed()
    }
  }}
  const NewPostCreator = { Component: { meta: { hasViewChilds: true },

    dbus_signal_newPostPublishRequest: "stream => text",

    '': [ 
      NewPostInput,
      NewPostController
    ]
  }}


  const Feed = { div: {

    a_style: { border: "1px solid black", width: "70%", paddin: "25px", margin: "0px 15%"},
    '': [
      NewPostCreator,
      { hr: {}},
      FeedPost
    ]
  }}

  const Home = { div: {
    let_user: undefined,
    let_feed: [],
    
    def_login: async $=>{
      $.this.user = await feedModelApi.login('user 0', 'dummy')
    },
    def_loadFeed: async $=>{
      $.this.feed = await feedModelApi.getFeed($.this.user.name)
    },
    def_likePost: async ($, post_id)=>{
      await feedModelApi.likePost($.this.user.name, post_id)
    },

    onInit: async $ => {
      await $.this.login()
      await $.this.loadFeed()
    },

    css: [
      `* { box-sizing: border-box !important;}`, 
      'body {padding: 0px; margin: 0px; }'
    ],

    '': [
      Feed
    ]

  }}


  RenderApp(document.body, Home)

}

const appDemoConstructor = async ()=>{

  const ShowText = { div: {
    // @Input
    let_desc: "",
    let_text: "",

    constructor: ($, {text})=>{
      if (text){
        $.this.text = text($)
      }
    },

    '': [  $=>$.this.desc, ": ", $=>$.this.text  ]
  }}


  const Input = { input: {
    ha_value: Bind(f`@root_text`)
  }}


  RenderApp(document.body, { div: {
    let_root_text: "hello",

    '': [
      Input,

      Use(ShowText, { let_desc: "Copy value once" }, {init: {text: $=>$.scope.root_text }}),
      Use(ShowText, { let_desc: "Follow Value (same scope..)" }, {init: {text: $=>_=>$.scope.root_text }}), // qui uso il punto di vista del padre in termini di reale accesso ($ è di parent) e scope per la change detection (fatta a livello di figlio, quindi serve scope). passo una funzione invece di un valore così ho la detection!
      Use(ShowText, { let_desc: "Follow Value (new scope..)", meta: {newScope:true}}, {init: {text: (_,$)=>()=>$.parent.root_text }}), // qui con il nuovo scope in realtà qui $ si riferisce al figlio (secondo param, visto che nel costuctor passo ($)), ovvero bypasso il binding a livello padre! passo una funzione invece di un valore così ho la detection!


      Use(ShowText, { let_desc: "No Constructor..", let_text: $=>$.parent.root_text }),

      { hr: {}}
    ]

  }})


  //////////////////////////////////////////////
  //////////////////////////////////////////////
  //////////////////////////////////////////////
  
  // v2: better with use external!

  const ShowText2 = { div: {
    ctx_id: "show",

    // @Input
    let_desc: "",
    let_text: "",
    let_setText: undefined,
    let_textChangedSignal: undefined,

    def_onTextChangedSignal: ($, ...args)=>{
      console.log("changed", $.comp_ctx_id, args)
    },

    constructor: ($, {text})=>{ // nota negativa: devo sempre passare una prop o testare cosa mi hanno passato
      if (text){
        console.log(text) // {getter, setter, signal}
        $.this.text = text.getter
        $.this.setText = text.setter
        $.this.textChangedSignal = text.signal // { emit, emitLazy, subscribe, unsubscribe}
        $.this.textChangedSignal.subscribe($, (...args)=>$.this.onTextChangedSignal($, ...args))
      }
    },
    
    h_onclick: $=>{
      console.log("clicked")
      $.this.setText("aa changeed")
      $.this.desc="decs changeed. "
    },

    '': [  $=>$.this.desc, ": ", $=>$.this.text  ]
  }}


  const Input2 = { input: {
    ha_value: Bind(f`@text`)
  }}

  RenderApp(document.body, { div: {
    id: "app",
    let_text: "hello",

    // also ref works!
    childsRef: {
      show_1: "single",
      show_2: "single"
    },

    on: { ref: {
      show_1: { descChanged: $=>{
        console.log("show 1 desc changed!")
      }},
      show_2: { descChanged: $=>{
        console.log("show 2 desc changed!")
      }},
    }},

    '': [
      Input2,

      // here we pass prop to a component that is in a new scope! encapsulated!
      Use(ShowText2, {ctx_id: "show_1", name: "show_1", let_desc: "Binded Value: ", meta: {newScope: true} }, {init: {text: BindToProp("text") }}), // point of view dela parent! text si trova in scope..
      Use(ShowText2, {ctx_id: "show_2", name: "show_2", let_desc: "Binded Value: ", meta: {newScope: true} }, {init: {text: BindToProp("$.le.app.text") }}), // full prop name, always point of view is parent.
    ]

  }})
}

const appDemoNestedDataChangeDetection = async ()=>{

  let Obj = (name, props, UUID=undefined, _async=1, retF=true)=>{ 
    const Storage = {}; 

    const F = ($, name, props, UUID=undefined)=>{
      if (UUID === undefined){
        // console.log("id is..", $.this.comp_id)
        UUID = $.this.comp_id
      }

      let inStorage = Storage[UUID+name]

      if (inStorage){
        return inStorage
      }
      else {
        let obj = {}
        
        Object.keys(props).forEach(k=>{

          obj['_'+k]=props[k]

          Object.defineProperty(obj, k, {

            get(){
              return obj['_'+k]
            },
            set (v) {
              obj['_'+k]=v
              if(_async>0){
                setTimeout(()=>$['this']['_mark_'+name+'_as_changed'](), _async)
              }
              else {
                $['this']['_mark_'+name+'_as_changed']()
              }
            }
          })
        })

        Storage[UUID+name] = obj
        
        return obj
      }
    }

    return $=>F($,name,props,UUID)
  }

  RenderApp(document.body, { div: {

    let_data: Obj("data", {
      prop1: 10,
      counter: 123
    }),


    onInit: $=>console.log($.this.data),

    '': [
      $=>$.scope.data.prop1,
      { button: { text: "+1", h_onclick: $=>$.scope.data.prop1+=1 }},
      
      {br:{}},
      
      $=>$.scope.data.counter,
      { button: { text: "+1", h_onclick: $=>$.scope.data.counter+=1 }},
    ]

  }})

  
}

const appDemoChachedWithAlias = async ()=>{

  RenderApp(document.body, { div: {

    let_data: {
      p1: 123,
      p2: "abc",
      p3: [1,2,3]
    },

    let_adata: SmartAlias(`@t.data`, (_new, _old)=>_new.p1!==_old.p1), // caching comparer can also be set to "true" for default caching strategy enabled!


    '': [

      { div: {
        '': f`JSON.stringify(@data)` // $=>JSON.stringify($.scope.data)
      }},

      { div: {
        '': f`JSON.stringify(@adata)`
      }},

      { div: {
        let_a_data_follower: $=>$.scope.adata,

        '': f`JSON.stringify(@a_data_follower)`
      }},

      { div: { meta: { forEach: "element", of: f`@data.p3`, comparer: (o, n)=>{ console.log(o,n, n.map((v,i)=>v!==o[i]).some(v=>v===true)); return o.length !== n.length || n.map((v,i)=>v!==o[i]).some(v=>v===true) } },
        '': f`@element`
      }},

      { button: {
        text: "edit p1",
        h_onclick: $=>{
          $.scope.data = {...$.scope.data, p1: 456}
        }
      }},
      { button: {
        text: "edit p2",
        h_onclick: $=>{
          $.scope.data = {...$.scope.data, p2: "cde"}
        }
      }},
      { button: {
        text: "edit p3",
        h_onclick: $=>{
          $.scope.data.p3 = [...$.scope.data.p3]
          $.scope.data.p3[2]=5
          $.scope.data = {...$.scope.data}
        }
      }}

    ]

  }})
}

const appDemoStackblitz = async ()=>{

  await Promise.all([
    LE_LoadScript("https://unpkg.com/@stackblitz/sdk/bundles/sdk.umd.js"),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js"),
  ])

  let [ f_libs_cle_lib_cagedle_js, f_libs_cle_routing_lite_routing_js, f_libs_cle_layouts_layouts_js
   ] = await Promise.all([
    await axios.get('https://cdn.jsdelivr.net/npm/cle.js@0.0.12/lib/caged-le.js'),
    await axios.get('https://cdn.jsdelivr.net/npm/cle.js@0.0.12/routing/lite_routing.js'),
    await axios.get('https://cdn.jsdelivr.net/npm/cle.js@0.0.12/layouts/layouts.js')
   ])

  RenderApp(document.body, { div: {
    id: "app",

    a_style: "height: 100vh",

    css: ["body{margin: 0}"],

    '': { div: {
      

    onInit: async $ => {

        StackBlitzSDK.embedProject( $.this.el, { files: {
// MAIN JS
'main.js': `
import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock} from "./libs/cle/lib/caged-le.js"

import {InitRouter, Router} from "./libs/cle/routing/lite_routing.js"

import {HomePage} from "./pages/home.js"

LE_InitWebApp(async ()=>{

  await InitRouter({

    pages: {
      "home": HomePage
    },
  
    defaultRoute: "home"
  })

})`,

// PAGES
'pages/home.js': `
import {pass, none, smart, Use, f, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, Alias} from "../libs/cle/lib/caged-le.js"

export const HomePage = async (state)=>{ return { 
  div: {

    id: "app",

    '': [

      { h2: { 
        text: "Hello World!",  a_style: "text-align: center"
      }}
      
    ],

}}}
`,

// LIBS
'libs/cle/lib/caged-le.js': f_libs_cle_lib_cagedle_js.data,
'libs/cle/routing/lite_routing.js': f_libs_cle_routing_lite_routing_js.data,
'libs/cle/layouts/layouts.js': f_libs_cle_layouts_layouts_js.data,

// INDEX HTML
'index.html': `
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta http-equiv="Content-Style-Type" content="text/css">
  <title>StackblitzApp</title>
  <script type="module" src="main.js" ></script>
</head>
<body>
</body>
</html>`,

          },
          title: "test title",
          description: "test description",
          template: 'polymer',
          // dependencies?: {[name: string]: string};
          // settings?: {
          //   compile?: {
          //     trigger?: 'auto' | 'keystroke' | 'save';
          //     action?: 'hmr' | 'refresh'
          //     clearConsole?: boolean
          //   }
          // }
        }, {height: "100%", openFile: "main.js"})
    }

    }}
  }})
}

const appDemoMetaEditsPushBack = async ()=>{
  const SIMPLE_TEST = false
  
  if (SIMPLE_TEST){

    RenderApp(document.body, { div: {
  
      id: "app",
  
      let_items: [{v:1}, {v:2}, {v:3}],
  
      '': [
  
        { h3: "Demo set meta value (with pushback)"},
  
        { div: { meta: {forEach: "item", of: f`@items`},
  
          "=>": { div: {
            
              text: [ "VAL: ", f`@item.v`],
              
              h_onclick: $ => {
                $.meta.item = {v:99},
                console.log($.scope.items)
              }
              
            }}
          }}
        ]
  
    }})

  } 
  
  else {

    // https://milligram.io/#getting-started
    await Promise.all([
      LE_LoadCss('https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic'),
      LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css'),
      LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css'),
    ])

    RenderApp(document.body, { div: {
  
      id: "app",
  
      let_todos: undefined,

      on_this_todosChanged: ($, _, old_v)=>{old_v !== undefined && $.this.store()}, // is an init?

      onInit: $ => { $.this.load() },

      def_store: $ => {
        localStorage.setItem("cle.demopushback.todos-data", JSON.stringify({ todos: $.this.todos }))
      },

      def_load: $ => {
        let loaded = localStorage.getItem("cle.demopushback.todos-data")
        try{ $.this.todos = JSON.parse(loaded).todos } 
        catch { $.this.todos = [{todo: "Test pushback!", done: true}] }
      },

      def_create: ($, todo) => {
        return {todo: todo, done: false}
      },

      def_add: ($, todo) => {
        $.this.todos = [...$.this.todos, todo]
      },

      def_remove: ($, todo) => {
        $.this.todos = $.this.todos.filter(t=>t!==todo)
      },

      a_style: { marginLeft: "25%", marginRight: "25%", marginTop: "25px", padding: "25px", border: "0.5px solid #dedede", minHeight: "540px" },
  
      '': [

        cle.h1({
          text: "Cle - To Do List",
          a_style: { textAlign: "center", fontSize: "5rem"}
        }),

        cle.div({ 
          a_style: { display: "flex", gap: "10px" }
        },
          
          cle.input({
            ctx_id: "input",
            
            let_text: "",
            ha_value: Bind(f`@text`),
            
            a_style: { flexGrow: "1"},
  
            h_onkeypress: ($, e) => { 
              if(e.key === "Enter") {
                $.scope.add($.scope.create($.this.text))
                $.ctx.input.text = ""
              }
            }
          }),
  
          cle.button({
            text: "Add",
            a_style: { minWidth: "120px" },
            h_onclick: $=>{ 
              $.scope.add($.scope.create($.ctx.input.text))
              $.ctx.input.text = ""
            }
          })

        ),

        cle.hr({}),
        
        cle.div({
          a_style: { overflowY: "auto", height: "310px", overflowY: "auto" }
        }, 

          cle.div({ meta: {forEach: "todo", of: f`@todos`},
            let_in_edit: false,

            a_style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
          },
            
            // todo with checkbox
            cle.span({ a_style: { display: "flex", marginLeft: "2px"}},

              cle.input({ 
                ha_type: "checkbox", 
                ha_checked: f`@todo.done`,
                a_style: { height: "3rem", width: "3rem"},

                h_onchange: f`{ @todo = {...@todo, done: !@todo.done} }`
              }), 
              
              ...Switch(
                
                Case(f`!@in_edit`,

                  cle.label({
                    text: f`@todo.todo`,
                    a_style: { margin: "3px 0px 0px 15px;" },

                    h_onclick: f`{ @in_edit = true }`
                  })
                ),

                Case(f`@in_edit`,
                    
                  cle.input({
                    let_new_text: Alias(f`@todo.todo`, fArgs('v')`{ @todo = {...@todo, todo: v }}`), // alias with custom setter required here to pushback text change

                    ha_value: Bind(f`@new_text`, {event: "change"}),
                    a_style: { margin: "3px 0px 0px 15px;" },

                    onInit: $ => $.this.el.focus(),
                    h_onblur: f`{ @in_edit = false }`,
                    h_onkeypress: fArgs('e')`{ if(e.key === 'Enter') { e.preventDefault(); @el.onblur = undefined; @in_edit = false; }}`, // must remove onblur event before delete!!
                  })
                )
              )

            ),

            // remove button
            cle.button({  
              text: "remove", 

              a_style: { marginLeft: "15px", minWidth: "120px" }, 

              h_onclick: f`@remove(@todo)`

            }),
          
          )
        ),

        cle.textarea({ 
          a_style: { position: "absolute", bottom: "10px", left: "25.2%", width: "calc(50% - 5px)", height: "110px"}
        }, 

          $=>("DATA: "+JSON.stringify($.le.app.todos, pass, 2))

        )
      ]
  
    }})
  }
    
}

const appDemoExternalPropsAndDyDef = async ()=>{

  // novità per aggiungere un po di dinamicità al tutto:
  // possibilità di bindarsi ad external props (da usare poi con chiusure)
  // + nuovo modo di scrivere le def alla "angular js", ovvero una funzione che ti fa "aggiungere" proprietà sull'oggetto def, piuttosto che un semplice json

  const DyDef = new Proxy({}, {
    get:(target, prop, rec) => {
      return f => {
        const def = {}
        // proxy of proxy, to set like "this.let.prop1", "this.def.func1", "this.a.style" etc, etc..
        const trap_subset = {}
        const proxied_def = new Proxy(def, {
          get: (target, trap_set_prop, rec) => {
            if([
              'a', 'attr', 'ha', 'hattr', 'p', 'let', 'd', 'def', 'h', 'handle', 's', 'signal', 'dbs', 'dbus_signal', 'on_this', 'on_parent', 'on_scope', 'on_dbus'
            ].includes(trap_set_prop)){
              return new Proxy(trap_subset, {
                set: (target, prop, value) => {
                  def[trap_set_prop+'_'+prop] = value
                  return true
                }
              })
            }
          },
          // set: (target, prop, value) => { //otherwise ordinary set! (to set this.def = { ... })
          // }
        })
        f.bind(proxied_def)(proxied_def) // can be used with first params or "this" (if ordinary function..)
        return {[prop]: def}
      }
    },
    set: ()=>{} // NOT ALLOWED
  })

  if(false){
    const exampleComponent = DyDef.div(function ($) { // "this" require ordinary function!

      $.let_prop1 = {hello: "world"}

      const _privateConst = "can be defined and used!"

      $.let.prop2 = $ => _privateConst + " (always!)"

      $.let.prop3 = "good works with trap!"

      $.def = {
        func1(){

        },
        func2(){

        }
      }
      $.def.func3 = $ => {

      }

      this.onInit = $ => {
        console.log($.this.prop1)
        console.log($.this)
      },

      this.view = [
        $ => $.this.prop1,
        { br: {} },
        $ => $.this.prop2,
        { br: {} },
        $ => $.this.prop3,
      ]
    })

    const exampleComponentExt = DyDef.div(function ($) { // "this" require ordinary function!

      const extProp = ExternalProp("Initial Ext Prop Value.")


      $.let.counter = 0

      $.let.usedExtProp = useExternal([extProp], 
        $=>extProp.value + " " + $.this.counter
      )
      $.on_this.usedExtPropChanged = $ => { console.log("usedExtProp chnaged") }


      this.onInit = $ => {
        console.log($.this)

        setTimeout(() => {
          extProp.value = "valore cambiato!"
        }, 3000);
      }

      this.handle_onclick = $ => {
        $.this.counter += 1
      }

      this.view = [
        { br: {} },
        $ => $.scope.counter,
        { br: {} },
        $ => $.this.usedExtProp,
      ]
    })
    RenderApp(document.body, { div: {
      id: "app",

      view: [
        exampleComponent,
        exampleComponentExt
      ]

    }})


    let globalCom = ExternalProp({
      comp1MustReload: false,
      comp2MustReload: false
    })
    RenderApp(document.body, { div: {
      id: "app2",

      let_gc: useExternal([globalCom], $=>globalCom.value),

      view: [
        "------------------",
        {br:{}},

        {div: {
          id: "comp1",

          let_comp1: useExternal([globalCom], $ => globalCom.value.comp1MustReload ),

          h_onclick: $ => { globalCom.value = {...globalCom.value, comp2MustReload: !globalCom.value.comp2MustReload}},

          '': $=>"comp1: " + $.this.comp1
        }},

        {div: {
          id: "comp2",

          let_comp2: useExternal([globalCom], $ => globalCom.value.comp2MustReload ),

          h_onclick: $ => { globalCom.value = {...globalCom.value, comp1MustReload: !globalCom.value.comp1MustReload}},

          '': $=>"comp2: " + $.this.comp2
        }},

        { span: $=>$.scope.gc.comp1MustReload + " - " + $.scope.gc.comp2MustReload}

      ]

    }})


    // parent to specific child comunication! -> creo e istanzio N ExternalProp quante me ne servono, poi a runtime risetto il puntamento nel figlio a quella che mi serve
    // good for performance..
    const propsContanier = {} 
    RenderApp(document.body, { div: {
      id: "app2",

      view: [
        "------------------",
        {br:{}},


        {div: {
          id: "the_parent",

          let_array: [10,20,30],

          onInit: $ => {
            $.this.array.forEach((v, i)=>{
              propsContanier[i] = ExternalProp("status: normal")
            })

            setTimeout(() => {
              propsContanier[1].value = "status: changed!"
            }, 3000);
          },

          '': { div: { meta: { forEach: "val", of: f`@array`, define: { index: 'index' }},

            let_msgFromParent: "",

            onInit: $=>{
              let p = propsContanier[$.meta.index]
              $.this.msgFromParent = useExternal([p], $ => p.value)
            },

            '': $=>$.this.msgFromParent
          }}
        }},
      ]

    }})
  }
  // test dynamic navigation via external prop
  else {

    let activePage;
    let activePageApp;


    let sharedCounter = ExternalProp(0)
    let sharedElements = ExternalProp([1,2,3])

    let [usernameProp, getUsername, setUsername] = ExternalProp('will').asFunctions
    
    const Page1 = ()=> RenderApp(document.body, cle.div({

      let_counter: sharedCounter.value, // copy by value
      onInit: $ => {
        sharedCounter.addOnChangedHandler($.this, ()=>{ $.this.counter = sharedCounter.value })
      },
      onDestroy: $ => {
        sharedCounter.removeOnChangedHandler($.this)
      },

      a_style: { width: "500px", height: "500px", border: "1px solid black", padding: "25px" },
    }, 
      cle.h1("this is page 1"),
      cle.button({h_onclick: $=>{ activePage.value = 'page 2'}}, 'Go To Page 2'),

      cle.h4($=>"Counter Value (via props): "+$.scope.counter),
      cle.button({h_onclick: $=>{ sharedCounter.value += 1 }}, 'Inc Counter'),

      cle.h4({}, 
        useExternal([sharedCounter], $=>"Direct Counter Value: "+sharedCounter.value) 
      ),

      cle.h4({}, 
        useExternal([usernameProp], $=>"Username: " + getUsername()) 
      ),

      cle.div({ meta: {forEach: "element", of: useExternal([sharedElements], $=>sharedElements.value)} },
        $ => $.scope.element
      ),

      cle.button({h_onclick: $=>{ sharedElements.value = [...sharedElements.value, "Added From Page 1!"] }}, 'Inc Elements'),

    ))


    const Page2 = ()=> RenderApp(document.body, cle.div({

      let_counter: sharedCounter.value, // copy by value
      onInit: $ => {
        sharedCounter.addOnChangedHandler($.this, ()=>{ $.this.counter = sharedCounter.value })
      },
      onDestroy: $ => {
        sharedCounter.removeOnChangedHandler($.this)
      },
      
      a_style: { width: "500px", height: "500px", border: "1px solid black", padding: "25px" },
    }, 
      cle.h1("this is page 2"),
      cle.button({h_onclick: $=>{ activePage.value = 'page 1'}}, 'Go To Page 1'),

      cle.h4($=>"Counter Value (via props): "+$.scope.counter),
      cle.button({h_onclick: $=>{ sharedCounter.value += 1 }}, 'Inc Counter'),

      cle.h4({}, 
        useExternal([sharedCounter], $=>"Direct Counter Value: "+sharedCounter.value) 
      ),
      
      cle.h4({}, 
        useExternal([usernameProp], $=>"Username: " + getUsername()) 
      ),

      cle.div({ meta: {forEach: "element", of: useExternal([sharedElements], $=>sharedElements.value)} },
        $ => $.scope.element
      ),

      cle.button({h_onclick: $=>{ sharedElements.value = [...sharedElements.value, "Added From Page 2!"] }}, 'Inc Elements'),
    ))
    
    activePage = ExternalProp('', (newPage, oldPage)=>{
      // console.log("changed!!", newPage, oldPage)
      // if (newPage !== oldPage){
        activePageApp?.destroy()
        activePageApp = newPage === "page 1" ? Page1() : Page2() 
      // }
    })

    activePage.value = "page 1"
  }
}

const appDemoTodoCard = async ()=>{

  console.log("WARNING: not well tested, nor completed")

  // https://milligram.io/#getting-started
  await Promise.all([
    LE_LoadCss('https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic'),
    LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css'),
    LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css'),
  ])

  const EMPTY_TASK = { content: "NO TASKS"}
  const EMPTY_TASK_LIST = [EMPTY_TASK]

  RenderApp(document.body, cle.root({

    // from https://www.youtube.com/watch?v=EqHwUsdOg8o
    // https://github.com/ayyazzafar/sortable-drag-and-drop-todo-list-with-javascript

    let_lists: [ 
      { name: "Col 1", tasks: [
        { content: "Hello" },
        { content: "World" },
      ]},

      { name: "Col 2", tasks: [
        { content: "Test" }
      ]}
    ],

    def_move_task: ($, task, from_, to_, new_idx)=>{
      console.log(task, from_, to_, new_idx)
      to_.tasks = [...to_.tasks.slice(0, new_idx), JSON.parse(JSON.stringify(task)), ...to_.tasks.slice(new_idx)]
      from_.tasks = from_.tasks.filter(t=>t !== task)
      // to_.tasks.splice(new_idx, 0, task)

      $.this.lists = [...$.this.lists]
    },

    css: [`

      /*.card-container {
        padding-top: 25px;
      }*/

      .list {
        min-width: 200px;
        min-height: 100px;
      }
    
      .card {
        /* Add shadows to create the "card" effect */
        box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
        transition: 0.3s;
        border-radius: 5px;
        width: 200px; 
        height: 100px;
        padding: 15px;
        margin-bottom: 15px;
      }
      
      /* On mouse-over, add a deeper shadow */
      .card:hover {
        box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
      }

    `]
    
  },

    cle.div({ 
      a_class: "container"
    }, 

      cle.div({ 
        a_class: "row",

        let_moving_task: undefined,
        let_hovered_task: undefined

      },
      
        cle.div({ meta: { forEach: "list", of: f`@lists`},
          a_class: "column list-container"
        },
          
          cle.h2({ text: f`@list.name`}),

          cle.div({ 
            a_class: "list",

            // 'let rendered': undefined,

            // onInit: f`{ @rendered = [] }`

            h_ondragover: ($, e) => {

              if ($.scope.list.tasks.length === 0){
                e.preventDefault(); // alow drop!

                $.scope.hovered_task = $.scope.task

                console.log("over!")
                // $.this.is_hovered_on_top = true
              }

            },

            def_h_ondrop: ($, e) => {
              console.log("drop!", $.scope.list)
              if ($.scope.list.tasks.length === 0){
                $.scope.move_task($.scope.moving_task.task, $.scope.moving_task.list, $.scope.list, 0)

                $.scope.hovered_task = undefined
              }
            },


          },

            cle.div({ meta: { forEach: "task", of: $ => $.scope.list.tasks.length > 0 ? $.scope.list.tasks : EMPTY_TASK_LIST, define: { index: "index", first: "isFirst", last: "isLast" } }, 
              
              a_draggable: true, 
              
              let_dragging_over: $=>$.scope.hovered_task===$.scope.task,
              let_is_hovered_on_top: false,
              
              let_dragging: false,

              let_loop: undefined,

              def_h_ondragstart: ($, ev) => {
                $.scope.moving_task = { list: $.scope.list, task: $.scope.task, idx: $.scope.index}
                console.log("start!!", $.scope.moving_task)
                $.scope.dragging = true
              },
              def_h_ondragend: ($, ev) => {
                $.scope.moving_task = undefined
                console.log("end!!", $.scope.moving_task)
                $.scope.dragging = false
              },

              // def_h_ondragenter: ($, e) => { 
              //   console.log("enter!", $.scope.task)
              //   $.this.dragging_over = true
              // },
              // def_h_ondragleave: ($, e) => { 
              //   console.log("leave!", $.scope.task)
              //   // clearTimeout($.this.loop)
              //   // $.this.loop = setTimeout(()=>{
              //   //   $.this.dragging_over = false
              //   // }, 10)
              // },
              def_h_ondragover: ($, e) => {
                e.preventDefault(); // alow drop!

                $.scope.hovered_task = $.scope.task

                console.log("over!")
                let draggingCardY = e.clientY
                let this_rect = $.this.el.getBoundingClientRect();
                let offset = draggingCardY - (this_rect.top + (this_rect.height / 2))
                if (offset <= 0){
                  $.this.is_hovered_on_top = true
                }
                else {
                  $.this.is_hovered_on_top = false
                }
              },
              def_h_ondrop: ($, e) => {
                console.log("drop!", $.scope.list)
                $.scope.move_task($.scope.moving_task.task, $.scope.moving_task.list, $.scope.list, $.scope.is_hovered_on_top ? $.scope.index : $.scope.index+1)

                $.scope.hovered_task = undefined
              },

              onInit: $ => {
                $.this.el.addEventListener('dragstart', (e)=>$.this.h_ondragstart(e), true)
                $.this.el.addEventListener('dragend', (e)=>$.this.h_ondragend(e), true)
                // $.this.el.addEventListener('dragenter', (e)=>$.this.h_ondragenter(e), true)
                // $.this.el.addEventListener('dragleave', (e)=>$.this.h_ondragleave(e), true)
                $.this.el.addEventListener('dragover', (e)=>$.this.h_ondragover(e), true)
                $.this.el.addEventListener('drop', (e)=>$.this.h_ondrop(e), true)
              }
            },

              // TOP GHOST MOVING EL
              cle.div({ meta: { if: f`@dragging_over && @is_hovered_on_top`},
                a_class: 'card',
                a_style: { opacity: 0.4 },
                text: f`@moving_task.task.content`
              }),

              // REAL CARD
              cle.div({
                a_class: $=>$.scope.task !== EMPTY_TASK ? 'card' : null, // $ => "card" + ($.scope.moving_task?.idx === $.scope.index ? ' dragging' : ''),
                a_style: $=>({ opacity: 1, height: $.scope.dragging ? "0px" : null, padding: $.scope.dragging ? "0px" : null, overflowY: 'hidden' }),
                text: f`@task.content`
              }),

              // BOTTOM GHOST MOVING EL
              cle.div({ meta: { if: f`@dragging_over && !@is_hovered_on_top && @isLast`},
                a_class: 'card',
                a_style: { opacity: 0.4 },
                text: f`@moving_task.task.content`
              }),


            
            )
          )
        )
      )
    )
  ))
}

const appRxJs = async ()=>{

  // // V6 =>
  // await LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/rxjs/6.6.0/rxjs.umd.min.js") 
  // V7 => 
  await LE_LoadScript("https://unpkg.com/rxjs@^7/dist/bundles/rxjs.umd.min.js")

  const $signal = new rxjs.Subject()


  const AppLogic = {
    
    let_latest_observed_val: undefined,

    onInit: $=>{
      
      $signal.asObservable().subscribe((val)=>{
        console.log("arrived:", val);
        $.this.latest_observed_val = val // there is no other way to renderize a value other than in a property. this will be renderized in a div
      })

      let counter = 0
      let interval;
      interval = setInterval(() => {
        if (counter >= 10){
          clearInterval(interval)

          $signal.next("COUNTER ENDED! " + counter)
        } else {
          $signal.next(counter++)
        }
      }, 1000);

    }

  }

  RenderApp(document.body, cle.root(AppLogic,
    
    cle.h2("Test RXJS inside CLE"),
    
    cle.div({}, 
      "Counter (deliverd by observable): ", $ => $.scope.latest_observed_val
    )
  ))
}

const appDemoDynamicDbusSignal = async ()=>{

  RenderApp(document.body, cle.root({

    onInit: $=>{

      $.dbus.newSignal("counterChanged")
      

      let counter = 0
      let interval;
      interval = setInterval(() => {
        if (counter >= 10){
          clearInterval(interval)

          $.dbus.counterChanged.emit("COUNTER ENDED! " + counter)
        } else {
          $.dbus.counterChanged.emit(counter++)
        }
      }, 1000);

    }

  },
    
    cle.h2("Test Dynamic Dbus Signal"),
    
    cle.div({
      let_latest_counter_value: undefined,

      onInit: $ => {
        $.dbus.subscribe("counterChanged", $.this, (val)=>{
          console.log("arrived:", val);
          $.this.latest_counter_value = val // there is no other way to renderize a value other than in a property. this will be renderized in a div
        })
      }
    }, 
      "Counter (deliverd by dynamic Dbus Signal): ", $ => $.scope.latest_counter_value
    )
  ))
}


const appDemoDynamicSignal = async ()=>{

  RenderApp(document.body, cle.root({

    onInit: $=>{

      $.u.newSignal("counterChanged")
      

      let counter = 0
      let interval;
      interval = setInterval(() => {
        if (counter >= 10){
          clearInterval(interval)

          $.this.counterChanged.emit("COUNTER ENDED! " + counter)
        } else {
          $.this.counterChanged.emit(counter++)
        }
      }, 1000);

    }

  },
    
    cle.h2("Test Dynamic Signal"),
    
    cle.div({
      let_latest_counter_value: undefined,

      onInit: $ => {
        $.parent.subscribe("counterChanged", $.this, (val)=>{
          console.log("arrived:", val);
          $.this.latest_counter_value = val // there is no other way to renderize a value other than in a property. this will be renderized in a div
        })
      },
      onDestroy: $ => {
        $.parent.unsubscribe("counterChanged", $.this)
      }
    }, 
      "Counter (deliverd by dynamic Signal): ", $ => $.scope.latest_counter_value
    )
  ))
}

const appDemoGetCleElByDomEl = async ()=>{

  RenderApp(document.body, cle.root({

    let_prop_to_follow: "prop1",
    let_followCostumCleCompProp: undefined,

    afterChildsInit: $=>{
      let dom_el = document.querySelector("h2")
      console.log(dom_el)

      let cle_el = $.u.getCleElementByDom(dom_el)
      console.log(cle_el)

      console.log(dom_el === cle_el.el)

      // ------- //

      console.log("list", $.u.getCleElementsByDom("h2"))//...document.querySelectorAll("h2")))

      // ------- //

      // novità getAsExternalProperty in ogni $.this per fare questo trick qui sotto e agganciarsi in modo dinamico ad OGNI prop (pasando o trovando l'el e la prop in questione..)
      let myCustomCleComponent = $.u.getCleElementByDom("myCustomCleComponent")
      let propToFollowAsProp = myCustomCleComponent.getAsExternalProperty($.this.prop_to_follow)
      $.this.followCostumCleCompProp = useExternal([propToFollowAsProp], $=>propToFollowAsProp.value)
      
      setTimeout(() => {
        myCustomCleComponent.prop1 = "100 changed!"
      }, 3000);
    }

  },
    
    cle.h2("Test Get Cle El By Dom El"),
    cle.h2("Another Test Get Cle El By Dom El"),

    cle.myCustomCleComponent({
      let_prop1: 1,
      let_prop2: 2
    },"myCustomCleComponent:", f`@prop1`, " - ", f`@prop2`),

    cle.div({}, "Followed in Root: ", f`@followCostumCleCompProp`)
    
  ))
}

const appDemoLazyRuntimeRender = async ()=>{

  await Promise.all([
    LE_LoadCss('https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic'),
    LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css'),
    LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css'),
  ])

  const RuntimeComponet = ($parent, state, {counter=0})=>{
    console.log("called lazy!")

    state.renderedTimes = state.renderedTimes === undefined ? 1 : (state.renderedTimes + 1)

    return cle.div({}, 
      cle.b({}, "Rendered Times: "+state.renderedTimes),

      cle.div({},
        (counter % 2 === 0 ? 
          cle.b({}, counter + " is even!") :
          cle.i({}, counter + " is odd!"))
      ),

      cle.br({}),

      cle.div(f`'I follow the text: ' + @text`),
    )
  }

  RenderApp(document.body, cle.root({
    id: str.app, 

    let_counter: 0,
    let_text: "",

    let_simulateCustomRemove: false
  },
    
    cle.h2("Test Runtime Lazy Component geeration"),

    cle.h5({}, "Counter: ", f`@counter`),
    cle.button({h_onclick: f`{ @counter +=1 }`}, "Inc Counter"),

    cle.div({}, "Text: ", cle.input({ha_value: Bind(f`@text`)})),

    cle.runtimeComp({

      on_scope_counterChanged: $=>{
        $.u.clearLazyRender()
        $.u.lazyRender(RuntimeComponet, pass, {counter: $.scope.counter})
      },

    }),

    cle.div({ meta: {if: f`@simulateCustomRemove`}}, 
      cle.hr(),

      cle.h4("With custom remover"),

      cle.runtimeComp({
        let_dynComponent: [],

        on_scope_counterChanged: $=>{
          
          if ($.scope.counter % 2){
            $.u.clearLazyRender($.this.dynComponent)
          }
          $.this.dynComponent = [...$.this.dynComponent, ...$.u.lazyRender(RuntimeComponet, pass, {counter: $.scope.counter})]
        },

      }),
    )
    
  ))
}

const appDemoParentChildsInteraction = async ()=>{
  // in questo modo posso ragionare a segnali e proprietà anche con gli le-for..senza sporcare i figli!

  RenderApp(document.body, cle.root({

    let_inputs: [1,2,3,4,5],

    let_inputsRefs: [],
    let_activeInputValue: undefined,
    let_setActiveInputValue: undefined,

    def_setupChildCommunication: $ => {
      $.this.inputsRefs = $.u.getCleElementsByDom("input")

      $.this.inputsRefs.forEach(ipt=>{
        ipt.subscribe("focus", $.this, (focused)=>{
          const textProp = ipt.getAsExternalProperty("text")
          $.this.activeInputValue = useExternal(textProp) // smart shortcuts! equals to: useExternal([textProp], $=>textProp.value). ancora meglio: useExternal(ipt.getAsExternalProperty("text"))
          $.this.setActiveInputValue = $=>v=>{ textProp.value = v } // solo per eivtare di salvare textProp a parte..perchè non posso fare 
        })
        ipt.subscribe("blur", $.this, (blured)=>{
          $.this.activeInputValue = undefined
        })
      })
    },

    afterChildsInit: $ => $.this.setupChildCommunication()

  },

    cle.h2("Test Get Cle El By Dom El"),

    cle.input({ meta: {forEach: "ipt", of: f`@inputs`},

      s_focus: "stream => bool",
      s_blur: "stream => bool",

      let_focused: false,

      let_text: "",
      ha_value: Bind(f`@text`),

      h_onfocus: $ => $.this.focus.emit(true),
      h_onblur: $ => $.this.blur.emit(true),
    }),

    cle.div({}, "Selected Value Text: ", f`@activeInputValue`),
    cle.button({ h_onclick: $=>{ $.scope.setActiveInputValue("")} }, "Reste Selected")
    
    
  ))
}


const appDemoSCSS = async ()=>{

  const MyComponent = cle.div({
    let_text: "original style",

    a_class: "demo-root",

    s_css: {
      
      ".demo-root": [$=>({
        width: "200px",
        height: "200px",
        backgroundColor: $.scope.darkTheme ? "black":"#cdcdcd",
        padding: "25px",
      })],

      ".my-input": [{
        color: "red",
        border: "1px solid red",
        width: "100px"
      }]

    }
  }, 
    cle.input({a_class: "my-input", ha_value: f`@text`})
  )

  const ExtendedMyComponent = Extended(MyComponent, {s_css: {".my-input": [ExtendSCSS, {color: "black", border: "none"}]}, let_text:"extended"})

  const ExtendedExtendedMyComponent = Extended(ExtendedMyComponent,{s_css: {".my-input": [ExtendSCSS, {color: "orange"}]}, let_text:"doble extended"})

  const OverwriteMyComponent = Extended(ExtendedMyComponent,{s_css: {".my-input": []}, let_text:"overwrite"}) // clear extend! (full overwite)

  const Extended$FuncMyComponent = Extended(MyComponent, {s_css: {".demo-root": [ExtendSCSS, $=>({backgroundColor: !$.scope.darkTheme ? "black" : "#cdcdcd"})]}, let_text: "original + inverted!"}) //inverted theme!


  const Nested = cle.div({ meta: { forEach: "x", of: f`@testArr`}, handle_onclick: $=>{$.scope.testArr = [1,2,3]}, // test also foreach!
    a_class: "demo-nested",

    s_css: {
      ".demo-nested": [$=>({
        width: "50px",
        height: "50px",
        backgroundColor: !$.scope.darkTheme ? "black":"#cdcdcd",
      })],
    },
  })
  const MyComponentWithNested = cle.div({ let_testArr: [1,2],
    a_class: "demo-w-nested",

    s_css: {
      ".demo-w-nested": [$=>({
        width: "100px",
        height: "100px",
        padding: "25px",
        backgroundColor: $.scope.darkTheme ? "black":"#cdcdcd",
      })],
    }
  }, 
    Nested
  )

  const RedefineNestedOnly = Extended(MyComponentWithNested, { s_css: {".demo-nested": [ExtendSCSS, { backgroundColor: "green"}]}})
  
  const RedefineNestedOnlyWithModifier = Extended(MyComponentWithNested, { s_css: {".demo-nested:hover": [ExtendSCSS, { backgroundColor: "green"}], ".demo-w-nested:hover": [ExtendSCSS, {backgroundColor: "#eeeeee"}] }})

  RenderApp(document.body, cle.root({
    let_darkTheme: false
  },
    
    cle.h2("Test SCSS"),

    cle.button({h_onclick: $=>($.scope.darkTheme = !$.scope.darkTheme)}, "change theme"), cle.br(), cle.br(),
    
    cle.input({a_class: "my-input", ha_value: "no style (is scoped!)"}), cle.br(), cle.br(),

    cle.div({a_style:"display: flex; gap: 15px"},
        

      MyComponent,

      // cle.br(),

      ExtendedMyComponent,

      // cle.br(),
      
      ExtendedExtendedMyComponent,

      // cle.br(),
      
      OverwriteMyComponent,

      // cle.br(),

      Extended$FuncMyComponent,
    ),

    cle.h2("Test SCSS Nested"),

    cle.div({a_style:"display: flex; gap: 15px"},
      MyComponentWithNested,

      RedefineNestedOnly,
      
      RedefineNestedOnlyWithModifier,
      cle.div({},"Hover me!"),
    ),

    // cle.div({meta: {forEach: "y", of: [...Array(1000).keys()]}}, MyComponentWithNested),

  ))
}


const appDemoFirebase = async ()=>{

  // Import the functions you need from the SDKs you need
  // import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries
  const { initializeApp: fb_initializeApp } = await import("https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js");
  const { getDatabase: fb_getDatabase, ref: fb_ref, get: fb_get, onValue: fb_onValue, child: fb_child, set: fb_set } = await import("https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js");

  // Your web app's Firebase configuration
  const { dbus_firebaseConfig } = await import("../../env.js")


  RenderApp(document.body, cle.root({

    props: {
      salesFilesVersion: undefined,
    },

    onInit: async $=>{

      // // Initialize Firebase
      // const fb_app = fb_initializeApp(dbus_firebaseConfig);
      // const db = fb_getDatabase(fb_app);
    
      // fb_onValue(fb_ref(db, 'projects/salesFilesVersion'), (snapshot) => {
      //   const data = snapshot.val();
      //   console.log("observer!", data)
      //   $.this.salesFilesVersion = data
      // });
    
      // fb_get(fb_child(fb_ref(db), `projects/salesFilesVersion`)).then((snapshot) => {
      //   if (snapshot.exists()) {
      //     console.log(snapshot.val());

      //     $.this.salesFilesVersion = snapshot.val()

      //     setTimeout(() => {
      //       fb_set(fb_ref(db, 'projects/salesFilesVersion'), snapshot.val()+1);
      //     }, 1000);

      //   } else {
      //     console.log("No data available");
      //   }
      // }).catch((error) => {
      //   console.error(error);
      // });

    }

  },
    
    cle.h2("Test Firebase"),

    cle.div({meta: {if:f`@salesFilesVersion !== undefined`}}, f`'value: ' + @salesFilesVersion`),
    
  ))
}


const appDemoCellSelection = async ()=>{

  RenderApp(document.body, cle.root({ 
    let_inSelection: false, 
    let_start_pointer:undefined, 
    let_end_pointer: undefined, 
    
    css: [`
      
      .unselectable {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
    `]},
      cle.div({ meta: {forEach:"cell", of: [...new Array(100).keys()], define: {index: "i"}}, 
        let_selected: $ => ($.scope.i >= $.scope.start_pointer && $.scope.i <= $.scope.end_pointer) || ($.scope.i <= $.scope.start_pointer && $.scope.i >= $.scope.end_pointer),
        a_style: $=>({display: "inline-block", width: "100px", height: "60px", border: $.this.selected ? "1px solid red" : "1px solid black", color: $.this.selected ? "red" : "black"}),
        a_class: "unselectable",
        h_onmouseup: $=>{
          console.log($.meta.cell, "up")
          $.scope.inSelection = false
          $.scope.start_pointer = undefined
          $.scope.end_pointer = undefined
        },
        h_onmousedown: $=>{
          console.log($.meta.cell, "down")
          $.scope.start_pointer = $.scope.i
          $.scope.end_pointer = $.scope.i
          $.scope.inSelection = true
        },
        h_onmouseleave: $=>{
          console.log($.meta.cell, "leave")
        },
        h_onmouseover: $=>{
          console.log($.meta.cell, "over")
          if($.scope.inSelection){
            $.scope.end_pointer = $.scope.i
          }
        }
      }, f`@cell`)
    )  
  )
}


const appDemoDefault$Scope = async ()=>{


  RenderApp(document.body, cle.root({ 
    let_inSelection: false, 
    let_start_pointer:undefined, 
    let_end_pointer: undefined, 
    
    css: [`
      
      .unselectable {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
    `]},
      cle.div({ meta: {forEach:"cell", of: [...new Array(50).keys()], define: {index: "i"}}, 
        let_selected: $ => ($.i >= $.start_pointer && $.i <= $.end_pointer) || ($.i <= $.start_pointer && $.i >= $.end_pointer),
        a_style: $=>({display: "inline-block", width: "100px", height: "60px", border: $.this.selected ? "1px solid red" : "1px solid black", color: $.this.selected ? "red" : "black"}),
        a_class: "unselectable",
        h_onmouseup: $=>{
          console.log($.cell, "up")
          $.inSelection = false
          $.start_pointer = undefined
          $.end_pointer = undefined
        },
        h_onmousedown: $=>{
          console.log($.cell, "down")
          $.start_pointer = $.i
          $.end_pointer = $.i
          $.inSelection = true
        },
        h_onmouseleave: $=>{
          console.log($.cell, "leave")
        },
        h_onmouseover: $=>{
          console.log($.cell, "over")
          if($.inSelection){
            $.end_pointer = $.i
          }
        }
      }, f`@cell`)
    )  
  )
}


const appDemoChildRefByName = async ()=>{

  RenderApp(document.body, cle.root({ 

    // must be after to subscribe without problems (signal will exists)
    afterChildsInit: $=>{
      const myInput = $.u.getSubChildRef("myInput") // ricerca verso il basso by name.. qui impossibile usare $.ref.myInput, oppure $.u.getChildsRef perchè non ho mai dichiarto un owner! (childsRef property)
      console.log(myInput, myInput.text)
      myInput.subscribe("textChanged", $.this, (t)=>{
        console.log("text changed!", t)
      })

      const myInputs = $.u.getSubChildsRef("myInputMulti", 2) // ricerca verso il basso by name.. qui impossibile usare $.ref.myInput, oppure $.u.getChildsRef come prima
      console.log(myInputs)
      myInputs.forEach(i=>{
        i.text = "Hello - rep (selected)"
      })
      myInputs.forEach((i, idx)=>i.subscribe("textChanged", $.this, (t)=>{
        console.log(idx, " - multi - text changed!", t)
      }))
    }
  },
    cle.h3("Demo Get Child By Name"),

    cle.div({
      name: "myInput",

      let_text: "Hello",

    }, cle.input({ ha_value: Bind(f`@text`) })),

    cle.hr(),

    cle.div({ meta: { forEach: "xx", of: [1,2,3]},
      name: "myInputMulti",

      let_text: "Hello - rep (ignored)",

    }, cle.input({ ha_value: Bind(f`@text`) }))

  ))

  RenderApp(document.body, cle.root({}, 
    cle.br(), cle.br(), cle.h2("Testing $.ref"))
  )


  RenderApp(document.body, cle.root({ 
    
    childsRef: {
      myInput: "single",
      myInputMulti: "multi"
    },

    afterChildsInit: $=>{
      console.log($.ref.myInput)
    }
  },
    cle.h3("Demo Get Child By Name (Using Ref)"),

    cle.div({}, 

      cle.div({
        name: "myInput",

        let_text: "Hello",

      }, cle.input({ ha_value: Bind(f`@text`) })),

      cle.hr(),

      cle.div({ meta: { forEach: "xx", of: [1,2,3]},
        name: "myInputMulti",

        let_text: "Hello - rep",

      }, cle.input({ ha_value: Bind(f`@text`) })),


      cle.hr(),
      cle.div({ meta: { forEach: "xx", of: [1,2,3]},
        name: "myInputMultiClone",

      }, cle.input({ ha_value: Bind(f`$.ref.myInput.text`) })),

      cle.div({
        let_follower: $=>$.ref.myInput.text,

        onInit: $=>{
          console.log($.ref.myInputMulti)
          setTimeout(() => {
            $.ref.myInputMulti.forEach(i=>i.text =  "Hello - rep (changed!)")
          }, 3000);
        }
      }, $=>$.this.follower, " --- ", $=>$.ref.myInput.text, cle.br())
    )

  ))
}


const appDemoCheckedDeps = async ()=>{

  const MyH3 = cle.h3({
    deps: { 
      scope: ["h3_text"] 
    }
  }, $=>$.scope.h3_text)


  // SUCCESS
  RenderApp(document.body, cle.root({ 
    let_h3_text: "Demo Checked Deps"
  },

    Use(MyH3),

    cle.div({}, "Hello World! Deps Check Passed!"),
    
    cle.br({}),
    cle.br({}),
    cle.div({}, "Checking second test..(should fail)"),
  ))

  // FAIL
  try{
    RenderApp(document.body, cle.root({},

      Use(MyH3),

      cle.div({}, "Hello World! Second Deps Check Passed!"),

    ))
  }
  catch (e){

    RenderApp(document.body, cle.root({},

      cle.div({}, "Second Deps Check FAILED!"),

    ))
    
    throw e
  }

}


const appDemoOptimizedLeFor = async ()=>{

  const APP = (elements=10, fully_optimized=false)=>RenderApp(document.body, cle.root({

    let_values: [...new Array(elements).keys()],// [1,2,3,4,5,6,7,8,9,10],

    def_swap: ($, idx)=>{
      console.log("APP: new, old", 
        [...$.values.slice(0, idx), $.values[idx+1], $.values[idx], ...$.values.slice(idx+2, $.values.length)],
        $.values
      )
      if (idx+1 <= $.values.length){
        $.values = [...$.values.slice(0, idx), $.values[idx+1], $.values[idx], ...$.values.slice(idx+2, $.values.length)]
      }
    },
    
    def_add: $=>{
      $.values = [...$.values, $.values.length]
    },
    
    def_addOnTop: $=>{
      $.values = [$.values.length, ...$.values]
    },
    
    def_removeFirst: $=>{
      let [first, ...others] = $.values
      $.values = others
    },
    
    def_removeMiddle: $=>{
      let middle = Math.round($.values.length/2)
      $.values = [...$.values.slice(0, middle), ...$.values.slice(middle+1)]
    },
    
    def_removeLast: $=>{
      let [last, ...others] = $.values.reverse()
      $.values = others.reverse()
    },

    def_changeSecond: $=>{
      $.editArrRefVal.values(v=>{ v[1] = 999 })
    },

    // onInit: $=>{
    //   setTimeout(() => {
    //     $.swap(1)
    //   }, 5000);
    // },
  
  },

    cle.h3(fully_optimized ? "CLE FULLY Optimized LeFor" : "CLE Optimized LeFor"),

    cle.button({h_onclick: $=>$.add()}, "Add"),
    cle.button({h_onclick: $=>$.addOnTop()}, "Add On Top"),
    cle.button({h_onclick: $=>$.removeFirst()}, "Remove First"),
    cle.button({h_onclick: $=>$.removeMiddle()}, "Remove Middle"),
    cle.button({h_onclick: $=>$.removeLast()}, "Remove Last"),
    cle.button({h_onclick: $=>$.changeSecond()}, "Change Second"),


    // "optimize" is the key to enable the enhancement. 
    // "idComparer" can be used to compare elments changes. 
    // standard "comparer" can be used to modify the array change detection. 
    // full_optimized: true to enable full optimization (no repaint! what has not changed)
    cle.div({meta: { forEach:"val", of: $=>$.values, define: {index: "idx"}, optimized: true, full_optimized: fully_optimized},
      h_onclick: $=> $.swap($.idx),

      createdAt: undefined,
      onInit: $ => { $.createdAt = new Date().toString()},

      onUpdate: $ => {
        console.log("UPDATE REQ", $)
      },

      on_idxChanged: ($, n, o) => console.log("idx changed!", $.val, $.idx, n,o),
      on_valChanged: ($, n, o) => console.log("val changed!", $.val, $.idx, n,o)
    },
      cle.div({}, 
        cle.span({}, "The Number Is: "), cle.span({}, $=>$.val), cle.span({}, " ------- created on: " , f`@createdAt`), 
      ) 
    ),


  ))

  APP(4, false)

  RenderApp(document.body, cle.hr())

  APP(4, true)
}


const appDemoFromHtmlTemplate = async ()=>{

  const myspan = html( /*html*/`
      <span>
        hello world
      </span>`
    )
  
  const myh3 = cle.h3({
    let_alias: "",
    on_parent_numbersChanged: $=>{
      console.log("n chan")
    }
  }, "hi baby!! ", f`@alias ? "(alias: "+@alias+")" : @alias`, " ", myspan)

  const app = html( /*html*/`
    <div class="myclass" [style]="({color: @color})" [ha-style.font-size]="@fontSize+'px'" (onclick)="@el_clicked()" signal-some_el_clicked="stream => el" >
      
      Hi <b>{{@user}}</b> (<i let-role="ADMIN">{{@role}}</i>)

      <use-myh3 set-alias="vivi"></use-myh3> <!-- passed variable. or [set-alias]="@user" for evaluable. can be also used Extended: extended-myh3></extended-myh3 -->

      <ul (onclick)="@addNum()" hook-onInit="console.log($.numbers)" (on-parent_numbers-changed)="console.log('numbers changed!', @numbers)">
        <li meta-foreach="num of @numbers" meta-define-index="idx">{{@idx+ ') '+@num}}</li>
      </ul>

      <div meta-if="@numbers.length % 2 === 0">Pari!</div>
      
      <span>test {{ {a:123} }} helloo! {} </span>
      <span>test {{ ({a:123}) }} helloo! {} </span>
      <span>test {{({a:123}).a}} helloo! {} </span>

      <div (on-some_el_clicked)="console.log('handlig a signal!', $val)" extra-defs="myDivExtraDef">from extra def</div>

    </div>`, 
    {
      // please, also if is it possible do not declare variable or signal inside template..use only to pass variable

      let_user: "vins",
      let_color: "red",
      let_numbers: [1,2,3],
      let_fontSize: 24,

      def_el_clicked: $=>{
        console.log("el clicked!")
        $.color = $.color === "red" ? "green" : "red"
        $.some_el_clicked.emit("passed val")
      },

      def_addNum($){
        $.numbers = [...$.numbers, $.numbers.length+1]
      },

      // onInit: $=>{
      //   console.log($.this, $.scope, $.numbers, $.scope.numbers)
      // },
      // afterChildsInit: $=>{
      //   console.log("after", $.u.getCleElementByDom("ul"))
      // }


    }, {myh3}, { myDivExtraDef: { style: "color: orange"} })

  console.log(app)

  // SUCCESS
  RenderApp(document.body, cle.root({},

    app,

    html( /*html*/`
      <h2>Radio Buttons</h2>

      <p>Choose your favorite Web language:</p>

      <form 
        (onchange)="{ $.dbus.radioSelected.emit(evt) }" 
        hook-onInit="{ console.log('Form Init!', $); $.u.getCleElementsByDom('input')[2].el.checked = true }"
      >
        <input type="radio" id="html" name="fav_language" value="HTML">
        <label for="html">HTML</label><br>

        <input type="radio" id="css" name="fav_language" value="CSS">
        <label for="css">CSS</label><br>

        <input type="radio" id="javascript" name="fav_language" value="JavaScript">
        <label for="javascript">JavaScript</label>
      </form> 
    `),

    { Controller: {
      
      dbus_signal_radioSelected: "stream => $event",

      on_dbus_radioSelected: ($, e)=>{
        console.log(e, e.target.value)
      },
      onInit: $=>{
        console.log("dbus", $.dbus)
      }
    }}
    
  ))

}


const appDemoCSSInJSWithCSZ = async ()=>{
  // FINAL CSS PROBLEM SOLUTION

  // use this lib. simply create at runtime css class from css strings, and reuse it in cache!
  // https://github.com/lukejacksonn/csz
  // https://rajasegar.github.io/csz-slides

  const css = (await import('https://unpkg.com/csz')).default;
  
  const globalStyle = css`
  :global(body){
    padding: 10px; margin: 0px; width: 100% 
  }
  :global(*){
    box-sizing: border-box !important;
  }
  
  `// global selector does not require to be inserted in cle etc..

  const highlightOnHover = css`&:hover{ transform: scale(1.05)}`

  // SUCCESS
  RenderApp(document.body, cle.root({},

    cle.h3({}, "Hello World from CSZ!"),
    cle.wrapper( { class: css`display: flex; justify-content: space-between; align-items: center;` +" "+ highlightOnHover},
      cle.button({}, "a standard btn"),
      cle.button({class: "waves-effect waves-light btn"}, "a standard btn (using materialize classes)"),
      cle.button({ a: {type:"button", class:"btn btn-primary"}}, "a standard btn (using bootstrap classes)"),
    ),

    cle.hr(),
    
    cle.materializecss({ class: css`https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css`, onInit: async ()=>{setTimeout(async() => {await LE_LoadScript('https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js'); window.M?.init()}, 2000); }}, cle.html({}, cle.body({}, 
      cle.h3({}, "Hello World from CSZ! (using Materialize CSS)"),
      cle.wrapper( { class: css`display: flex; justify-content: space-between; align-items: center;` +" "+ highlightOnHover},
        cle.a({ class: "waves-effect waves-light btn"}, "a materialize btn"),
        cle.a({ class: "waves-effect waves-light btn"}, "a materialize btn"),
        cle.a({ class: "waves-effect waves-light btn"}, "a materialize btn"),
      )
    ))),
    
    cle.hr(),
    // to use bootstrap 5 isolated in some component you need to attach as shadowDom
    cle.bootstrap({ class: css`https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css`  }, cle.html({}, cle.body({}, 
      cle.h3({}, "Hello World from CSZ! (using Bootstrap)"),
      cle.wrapper( { class: css`display: flex; justify-content: space-between; align-items: center;` +" "+ highlightOnHover},
        cle.button({ a: {type:"button", class:"btn btn-primary"}}, "a bootstrap btn"),
        cle.button({ a: {type:"button", class:"btn btn-primary"}}, "a bootstrap btn"),
        cle.button({ a: {type:"button", class:"btn btn-primary"}}, "a bootstrap btn"),
      )
    ))),
  ))

}

const appDemoEditRefValAndStupidShortcuts = async ()=>{

  // $.this.editRefVal.xxx(=>): utility to edit an object/reference prop without makr as changed explicitly

  // utils banale per ripetere un tag html cambiando solo il contenuto testuale.. es per fare 3 div uno dopo l'altro
  const repeat = new Proxy({}, {
    get: (_target, prop, receiver)=>{ 
      return (args_dict, ...childs)=>childs.map(c=>({[prop]:{
        ...args_dict, 
        ...(c.length ? {'':c} : {}) } 
      })) 
    },
    set: function(){}
  })
  

  // utils per scrivere con una sintassi leggera i componenti! sintassi basata su tab yaml like..vedi in seguito..
  class YAMLIZED_TAG{
    constructor(tag){ this.tag = tag}
    buildComponent(def, ...childs){
      return {[this.tag]: {
        ...(def === undefined ? {} : def), 
        ...(childs.length ? {'':childs} : {}) 
      }}
    }
  }
  // declare tag. proxy a func to have vscode highlight!
  const a = new Proxy(()=>{}, {
    get: (_, tag)=>{ 
      return new YAMLIZED_TAG(tag)
    },
    set: function() {}
  })
  // use this syntax
  const yml = (...childs)=>{
    let latestDef = undefined
    let nextMastBeDefOrChilds = false

    let finalComponents = []

    const compactLatest = (reset=false)=>{
      if (latestDef !== undefined){
        finalComponents.push(latestDef.tag.buildComponent(latestDef.def, ...latestDef.childs))
      }
      if (reset){
        latestDef = undefined
      }
    }

    for (let x of childs){
      if (x instanceof YAMLIZED_TAG){
        if (latestDef !== undefined){
          compactLatest(false)
        }
        latestDef = { tag: x, def: undefined, childs: [] }
        nextMastBeDefOrChilds = true
      }
      else if (nextMastBeDefOrChilds && latestDef !== undefined){
        if (x === pass){
          if (latestDef !== undefined){
            compactLatest(true)
          }
        }
        else if (x === none) {
          // NO OP
        }
        else if (typeof x === "function" || typeof x === "string" || Array.isArray(x) || x instanceof StandardCleComponent){
          latestDef.childs = [...latestDef.childs, ...(Array.isArray(x) ? (x.map(c=>c instanceof StandardCleComponent ? c.component : c)) : [x])]
        }
        else {
          latestDef.def = x
        }
      }
      else {
        throw Error("PARSER ERROR!!!")
      }
    }
    
    compactLatest(true)

    return finalComponents
  }
  class StandardCleComponent{ constructor(component){ this.component = component }}
  const std = (...components)=>components.map(c=>new StandardCleComponent(c))
  const _ = yml

  // VALID: Ω æ œ œ ø π å ß ƒ ª º µ
  const ƒ = _
  const µ = a 
  const ø = a
  
  

  RenderApp(document.body, cle.root({
    let_calendarEvent: {
      id: 0, dueTo: "2022-01-01", title: "Go to grocery store"
    },

    def_editTitle: $=>{
      $.this.editRefVal.calendarEvent(cv=>cv.title = cv.title !== "Go to the mall!" ?  "Go to the mall!" : "Go to grocery store")
    }
  },

    cle.h3("Demo EditRefVal"),

    cle.div({}, "ID: ", f`@calendarEvent.id`),
    cle.div({}, "Due To: ", f`@calendarEvent.dueTo`),
    cle.div({}, "Title: ", f`@calendarEvent.title`),

    cle.button({
      h_onclick: $=>$.editTitle()
    }, "Change Title"),
  
  
  
  
  
  

    // OTHER STUPID SHORTCUTS
  
    cle.hr(),
    cle.hr(),
    cle.hr(),

    cle.h3("OTHER TESTS"),


    ...repeat.div({}, 
      ["ID: ", f`@calendarEvent.id`],
      ["Due To: ", f`@calendarEvent.dueTo`],
      ["Title: ", f`@calendarEvent.title`],
    ),

    cle.hr(),



    ..._(
      a.div,
        "ID: ", f`@calendarEvent.id`,
      
      a.div, { 
        style: "color: red" 
      },
        "Due To: ", f`@calendarEvent.dueTo`, 

      a.div,
        "Title: ", f`@calendarEvent.title`,

      /* HTML TEMPLATE VERSION COMPAISON
      <div>
        ID: {{@calendarEvent.id}}
      </div>
      
      <div style="color: red">
        Due To: {{@calendarEvent.dueTo}}
      </div>

      <div>
        Title: {{@calendarEvent.title}}
      </div>
      */

      
      a.hr, //////////
      
      a.div, {
        let_prop1: 123
      },
        "Lets try nesting!",

        _(a.div, { style: "color: green" },
            "- 1) Nested! Val: ", $=>$.prop1,
            
            _( a.div, { style: "color: red" },
              "-- 1.1) Sub Nested! Val: ", f`@prop1`
             )
         ),

        _(a.div, { style: "color: green" },
          "- 2) Nested! Val: ",
          
          _( a.div, { style: "color: red" },
            "-- 2.1) Sub Nested! Val: ", f`@prop1`
           )
        ),

        std(
          cle.br(),
          cle.div("A Standard div"),
          f`@prop1`
        ),


        // MAC SHORTCUT TEST //////////

        ø.hr, 
        
        ø.div, {
          let_prop1: 123
        },
          "Lets try nesting!",

          ƒ(ø.div, { style: "color: green" },
              "- 1) Nested! Val: ", $=>$.prop1,
              
              ƒ( ø.div, { style: "color: red" },
                "-- 1.1) Sub Nested! Val: ", f`@prop1`
              )
          ),

          ƒ(ø.div, { style: "color: green" },
            "- 2) Nested! Val: ",
            
            _( ø.div, { style: "color: red" },
              "-- 2.1) Sub Nested! Val: ", f`@prop1`
            )
          ),

          std(
            cle.br(),
            cle.div("A Standard div"),
            f`@prop1`
          )
    ),
    
  ))

}


const appDemoNoMoreLetAndAsFunc = async ()=>{

  RenderApp(document.body, { div: {
    // PROP no more reuire let etc. OBIUSLY CANNOT BE A RESERVED KEYWORD
    myText: "Hello World From No More Let",

    // FUNC AS PROPERTY easy declaration! no detection available, so is not suitable to be used where it's required (rendered text, binding etc..)
    log: asFunc(($, ...what)=>{
      console.log(...what)
    }),


    '': [
      cle.h2($=>$.myText),
      
      cle.button({ handle_onclick: $ => $.log("the text is: ", $.myText) }, "Log To Console")
    ]

  }})
}




const appDemoComponentFactory = async ()=>{

  const MyComponentByFactory = ({bindedCounter, onCounterChanged, readOnlyVal, getText, setText, subElement})=>{

    return cle.myComponent({

      counter: bindedCounter, // must be a Bind
      num: readOnlyVal, // not binded..cannot be set in this component, or will be overwrite
      txt: Alias(getText, setText), // react style..

      onInit: $=>console.log("init", $.num),
      
      on_counterChanged: onCounterChanged,
      
    },

      cle.h2("This is a component by Factory"),

      cle.button({
        handle_onclick: $ => $.counter += 1,
      }, "Inc Counter: ", $=>$.counter),

      cle.div({}, "The num is: ", $=>$.num),

      cle.input({ ha_value: Bind($=>$.txt)}),

      cle.div("subel: "), 
      subElement || "",
    )
  }

  RenderApp(document.body, cle.root({
    aCounter: 10,
    aNum: 123,
    aTxt: "hi",

    aCounterClone: undefined,
    setCounterClone: asFunc(($, v)=>{
      console.log("otuput: counter changed!")
      $.aCounterClone = v
    }),

    on: { this: {
      aCounterChanged: $=>{ console.log("counter changed!", $.aCounter)},
      aNumChanged: $=>{ console.log("num changed!", $.aNum)},
      aTxtChanged: $=>{ console.log("counter changed!", $.aTxt)},
    }},

  },
    cle.h2("Hello from component factory"),

    MyComponentByFactory({
      bindedCounter: Bind('@aCounter'), 
      readOnlyVal: $=>$.aNum, 
      getText: $=>$.aTxt, 
      setText: ($, v)=>{$.aTxt=v}, 

      onCounterChanged: ($, v)=>$.setCounterClone(v), // catch output!

      subElement: { div: ["a subelement, counter clone: ", $=>($.aCounterClone || 'not-set-yet')] }
    })
  ))

}

const appDemoComponentPrivateVar = async ()=>{

  const Component = cle.div(
  { 
    // ctx id is by defult "root" for component in Use
    
    initialText: "",
    publicTextReadOnly: Alias($ => $.ctx.inputBar.text), // public! after a set by evaluable

    def: {
      getText: $ => $.ctx.inputBar.text,

      setText: ($, txt) => { $.ctx.inputBar.text = txt },

      resetText: $ => { $.ctx.inputBar.text = "" },

      setPrivateText: ($, val) => {
        $.ctx.private.privateVar = val
      }
    }
  },

    cle.Model({ ctx_id: "private", 
      let: {
        privateVar: "hello i'm private",
      }
    }),
  
    // private! unreachable text props
    cle.input({  ctx_id: "inputBar",
        let_text: $=>$.initialText,  a_value: Bind(f`@text`) // copied once, then overwritten!
    }),

    cle.div({ ctx_id: "output", }, $=>$.ctx.inputBar.text),

    cle.div({}, $=>$.ctx.private.privateVar)
  )


  RenderApp(document.body, cle.root(
  {
    childsRef: {
      component1: "single",
      component2: "single",
    },

    def: {
      getComp1PublicText: $=>{
        return "-- ref: " + $.ref.component1.publicTextReadOnly + "-- ctx: " + $.ctx.component1.publicTextReadOnly
      },
      getComp2PublicText: $=>{
        return "-- ref: " + $.ref.component2.publicTextReadOnly + "-- ctx: " + $.ctx.component2.publicTextReadOnly
      },
    }
  },

    { h1: "Hello World!" },

    "--ref: ", $=>$.ref.component1.publicTextReadOnly, // test deps following before element has been created!
    cle.br(),
    "--ctx: ", $=>$.ctx.component1.publicTextReadOnly,
    cle.br(),
    "--via func: ", $ => $.getComp1PublicText(),
    
    Use(Component, { 
      name: "component1", 
      ctx_ref_id: "component1", // refer in the parent context as
      initialText: "text 1"
    }),

    cle.button({
      handle_onclick: $ => { $.ctx.component1.setPrivateText("Changed with a public (controlled) method")}
    }, "Edit Private Comp1 Var"),
    
    
    
    cle.hr(),

    "--ref: ", $=>$.ref.component2.publicTextReadOnly,
    cle.br(),
    "--ctx: ", $=>$.ctx.component2.publicTextReadOnly,
    cle.br(),
    "--via func: ", $ => $.getComp2PublicText(),
    
    Use(Component, { 
      name: "component2", 
      ctx_ref_id: "component2", // refer in the parent context as
      initialText: "text 2"
    }),

    cle.button({
      handle_onclick: $ => { $.ctx.component2.setPrivateText("Changed with a public (controlled) method")}
    }, "Edit Private Comp1 Var"),


  ))
}


const appDemoProducerConsumerSync = async ()=>{

  const GlobalDbus = { Controller: {
    dbus_signals: {
      newNumInput: "stream => num"
    }
  }}

  const ProducerStyle = { display: "inline-block", border: "1px solid black", width: "200px", height: "200px", backgroundColor: "red"}
  const ConsumerStyle = { display: "inline-block", border: "1px solid black", width: "100px", height: "100px", backgroundColor: "green"}
  
  const Producer = { Producer: {
    num: 0,
    responses: [],

    h_onclick: $ => {
      $.num += 1
      const responses = $.dbus.newNumInput.emitWaitResp($.num)
      $.responses = responses
    },

    h_oncontextmenu: ($, e) => {
      e.preventDefault();

      $.num += 1
      const {consumer, response} = $.dbus.newNumInput.emitWaitFirstToResp($.num) // there is also emitWaitRespContidion..
      console.log(consumer, response)
      $.responses = response

      return false
    },

    text: ["Producer, Num: ", $ => $.num, " -> Res: ", $ => $.responses],

    style: ProducerStyle
  }}

  const Consumer = { Consumer: {
    
    consumerId: 0,
    latestNum: 0,
    latestResp: 0,

    on_dbus_newNumInput: ($, num) => {

      let resp = num * $.consumerId
      $.latestNum = num
      $.latestResp = resp
      return resp
    },

    text: ["Consumer  ", $=>$.consumerId, ", Num: ", $ => $.latestNum, " -> Res: ", $ => $.latestResp],

    style: ConsumerStyle
  }}

  
  RenderApp(document.body, cle.root({},

    cle.div({}, "Cle Producer Consumer"),

    Use(GlobalDbus),

    Use(Producer),
    
    Use(Consumer, { meta: {forEach: "cons", of: $ => [1,2,3,4,5]}, consumerId: $ => $.meta.cons}),

    Use(Consumer, { 
      consumerId: 10, 

      // TESTING OUT OF SCOPE STUFF
      oos: {
        outOfScopeStuff: [123],
        func: ()=>console.log("aaa")
      },
      h_onclick: $ => {
        console.log($.oos.outOfScopeStuff, $.oos.func())
        $.oos.outOfScopeStuff[0] += 1
      },
    })
  ))

}



const appDemoExplodeProps = async ()=>{
  
  console.log(DefineSubprops("todo => desc, done"))

  RenderApp(document.body, cle.div({

    todo: {desc: "a todo", done: false, dueto: "never"},

  },
    cle.div({
      ...DefineSubprops("todo => desc, done"),

      on_descChanged: ()=>console.log("la desc è changed"),
      on_doneChanged: ()=>console.log("la done è changed")
    }, 
      cle.h2({
        h_onclick: $ => { $.desc = "desc changed!" },
      }, f`@desc + ' - ' + (new Date()).getTime()`),
      cle.h4({
        h_onclick: $ => { $.done = !$.done },
      }, f`@done + ' - ' + (new Date()).getTime()`),
    )

  ))

  RenderApp(document.body, cle.hr())

  const genTodo = ()=>({desc: "a todo", done: false, dueto: "never"})

  RenderApp(document.body, cle.div({

    todos: [genTodo(), genTodo()],

  },

    cle.div({ meta: { forEach: "todo", of: f`@todos`, optimized: true }
    ,
      ...DefineSubprops("todo => desc, done"),

      on_descChanged: ()=>console.log("la desc è changed"),
      on_doneChanged: ()=>console.log("la done è changed")
    }, 
      cle.h2({
        h_onclick: $ => { $.desc = "desc changed!" },
      }, f`@desc + ' - ' + (new Date()).getTime()`),
      cle.h4({
        h_onclick: $ => { $.done = !$.done },
      }, f`@done + ' - ' + (new Date()).getTime()`),
    )

  ))

}



const appDemoFromHtmlTemplateViaExternalFile = async ()=>{
  // Lib
  // await Promise.all([LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js")])
  // const htmlRef = async (fileName, ...args) => { let txt = (await axios.get(fileName)).data; return html(txt, ...args)}
  
  const htmlRef = async (fileName, ...args) => { 
    try{
      let res = await fetch(fileName);
      if (!res.ok){
        console.log(res)
        throw new Error("HTML REF ERROR")
      }
      let txt = await res.text()
      return html(txt, ...args)
    }
    catch (e){
      throw new Error("HTML REF ERROR: " + e)
    }
  }

  const HtmlRefComponent = (fileName, ...args)=>({ lazy: {
    onInit: $ => {
      setTimeout(async () => {
        let def = await htmlRef(fileName, ...args)
        $.u.newConnectedSubRenderer(pass, def)
      }, 1);
    }
  }});

  // Components
  
  const myh3 = cle.h3({
    let_alias: "",

    on_parent_numbersChanged: $=>{
      console.log("n chan")
    }
  }, 
    "hi baby!! ", f`@alias ? "(alias: " + @alias + ")" : @alias`, " ",  html(`<span> hello world </span>`)
  )

  const MiscComponent = await htmlRef("./angular-style/misc.html", {
    // please, also if is it possible do not declare variable or signal inside template..use only to pass variable

    let_user: "vins",
    let_color: "red",
    let_numbers: [1,2,3],
    let_fontSize: 24,

    def_el_clicked: $=>{
      console.log("el clicked!")
      $.color = $.color === "red" ? "green" : "red"
      $.some_el_clicked.emit("passed val")
    },

    def_addNum($){
      $.numbers = [...$.numbers, $.numbers.length+1]
    },

  }, 
  {myh3}, 
  { myDivExtraDef: { style: "color: orange"} }
  )

  const MyFormComponent = await htmlRef("./angular-style/form.html")


  const AppController = { Controller: {
      
    dbus_signal_radioSelected: "stream => $event",

    on_dbus_radioSelected: ($, e)=>{
      console.log(e, e.target.value)
    },
    onInit: $=>{
      console.log("dbus", $.dbus)
    }
  }}


  // SUCCESS
  RenderApp(document.body, cle.root({},
    
    MiscComponent,
    
    AppController,
    
    MyFormComponent,

    cle.hr(),

    HtmlRefComponent("./angular-style/form.html")
    
  ))

}


const appDemoLazyComponent = async ()=>{

  const InputOrTextArea = async ($, {componentNum=0, text=()=>""}={}) => {
    
    await wait(2000);

    // todo: support meta etc (in general the bug is that connected subrender does not use standard factory..)
    const Input = { input: { meta: {forEach: "ipt", of: $=>[1,2,3]}, 
      a_value: Bind(text)
    }}

    const TextArea = { textarea: { meta: { if: $=>false},//forEach: "ipt", of: $=>[1,2,3]},
      ha_value: Bind(text),
      style: "color: red"
    }}

    return componentNum === 1 ? 
      ($.component1Type === 'input' ? Input : TextArea) : 
      ($.component2Type === 'textarea' ? TextArea : Input)

  }

  const wait = (msec) => new Promise((resolve, _) => {
    setTimeout(resolve, msec);
  });

  
  const LazyItem = async ($, {counterValue}, lastRenderized)=>{
    
    await $.u.propCondition($=>$.parent, "counter", v=>v>=counterValue && v<=counterValue*2)

    return cle.div({},
      cle.div({}, f`'Counter at lazy: ' + @counter`),
      cle.h3({}, "The Counter finally visible: "+counterValue+"!")
    )
  }

  const LazyItemWrapper = cle.div({
    counter: 0,
  },
    cle.div(f`'Counter: ' + @counter`),
    cle.button({handle_onclick: f`{ @counter += 1 }`}, "Inc Counter"),

    LazyComponent(LazyItem, {counterValue: 5}, {}, $=>$.counter, (n,o)=>n < 5 || n > 10)
  )


  // SUCCESS
  RenderApp(document.body, cle.root({

    component1Type: "input",
    component2Type: "textarea",

    let_text: "Helo World!"

  },

    { h2: "Simulate loading in 2 sec.."},

    LazyComponent(InputOrTextArea, {componentNum: 1, text: $ => $.text}),

    LazyComponent(InputOrTextArea, {componentNum: 2, text: $ => $.text}),

    LazyItemWrapper

  ))

}


const appDemoWaitSignalAndPropCondition = async ()=>{

  const Timer = { Model: {
    interval: 1000,
    running: false,
    repeat: true,
    trigerOnStart: false,

    last_execution: undefined,
    num_execution: 0,

    signals: {
      trigger: "stream => void",
    },

    oos: $ => ({ private: undefined }),

    def:{

      _private: { setupPrivateModel($, pr){ $.oos.private = pr } },
      
      start($){
        $.oos.private.start()
      },

      stop($){
        $.oos.private.start()
      }
    },

    '': cle.Model({ // name: "private",

      setIntervalOrTimeout: $ => $.repeat ? (...args)=>setInterval(...args) : (...args)=>setTimeout(...args),
      clearIntervalOrTimeout: $ => $.repeat ? (...args)=>clearInterval(...args) : (...args)=>clearTimeout(...args),
      
      onInit: $ => { 
        console.log("AAAAAAA", $.setIntervalOrTimeout, $.clearIntervalOrTimeout)
        $._private.setupPrivateModel($.this);
        
        $.running && $.start();
      },

      on_runningChanged: ($, running, oldRunning) => {
        if (running !== oldRunning){
          running ? $.start() : $.stop()
        }
      },
      on_repeatChanged: ($, repeat) => { $.stop(); $.start(); },

      oos: $=>({ // declare as a function to have a personal obj per-instance, otherwhise it will be shared between all instances!
        interval_handler: undefined
      }),

      def: {

        triggerSignal($){
          $.last_execution = new Date()
          $.num_execution = $.num_execution +1
          $.trigger.emitLazy(0)
          
          if (!$.repeat) { $.stop() }
        },

        start($){
          $.num_execution = 0

          $.clearIntervalOrTimeout($.oos.interval_handler)

          $.trigerOnStart && $.triggerSignal();

          $.oos.interval_handler = $.setIntervalOrTimeout($.triggerSignal, $.interval);
        },

        stop($){
          $.clearIntervalOrTimeout($.oos.interval_handler)
          $.oos.interval_handler = undefined
        }
      }

    }),

  }}

  RenderApp(document.body, cle.root({
    
  },

    Use(Timer, {ctx_ref_id: "secTimer", interval: 1000, running: true, trigerOnStart: true, on_trigger: $ => {
      console.log("1sec Trigger!")
    }}),

    cle.h2({
      date: "-",
      on:{ ctx:{ secTimer:{ trigger: $ => { $.date = new Date().toString() }}}},
    }, 'Date: ', f`@date`),
    cle.h4("Synced once a second. (last execution: ", f`$.ctx.secTimer.last_execution`, ")"),


    cle.hr({}),


    Use(Timer, {ctx_ref_id: "fiveSecTimer", interval: 5000, running: true, trigerOnStart: true, on_trigger: $ => {
      console.log("5sec Trigger!")
    }}),

    cle.h2({
      date: "-",
      on:{ ctx:{ fiveSecTimer:{ trigger: $ => { $.date = new Date().toString() }}}},
    }, 'Date: ', f`@date`),
    cle.h4("Synced once every 5 seconds. (last execution: ", f`$.ctx.fiveSecTimer.last_execution`, ")"),

    cle.button({
      color: "black",
      inWaiting: false,

      style: f`({ color: @color })`,

      // OR onclick_event
      onclick: async $ => {
        $.inWaiting = true
        console.log("waiting next 5sec clock to change color..")
        await $.u.signalFired($=>$.ctx.fiveSecTimer, "trigger")
        console.log("changinc color now!")
        $.color = $.color === "black" ? "red" : "black"
        $.inWaiting = false
      }
    }, "hi, if you click me i will change the color once the timer has been triggered. ", cle.span({meta: {if: f`@inWaiting`}}, "In Waiting.."))

  ))

}


const appDemoSubChildsInUseAndHandleChildsBeforeInit = async ()=>{

  const InjectableListStdComponent = cle.ol({
                
    beforeInit:  def  => {

      console.log("before init!", def)
      
      def.childs = def.childs.map(el=>{
        if (typeof el === "string" && el==="sublist") {
          return cle.ol({}, cle.li({}, "sublist"))
        } 
        else if (typeof el === "object" && el.type==='red-content'){
          return cle.li({style: "color: red"}, "Red Content")
        }
        return el
      })

      console.log("after 'before init' transformation!", def)

      return def
    }
  },
    
    { li: "Initial 'Standard' Item, from JS" },

  )
  
  RenderApp(document.body, cle.root({},

    await fromHtmlComponentDef( /*html*/`
      <script>
      
        const { cle } = Cle;

        return [ {}, 
          { deps: { 

            injectableList: cle.ol({ // recreated here
              
              beforeInit:  def  => {

                console.log("before init!", def)
                
                def.childs = def.childs.map(el=>{
                  if (typeof el === "string" && el==="sublist") {
                    return cle.ol({}, cle.li({}, "sublist"))
                  } 
                  else if (typeof el === "object" && el.type==='red-content'){
                    return cle.li({style: "color: red"}, "Red Content")
                  }
                  return el
                })

                console.log("after 'before init' transformation!", def)

                return def
              }
            }, 
              { li: { text: "Initial 'Standard' Item, from JS"} },
            ),
          }}
        ];
      </script>

      <view>
        <h3> Hi Developer </h3>

        <hr/>

        <!-- use with childs injection! -->
        <use-injectableList> 
          <li>Hi to all!</li>
          <li>Insert How Many Childs You Whant!</li>

          <js-val>({ li: { onclick: $=>{$.el.style.color = 'blue', text: "Or do in cle-in-js way from HTML" } } })</js-val>
          <!-- JS-VAL its'a function like with 4 args: (Cle, params, state, DepsInj, u) => ...  -->
          <js-val>Cle.cle.li({ onclick: $=>{$.el.style.color = 'blue'}, "Or do in cle-in-js way from HTML" )</js-val>
          
          <!-- handled and convertedby beforeInit handler -->
          <js-val>"sublist"</js-val>
          <js-val>({type: "red-content"})</js-val>
        </use-injectableList>

      </view>
    `),

    cle.hr(),
    cle.hr(),

    { h3: 'Hi Developer' },
    
    cle.hr(),

    Use(InjectableListStdComponent, pass, pass, [ // childs injection
      { li: "Hi to all!" },
      { li: "Insert How Many Childs You Whant!" },
      { li: { text: "Or do in cle-in-js way from HTML", onclick: $=>{$.el.style.color = 'blue'} } },
      
      // handled and convertedby beforeInit handler
      "sublist",
      {type: "red-content"}
    ]),

  ))
}


const appDemoShadowRoot = async ()=>{

  await Promise.all([
    LE_LoadCss("https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic"),
    LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css"),
    LE_LoadCss("https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css"),
  ])
  
  RenderApp(document.body, cle.root({
    prop1: 123,
    showShadow: true,
  },

    cle.style({}, `
      body{padding: 25px; height: 100%; width: 100%;}
      h3{font-size: 2rem}
    `),

    cle.h3({}, "Hi From External!", f`@prop1`),


    UseShadow(cle.div({ 
      onDestroy: $ => console.log("destroy"),

      style: "border: 1px solid gray; padding: 25px; margin: 25px; font-family: unset"
    }, 

      cle.style({}, `
        h3{color: green}
      `),

      cle.h3({}, "Hi From Internal! ", f`@prop1`, " (Shadow)"),
      
      cle.button({onclick: $ => $.showShadow = !$.showShadow}, 'Change From Internal')
      
    ),{meta: {if: $ => $.showShadow}}),

    cle.button({onclick: $ => $.showShadow = !$.showShadow}, 'Change From External'),

    cle.hr(),

    cle.h4("At the end of the day all except font-face should works!")
  ))
}



const appDemoHeavyPropertyFuncEvalOptimization = async ()=>{

  RenderApp(document.body, cle.root({
    array: [...new Array(100000).keys()],
    partition_num_up:1.5,
    partition_num_down:2,
    filtered: $ => $.array.filter(v => v >= $.array.length/$.partition_num_down && v <= $.array.length/$.partition_num_up),
    
  },
    cle.button({onclick: $=>{
      let oj_val = $.array.length
      let start = new Date().getTime()
      let val = $.filtered.length
      let end = new Date().getTime()
      console.log(oj_val, val, start, end, " -> ", end-start)
    }}, "Get Data"),

    cle.button({onclick: $=>{
      CLE_FLAGS.PROPERTY_OPTIMIZATION = !CLE_FLAGS.PROPERTY_OPTIMIZATION
      $.filtered = $ => $.array.filter(v => v >= $.array.length/$.partition_num_down && v <= $.array.length/$.partition_num_up) // reset to change mode
    }}, "Changemode"),

    cle.button({onclick: $=>{
      $.array = [...new Array($.array.length*10).keys()]
    }}, "Edit data"),

    cle.button({onclick: $=>{
      $.partition_num_down = $.partition_num_down+0.1
      $.partition_num_up = $.partition_num_up-0.1
    }}, $=>"Edit limits ["+$.partition_num_up+","+$.partition_num_down+"]")
  ))
}



const appDemoFixStyleWithHAStyleProp = ()=>{

  RenderApp(document.body, cle.root({
    
    condition2: true,
  },

      cle.div({ meta: {forEach: "q", of: [1,2]},

      condition: true,

      a_style: $ => ( 
        $.condition === true ? 
        {
          background: "green",
          color: "white"
        } : {
          background: "red",
          color: "white"
        }
      ),

      "ha.style.width": "200px",
      "ha.style.height": "200px",

      "ha.style.border": $ => ($.condition ? 5 : 10 ) + "px solid black",
      "ha.style.padding": $ => $.condition ? "25px" : "0px",

      onclick: $=>{
        $.condition = !$.condition
      }

    }, "I'm a rectangle! Click to change condition"),

    cle.br({}),

    cle.div({ meta: {if: f`@condition2`,},


      a_style: $ => ( 
        $.condition2 === true ? 
        {
          background: "green",
          color: "white"
        } : {
          background: "red",
          color: "white"
        }
      ),

      "ha.style.width": "200px",
      "ha.style.height": "200px",

      "ha.style.border": $ => ($.condition2 ? 5 : 10 ) + "px solid black",
      "ha.style.padding": $ => $.condition2 ? "25px" : "0px",

    }, "I'm a rectangle 2!"),

    cle.button({ onclick: $=>{
      $.condition2 = !$.condition2
    }}, "Change condition2")

  ))
}



const appDemoDirectivesSystem = ()=>{

const colorOnHover = ({preferredColor='orange'})=>({ dir_colorOnHover: {

  onInit: $ => {

    let colors = [preferredColor, 'gray']

    const count = ExternalProp(0)

    count.addOnChangedHandler($.this, (...args)=>{
      console.log("directives: count changed!!", count.value, args)
    })

    let oj_color = $.el.style.color
    let onMouseEnter = (e)=>{
      oj_color = $.el.style.color
      $.el.style.color = colors[count.value%2]
    }
    let onMouseLeave = (e)=>{
      $.el.style.color = oj_color
      count.value += 1
    }

    $.this.el.addEventListener("mouseenter", onMouseEnter)
    $.this.el.addEventListener("mouseleave", onMouseLeave)

    // REMOVER
    return ()=>{
      console.log("dirctive: ret destroy")
      $.this.el.removeEventListener("mouseenter", onMouseEnter)
      $.this.el.removeEventListener("mouseleave", onMouseLeave)
      count.destroy(true)
    }
  },

  onDestroy($){
    console.log("dirctive: ondestroy")
  }
}})

// more configurable & multi-use!
const colorOnHoverV2 = ({preferredColor='orange', kind="color"})=>({ ['dir_colorOnHover'+kind]: {  // multi-use directive ready
  
  onInit: $ => {

    let colors = [preferredColor, 'gray']

    const count = ExternalProp(0)

    count.addOnChangedHandler($.this, (...args)=>{
      console.log("directives: count changed!!", count.value, args)
    })

    let oj_color = $.el.style[kind]
    let onMouseEnter = (e)=>{
      oj_color = $.el.style[kind]
      $.el.style[kind] = colors[count.value%2]
    }
    let onMouseLeave = (e)=>{
      $.el.style[kind] = oj_color
      count.value += 1
    }

    $.this.el.addEventListener("mouseenter", onMouseEnter)
    $.this.el.addEventListener("mouseleave", onMouseLeave)

    // REMOVER
    return ()=>{
      console.log("dirctive: ret destroy")
      $.this.el.removeEventListener("mouseenter", onMouseEnter)
      $.this.el.removeEventListener("mouseleave", onMouseLeave)
      count.destroy(true)
    }
  },

  onDestroy($){
    console.log("dirctive: ondestroy")
  }
}})

// example of how to declare variable and signals..
const logPropChanges = ({prop, scope="$.scope"})=>{
  return {
    // use standard injection in component definition!
    // declare a variable
    ['__logPropChanges__followed_prop__'+prop]: undefined, // f(scope+"."+prop, true)

    // declare a signal handling
    ['on_this_'+'__logPropChanges__followed_prop__'+prop+"Changed"]: ($, v, o) => {
      console.log("the followed prop changed!!", v, o)
    },

    
    // standard directives def
    ['dir_logPropChanges'+prop]: { // multi-use directive ready
      onInit: $=>{
        console.log("logPropChanges active on prop:", prop, "i will log this prop changes")
        $['__logPropChanges__followed_prop__'+prop] = f(scope+"."+prop, true)
      }
    }
  }
}

console.log(logPropChanges({prop: "condition"}))

RenderApp(document.body, cle.root({ vals: [1,2] },

  cle.div({ meta: {forEach: "q", of: f`@vals`},

    condition: true,

    style: $ => ( 
      $.condition === true ? 
      {
        background: "green",
        color: "white"
      } : {
        background: "red",
        color: "white"
      }
    ),

    "ha.style.width": "200px",
    "ha.style.height": "200px",

    "ha.style.border": $ => ($.condition ? 5 : 10 ) + "px solid black",
    "ha.style.padding": $ => $.condition ? "25px" : "0px",

    onclick: $=>{
      $.condition = !$.condition
    },

    ...colorOnHoverV2({preferredColor: 'red', kind: 'color'}),
    ...colorOnHoverV2({preferredColor: 'blue', kind: 'background'}),

    ...logPropChanges({prop: "condition", scope: "$.this"})

  }, "I'm a rectangle! Click to change condition"),

  cle.button({ onclick: f`{ @vals = [...@vals, 1] }`, text: "+", style: "width: 200px; height: 80px"}),
  cle.button({ onclick: f`{ @vals = @vals.filter((_,i)=>i<@vals.length-1) }`, text: "-", style: "width: 200px; height: 80px"}),

))
}


const appDemoModelInExternalVar = ()=>{

  RenderApp(document.body, cle.root({ 
    vals: [1,2] 
  }, 
    cle.h2("Hello"),

    (()=>{
      let $;

      return { div: { onInit: model=>{ $ = model},

        varabile: 123,
        doubleVar: ()=>$.varabile*2,

        afterInit(){
          console.log("afterInit: ", $, $.varabile)
        },

        text: ["hello", " - ", ()=>$.varabile, " - ", ()=>$.doubleVar]
      }}

    })()
  ))
}


const appDemoProtocols = ()=>{

  const Client1 = cle.div({

    response: "",

    def_start_hello_protocol: async ($)=>{
      let final_resp = await $.exec_protocol("com.server1/hello", $.this, [

        // obj mode
        { op: ({send, cancel}, {msg}={}) => { 
          console.log("CLIENT: i will send msg", "hello"); 
          send({msg: "hello"}) 
          // cancel()
        }},

        // or use array notation
        [({send, cancel}, {msg}={}) => { 
            console.log("CLIENT: received", "client review", msg); 
            send({msg: "review " + msg})
        }, undefined, undefined, {sig: PROTOCOL.THEN.REPEAT_ALL, options: {max_times: 2}}]

      ], undefined);

      // let response = await final_resp.response
      let response = final_resp

      console.log("final resp: ", response)
      
      $.response = response.msg
    }

  }, 
    cle.div("Resp: ", $=>$.response),

    cle.button({
      onclick: async $ => await $.start_hello_protocol()
    }, "Start")
  )

  const Server1 = cle.div({

    ...defineProtocols(()=>({

      "com.server1/hello": new ServerProtocol([ 

        [({send, cancel}, {msg}={})=>{ 

            console.log("SERVER: msg is", msg); 

            setTimeout(() => {
              send({msg: "hi"}) 
            }, 1000);
        }]

      ])
    }))
  })

  RenderApp(document.body, App({

      // class: css(``)
      ...useProtocols

    }, 
      H2("HI, test the app with the button above"),

      /////////////////
      Server1,
      Client1,
      /////////////////

  ))
}


const appDemoAvoidLambdaForComponentPropertySetupAndInputProps = ()=>{ // pure react style (with the declarative limits..)
  // new: use input to avoid scope problem while passing parent to child props, in order to enable react functional component style

  const SquareLabel = ({currentSize}) => cle.div({'ha.style.fontWeight': 600}, currentSize)

  const SizeLabel = ({size}) => (
    cle.div({ '@input': {size} }, 
      get.size
    )
  )

  const Square = ({size=10, setSize, color='red', useBind=false, inject}) => {

    return cle.div({

      '@input': {size, setSize}, // new! use @input to declare local variable as given by "parent". this will change the internal resolution, and resolving with the parent point of view. this resolve the "same name var" passing problem of the pure scope approach while using components

      style: $ => ({
        width: $.size+'px',
        height: $.size+'px',
        background: color,
        color: "black"
      }),
      // or use by ref but declare deps with comments trick // style: $ => ({ /* deps: $.size */ width: size($)+'px' }),

      ...(useBind ? {
        handle_onclick: $ => { $.size = ($.size*2) } // for binded value we can use directly the variable! (it will act as an alias)
      } : {
        handle_onclick: $ => $.setSize($.size*2)
      } )
    },
      cle.div({}, get.size),
      SquareLabel({currentSize: get.size}),
      SizeLabel({size: self.scope.get.size}), // no problem to pass same name using scope!
      inject ?? ''
    )
  }

  const ResetButton = ({reset, text}) => (
    
    cle.button({
      '@input': {reset, text},

      onclick: $=>{
        console.log("RESET", $.reset);
        $.reset()
      }
    },
      get.text
    )
  )

  RenderApp(document.body, cle.root({ 
    squareSize: 100,

    def: {
      resetSquareSize: $ => {
        $.squareSize=100
      }
    }
  }, 
    cle.h2("Hello"),

    ResetButton({reset: fun.resetSquareSize, text: 'Reset'}),

    Square({size: get.squareSize,      setSize: set.squareSize,    useBind: false}),
    Square({size: Bind("@squareSize"), setSize: set.squareSize,    useBind: true, color: 'green'}),
    Square({size: self.get.squareSize, setSize: set.squareSize,    useBind: false}),
    Square({size: T.get.squareSize,    setSize: set.squareSize,    useBind: false, color: 'green'}),
    Square({size: Bind("@squareSize"), setSize: set.squareSize,    useBind: true, inject: {span: 'hi'}}),

  ))
}


const appDemoSupportSvg = ()=>{ 
  // Create an element within the svg - namespace (NS) 

  RenderApp(document.body, cle.root({ 
    radius: 40,

    items: [
      {type: 'circle', x: 100, y: 100},
      {type: 'circle', x: 200, y: 200},
      {type: 'rect',   x: 300, y: 300, w: 50, h: 50},
      {type: 'line',   x1: 400, y1: 400, x2: 500, y2: 500, },
    ]
  }, 
    cle.h2("Hello"),

    svg.component({
      counter: 1,
      attrs: {
        width:"100%", 
        height: "700"
      } 
    },

      svg.circle({
        attrs: {
          cx: $=>$.counter*50, 
          cy: 50, 
          r: $=>$.radius+($.counter**2), 
          stroke: "green", 
          strokeWidth: 10, 
          fill: "white" 
        }, 
        onclick: $=>$.counter+=1
      }),

      svg.g({ meta: {forEach: 'item', of: f`@items`}, attrs: {
        stroke: "green", 
        strokeWidth: 10, 
        fill: "white" 
      }},

        svg.circle({ meta: {if: f`@item.type === 'circle'`}, attrs: {
          cx: f`@item.x`,
          cy: f`@item.y`,
          r: f`@radius`
        }}),

        svg.rect({ meta: {if: f`@item.type === 'rect'`}, attrs: {
          x: f`@item.x`,
          y: f`@item.y`,
          width: f`@item.w`,
          height: f`@item.h`,
        }}),

        svg.line({ meta: {if: f`@item.type === 'line'`}, attrs: {
          x1: f`@item.x1`,
          y1: f`@item.y1`,
          x2: f`@item.x2`,
          y2: f`@item.y2`,
        }}),
      )
    ),
  ))
}


const appDemoAutoFVarDefAndText = ()=>{ 

  CLE_FLAGS.AUTO_SMARTFUNC_ENABLED = true

  RenderApp(document.body, cle.root({ 
    id: 'app',

    let_counter: 0,
    
    f_let_doubleCounter: '@counter * 2',

    f_def_incCounter: '@counter += $arg',

    f_onInit: "{ console.log('init!', @counter) }"
  }, 
    Service({
      f_on_counterChanged: '{ console.log("counter changed!", @counter, oldVal, newVal) }',
      f_on_le_app_counterChanged: '{ console.log("app counter changed!", @counter, oldVal, newVal) }'
    }),

    cle.h2({
      f_attr_style: '"font-weight: " + Math.min(900, (100 * (@counter+1)))',
    }, "Hello"),

    cle.h2({
      'f_hattr_style.fontWeight': 'Math.min(900, (100 * (@counter+1)))',
    }, "Hello"),

    cle.div({}, 'The Counter is:', f`@counter`),
    cle.div({}, 'The Double Counter is:', f`@doubleCounter`),
    cle.div({}, 'The Double Counter is:', {f_text: '@doubleCounter'}),
    cle.div({}, 'The 4x Counter is:', {f_text: '@doubleCounter*2'}),
    
    Button({onclick: $ => $.incCounter(1)}, 'Inc Counter'),
    Button({f_handle_onclick: '{ console.log($arg); @incCounter(1) }'}, 'Inc Counter'),

    cle.div("f-for"),
    cle.div({meta: {forEach: "item", f_of: "[1,2,3, @counter]"}}, {f_text: "' - '+ @item"}),
    cle.div({meta: {f_if: "@counter % 2 === 0"}}, 'f_if: [if even] - The Counter is:', f`@counter`),

  ))
}


const appDemoPureFunctionalWithExt = ()=>{ 

  const FULL_EXAMPLE = false

  if (FULL_EXAMPLE){

    /**
     * @param {{ addTodo: (text: string)=>void }} param0 
     * @returns 
     */
    const InputBar = ({addTodo}) => {

      const text = useState('Placeholder..')

      return (
        cle.div({ style: "display: flex; "},
          cle.input({
            // option 1) local var + double Bind:    local_input: Bind(text), a_value: Bind($=>$.local_input),
            // option 2) std attrs (buggy): a_value: text.use(),
            // option 3) ha attrs
            ha_value: text.use(),
            handle_oninput: ($, ev) => text.value = ev.target.value 
          }),
          cle.button({ handle_onclick: $ => {
            addTodo(text.value);
            text.value = ''
          }}, 'Add')
        )
      )
    }

    /**
     * @param {{todolist: Property, toggleTodoCompletion: (id: string)=>void, removeTodo: (id: string)=>void}} param0 
     * @returns 
     */
    const ToDoList = ({todolist, toggleTodoCompletion, removeTodo}) => {

      return (
        cle.div({},
          cle.div({ meta: { forEach: "todo", of: todolist.use(), optimized: true, idComparer: (a,b)=>a.id !== b.id}, style: "display: flex; gap: 4px" },
            cle.input({ 
              hattrs: { type: "checkbox", checked: $ => $.todo.done }, 
              handle: { onchange: $ => toggleTodoCompletion($.todo.id) } 
            }),
            cle.span({}, $ => $.todo.text),
            cle.button({ handle: { onclick: $ => removeTodo($.todo.id)  } }, 'x')
          )
        )
      )
    }

    const App = () => {

      const idgen = useState(0)

      const todolist = useState([
        { id: idgen.value++, text: 'todo 1', done: false }
      ])

      const addTodo = (text) => {
        todolist.value = [...todolist.value, {id: idgen.value++, text, done: false}]
      }

      const removeTodo = (id) => {
        todolist.value = todolist.value.filter(t => t.id !== id)
      }

      const toggleTodoCompletion = (id) => {
        const todo = todolist.value.find(t => t.id === id)
        todo.done = !todo.done
        // todolist.value = [...todolist.value]
        todolist.markAsChanged()
      }
      

      return (
        cle.root({},
          InputBar({addTodo}),
          ToDoList({todolist, toggleTodoCompletion, removeTodo})
        )
      )
    }

    RenderApp(document.body, App())
  }
  else {

    const InternalPropBanner = ({internal_prop_asExt}) => {
      return (
        cle.h3({
          style: 'cursor: pointer',
          onclick: $ => internal_prop_asExt.value.set(internal_prop_asExt.value.get + 1)
        }, "Internal Prop: ", internal_prop_asExt.use((_, v) => v.get))
      )
    }

    const Button = ({onClick, label}) => {

      return { button: {
        onclick: $ => onClick(),
        text: label
      }}

    }


    const App = () =>{

      const counter = useState(0, $ => {
        console.log("counter changed!")
      })

      const incCounter = () => {
        counter.value += 1
      }

      const internal_prop_asExt = useState({get, set}) // uso unica var con dentro getter e setter

      return cle.root({
        counter_alias: useExternal(counter, $=>counter.value, ($,v)=>counter.value=v),
        // or simply use bind!
        counter_alias2: Bind(counter),

        on_counter_aliasChanged: $ => console.log("counter alias changed event"),
        on_counter_alias2Changed: $ => console.log("counter alias 2 changed event"),

        onDestroy: $ => counter.destroy(),

        // HOW TO SET ARG USING EXTERNAL VAR OF INTERNAL PROP
        internal_prop: 100,
        on_internal_propChanged: ($, _new, _old)=> { console.log("change!", _new, _old ); if (internal_prop_asExt.value.get !== _new){ internal_prop_asExt.markAsChanged() }}, // prevent loop
        onInit: $ => { 
          internal_prop_asExt.value = () => ({ get: $.internal_prop, set: (v) => { $.internal_prop = v } })
        }
      },

        H2({}, "Hello User"),

        // ---------------- //
        { hr: {}},
        InternalPropBanner({internal_prop_asExt}),
        { hr: {}},
        // ---------------- //

        Div({}, "The Counter is: ", counter.use()),

        Button({onClick: incCounter, label: 'Inc Counter'}),
        Button({onClick: incCounter, label: counter.use(($,val)=>'Inc Counter ('+val+')')}),

        // ---------------- //
        Div({}, "The Counter alias is: ", $ => $.counter_alias),
        cle.button({ onclick: $ => $.counter_alias += 1 }, 'Inc using Alias'),

        // ---------------- //
        Div({}, "The Counter alias 2 is: ", $ => $.counter_alias2),
        cle.button({ onclick: $ => $.counter_alias2 += 1 }, 'Inc using Alias 2'),
        
        // ---------------- //
        { hr: {}},
        // ---------------- //
        (()=>{

          const counter2 = useStateWithSignal(counter.value, $ => {
            if (counter.value !== counter2.prop.value) { // keep in sync, avoid loop
              counter.value = counter2.prop.value
            }
            console.log("counter 2 changed!")
          })
          
          counter.addOnChangedHandler(0, ()=>counter2.prop.value=counter.value) // 2 way

          return Div({},
            Div({
              onInit: $=>{
                counter2.signal.subscribe($, ()=>console.log("counter 2 changed"))
              }
            }, "The Counter 2 is: ", counter2.prop.use()),
            cle.button({ onclick: $ => counter2.prop.value += 1 }, 'Inc')
          )
        })()

      )
    }

    RenderApp(document.body, App())

  }

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
// appMetaInScopeAndLowCodeTest()
// appDemoDbus()
// appDemoAlias()
// appResolveMultiCssProblem()
// appDemoNewShortcuts()
// appDemoSocialNetworkReactStyle()
// appDemoConstructor()
// appDemoNestedDataChangeDetection()
// appDemoChachedWithAlias()
// appDemoStackblitz()
// appDemoMetaEditsPushBack()
// appDemoExternalPropsAndDyDef()
// appDemoTodoCard()
// appRxJs()
// appDemoDynamicDbusSignal()
// appDemoDynamicSignal()
// appDemoGetCleElByDomEl()
// appDemoLazyRuntimeRender()
// appDemoParentChildsInteraction()
// appDemoSCSS()
// appDemoFirebase()
// appDemoCellSelection()
// appDemoDefault$Scope()
// appDemoChildRefByName()
// appDemoCheckedDeps()
// appDemoOptimizedLeFor()
// appDemoFromHtmlTemplate()
// appDemoCSSInJSWithCSZ()
// appDemoEditRefValAndStupidShortcuts()
// appDemoNoMoreLetAndAsFunc()
// appDemoComponentFactory()
// appDemoComponentPrivateVar()
// appDemoProducerConsumerSync()
// appDemoExplodeProps()
// appDemoFromHtmlTemplateViaExternalFile()
// appDemoLazyComponent()
// appDemoWaitSignalAndPropCondition()
// appDemoSubChildsInUseAndHandleChildsBeforeInit()
// appDemoShadowRoot()
// appDemoHeavyPropertyFuncEvalOptimization()
// appDemoFixStyleWithHAStyleProp()
// appDemoDirectivesSystem()
// appDemoModelInExternalVar()
// appDemoProtocols()
// appDemoAvoidLambdaForComponentPropertySetupAndInputProps()
// appDemoSupportSvg()
// appDemoAutoFVarDefAndText()
appDemoPureFunctionalWithExt()

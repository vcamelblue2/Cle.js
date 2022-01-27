
import {pass, none, smart, Use, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp} from "../lib/caged-le.js"

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

          def: {
            incCounter: $ => $.this.counter = $.this.counter+2,
            beautifyCounterStatus: $ => "the counter is: " + $.this.counter + " (testing def deps)"
          },

          handle: { 
            onclick: ($, e)=> $.this.incCounter()
          },

          on: { this: { 
            counterChanged: ($, v)=> console.log("il counter è cambiato!! ora è:", v) 
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
                  div: { text: $ => $.parent.futureCounter }
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
              { div: { "=>": { div: { "=>": { div: { "=>": {div: { afterInit: $ => console.log("ooooooooooooooooo", $.this, $.this.parent.parent.parent.parent.counter, $.this, $.parent.parent.parent.parent.counter)}}}}}}}},


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
                    "=>":[ 
                      Placeholder("select_button"), Placeholder("deselect_button") ]}
                  }
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


app0()
// test2way()
// appTodolist()
// appTodolistv2()
// appNestedData()
// appPrantToChildComm()
// appTestCssAndPassThis()
// appTestSuperCtxProblem()
// appTestAnchors()

// appDemoStockApi()

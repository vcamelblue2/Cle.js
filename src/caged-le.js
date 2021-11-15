// ORIGINAL
/*
const AppRoot = { 

  id: "app_root", div: [

    { h1: "hello world!" },

    { div: [{ 
    
        id: "inc_button", 
        button: "Inc. Counter", 

        props: { 
          onclick: self=>self.v.counter += 1
        },
        LE: { 
          vars: { counter: 0 },
          binding: {
            onclick: self => self.v.counter += 1
          }
        },
        LE_customStuff: "bla bla"
      }
    ]},
    
    MySubComponent()

  ],
  props: { 
    onclick: self=>console.log(self)
  },
  LE: { 
    init: self=> {
      console.log("helloooo")
    }
  }
}






// NEW STUFF 


class AppRoot {

  signals = {
    counterReset: "int"
  }

  model = {
    title: "Hello world!",
    count: 0,
  }

  reactTo = {
    countChanges: ()=>console.log(this.count)
  }

  func = {
    resetCounter: ()=>{
      this.count = 0
    }
  }

  onInit = ()=>{

  }
  onUpdate = ()=>{

  }
  onDestroy = ()=>{

  }
  


  template = { 

    id: "app_root",
    div: [

      { 
        h1: F($ => this.title, ["this.title"]
        "count: {{ self.capitalize(|self.title|) + |parent.width| + |le.navbar.height| }}" -> estraggo via pattern i pezzi "dinamici" via '{{}}' e faccio replace di questo simbolo (che uso solo per identificare le deps) '|'..poi creo una funzione con 3 params e uso 'bind' [post primo parametro che serrve per 'this' ma le lambda ()=> non possono bindare] per bindare questi 3 params (self, parennt, le)=>
        "count: {{ self.capitalize($('title')) + $('parent.width') + $('le.navbar.height') }}" -> uso funzione $
        "count: {{ self.capitalize($`title`)) + $`parent.width` + $`le.navbar.height` }}" -> uso funzioni template string
        h1: $ => $.title + $.parent.width + $.le.navbar.height, alternativa estraggo via f.toString() e pattern match le deps..
        // alternativa plausibile: se uso this/dollaro mi basta solo "proxare" questa variabile (bindando sia this che $), a quel punto proxo le get, in modo da poter trovare quali prop vengono usate al "primo uso" aka rendeiring. esempio: proxo tutte le var con un Proxy, che se abilitato, quando arriva una get va a pushare su uno stack la var in questione, e il renderer va a pescare dopo l'esecuzione quali cose sono state chiamate. unico problema i vari if etc..
        style: { color: "red" }
      },
      { 
        span: ()=> "count: " + this.count
      },
      { 
        id: "inc_button",
        button: "inc. counter", 
        onclick: ()=> this.count++ 
      },
      { 
        id: "reset_button",
        button: "reset counter", 
        onclick: ()=> this.resetCounter()
      },

    ],

    style: {
      width: 200,
      height: 200
    },

    class: "someclass"

  }




  template = { 

    
    div: { 
      id: "app_root", 

      '>>' : [

        { 
          h1: ()=> this.title 
        },
        { 
          span: ()=> "count:" + this.count 
        },
        { 
          button: { 
            id: "inc_button",

            '>>' : "inc. counter",

            onclick: ()=> this.count++ 
          }
        },
        { 
          button: { 
            id: "reset_button",

            '>>' : "reset counter",

            onclick: ()=> this.resetCounter()
          }
        },
      ],

      style: {
        width: 200,
        height: 200
      },
      class: "someclass"

    }

  }





  // ultra qml style
  template = { 

    
    div: { 
      id: "app_root", 

      contains | childs | text | '>>' | '-->' : [

        { 
          h1: { text: $ => $.this.title }
        },
        { 
          span: { text: $ => "count:" + $.this.count }
        },
        { 
          button: { 
            id: "inc_button",

            text: "inc. counter",

            onclick: $ => $.this.count++ 
          }
        },
        { 
          button: { 
            id: "reset_button",

            text: "reset counter",

            onclick: $ => $.this.resetCounter()
          }
        }

      ],

      style: {
        width: 200,
        height: 200
      },
      class: "someclass"

    }

  }

}

*/





/*

// mettiamo insieme le idee..



// ricordati che è sempre possibile segnalare una change in una prop facendo esplicitamente $.this.xxxpropNamexxxChanged()

// todo: signal subsystem, un qualcosa tipo dbus, per cui tutte le props e signal notificano al sottositema il cambiamento..nient'altro che un msg broker / dispatcher. così da svincolare sender e reciver. più semplicie eliminare i segnali e gli "ascoltatori" post destroy
// todo: funzione F in cui dichiarare una lambda e le sue deps (per magheggi strani..) ---> const f = (lambda, deps=[])=>...   ---> { div: {text: f($ => $.le.qualcosa.prop + 123, ["le.qualcosa.prop"])}} oppure vere e proprie Property istanziate a parte..con js scope


// NOTE DONE:
// $.meta per le var in meta..es nei foreach etc
// "$.ctx" che rappresenta il contest dov'è definito il componente..escludendo quindi figli as component, parent e altre cagate
// grazie a questa cosa posso definire un "local_id" o "private:id" che potrei usare per fare hoisting dei nomi! aumentando riusabilità e un minimo di private/public
// altra cosa interessante sarebbero i modificatorie public e private, esempio "private:data": ... oppure "private:def", per avere anche più "def" etc pubbliche e private

// l'uso di questi oggetti apre a nuove possibilità, come ad esempio i tratti..ovvero poter prendere alcune cose in var e poi usarle in vari punti..
// ricordarsi di tutte le cose buone che abbiamo in le attuale..come i global signal, e a livello di page. nonchè una zona dove poter definire regole css


// se volessimo usare le classi sarebbe così: (anche meglio, perchè così ad ogni new ho già una copia che non alterna nulla..non devo fare copy)
const myComponet = {
  htmlType: class myComponentDef {
    props = {...},
    ...
  }
}


const component = {

  component_name: { meta: { if: $ => some.condition },

    "private:"? id: "compoent_id",

    constructor: ($, {param1, param2, param3 ...}) => { // costruttore, quando viene generato il componente
      $.this.blabla = blilbi
    },
    
    beforeInit: $ => { // prima di tutto

    }

    onInit: $ => { // prima di inizializzare html 
      console.log()
    },

    afterInit: $ => { // dopo html init (auto lazy)
      console.log()
    },

    onUpdate: $ => { // cancellato per essere ricreato

    },

    onDestroy: $ => {

    },

    signals: {
      counterReset: "stream => (void)" // definiamo il tipo di segnale (es: stream [per indicare chi c'è c'è], observable [per indicare che chi non c'è riceverà tutti i next e poi stream]) "=>" una descrizione dei params (es il tipo dei parametry, la signature etc etc..è solo testo che documenta!)
    },

    // ne abbiamo davvero bisogno?? alla fin fine basterebbe definire un componente/constroller global che definisce i global signal..
    dbus_signals: { // qui definiamo i segnali globali..un modo per creare uno stream su un canale comune con un compagno che non riesco a raggiungere facilmente "by name", e che entrambi conosciamo
      iEmitThisGlobalSignal_UniqueName: "stream => (int: counter status)"
    }

    "private:"? data | props: {
      name: "counter 1",
      counter: 0,
    },

    on: { // on props | alias changes
      this: {
        counterChanged: ($, newCounter, oldCounter) => console.log($.this.counter),
      }, 
      parent: ...
      le: ..byname.. : {props | alias changed},
      ctx: ...qui mettiamo solo i nomi dei sub_componenti + this di questo componente! 
      // ci vorrebbe anche un $.subel, (un array, non obj con in le) in cui è possibile filtrare by type: es $.subel.get("div")[0]..oppure il concetto di tref di le..o magari questa in realtà con ctx si risolve.. vedi sotto che ho descritto bene
    },

    on_s: { // on signal
      this: {
        counterReset: $ => console.log("counter reset!")
      }, 
      parent: ...
      le: .component byname.. : { signal},
      ctx: ...qui mettiamo solo i nomi dei sub_componenti + this di questo componente! 
      dbus: ...qui mettiamo i signals globali che ascolto

      // valitare anche "child:0" & "child:*" | child: { "0" | "*" : .. }

      // è anche possibile "autopropagare" i segnali che elaboro, senza ridefinirli (per favorire sub child to parent flow, o evitare inutili remap), come?  con una classe/costante che instanziamo e dunque definire: ctx: {subchildSignal: Autopropagate}
    },

    on_a { /////// AL MOMENTO NON PREVISITO!!!
      this: {
        "class" | "style.width" : $ => ... 
      }
      ... come sopra
    },

    // todo: valutare anche i "transoformer/reducer" in quanto con il sistema di auto change propagation per fare una op in blocco dovrei avere un mega stato..ma poi ho il problema che ci sono troppi update inutili..i reducer/transformer aiuterebbero!


    "private:"? def: {
      resetCounter: $ => {
        $.this.counter = 0
        $.this.counterReset.emit()
      }, 

      utils: { // def namespace example
        toUppercase: ($, txt) => txt.toUppercase()
      }
    },

    alias: { // nice to have, alias, per permettere di vedere all'esterno alcune proprietà interne e ridefinirle con la use senza toccare la logica o via prop extra!
      ctx: {
        counter_txt: $ => $.ctx.counter_value.text // qui probabilmente devo andare con la tecnica retry untill..
      }
    }

    "private:"? attrs | a : { // html attr  -> // altri nomi possibili: "has" | "viewProps" | "</>" P.S: qui magari veramente che potrebbe starci il fatto che qualsiasi altra cosa che non sia tra quelle descritte da noi diventa un attribute o un $.this.el.XXX

      style: {
        width: 200,
        height: $ => 200
      }, // oppure style: $ => ({ width... }) su questo devo ancora ragionare..

      class: "someclass"

      "@lazy:scrollTop": 100 // con il prefisso '@lazy:' indico che quell'attributo lo voglio inizializzare lazy!

      value: Bind($ => $.this.counter) // per effettuare 2 way data binding!
    
      // todo: style e class devono stare separati?? in roba apposita? in teoria si..perchè così potremmo anche andare a utilizzarli per creare l'anchors system definitivo..visto che starebbero in qualcosa di separato è anche più facile la sovrascrittura..
    },
    // NB: ricordarsi che è possibile osservare i changes degli attributi tramite un semplicissimo "mutationObserver"..questo ci permette di fare il 2 way binding in modo super semplice! infatti basta fare questa cosa: https://stackoverflow.com/a/41425087 unita al una classe che usiamo come trap per configurare il 2 way binding! ovviamente dovrà essere possibile configurare anche solo il flusso attr to property, in modo p.es da bindre la select a una nostra property in modo unidirezionale


    // hattrs ... "harmfulAttr" todo, capire se ha senso..in pratica qui non settiamo via "setAttribute", ma direttamente via this.el.xxxx = e anche in ricorsione..
    "private:"? hattrs | ha: {
      scrollTop: "0px",
      'style.backgroundColor': "red",
      'myAttr.nested.prop': $ => "follow some stuff"
      "@lazy:scrollTop": Bind($ => $.this.counter) // per lazy binding!
    }

    handle: { // html event
      onclick: ($, e) => $.this.count++
    },

    css: [ ".class { bla:bli ... }", $=>".r0 { .."+$.this.somedeps +"}" ] | {rule1: ".class { bla:bli ... }", rule2: $=>".r0 { .."+$.this.somedeps +"}"} // todo..magari qualcosa di più complesso..come hoisting (via replacer, o anche per i subel), or namaed definition (tipo le)..oppure per automatizzare l'hoisting =>  css: [ ".class { bla:bli ... }", ".class2 { foo:bar; ...", NoHoisting("sostanzialmente ::ng-dep..")]

    states: {
      // "default": "this", // implicit, always chang

      "bigger": { // 

        attrs: {
          style: {
            width: 400,
            backgroundColor: "red"
          }
        }
      }

    },

    state: "default" // optional different starting state
    stateChangeStrategy: "merge XXXstatenameXXX" | "replace" | "remove" // magari questa cosa va dentro i singoli state..

    onState: ($, newState, oldState)=> {

    }


    contains | childs | text | '>>' | '=>' | _ : [

      { 
        h1: { "private:id": "counter_name", text: $ => $.parent.name }
      },
      { 
        span: { "private:id": "counter_value", text: $ => "count:" + $.parent.counter }
      },
      "simple text",
      $ => "lazy text:" + $.this.state,

      Use( MyComponent, { // component creation / use example (from following code) 
        // redefinition..
          handle: {
            onclick: ...
          }
          on_s: { 
            this: { 
              mySignal: ($, ...args) => do whatever
            }
          } 
        }, 
        {
          init: { childPropToInitInConstructor: $ => $.meta.idx }
        }, 
        // todo: qui potrebbe starci una connect del signal con autopropagate, ovvero poter indicare che propago un certo segnale nel mio parent!
      ),


      { Model | Controller | Connector: { // OBJECT, invisible, usefull for app logic and data manipulation
        data: {prop1: 23},

        ["=>"]: [

          { Model: { // sub model/obj
            data: {prop2: 25},
            afterInit: $ => console.log($.this.prop2),
            text: $ => $.parent.prop1,
          }
        },
        ]
      }},

    ],

  }
}

// COMPONENT REDEFINITION SEPARATION

impossible_to_redefine = ["private:id"]
direct_lvl = ["id", "constructor", "beforeInit", "onInit", "afterInit", "onUpdate", "onDestroy"]
first_lvl = ["signals", "dbus_signals", "data", "private:data", "props", "private:props", "alias", "handle"]
second_lvl = ["on", "on_s", "on_a"]
first_or_second_lvl = ["def", "private:def"] // check for function (may exist "first lvl namespace")
// TODO: actually merge unsupported
"hattrs", "ha", "private:hattrs", "private:ha", "attrs", "private:attrs", "a", "private:a", css, states, state, stateChangeStrategy, onState, contains | childs | text | '>>' | '=>' | _???



const DeleteTodoButton = { 

  button: {
  
    props: { todoIndex: undefined },

    constructor: ($, {todoIndex})=>{ // qua forse capiamo, perchè sarebbe carino poter definire dinamicamente prop..anche se potrebbe diventare illegibile!
      $.this.todoIndex = todoIndex // sabebbe bello avere anche un mini constructor di default per questi casi, ovvero constructor: autoConstructor; autoConstructor: (arg_as_obj)=>Object.entries..map in data/pros etc..
    },

    text: $ => "delete me ("+$.this.todoIndex+")",

    signals: {
      deleteRequest: "stream => (void)",
    }

    handle: {
      onclick: $ => $.this.deleteRequest.emit()
    }

  }
}


const TodoList = { // automatic root div!

  id: "todolist", 

  data: {
    todolist: []
  }

  on: {
    this: {
      todoListChanged: $ => $.this._logTodoEdits()
    }
  },

  on_s: {
    le | ctx : {
      input_bar: {
        newTodoRequest: ($, todo) => $.this.addTodo(todo)
      }
    }
  },


  def: {
    addTodo: ($, todo) => $.this.todolist = [...$.this.todolist, todo],
    deleteTodo: ($, todo) => ...find and delete..
  }

  "private:def":{
    logTodoEdits: $ => console.log("todo edited!!")
  }

  '=>': [

    { input: { 

        id: "input_bar", 

        signals: { 
          newTodoRequest: "stream => (string: new inserted todo)"
        },
        props | data: { todo: "" }
        attrs: { 
          value: $ => $.this.todo, 
          placeHolder: "Insert some Todo..", 
          style: { width: "300px", height: "100px"} 
        }, 
        handle: { 
          onInput: ($,e) => $.this.todo = e.target.value, 
          onEnterPressed: $ => $.this.newTodoRequest.emit($.this.todo) 
        } //mock
      }
    },

    { hr: {} },


    { div: { meta: [{ forEach:"todo",  of: $ => $.parent.todolist,  define:{ index:"idx", first:"isFirst", last:"isLast", length:"len", iterable:"arr" }, define_alias:{ // my_var_extracted_with_meta_identifier..easy alias! //, todo_label: $ => $.this.todo_label_mapping[$.meta.todo]},  key,comparer: el=>... extractor/converter: $=> // opzionale, per fare es Obj.keys --> extractor:($, blabla)=>Object.keys(blabla) e i comparer per identificare i changes // }], 
      
      "=>": [

        { div: { text: $ => $.meta.idx + ") " $.meta.todo, // oppure "stringa" oppure $=>$.meta.idx ..shortcut for textNode (vecchio {$: fff} in le)

        Use( DeleteTodoButton, { 
            on_s: { 
              this: { 
                deleteRequest: $ => $.ctx.root.deleteTodo() 
              }
            } 
          }, 
          {
            init: { todoIndex: $ => $.meta.idx } // nella init il punto di vista del this E' SEMPRE IL MIO, qui meta è sempre quello del mio meta più vicino o l'insieme dei miei meta pià vicini..da capire..
          }, 
          // todo: qui potrebbe starci una connect del signal con autopropagate, ovvero poter indicare che propago un certo segnale nel mio parent!
        )
      ]

    }},


    { div: { meta: { if: $ => $.ctx.root.todolist.length > 50},
      text: "ohhh nooo, hai molti todo"
    }},

    { div: { meta: { if: $ => $.ctx.root.todolist.length === 0},
      text: "hurrraaa, non hai nulla da fare!"
    }},


    // oppure
    { div: { meta: { 
      swich: $ => $.ctx.root.todolist.length, 
      cases: [
        [($, len) => len > 50, { div: { text: "ohhh nooo, hai molti todo"} }]
        [($, len) => len == 0, { div: { text: "hurrraaa, non hai nulla da fare!"} }]
      ], 
      default: undefined
    },
    }}, // così però devo per forza wrappare in un div etc..
    
    // alternativa: lo switche non è ninent'altro che una trasfromazione identificata a beckend (con classe sentinel) e riconvertita in le-if da noi
    Switch( $ => $.ctx.root.todolist.length, 

      Case( ($, len) => len > 50,  
      { 
        div: { text: "ohhh nooo, hai molti todo"} 
      }),

      Case( ($, len) => len == 0, 
      { 
        div: { text: "hurrraaa, non hai nulla da fare!"} 
      }),

      Default( pass )
    )

  ],

}


*/



// TODO: ragionare se ci piace davveero "private: xxx": "blabla"   o è meglio un   private_xxx: "blibli"
// allo stesso tempo potrebbe eanche essere utile invertire: normalmente tutto è privato (aka by $ctx), con public: si va in modalità pubblica..quantomeno per gli id!


// ricorda il trick del comment node: in pratica sapendo già tutto il modello statico (cioè senza ngif, ngfor e ngswitch) definisco tutto (almeno la struct di base, cioè div->span, div...) e piazzo al posto degli el dinamici un commento, puntando a quell'elemento li. a quel punto ho un puntamento alla "posizione" dove farò replace e insert after/before...potenzialmente per le liste ne avrò 2: uno di apertura e uno di chiusura, così da poter cancellare tutti gli el associati alla lista anche da li (scorrendo i child)

// nuova idea su come bindare il this con qualunque funzione (anche => ) (che però annulla la possibilità di avere cose extra framework..): basta fare il toString della func, e poi ricostruirla con new Function assegnando il this..però si perdono tutti gli extra ref!

const DEBUG_ENABLED = false
const debug = { log: (...args)=> DEBUG_ENABLED && console.log(...args) }

// syntatic sentinel..maybe use symbol in future..
/*export*/ const pass = undefined
/*export*/ const none = ()=>undefined


// utils
const copyObjPropsInplace = (copy_from, copy_into, props) => {
  Object.keys(copy_from).forEach(p=>{
    if (props.includes(p)){
      copy_into[p] = copy_from[p]
    }
  })
}

/*export*/ const toInlineStyle = /** @param {CSSStyleDeclaration | ()=>CSSStyleDeclaration} styles - use "::" on single style name to specify no name translation! */(styles)=>{ 
  if((typeof styles) === "function"){styles=styles()}; 

  let style = ""

  Object.keys(styles).forEach(s=>{
      if (s.startsWith("::")){
          style += s+":"+styles[s]+";"
      }
      else {
          style += s.split(/(?=[A-Z])/).join('-').toLowerCase()+":"+styles[s]+";"
      }
  })

  return style
}

const isFunction = (what)=>typeof what === "function"

const recursiveAccessor = (pointer, toAccess)=>{
  // console.log("recursiveAccessor", pointer, toAccess)
  if (toAccess.length === 1)
    return [pointer, toAccess[0]]
  else {
    // console.log("ritornerò: ", pointer, toAccess[0], pointer[toAccess[0]])
    return recursiveAccessor(pointer[toAccess[0]], toAccess.slice(1))
  }
}

const cloneDefinitionWithoutMeta = (definition)=>{
  let componentType = getComponentType(definition)
    
  let {meta, ...oj_definition_no_meta} = definition[componentType]
  return {[componentType]: oj_definition_no_meta}
}

// Framework

class Property{
  constructor(valueFunc, onGet, onSet, onDestroy, executionContext, registerToDepsHelper, init=true){
    // execution context per fare la bind poco prima di chiamare (o per non bindare e chiamare direttamente..)
    // "registerToDepsHelper..un qualcosa che mi fornisce il parent per registrarmi alle mie dpes..in modo da poter settare anche altro e fare in modo da non dover conoscere il mio padre, per evitare ref circolari"
    this.executionContext = (Array.isArray(executionContext) ? executionContext : [executionContext]).map(ec=>isFunction(ec) ? ec : ()=>ec) // interface for "dynamic execution context"..wrap in lambda aslo if not passed..
    this.registerToDepsHelper = registerToDepsHelper
    this.onChangedHandlers = []
    this.dependency = undefined
    this.registeredDependency = [] // container of depsRemoverFunc

    if (init){
      this.init(valueFunc, onGet, onSet, onDestroy) // helper, to separate prop definition from initializzation (for register)
    }
  }

  init(valueFunc, onGet, onSet, onDestroy){
    this.isFunc = isFunction(valueFunc)

    this._onGet = onGet
    this._onSet = onSet
    this._onDestroy = onDestroy

    this._latestResolvedValue = undefined
    this._valueFunc = valueFunc
    this.__analyzeAndConnectDeps()

    try{ this._latestResolvedValue = this.__getRealVaule() } catch {} // with this trick (and setting on markAsChanged and set value) we can compare new and old!
  }

  __analyzeAndConnectDeps(){
    // step 1: remove old deps (if any)
    this.registeredDependency.forEach(depsRemoverFunc=>depsRemoverFunc())
    this.registeredDependency = []
    this.dependency = undefined
    // step 2: compute the new deps and register to it
    if (this.isFunc){
      this.dependency = analizeDepsStatically(this._valueFunc)
      console.log("dependency!!!!", this, this.dependency)
      this.registerToDepsHelper(this, this.dependency) // it's my parent competence to actually coonect deps!
    }
  }

  destroy(alsoDependsOnMe=false){
    this.init(undefined, undefined, undefined) // this will remove alse deps connection (but not who depends on me!)
    this.registerToDepsHelper = undefined
    if (alsoDependsOnMe){
      return this.removeAllOnChengedHandler() // this will return the old deps (eg. to restore deps after a destroy/recreate cycle)
    }
    this._onDestroy && this._onDestroy()
  }

  __getRealVaule(){
    return this.isFunc ? this._valueFunc(...this.executionContext.map(ec=>ec())) : this._valueFunc
  }

  get value(){
    this._onGet() // this._onGet?.()
    return this.__getRealVaule()
  }
  set value(v){
    this.isFunc = isFunction(v)
    this._valueFunc = v
    this.__analyzeAndConnectDeps()
    let _v = this.__getRealVaule()
    this._onSet(_v, v, this)
    this.fireOnChangedSignal()
    this._latestResolvedValue = _v // in this way during the onSet we have the latest val in "_latestResolvedValue" fr caching strategy
  }

  // manually, useful for deps
  markAsChanged(){
    debug.log("marked as changed!", this)
    let _v = this.__getRealVaule()
    this._onSet(_v, this._valueFunc, this)
    this.fireOnChangedSignal()
    this._latestResolvedValue = _v
  }


  // registered changes handler, deps and notify system
  fireOnChangedSignal(){
    this.onChangedHandlers.forEach(h=>h.handler(this.__getRealVaule(), this._latestResolvedValue))
  }
  hasOnChangedHandler(who){
    return this.onChangedHandlers.find(h=>h.who === who) !== undefined
  }
  addOnChangedHandler(who, handler){ // return the remove function!
    if(!this.hasOnChangedHandler(who)){
      this.onChangedHandlers.push({who: who, handler: handler})
    }
    return ()=>this.removeOnChangedHandler(who)
  }
  removeOnChangedHandler(who){
    this.onChangedHandlers = this.onChangedHandlers.filter(h=>h.who !== who)
  }
  removeAllOnChengedHandler(){
    let oldChangedHandlers = this.onChangedHandlers
    this.onChangedHandlers = []
    return oldChangedHandlers
  }

}

// signalHandler = {
//   singal1: {
//     handlers = [ {who:..., handler:...} ],
//     emit = (...args)=>this.handlers.forEach(h=>h.handler(...args))
//   }
// }
class Signal {
  constructor(name, definition){
    this.name = name;
    this.definition = definition;
    this.handlers = []
  }

  emit(...args){
    this.handlers.forEach(h=>h.handler(...args))
  }

  hasHandler(who){
    return this.handlers.find(h=>h.who === who) !== undefined
  }
  addHandler(who, handler){
    if(!this.hasHandler(who)){
      this.handlers.push({who: who, handler: handler})
    }
    return ()=>this.removeHandler(who)
  }
  removeHandler(who){
    this.handlers = this.handlers.filter(h=>h.who !== who)
  }

  destroy(){ // todo: integrare todo per bene!
    let to_notify_of_destroy = this.handlers.map(h=>h.who)
    this.handlers = []
    return to_notify_of_destroy
  }

  // proxy dei signal esposto agli user, che possono fare solo $.this.signalName.emit(...)
  static getSignalProxy = (realSignal)=> ( {emit: (...args)=>realSignal.emit(...args)} )

}

class SignalSubSystem {
  singals = {} // Map?? e uso un component dell'albero direttamente..così però rischio di perdere il "riferimento" in caso di dynamics..o meglio, va gestito bene..

  toRegister = {}

  addSignal(signal){

  }
  removeSignal(signal){

  }

  replaceSignal(oldSignal, newSignal){ // quando so che c'è una replace/update di un nodo..devo replecare per far in modo che le subscribe funzionino ancora

  }

  registerToSignal(signal, who){

  }

  sendSignal(signal, ...args) {
    //mentre segnalo bisogona controllare che esiste ancora il sengale..potrebbe portare all'eleiminazione'..

  }

  _dispatchSignal(){}

}

// smart component: convert {div: "hello"} as {div: {text: "hello"}}
/*export*/ const smart = (component, otherDefs={}) => {
  return Object.entries(component).map( ([tag, text])=>( {[tag]: {text: text, ...otherDefs }} ) )[0]
}

//const Use = (component, redefinition, initialization_args=$=>({p1:1, p2:"bla"}), passed_props= $=>({prop1: $.this.prop1...}) )=>{ 
/*export*/ const Use = (component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined }={})=>{ return new UseComponentDeclaration(component, redefinitions, { strategy:strategy, init:init, passed_props:passed_props } ) } // passed_props per puntare a una var autostored as passed_props e seguirne i changes, mentre init args per passare principalmente valori (magari anche props) ma che devi elaborare nel construct
// todo: qui potrebbe starci una connect del signal con autopropagate, ovvero poter indicare che propago un certo segnale nel mio parent! subito dopo la redefinitions, in modo da avere una roba molto simile a quello che ha angular (Output) e chiudere il cerchio della mancanza di id..
// di fatto creiamo un nuovo segnale e lo connettiamo in modo semplice..nel parent chiamo "definePropagatedSignal"
// perdo solo un po di descrittività, in favore di un meccanismo comodo e facile..

// nella init il punto di vista del this E' SEMPRE IL MIO

class UseComponentDeclaration{
  constructor(component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined }={}){
    this.component = component // Todo: e se voglio ridefinire un componente già Use??
    this.init = init
    this.passed_props = passed_props
    this.redefinitions = redefinitions
    // assert strategy in "merge" | "override"
    this.strategy = strategy

    this.computedTemplate = this._resolveComponentRedefinition()
  }

  _resolveComponentRedefinition(){
    let componentType = getComponentType(this.component)
    let resolved = Object.assign({}, this.component[componentType]) // shallow copy of first level..

    if (this.redefinitions !== undefined){
      if (this.strategy === "override"){
        resolved = {...resolved, ...this.redefinitions}
      } 
      // TO DO: deep copy
      else if (this.strategy === "merge") {

        // throw new Error("Not Implemented Yet!")
        const impossible_to_redefine = ["private:id"]
        const direct_lvl = ["id", "constructor", "beforeInit", "onInit", "afterInit", "onUpdate", "onDestroy"] // direct copy
        const first_lvl = ["signals", "dbus_signals", "data", "private:data", "props", "private:props", "alias", "handle"] // on first lvl direct
        const second_lvl = ["on", "on_s", "on_a"]
        const first_or_second_lvl = ["def", "private:def"] // check for function (may exist "first lvl namespace")
 
        Object.entries(this.redefinitions).forEach(([k,v])=>{
          if (direct_lvl.includes(k)){
            // todo: use null to delete 
            // if (v === null)
            //   delete resolved[k]
            // else
            //   resolved[k] = v
            resolved[k] = v
          }
          else if (first_lvl.includes(k)){ //copio il primo lvl
            if (!(k in resolved)){ 
              resolved[k] = {}
            }
            else {
              resolved[k] = {...resolved[k]}
            }
            Object.entries(v).forEach(([kk,vv])=>{
              console.log(k, kk, vv)
              resolved[k][kk] = vv
            })
          }
          else if (second_lvl.includes(k)){ //copio il secondo lvl
            if (!(k in resolved)){
              resolved[k] = {}
            }
            else {
              resolved[k] = {...resolved[k]}
            }
            Object.entries(v).forEach(([kk,vv])=>{
              if ((resolved[k] !== undefined) && !(kk in resolved[k])){
                resolved[k][kk] = {}
              }
              else {
                resolved[k][kk] = {...resolved[k][kk]}
              }
              Object.entries(vv).forEach(([kkk,vvv])=>{
                // if ((resolved[k][kk] !== undefined) && (typeof resolved[k][kk] === "object") && !(kkk in resolved[k][kk])){
                //   resolved[k][kk][kkk] = {}
                // }
                resolved[k][kk][kkk] = vvv
              })
            
            })
          }
          else if (first_or_second_lvl.includes(k)){ //copio il primo o il secondo lvl
            if (!(k in resolved)){
              resolved[k] = {}
            }
            else {
              resolved[k] = {...resolved[k]}
            }
            Object.entries(v).forEach(([kk,vv])=>{
              if (typeof vv === "function"){ // è un first lvl!
                resolved[k][kk] = vv
              }
              else { // è un second lvl!
                if ((resolved[k] !== undefined) && !(kk in resolved[k])){
                  resolved[k][kk] = {}
                }
                else {
                  resolved[k][kk] = {...resolved[k][kk]}
                }
                Object.entries(vv).forEach(([kkk,vvv])=>{
                  // if ((resolved[k][kk] !== undefined) && (typeof resolved[k][kk] === "object") && !(kkk in resolved[k][kk])){
                  //   resolved[k][kk][kkk] = {}
                  // }
                  resolved[k][kk][kkk] = vvv
                })
              
              }
            })
          
          }
          else if (impossible_to_redefine.includes(k)){
            console.log("WARNING!!!", k, "cannot be redefined!!")
          }
          else {
            console.log("WARNING!!! ACTUALLY", k, "is not supported in merge strategy! i simply override it!! assuming you can control the amount of override..")
            resolved[k] = v
          }


        })
        
        console.log("RESOLVED!", this.component[componentType], this.redefinitions, resolved)

      }
    }
    
    return { [componentType]: resolved }
  }

  cloneWithoutMeta(){
    let redefinitions_no_meta = undefined

    if (this.redefinitions !== undefined){
      let {meta, ..._redefinitions_no_meta} = this.redefinitions
      redefinitions_no_meta = _redefinitions_no_meta
    }

    return new UseComponentDeclaration(
      cloneDefinitionWithoutMeta(this.component), redefinitions_no_meta, { strategy:this.strategy, init:this.init, passed_props:this.passed_props }
    )
  }

}


const getComponentType = (template)=>{
  // let componentDef;

  if (template instanceof UseComponentDeclaration){
    // componentDef = template
    template = template.computedTemplate
  }
  
  let entries = Object.entries(template)
  console.log(template, entries)
  if(entries.length > 1){
    throw new Error()
  }
  let [elementType, definition] = entries[0]

  return elementType
  // return [elementType, componentDef ?? definition] // per i template veri restituisco la definizione (aka la definizione del componente), mentre per gli UseComponent il template/classe passata
}

const analizeDepsStatically = (f)=>{

  // const f = $ => $.this.title + $.parent.width + $.le.navbar.height

  let to_inspect = f.toString()

  // replace va perchè fa la replace solo della prima roba..alternativa un bel cut al numero di caratteri che sappiamo già
  let $this_deps = to_inspect.match(/\$.this\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $this_deps = $this_deps?.map(d=>d.replace("$.this.", "").split("."))
  
  let $parent_deps = to_inspect.match(/\$.parent\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $parent_deps = $parent_deps?.map(d=>d.replace("$.parent.", "").split("."))

  let $le_deps = to_inspect.match(/\$.le\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $le_deps = $le_deps?.map(d=>d.replace("$.le.", "").split(".")) 

  let $ctx_deps = to_inspect.match(/\$.ctx\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $ctx_deps = $ctx_deps?.map(d=>d.replace("$.ctx.", "").split(".")) 

  let $meta_deps = to_inspect.match(/\$.meta\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $meta_deps = $meta_deps?.map(d=>d.replace("$.meta.", "").split(".")) 

  return {
    // todo: vedere se hanno senso
    $this_deps: $this_deps, 
    // $pure_this_deps: $this_deps.length === 1 && $this_deps[0]==="", 

    $parent_deps: $parent_deps, 
    // $pure_parent_deps: $parent_deps.length === 1 && $parent_deps[0]==="", 

    $le_deps: $le_deps, 
    // $pure_le_depss: $le_deps.length === 1 && $le_deps[0]==="", 

    $ctx_deps: $ctx_deps, 
    // $pure_ctx_deps: $ctx_deps.length === 1 && $ctx_deps[0]==="", 

    $meta_deps: $meta_deps, 
    // $pure_meta_deps: $meta_deps.length === 1 && $meta_deps[0]==="", 
  }

}

// class ComponentProxySentinel {
//   constructor(obj){
//     Object.assign(this, obj)
//   }
// }

// Property proxy, frontend for the dev of the component Property, usefull to hide the .value mechanism (get/set) of Property
// let deps_stack = [];
const ComponentProxy = (context, lvl=0)=>{

  return new Proxy(context, {

      get: (target, prop, receiver)=>{
        let prop_or_value_target = target[prop];
        if (prop_or_value_target instanceof Property){
          debug.log(prop, "--", lvl, "--->", target, "isProperty!");
          return prop_or_value_target.value
        }
        debug.log(prop, "--", lvl, "--->", target);
        return prop_or_value_target

        // // deps_stack.push([prop, lvl]);
        // let prop_target = target[prop];

        // if (ret instanceof Property){
        //   return ComponentProxySentinel(ret.value, lvl+1)
        // }
        // else{
        //   return ret
        // }
      },

      set: function(target, prop, value) {
        debug.log("SET", target, prop, value)

        let prop_or_value_target = target[prop];
        if (prop_or_value_target instanceof Property){
          // todo, intercept and setup dependency again
          prop_or_value_target.value = value
          return true
        } // you can only set existing prpoerty value..to avoid stupid imperative tricks!

      }
  })
}

class ComponentsContainerProxy {
  // public proxy

  constructor(){

    this.proxy = new Proxy(this, { // todo..proxy è visibile all'interno?????? bug???
      get: function (target, prop, receiver){
        debug.log(target, prop, target[prop], target[prop].$this.this)
        return target[prop].$this.this
      }
    })

  }
}

// TODO: manually specify the remap event, throttling, lazy..
class Binding {
  constructor(bindFunc, remap, event){
    this.bindFunc = bindFunc
    this.remap = remap
    this.event = event
  }
}
/*export*/ const Bind = (bindFunc, {remap=undefined, event=undefined}={}) => new Binding(bindFunc, remap, event)



/*export*/ const RenderApp = (html_root, definition)=>{

  let component_tree_root = new ComponentsTreeRoot(html_root, definition)
  component_tree_root.initAndRenderize()

  return component_tree_root

}

// todo: routing (also partial!) con history api
// class VDoom {
//   constructor(renderRoot, route){
//     this.renderRoot = renderRoot
//     this.componentRouter = componentRoute

//     this.renderRoute()
//   }

//   renderRoute(){

//     // TMP only 1

//   }

// }


class ComponentsTreeRoot {

  html_root
  oj_definition
  components_root

  $le // ComponentsContainerProxy
  $signalSubSystem
  $cssEngine

  // step 1: build
  constructor(html_root, definition){
    this.html_root = html_root
    this.oj_definition = definition

    this.$le = new ComponentsContainerProxy()
    this.$signalSubSystem = new SignalSubSystem()
  }

  // step 2 & 3: build skeleton (html pointer & child) and renderize
  initAndRenderize(){

    this.buildSkeleton()

    this.components_root.create()

  }

  buildSkeleton(){

    this.components_root = Component.componentFactory(this.html_root, this.oj_definition, this.$le)
    this.components_root.buildSkeleton()

  }

  destroy(){
    this.components_root.destroy()
  }

}

// @interface Component base defintion
class IComponent {
  constructor(parent, definition, $le){}
  
  buildSkeleton(){}
  create(){}
  destroy(){}

}

class Component {

  id  // public id
  _id // private (or $ctx) id
  
  oj_definition
  convertedDefinition
  
  isMyParentHtmlRoot // boolean
  parent // Component
  childs // Component []

  properties = {}// real Props Container, exposed (in a certain way) to the dev
  // attrProperties = {}// real attr Props Container // todo: qualcosa del genere per gli attr
  signals = {} // type {signalX: Signal}
  hooks = {}// hook alle onInit dei componenti etc..
  meta = {} // container of "local" meta variable (le-for)


  // Frontend for Dev
  $this  // ComponentProxy -> binded on user defined function, visible to the dev as $.this
  $parent // ComponentProxy ==> in realtà è this.parent.$this, visible to the dev as $.parent
  $le // ComponentsContainerProxy - passed, visible to the dev as $.le
  $ctx // ComponentsContainerProxy - created if is a ctx_component, visible to the dev as $.ctx
  isA$ctxComponent = false
  // $bind // ComponentProoxy -> contains the property as "binding"..a sort of "sentinel" that devs can use to signal "2WayBinding" on a property declaration/definition, visible to the dev as $.bind, usefull also to define intra-property "alias"
  $dbus 
  $meta // ComponentProxy => contains all "meta", local and from parents, in the same Component


  htmlElementType
  isObjComponent
  html_pointer_element
  html_end_pointer_element // future use, per i componenti dinamici e liste..
  css_html_pointer_element

  // step 1: build
  constructor(parent, definition, $le){
    this.isA$ctxComponent = ((definition instanceof UseComponentDeclaration) || !(parent instanceof Component))
    this.parent = parent
    this.isMyParentHtmlRoot = (parent instanceof HTMLElement) // && !((parent instanceof Component) || (parent instanceof UseComponentDeclaration)) // if false it is a parent HTML node

    this.$le = $le
    this.$ctx = this.getMy$ctx()
    this.$meta = this.getMy$meta()

    this.oj_definition = definition

    this.htmlElementType = getComponentType(definition)
    this.isObjComponent = ["Model", "Controller", "Connector", "Signals", "Style", "Css"].includes(this.htmlElementType)
    this.convertedDefinition = Component.parseComponentDefinition( (definition instanceof UseComponentDeclaration ? definition.computedTemplate : definition) [this.htmlElementType])

    this.defineAndRegisterId()

  }

  getMy$ctx(){ // as singleton/generator
    if(this.isA$ctxComponent){
      return this.$ctx ?? new ComponentsContainerProxy()
    }

    else{
      if (this.parent !== undefined && (this.parent instanceof Component)){
        return this.parent.getMy$ctx()
      }
      
      return undefined
    }
  }

  getMyFullMeta(){
    if(this.isA$ctxComponent){
      return this.meta
    }

    else{
      if (this.parent !== undefined && (this.parent instanceof Component)){
        return {...this.parent.getMyFullMeta(), ...this.meta}
      }
      
      return {}
    }

  }
  getMy$meta(){ // as singleton/generator
    if(this.isA$ctxComponent){
      console.log("Component metaaaaaaaaa", this.meta, this.oj_definition, this)
      return ComponentProxy(this.meta)
    }

    else{
      if (this.parent !== undefined && (this.parent instanceof Component)){
        console.log("parernt metaaaaaaaaa", this.parent.meta, this.oj_definition, this)
        return ComponentProxy(this.getMyFullMeta())
      }
      
      return undefined
    }
  }

  defineAndRegisterId(){

    this.id = this.convertedDefinition.id
    this._id = this.convertedDefinition._id

    if (this.id !== undefined){
      this.$le[this.id] = this
      this.$ctx[this.id] = this
    }
    if (this._id !== undefined){
      this.$ctx[this._id] = this
    }

    // USE _root_ e _ctxroot_ per accedere alla root di tutto e alla root del context
    if(this.isMyParentHtmlRoot){
      this.$le["_root_"] = this
    }

    if(this.isA$ctxComponent){
      this.$ctx["_ctxroot_"] = this
    }
  }
  

  // step 2: build skeleton (html pointer and child), then properties ref
  buildSkeleton(){

    this.buildHtmlPointerElement()


    this.buildChildsSkeleton()

    
    this.buildPropertiesRef()

  }

  buildHtmlPointerElement(){

    if ( this.isObjComponent ){

      this.html_pointer_element = document.createElement("obj")

    }
    else {

      this.html_pointer_element = document.createElement(this.htmlElementType)

      if (this.isMyParentHtmlRoot){
        this.parent.appendChild(this.html_pointer_element)
      }
      else {
        this.parent.html_pointer_element.appendChild(this.html_pointer_element)
      }

    }

  }

  buildChildsSkeleton(){

    this.childs = (this.convertedDefinition.childs?.map(childTemplate=>Component.componentFactory(this, childTemplate, this.$le)) || [] )

    this.childs.forEach(child=>child.buildSkeleton())

  }

  buildPropertiesRef(){

    // t.b.d
    this.properties.el = this.html_pointer_element // ha senso??? rischia di spaccare tutto..nella parte di sotto..
    this.properties.parent = this.parent?.$this?.this // ha senso??? rischia di spaccare tutto.. recursive this.parent.parent & parent.parent le.x.parent.. etc..

    // todo: qualcosa del genere per gli attr
    // this.properties.attr = ComponentProxy(this.attrProperties)

    // todo: parent and le visible properties only..
    this.$parent = (this.parent instanceof Component) ? ComponentProxy(this.parent.properties) : undefined
    this.$this = ComponentProxy(/*new ComponentProxySentinel(*/{this: ComponentProxy(this.properties), parent: this.$parent, le: this.$le.proxy, ctx: this.$ctx.proxy /*, dbus: this.$dbus*/, meta: this.$meta} /*)*/ ) //tmp, removed ComponentProxySentinel (useless)

    // mettere private stuff in "private_properties" e "private_signal", a quel punto una strada potrebbe essere quella di avere un "private_this" qui su..ma in teoria dovrebbe essere qualcosa di context, e non solo in me stesso..
  }

  // step 3: create and renderize
  create(){

    // html event
    if (this.convertedDefinition.handle !== undefined){
      Object.entries(this.convertedDefinition.handle).forEach(([k,v])=>{
        this.html_pointer_element[k] = (...e)=>v.bind(undefined, this.$this, ...e)()
      })
    }

    // first of all: declare all "data" possible property changes handler (in this way ww are sure that exist in the future for deps analysis) - they also decalre a signal!
    if (this.convertedDefinition.data !== undefined){
      Object.entries(this.convertedDefinition.data).forEach(([k,v])=>{

        // Create but do not init
        this.properties[k] = new Property(pass, pass, pass, pass, ()=>this.$this, (thisProp, deps)=>{

          // deps connection logic

          deps.$this_deps?.forEach(d=>{
            debug.log("pushooooo")
            this.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ) // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
          }) // supporting multiple deps, but only of first order..

          deps.$parent_deps?.forEach(d=>{
            debug.log("pushooooo")
            this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          })

          deps.$le_deps?.forEach(d=>{ // [le_id, property]
            debug.log("pushooooo")
            this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          })

          deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
            debug.log("pushooooo")
            this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          })

        }, false)

        // Create associated Signal -> Every property has an associated signal, fired on change, that we use to notify interested components
        let signalName = k+"Changed" // nomde del segnale che useranno i dev per definirlo nelle on.. name used to store signal
        let manualMarkSignalName = "_mark_"+k+"_as_changed" // nome visible ai dev per marcare manualmente la property come changed
        this.signals[signalName] = new Signal(signalName, "stream => (newValue: any, oldValue: any) - property change signal")
        this.properties[manualMarkSignalName] = ()=>this.properties[k].markAsChanged() // via on set scatenerà il signal etc!
      })
      console.log(this, this.signals, this.properties)
    }

    // signals def
    if (this.convertedDefinition.signals !== undefined){
      Object.entries(this.convertedDefinition.signals).forEach(([s,s_def])=>{
        const realSignal = new Signal(s, s_def)
        this.signals[s] = realSignal
        this.properties[s] = Signal.getSignalProxy(realSignal)
      })
      console.log(this, this.signals, this.properties)
    }

    // function def // NO DEPS SCAN AT THIS TIME
    if (this.convertedDefinition.def !== undefined){
      Object.entries(this.convertedDefinition.def).forEach(([k,v])=>{
        let _isFunc = isFunction(v)
        if (!_isFunc){ // is a namespace
          this.properties[k] = {}
          Object.entries(v).forEach(([kk,vv])=>{
            this.properties[k][kk] = (...args)=>vv.bind(undefined, this.$this, ...args)()

            // let staticDeps = analizeDepsStatically(vv) // TODO: static deps analysis

          })
          this.properties[k] = ComponentProxy(this.properties[k]) // maby is a normal obj??
        }
        else{
          this.properties[k] = (...args)=>v.bind(undefined, this.$this, ...args)()
        }
      })
    }

    // on (property) | on_s (signal) def // todo: trigger on inti?
    [this.convertedDefinition.on, this.convertedDefinition.on_s /*, this.convertedDefinition.on_a*/].forEach( handle_on_definition => {
      if (handle_on_definition !== undefined){
        console.log("ho un on/on_s/on_a definito", this)
        Object.entries(handle_on_definition).forEach(([typologyNamespace, defs ])=>{
          if (typologyNamespace === "this"){
            Object.entries(defs).forEach(([s, fun])=>{
              let remover = this.signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
            })
          }
          if (typologyNamespace === "parent"){
            Object.entries(defs).forEach(([s, fun])=>{
              let remover = this.parent.signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
            })
          }
          if (typologyNamespace === "le"){
            Object.entries(defs).forEach(([leItem, leItemDefs])=>{ // get requested element name
              Object.entries(leItemDefs).forEach(([s, fun])=>{
                // exponential retry to handle signal
                const setUpSignalHandler = (num_retry=0)=>{
                  try{
                    // console.log("provo ad agganciare signal", leItem, s)
                    let remover = this.$le[leItem].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
                  }
                  catch{
                    if (num_retry < 5) {
                      setTimeout(()=>setUpSignalHandler(num_retry++), Math.min(1*(num_retry+1), 5))
                    }
                    else{
                      console.log("WARNING!! unable to connect to the signal!! -> ", this, defs,)
                    }
                  }
                }
                setUpSignalHandler()
              })
            })
          }
          // todo: fattorizzare con le, se possibile!
          if (typologyNamespace === "ctx"){
            Object.entries(defs).forEach(([ctxItem, ctxItemDefs])=>{ // get requested element name
              Object.entries(ctxItemDefs).forEach(([s, fun])=>{
                // exponential retry to handle signal
                const setUpSignalHandler = (num_retry=0)=>{
                  try{
                    // console.log("provo ad agganciare signal", leItem, s)
                    let remover = this.$ctx[ctxItem].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
                  }
                  catch{
                    if (num_retry < 5) {
                      setTimeout(()=>setUpSignalHandler(num_retry++), Math.min(1*(num_retry+1), 5))
                    }
                    else{
                      console.log("WARNING!! unable to connect to the signal!! -> ", this, defs,)
                    }
                  }
                }
                setUpSignalHandler()
              })
            })
          }
        })
      }
    })
    

    // data, TODO: check deps on set, "cached get", support function etc
    if (this.convertedDefinition.data !== undefined){
      Object.entries(this.convertedDefinition.data).forEach(([k,v])=>{

        // finally init!
        this.properties[k].init(
          v,
          ()=>debug.log(k, "getted!!"), 
          (v, ojV, self)=>{ debug.log(k, "setted!!", this); 
            this.signals[k+"Changed"].emit(v, this.properties[k]._latestResolvedValue);
          },
          //()=>{console.log("TODO: on destroy clear stuff and signal!!")}
        )
        debug.log("!!!!!", this, this.properties)
      })
    }

    // attributes, TODO: support function etc
    if (this.convertedDefinition.attrs !== undefined){
      debug.log("attrs ", this.convertedDefinition.attrs)

      // let has2WayBinding = Object.values(this.convertedDefinition.attrs).find(v=>v instanceof Binding) !== undefined
      let _2WayPropertyBindingToHandle = {}

      Object.entries(this.convertedDefinition.attrs).forEach(([k,v])=>{
        
        const toExecMabyLazy = (k)=>{
          debug.log("attr: ", k,v)

          if (k.includes(".")){ // devo andare a settare l'attr as property dinamicamente [nested!]
            console.log("WARNING!!! ATTRS does not support '.' property navigation!!")
          }
          else {
            if (k === "style"){

              const resolveObjStyle = (o)=> typeof o === "object" ? toInlineStyle(o) : o
              const setupStyle = (s)=>{ 
                let val = isFunction(s) ? s.bind(undefined, this.$this)() : s
                if ((val === null || val === undefined)) { 
                  if(this.html_pointer_element.hasAttribute("style")) { 
                    this.html_pointer_element.removeAttribute("style") 
                  }
                } else { 
                  this.html_pointer_element.setAttribute("style", resolveObjStyle( val ).toString())
                } 
              }

              if (isFunction(v)){
                let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machanism..this wil break deps update in future!!!
                debug.log("attr static deps", staticDeps)

                staticDeps.$this_deps?.forEach(d=>{
                  debug.log("pushooooo")
                  this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) ) // questa cosa da rivdere...il who non lo salviam ma in generale ora questa roba deve essere una prop, fully automated!
                }) // supporting multiple deps, but only of first order..

                staticDeps.$parent_deps?.forEach(d=>{
                  debug.log("pushooooo")
                  this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                })

                staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                  debug.log("pushooooo")
                  this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                })

                staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                  debug.log("pushooooo")
                  this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                })

              }
              else {

              }

              setupStyle(v)

            } 
            else if (isFunction(v)){
                const setupValue = ()=>{ 
                  const val = v.bind(undefined, this.$this)(); 
                  if ((val === null || val === undefined)) { 
                    if (this.html_pointer_element.hasAttribute(k)) { 
                      this.html_pointer_element.removeAttribute(k)
                    }
                  } else { 
                    this.html_pointer_element.setAttribute(k, val.toString())
                  } 
                }

                let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
                console.log("attr static deps", staticDeps)

                staticDeps.$this_deps?.forEach(d=>{
                  debug.log("pushooooo")
                  this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                }) // supporting multiple deps, but only of first order..

                staticDeps.$parent_deps?.forEach(d=>{
                  debug.log("pushooooo")
                  this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                })

                staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                  debug.log("pushooooo")
                  this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                })

                staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                  debug.log("pushooooo")
                  this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                })

                setupValue()

            }
            else if (v instanceof Binding){ 
              console.log("binding attr: ", k,v, this)

              const _binding = v;
              v = v.bindFunc

              const setupValue = ()=>{ 
                const val = v.bind(undefined, this.$this)(); 
                if (val !== this.html_pointer_element[k]){ //set only if different!
                  this.html_pointer_element[k] = val?.toString()
                }
                
              }

              let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
              console.log("attr static deps", staticDeps)
              // todo: in realtà è mutualmente escusivo, e solo 1 dep il property binding!
              staticDeps.$this_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.properties[d]
              }) 

              staticDeps.$parent_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.parent.properties[d]
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                debug.log("pushooooo")
                this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                debug.log("pushooooo")
                this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
              })

              // now manually configure the binding
              if ((this.htmlElementType === "input" || this.htmlElementType === "div") && ["value", "checked"].includes(k)){
                if ( ( ! ["button", "hidden", "image", "reset", "submit", "file"].includes(this.convertedDefinition.attrs.type)) ){
                  console.log("2 way bidning, ci sonooooooooo", k, this)
                  let handlerFor2WayDataBinding = (e)=>{ 
                    console.log("changed handled!!")
                    // e.stopPropagation(); 
                    let bindedProps = _2WayPropertyBindingToHandle[k]()
                    let newValue = _binding.remap !== undefined ? _binding.remap.bind(undefined, this.$this)(e.target[k], e) : e.target[k]
                    if(bindedProps.value !== newValue) {
                      bindedProps.value = newValue
                    }
                  }
                  console.log("scelgoooooooo", _binding.event ?? "input", k, this)
                  this.html_pointer_element.addEventListener(_binding.event ?? "input", handlerFor2WayDataBinding)
                  let remover = ()=>this.html_pointer_element.removeEventListener(_binding.event ?? "input", handlerFor2WayDataBinding) // per la destroy..
                }
              }
              else if(this.htmlElementType === "textarea"){
                // todo..in realtà basta anche qui oninput e accedere a .value ...in alternativa textContent.. ma qui ho il problema che non so ancora come settare il valore..visto che in realtà useri text e quindi i child..
              }
              else if(this.htmlElementType === "select" && k === 'value' && this.convertedDefinition.attrs.multiple === undefined){ // todo: multiple is not supported at this time.. https://stackoverflow.com/questions/11821261/how-to-get-all-selected-values-from-select-multiple-multiple
                let handlerFor2WayDataBinding = (e)=>{ 
                  // e.stopPropagation(); 
                  let bindedProps = _2WayPropertyBindingToHandle[k]()
                  let newValue = _binding.remap !== undefined ? _binding.remap.bind(undefined, this.$this)(e.target[k], e) : e.target[k]
                  if(bindedProps.value !== newValue) {
                    bindedProps.value = newValue 
                  }
                }
                this.html_pointer_element.addEventListener(_binding.event ?? "change", handlerFor2WayDataBinding)
                let remover = ()=>this.html_pointer_element.removeEventListener(_binding.event ?? "change", handlerFor2WayDataBinding) // per la destroy..
              
              }
              else if(this.htmlElementType === "details" && k === "open"){
                // todo
              }

              setupValue()

            }
            else {
              if ((v === null || v === undefined)) { 
                if (this.html_pointer_element.hasAttribute(k)) { 
                  this.html_pointer_element.removeAttribute(k) 
                }
              } else { 
                this.html_pointer_element.setAttribute(k, v.toString())
              } 
            }
          }

        }

        if (k.startsWith("@lazy:")){
          console.log("laaaaazyyyyyyy")
          setTimeout(()=>toExecMabyLazy(k.replace("@lazy:", "")), 10)
        }
        else {
          toExecMabyLazy(k)
        }

      })

    //   // todo: vedi https://stackoverflow.com/a/55737231 e/o https://stackoverflow.com/a/51056988
    //   // observer non va a quanto pare..per il discorso che attr e prop sottostanti non viaggiano insieme!
    //   // Now, watch 2 way binded attr for changes (when value is different than ours in property)
    //   if (has2WayBinding){
    //     console.log("has 2 way binding!!")
    //     let observer = new MutationObserver(function(mutations) {
    //       mutations.forEach(function(mutation) {
    //         console.log("something changeddd", mutation)
    //         if (mutation.type == "attributes") {
    //           console.log("attributes changed", mutation)
    //           let bindedProps = _2WayPropertyBindingToHandle[mutation.attributeName]()
    //           if(bindedProps.value !== mutation.target[mutation.attributeName]){ //set only if different! aka is from usr input [or direct html manipulation..]
    //             bindedProps.value = mutation.target[mutation.attributeName]
    //             console.log("setted!!")
    //           } // else, we are editing the value..
    //         }
    //       });
    //     });
    //     observer.observe(this.html_pointer_element, {
    //       attributes: true //configure it to listen to attribute changes
    //     });
    //   }

      // OLD::
      // first: convert as property.. then, create mutation observer, and watch for changes (when value is different than ours in property)

      //   observer = new MutationObserver(function(mutations) {
      //     mutations.forEach(function(mutation) {
      //       if (mutation.type == "attributes") {
      //         console.log("attributes changed", mutation)
      //         if(XXXXX !== mutation.target[mutation.attributeName]){ // aka is from usr input [or direct html manipulation..]
      //           XXXXX = mutation.target[mutation.attributeName]
      //           console.log("setted!!")
      //         } // else, we are editing the value..
      //       }
      //     });
      //   });
      //   observer.observe($.this.el, {
      //     attributes: true //configure it to listen to attribute changes
      //   });
    }


    // attributes, TODO: support function etc
    if (this.convertedDefinition.hattrs !== undefined){
      debug.log("hattrs ", this.convertedDefinition.hattrs)

      let _2WayPropertyBindingToHandle = {}

      Object.entries(this.convertedDefinition.hattrs).forEach(([k,v])=>{
        
        const toExecMabyLazy = (k)=>{

          
          debug.log("attr: ", k,v)

          let _oj_k = k

          if (k.includes(".")){ // devo andare a settare l'attr as property dinamicamente [nested!]

            if (isFunction(v)){
              const setupValue = ()=>{ 
                let [pointer, final_k] = recursiveAccessor(this.html_pointer_element, k.split("."))

                const val = v.bind(undefined, this.$this)(); 
                
                pointer[final_k] = val
              }

              let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
              console.log("attr static deps", staticDeps)

              staticDeps.$this_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              }) // supporting multiple deps, but only of first order..

              staticDeps.$parent_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                debug.log("pushooooo")
                this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                debug.log("pushooooo")
                this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              })

              setupValue()

            }
            else if (v instanceof Binding){ 
              console.log("binding attr: ", k,v, this)

              const _binding = v;
              v = v.bindFunc

              const setupValue = ()=>{ 
                let [pointer, final_k] = recursiveAccessor(this.html_pointer_element, k.split("."))
                const val = v.bind(undefined, this.$this)(); 
                if (val !== this.html_pointer_element[k]){ //set only if different!
                  pointer[final_k] = val
                }
              }

              let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
              console.log("attr static deps", staticDeps)
              // todo: in realtà è mutualmente escusivo, e solo 1 dep il property binding!
              staticDeps.$this_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.properties[d]
              }) 

              staticDeps.$parent_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.parent.properties[d]
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                debug.log("pushooooo")
                this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                debug.log("pushooooo")
                this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
              })


              // now manually configure the binding
              console.log("2 way bidning, ci sonooooooooo", k, this)
              let handlerFor2WayDataBinding = (e)=>{ 
                console.log("changed handled!!")
                // e.stopPropagation(); 
                let bindedProps = _2WayPropertyBindingToHandle[k]()

                let [pointer, final_k] = recursiveAccessor(e.target, k.split("."))

                let newValue = _binding.remap !== undefined ? _binding.remap.bind(undefined, this.$this)(pointer[final_k], e) : pointer[final_k]
                if(bindedProps.value !== newValue) {
                  bindedProps.value = newValue
                }
              }
              console.log("scelgoooooooo", _binding.event ?? "input", k, this)
              this.html_pointer_element.addEventListener(_binding.event ?? "input", handlerFor2WayDataBinding)
              let remover = ()=>this.html_pointer_element.removeEventListener(_binding.event ?? "input", handlerFor2WayDataBinding) // per la destroy..

              setupValue()

            }
            else {
              let [pointer, final_k] = recursiveAccessor(this.html_pointer_element, k.split("."))
              pointer[final_k] = v
            }

          }
          else if (isFunction(v)){
              const setupValue = ()=>{ 
                this.html_pointer_element[k] = v.bind(undefined, this.$this)(); 
              }

              let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
              console.log("attr static deps", staticDeps)

              staticDeps.$this_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              }) // supporting multiple deps, but only of first order..

              staticDeps.$parent_deps?.forEach(d=>{
                debug.log("pushooooo")
                this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                debug.log("pushooooo")
                this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                debug.log("pushooooo")
                this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              })

              setupValue()

          }
          else if (v instanceof Binding){ 
            console.log("binding attr: ", k,v, this)

            const _binding = v;
            v = v.bindFunc

            const setupValue = ()=>{ 
              const val = v.bind(undefined, this.$this)(); 
              if (val !== this.html_pointer_element[k]){ //set only if different!
                this.html_pointer_element[k] = val
              }
              
            }

            let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
            console.log("attr static deps", staticDeps)
            // todo: in realtà è mutualmente escusivo, e solo 1 dep il property binding!
            staticDeps.$this_deps?.forEach(d=>{
              debug.log("pushooooo")
              this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              _2WayPropertyBindingToHandle[k] = ()=>this.properties[d]
            }) 

            staticDeps.$parent_deps?.forEach(d=>{
              debug.log("pushooooo")
              this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              _2WayPropertyBindingToHandle[k] = ()=>this.parent.properties[d]
            })

            staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
              debug.log("pushooooo")
              this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
            })

            staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
              debug.log("pushooooo")
              this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
            })


            // now manually configure the binding
            console.log("2 way bidning, ci sonooooooooo", k, this)
            let handlerFor2WayDataBinding = (e)=>{ 
              console.log("changed handled!!")
              // e.stopPropagation(); 
              let bindedProps = _2WayPropertyBindingToHandle[k]()
              let newValue = _binding.remap !== undefined ? _binding.remap.bind(undefined, this.$this)(e.target[k], e) : e.target[k]
              if(bindedProps.value !== newValue) {
                bindedProps.value = newValue
              }
            }
            console.log("scelgoooooooo", _binding.event ?? "input", k, this)
            this.html_pointer_element.addEventListener(_binding.event ?? "input", handlerFor2WayDataBinding)
            let remover = ()=>this.html_pointer_element.removeEventListener(_binding.event ?? "input", handlerFor2WayDataBinding) // per la destroy..
          


            setupValue()

          }
          else {
            this.html_pointer_element[k] = v 
          }

        }

        if (k.startsWith("@lazy:")){
          console.log("laaaaazyyyyyyy")
          setTimeout(()=>toExecMabyLazy(k.replace("@lazy:", "")), 10)
        }
        else {
          toExecMabyLazy(k)
        }
      })
    }


    // css, TODO: support function etc. occhio 
    if (this.convertedDefinition.css !== undefined){
      if (this.css_html_pointer_element === undefined){
        this.css_html_pointer_element = document.createElement('style');
        document.getElementsByTagName('head')[0].appendChild(this.css_html_pointer_element);
      }

      let rules = []
      
      const renderize_css = ()=>{
        this.css_html_pointer_element.innerText = rules.map(r=>r.value.replaceAll("\n", "").replaceAll("\t", " ").replaceAll("   ", "").replaceAll("  ", " ")).join(" ")
      }

      (Array.isArray(this.convertedDefinition.css) ? 
        this.convertedDefinition.css 
        :
        Object.values(this.convertedDefinition.css)
      ).forEach(rule=>{
        rules.push(
          
          new Property(rule, none, renderize_css, none, ()=>this.$this, (thisProp, deps)=>{
            
            // deps connection logic
            deps.$this_deps?.forEach(d=>{
              this.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ) // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
            }) // supporting multiple deps, but only of first order..

            deps.$parent_deps?.forEach(d=>{
              this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            })

            deps.$le_deps?.forEach(d=>{ // [le_id, property]
              this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            })

            deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
              this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            })

          }, true)
        )
      })

      renderize_css()

    }



    // constructor (if is a use component)
    if (this.isA$ctxComponent && this.convertedDefinition.constructor !== undefined){
      let args = {}
      if (this.oj_definition.init !== undefined){
        Object.entries(this.oj_definition.init).forEach(([p, v])=>{
          args[p] = isFunction(v) ? v.bind(undefined, this.$this) : v // todo: questo è un mezzo errore..perchè in questo modo non ruisciro a parsare le dipendenze nel caso di set di una prop..perchè è già bindata! d'altro canto a me potrebbero servire i valori..qui è da capire..
        })
      }
      this.hooks.constructor = this.convertedDefinition.constructor.bind(undefined, this.$this, args)
    }

    // onInit
    if (this.convertedDefinition.onInit !== undefined){
      this.hooks.onInit = this.convertedDefinition.onInit.bind(undefined, this.$this)
    }

    // afterInit
    if (this.convertedDefinition.afterInit !== undefined){
      this.hooks.afterInit = this.convertedDefinition.afterInit.bind(undefined, this.$this)
    }

    // onUpdate
    if (this.convertedDefinition.onUpdate !== undefined){
      this.hooks.onUpdate = this.convertedDefinition.onUpdate.bind(undefined, this.$this)
    }

    // onDestroy
    if (this.convertedDefinition.onDestroy !== undefined){
      this.hooks.onDestroy = this.convertedDefinition.onDestroy.bind(undefined, this.$this)
    }


    // trigger constructor (if is a component)
    this.isA$ctxComponent && this.convertedDefinition.constructor !== undefined && this.hooks.constructor()

    // trigger init
    this.hooks.onInit !== undefined && this.hooks.onInit()

    // create childs
    this.childs.forEach(child=>child.create())

    // trigger afterInit (lazy..)
    this.hooks.afterInit !== undefined && setTimeout(()=>this.hooks.afterInit(), 1)

  }
  // update(){
  //   this.childs.forEach(child=>child.update())
  // }
  // regenerate(){}
  destroy(){
    this.childs?.forEach(child=>child.destroy())
    this.html_pointer_element?.remove()
    this.css_html_pointer_element?.remove()
    this.css_html_pointer_element=undefined
    try { delete this.$ctx[this.id] } catch {}
    try { delete this.$ctx[this._id] } catch {}
    try { if(this.isMyParentHtmlRoot){ delete this.$le["_root_"] } } catch {}
    try { if(this.isA$ctxComponent){ delete this.$ctx["_ctxroot_"] } } catch {}
    delete this.$le[this.id]

    Object.values(this.signals).forEach(s=>{
      try{s.destroy()} catch{}
    })
    Object.values(this.properties).forEach(p=>{
      try{p.destroy(true)} catch{}
    })

    // todo: destroy properties and signal well..

  }

  static parseComponentDefinition = (definition) => {
    let unifiedDef = { }


    // multi choice def

    let { childs, contains: childs_contains, text: childs_text, ">>":childs_ff, "=>": childs_arrow, _: childs_underscore } = definition
    unifiedDef.childs = childs || childs_contains || childs_text || childs_ff || childs_arrow || childs_underscore
    if (unifiedDef.childs !== undefined && !Array.isArray(unifiedDef.childs)) {unifiedDef.childs = [unifiedDef.childs]}
    // can be: template | string | $ => string | array<template | string | $ => string>


    // standard def

    unifiedDef.state = definition.state || "initial"

    copyObjPropsInplace(definition, unifiedDef, [
      "constructor", 
      "beforeInit", "onInit", "afterInit", "onUpdate", "onDestroy", 
      "signals", "dbus_signals", "on", "on_s", "on_a", 
      "alias", "handle", "css", 
      "states", "stateChangeStrategy", "onState"
    ])



    // maybe private def

    let { 
      id, "private:id": _id, 
      def, "private:def": _def, 
      attrs, "private:attrs":_attrs, 
      a, "private:a": _a, 
      hattrs, "private:hattrs":_hattrs, 
      ha, "private:ha": _ha, 
    } = definition

    unifiedDef.id = id || "TODO: RANDOM ID"
    unifiedDef._id = _id || id || "TODO: RANDOM ID"

    def && (unifiedDef.def = def)
    _def && (unifiedDef._def = _def)
    
    attrs && (unifiedDef.attrs = attrs || a)
    _attrs && (unifiedDef._attrs = _attrs || _a)

    hattrs && (unifiedDef.hattrs = hattrs || ha)
    _hattrs && (unifiedDef._hattrs = _hattrs || _ha)


    
    // maybe private def and multichoice

    let { 
      data, "private:data": _data, 
      props, "private:props": _props, 
    } = definition

    unifiedDef.data = data || props || {}
    unifiedDef._data = _data || _props || {}

    let {meta} = definition

    unifiedDef.meta = meta


    return unifiedDef

  }

  static componentFactory = (parent, template, $le) => {

    let component;

    if ((typeof template === "string") || (typeof template === "function")){
      component = new TextNodeComponent(parent, template)
      return component
    }

    console.log(parent, template)
    let componentType = getComponentType(template)
    let componentDef = (template instanceof UseComponentDeclaration ? template.computedTemplate : template) [componentType]


    if("meta" in componentDef){
      if ("if" in componentDef.meta){ // is a conditionalComponet
        component = new ConditionalComponent(parent, template, $le)
      }
      else if ("swich" in componentDef.meta){ // is a switchConditionalComponent
        component = new SwitchConditionalComponent(parent, template, $le)
      }
      else if ("forEach" in componentDef.meta) { // is a foreach component (IterableViewComponent)
        component = new IterableViewComponent(parent, template, $le)

      }
      else {
        component = new Component(parent, template, $le)
      }
    }
    else {
      component = new Component(parent, template, $le)
    }
  
    return component
  }
  
}

class TextNodeComponent {

  html_pointer_element
  definition
  parent

  // step 1: build
  constructor(parent, definition){
    this.parent = parent

    this.definition = definition
  }


  // step 2: build skeleton (html pointer)
  buildSkeleton(){

    this.buildHtmlPointerElement()

  }

  buildHtmlPointerElement(){

    this.html_pointer_element = document.createTextNode("")
    this.parent.html_pointer_element.appendChild(this.html_pointer_element)

  }

  _renderizeText(){
    this.html_pointer_element.textContent = isFunction(this.definition) ? this.definition.bind(undefined, this.parent.$this)() : this.definition
  }

  staticAnDeps = {} // TEST, DEMO
  analizeDeps(){
    if (typeof this.definition === "function"){
      this.staticAnDeps = analizeDepsStatically(this.definition)
      debug.log("analysis: ", this, this.staticAnDeps)
    }

  }
  // step 3: create and renderize
  create(){
    
    this.analizeDeps()
    debug.log("createeed")

    // todo: questo bugfix va anche da altre parti
    this.staticAnDeps.$this_deps?.forEach(d=>"addOnChangedHandler" in this.parent.properties[Array.isArray(d) ? d[0] : d] && this.parent.properties[Array.isArray(d) ? d[0] : d].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps
    this.staticAnDeps.$parent_deps?.forEach(d=>"addOnChangedHandler" in this.parent.parent.properties[Array.isArray(d) ? d[0] : d] && this.parent.parent.properties[Array.isArray(d) ? d[0] : d].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps
    this.staticAnDeps.$le_deps?.forEach(d=>"addOnChangedHandler" in this.parent.$le[d[0]].properties[d[1]] && this.parent.$le[d[0]].properties[d[1]].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps
    this.staticAnDeps.$ctx_deps?.forEach(d=>"addOnChangedHandler" in this.parent.$ctx[d[0]].properties[d[1]] && this.parent.$ctx[d[0]].properties[d[1]].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps

    this._renderizeText()
    
  }

  // update(){
  //   this.childs.forEach(child=>child.update())
  // }

  // regenerate(){}
  destroy(){
    this.html_pointer_element.remove()
  }

}



class ConditionalComponent extends Component{
  visible = false

  html_pointer_element_anchor

  constructor(...args){
    super(...args)

  }

  // generate the comment/anchor for the real conditional element (that will be create "after" the anchor)
  buildHtmlPointerElementAnchor(){
    
    this.html_pointer_element_anchor = document.createComment("le-if")

    if (this.isMyParentHtmlRoot){
      this.parent.appendChild(this.html_pointer_element_anchor)
    }
    else {
      this.parent.html_pointer_element.appendChild(this.html_pointer_element_anchor)
    }
  }

  // overwrite to do not execut during creation..execpt for the generation of the "anchor", a pointer in the DOOM where we inserte later the real node (if condition is meet)
  // @overwrite
  buildSkeleton(){  this.buildHtmlPointerElementAnchor()  }
  // @overwrite
  buildChildsSkeleton(){ }

  // overwrite to insert the real component after the "anchor", instead of the "append" on child
  // @overwrite
  buildHtmlPointerElement(){

    if ( this.isObjComponent ){

      this.html_pointer_element = document.createElement("obj")

    }
    else {

      this.html_pointer_element = document.createElement(this.htmlElementType)

      this.html_pointer_element_anchor.after(this.html_pointer_element)

      console.log("inserted after commenttttttt!!!!")

    }

  }

  // real "create", wrapped in the conditional system
  _create(){
    console.log("sto per ricreare", this)
    super.defineAndRegisterId()
    super.buildSkeleton()
    super.buildChildsSkeleton()
    super.create()
  }
  // @overwrite
  create(){
    this.buildPropertiesRef()
    // step 1: geenrate If property, and configure to create (that build) or destry component!
    this.visible = new Property(this.convertedDefinition.meta.if, none, (v, _, prop)=>{ console.log("seeeetttinnggggggg", v, _, prop); if (v !== prop._latestResolvedValue) { v ? this._create() : this._destroy() } }, pass, ()=>this.$this, (thisProp, deps)=>{

      console.log("calculating deeeeeepsssssss!!!!!")
      // deps connection logic
      deps.$parent_deps?.forEach(d=>{
        debug.log("pushooooo")
        this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
      })

      deps.$le_deps?.forEach(d=>{ // [le_id, property]
        debug.log("pushooooo")
        this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
      })

      deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
        debug.log("pushooooo")
        this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
      })
    }, true)

    console.log("ultimooooooooooo", this, this.convertedDefinition.meta.if)
    // try {
      this.visible.value && this._create()
    // }
    // catch {
    // }

  }

  _destroy(){
    super.destroy()
  }

  // real destroy
  destroy(){
    this.html_pointer_element_anchor.remove()
    this.visible.destroy(true)
    super.destroy()
  }

}

class SwitchConditionalComponent extends Component{
  visible = false
}


class IterableComponent extends Component{
  
  constructor(parent, definition, $le, parentIterableView, iterableIndex, meta_config){
    super(parent, definition, $le)

    this.parentIterableView = parentIterableView
    this.iterableIndex = iterableIndex
    this.meta_config = meta_config

    this.meta[this.meta_config.iterablePropertyIdentifier] = new Property(this.meta_config.value, none, none, none, ()=>this.$this, none, true)
    if (this.meta_config.define !== undefined){
      // define:{ index:"idx", first:"isFirst", last:"isLast", length:"len", iterable:"arr" }
      Object.entries(this.meta_config.define).forEach(([define_var, dev_var_name])=>{
        this.meta[dev_var_name] = new Property(this.meta_config.define_helper[define_var], none, none, none, ()=>this.$this, none, true)
        // console.log("ho delle define nel meta!!", this.meta, define_var, dev_var_name, this.meta_config.define)
      })
    }
    // console.log("prima del meta", this.$meta, this.parent.$meta, this.meta, this.parent.meta, this.parent)
    this.$meta = this.getMy$meta() // rebuild
    // console.log("dopo del meta", this.$meta, this.parent.$meta, this.meta, this.parent.meta, this.parent)
  }

  // ridefinisco la crezione dell'html pointer, e definisco anche se devo autoeliminarmi..o ci pensa il parent
  // @overwrite, delegate html el construction to the Iterable View Hanlder (real parent)
  buildHtmlPointerElement(){

    this.parentIterableView.buildChildHtmlPointerElement(this, this.iterableIndex)

  }
  // la destroy funziona già bene, perchè rimuoverò me stesso (pointer)..!

}

class IterableViewComponent{
  iterableProperty
  iterablePropertyIdentifier

  parent
  $le

  oj_definition
  real_iterable_definition
  meta_def

  properties = {} // only for the "of" execution context, as child instead of parent!
  $this
  $parent

  childs = []

  html_pointer_element_anchor
  html_end_pointer_element_anchor

  // step 1: build
  constructor(parent, definition, $le){
    this.parent = parent
    this.$le = $le

    this.oj_definition = definition
    this.meta_def = ((definition instanceof UseComponentDeclaration ? definition.computedTemplate : definition)[getComponentType(definition)]).meta
    this.real_iterable_definition = (definition instanceof UseComponentDeclaration ? definition.cloneWithoutMeta() : cloneDefinitionWithoutMeta(definition))
  }

  // generate the comment/anchor for the real conditional element (that will be create "after" the first or "before" the last "anchor")
  buildHtmlPointerElementAnchor(){
    
    this.html_pointer_element_anchor = document.createComment("le-for")
    this.html_end_pointer_element_anchor = document.createComment("le-for-end")

    if (this.isMyParentHtmlRoot){
      this.parent.appendChild(this.html_pointer_element_anchor)
      this.parent.appendChild(this.html_end_pointer_element_anchor)
    }
    else {
      this.parent.html_pointer_element.appendChild(this.html_pointer_element_anchor)
      this.parent.html_pointer_element.appendChild(this.html_end_pointer_element_anchor)
    }
  }

  buildChildHtmlPointerElement(child, childIndex){

    child.html_pointer_element = document.createElement(child.htmlElementType)

    this.html_end_pointer_element_anchor.before(child.html_pointer_element)
    // todo, child index to insert in right position
  }

  // step 2: build skeleton (only the anchors & exec context for 'of' evaluation!)
  buildSkeleton(){

    this.buildHtmlPointerElementAnchor()
    
    this.buildPropertiesRef()

  }

  // properties to execute "of" clausole as subel (always child point of view!)
  buildPropertiesRef(){

    // here super simplyfied execution context! only parent, le, and my parent ctx & meta is allowed..ob how can i refer to this if this does not exist already?

    // TODO: meta anche qui..

    this.properties.parent = this.parent?.$this?.this

    this.$parent = (this.parent instanceof Component) ? ComponentProxy(this.parent.properties) : undefined
    this.$this = ComponentProxy({parent: this.$parent, le: this.$le.proxy, ctx: this.parent.$ctx.proxy, meta: this.parent.$meta})
  }


  //@override, per utilizzare nella Factory this.parent come parent e non this. inoltre qui in realtà parlo dei children come entità replicate, e non i child del template..devo passare una versione del template senza meta alla component factory! altrimenti errore..
  // in realtà dovrebbe essere un "build child skeleton and create child"
  buildChildsSkeleton(){
    this._destroyChilds()

    // todo, algoritmo reale euristico, che confronta itmet per item (via this.iterableProperty.value._latestResolvedValue[idx] !== arrValue)
    this.childs = (this.iterableProperty.value?.map((arrValue, idx, arr)=>new IterableComponent(this.parent, this.real_iterable_definition, this.$le, this, idx, {iterablePropertyIdentifier: this.iterablePropertyIdentifier, value: arrValue, define: this.meta_def.define, define_helper: {index: idx, first: idx === 0, last: idx === arr.length-1, length: arr.length, iterable: arr}})) || [] )

    // devo sicuramente fare una roba come per il conditional..un componente che estende component, perchè devo per forza gestire meglio la parte di append all'html pointer..

    this.childs.forEach(child=>child.buildSkeleton())
    this.childs.forEach(child=>child.create())

  }

  _destroyChilds(){
    if (this.childs.length > 0){
      this.childs.map(c=>c.destroy())
      this.childs = []
    }
  }

  // real "create", wrapped in the conditional system
  _create(){
    console.log("sto per ricreare", this)
    this.buildChildsSkeleton()
  }

  // @overwrite
  create(){

    // step 1: generate Of clausole property, and configure to create (build) or destry component!
    this.iterablePropertyIdentifier = this.meta_def.forEach

    this.iterableProperty = new Property(
      this.meta_def.of, 
      none, 
      (v, _, prop)=>{ 
        console.log("seeeetttinnggggggg iterablee", v, _, prop); 
        if (v !== prop._latestResolvedValue) { 
          this._create()
        } 
      }, 
      pass, 
      // aggancio gli autoaggiornamenti della property per far in modo che la set vada a buon fine senza una "set" reale e diretta
      ()=>this.$this, (thisProp, deps)=>{

        console.log("calculating deeeeeepsssssss!!!!!")
        // deps connection logic
        deps.$parent_deps?.forEach(d=>{
          debug.log("pushooooo")
          this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        })

        deps.$le_deps?.forEach(d=>{ // [le_id, property]
          debug.log("pushooooo")
          this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        })

        deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
          debug.log("pushooooo")
          this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        })
      }, 
      true
    )

    console.log("ultimooooooooooo", this, this.meta_def.of)
    
    // try {
    this.iterableProperty.value.length > 0 && this._create()
    // }
    // catch {
    // }

  }
  destroy(){
    this._destroyChilds()

    this.html_pointer_element_anchor.remove()
    this.html_end_pointer_element_anchor.remove()

    this.iterableProperty.destroy(true)

  }

}






// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// TESTING

// todo: analisi dipendenze funzioni (in cascata..ovvero se uso func le "importo")..qui il senso è NON rielaborare la funzione ad ogni changes delle deps, ma segnalare le deps, in modo che le property che veramente la usano e devono autoupdatarsi possono agganciarsi alle deps..in modo da "far funzionare l'auto aggiornamento" in quanto il signal delle deps delle func farà si che si uppi la prop/text etc che la segue e tutto funge. in cascata perchè se uso altre func devo agganciarmi a tutto. 
// todo: una cosa molto figa che viene fuori da questa cosa è che posso anche "sandboxare" altre dipendenze , ovvero: se scrivo in una def tipo "myVarDeps": $ => ($.this.dep1, $.this.dep2..., "") posso usarla in un text o una property o qualsiasi altra cosa e stabilire le deps a piacimento (non so se veramnete utile..)

// todo: il bugfix dei text node va anche da altre parti..ovvero di avere $.this.miavar.something.. il parser restituisce [miavra, something] e non miavar..qui devo fozare di prendere [0]..alternativa farlo bene perchè in effetti potrei bindarmi a tutto..e poi mi serve per la catena dei parent

// todo: "smart component", ovvero la possibilità di scrivere {div: "mio text"} e in automatico venga parsata in modo corretto con l'autoespansione in {div: { text: "mio text" }}

// todo: lanciare eccezioni quando parso dei componenenti (anche Use) con nome di proprietà non conosciuti! magari regole di similarità per hint su cosa si voleva scrivere!

// todo: "re_emit_as" -> combina in automatico la possibilità di gestire un segnale e rialnciarlo con un altro nome..per propagare i sengali! ovviamente devo inserire il nome di un mio segnale e non di altri.. potrebbe avere senso avere una sentinel del tipo "NewSignal("xxx") per indicare un nuovo segnale ? eìsenza stare a dichiaraare 2 volte..per easy propagation..

// todo: "SelfStyle" o altro meccanismo per esplicitare hoisting del css..vedi su..alternativa andare di replace e tutto è "pubblico" (aka ng-deep) di default..in questo caso è compito dello sviluppatore inserire un "replacer" che indica all'engine che quella classe è "locale"
// todo: tutti gli elementi devono avere un attributo che mappa un identificativo univoco dell'elemento (stabile nel tempo, anche per gli ng-if e ng-for) per poter aiutare l'hoisting..

// todo: al momento la catena dei parent non è contemplata nella risoluzione delle dipendenze..migliorare

// todo: anche se abbiamo fatto una prima versione di le-for, in realtà molto è da fare..al momento distruggo e ricreo, e dunque non posso neanche legarmi agli aggiornamenti delle property in meta..anche perchè non è semplice recuperare il who/what id-metaOfComponent. anche perchè i componenti non sopravvivono mai ad un aggiornamento!
// todo: le-for e le-if: se qualcuno seguiva qualche proprità e distruggo, devo riagganciare al rebuild!

// todo: le dipendenze in cascata devono avere il meccanismo della retry, altrimenti al primo undefined ciaone
// todo: destroy delle dipendenze, properties, signal, attr etc alla destroy!

// todo: state

// todo: i Model/Controller (object) devono poter definire css? sarebbe mooolto utile, in quanto sarebbe il modo naturale (magari via Css) per definirlo, integrando anche l'auto update dei dati..ovvero le classi possono dipendere dai dati e quinid non devo più aggiornare la classe css dell'elemento, ma una property, che in cascata aggiornerà tutto. questo porta alla necessità di avere gli ng-if anche per gli object in modo obbligatorio! [done]

// todo: dipendenze delle def..perchè al momento non posso usare in una Property e avere l'autoaggiornamneto

// todo: private..come realizzo il meccanismo dei private? name mangling in python style? (più semplice ma "inutile") o reale (e quindi tentare di capire come filtrare le properties visibili..)

// todo: anche se non voglio farlo, potremmo usare un meccanismo per gestire anche le cose dei figli senza usare il nome..la prima cosa è andare alla angular maniera..ovvero aggiungere dettagli nel meta quando definisco un componente..in questo modo non ho problemi e posso risalire facile! -- altrimenti un qualcosa tipo  " on: {this: Child(0, {dataChanged: $=>...})} "..occhio che deve essere lazy!! o fatto dopo i child..
// ---v
// todooo: in realtà la cosa migliore sarebbe utilizare una nomencalutura particolare per tutti i figli (che non hanno definito un id e un _id). ovvero dare il nome del padre + indice figlio (contanto eventuale figli con nome as ++) es: Root => [ undefeined => [undefined], myElementName, undefined ] diventerebbe: Root => [Root_cld_0 => [Root_cld_0_cld_0], myElementName, Root_cld_2]  oppure: Root => [Root.0 => [Root.0.0], myElementName, Root.2]
// un'altra cosa figa di questa cosa è che ora possiamo avere il "full name", ovvero il nome completo di un elemento, come Root.Root_cld_0.Root_cld_0_cld_0  oppure  Root.0.0 (prendendo solo index)
// todo: quindi a questo punto gli elementi dovrebbero stare anche anche in una property "child", accessibile sia come array che by name (realizzabile tramite "proxy", tenendo gli elementi come dict [solo se unordered] altrimenti come array)

// todo: per la comunicazion "child to parent" potremmo srubacchiare da angular..ovvero nuova proprietà oltre id e _id in cui dichiaro il nome del children dal punto di vista del parent (e solo di lui! come quando in angular dichiari un #nome, ma li va per "contesto" ovvero il nostro ctx), quindi ogni parent avrà un nuovo $.child.XXXNAMEXXX da poter usare e di conseguenza ovunque..ovviamente è un extra rispetto a quanto definito

// todo: iniziare a pensare alla questione che posso definire e usare anche pezzi dei children nel parent (se quello di sopra dovesse realizzarsi), in partiolare gli alias..portano dritto questo problema alla luce

// todo: potrebbe essere più semplice per il discorso "padre deve seguire il figlio senza replace/merge" definire nella "Use" una parte specifica dove posso definire delle "add" in modo da non compromettere il funzionamento di un componente..e quindi poter definire delle "on" etc che si aggiungono e non sovrappongono (basta duplicare on etc per la Use in una nuova property)
// todo/note: come fare per fare in modo che un padre possa operare su un child senza nome? (neanche di contesto) opz 1: proprietà child come array (ma questo richiede la specifica di un estrapolatore etc, nonchè una nuova logica per gestire tutte le paturnie degli array..es: [x], find.. etc etc..). opzione 2: ogni elemento che ha figli ha al suo interno delle proprità "_child_XXX" con XXX numero/indice del child. essendo proprietà a tutti gli effetti potrei seguirle e bona, e al suo interno ci troverei il suo $this. per poter tenere in piedi il meccanismo di estrapolazione deps dovrei realizzare un $.childs.c_xxx

// todo: iniziare a strutturare come funziona "meta" lato dev, nel senso che il mio meta è in realtà l'insieme di tutti i meta dei miei parent (nello stesso componente? in teoria si, perchè il il compoente è entità "atomica", non dividibile, quindi dentro e fuori non si "conoscono") compreso il mio..a questo punto tutto deve andare con retry incrementale?

// todo: visto che il punto di vista nella redefine dei componenent è sempre se stessi..quando faccio una use component non posso in alcun modo usare $.ctx per riferirmi al mio contesto visibile al momento della definizione..quindi forse ho due "problemi", il primo è che i context dovrebbero essere inclusivi (ovvero il mio as subchild è l'insieme del mio e di tutti quelli sopra di me. in alternativa devo avere il concetto di "supctx" ovvero ctx di mio padre (che deve rimanere tale anche per i miei child interni al componente). in effetti è semplice da fare, sostanzialmente è: this.getMyCtx().parent.getMyCtx()). in alternativa devo poter andare in cascata come per parent..

// todo (old?): ng if, ng for, ng switch.. => per poter fare questa cosa c'è bisogno di un refactoring abbastanza importante, affiche ogni componente sia di fatto un contenitore per N elementi. questa è la base. per i componenti nomrmali ho solo 1 elemento, mentre per gli ngfor ne ho N. questo è l'uncio modo per poter continuare ad andare in questa direzione. altrimenti l'albero perde completamente di senso, a meno di non creare una sorta di "wrapper" per tutte le proprietà e quindi far diventare trasparente quell'operazione
// di fatto questa visione torna con l'originale dell'idea di avere dei "pointer html" via commento. ovvero ho un albero di componenti virtuali, nella quale in ogni fogli posso avere un albero di componenti reali. i cui sottocomponenti sono ancora una volta virtuali.
// in alternativa: devo agire a livello di factory..creando un qualcosa che wrappa ma solo per l'ng for..visto che switch e if sono già ok..ma a quel punto il controllo della situazione chi ce l'ha??



//// note: tutto è un signal: ovvero le prop hanno dei signal associati (signal particolari, che portano con se il vecchio e il nuovo valore al triggher.. ergo: on, on_s e on_a sono solo degli alias (sovrapponibili a differenza di children etc) che servono allo sviluppatore pià che altro.
// conseguenza esistono solo due cose da gestire: i dati (le property) e i signal. da qui va da se che anche gli attr sono property, con tutto quello che ne derive (signal etc)

// note: forse per le-for la cosa migliore è andare con una classe sentinel apposita, ForEach($=>blabla, {options}, {...component to repeat..}) perchè altrimenti devo eliminare dal meta prima di replicare e non è facile..a quel punto nella factory ricevo la sentinel e creo la classe che wrappa come pensavo in modo semplice..riutilizzando molto codice


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
      "private:id": "myCtxRoot",

      data: {
        todo: ["todo1", "todo2", "todo3"]
      },

      "=>" : [

        { button: { 
          "private:id": "removeBtn",

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
            "private:id": "listPresenter",

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

  const app_root = RenderApp(document.body, {
      div: { 
          data: { counter: 10 },

          def: {
            incCounter: $ => $.this.counter = $.this.counter+2
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

      // simulate data
      afterInit: $ => {
        $.le.model.add("Some stuff..", true)
        $.le.model.add("Other things")
        $.le.model.add("Kind of magic!", true)
      }
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

// app0()
// test2way()
// appTodolist()
// appTodolistv2()
// appNestedData()
// appPrantToChildComm()
// appTestCssAndPassThis()

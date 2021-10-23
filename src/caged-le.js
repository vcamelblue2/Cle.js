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
// todo: funzione F in cui dichiarare una lambda e le sue deps (per magheggi strani..) ---> const f = (lambda, deps=[])=>...   ---> { div: {text: f($ => $.le.qualcosa.prop + 123, ["le.qualcosa.prop"])}}


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

    dbus_signals: { // qui definiamo i segnali globali..un modo per creare uno stream su un canale comune con un compagno che non riesco a raggiungere facilmente "by name", e che entrambi conosciamo
      iEmitThisGlobalSignal_UniqueName: "stream => (int: counter status)"
    }

    "private:"? data | props: {
      name: "counter 1",
      counter: 0,
    },

    on: { // on props | alias changes
      this: {
        counterChanged: ($, newCounter, oldCounter) => console.log($.counter),
      }, 
      parent: ...
      le: ..byname.. : {props | alias changed},
      ctx: ...qui mettiamo solo i nomi dei sub_componenti + this di questo componente! 
      // ci vorrebbe anche un $.subel, (un array, non obj con in le) in cui è possibile filtrare by type: es $.subel.get("div")[0]..oppure il concetto di tref di le..o magari questa in realtà con ctx si risolve..
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

    on_a {
      this: {
        "class" | "style.width" : $ => ... 
      }
      ... come sopra
    },

    // todo: valutare anche i "transoformer/reducer" in quanto con il sistema di auto change propagation per fare una op in blocco dovrei avere un mega stato..ma poi ho il problema che ci sono troppi update inutili..i reducer/transformer aiuterebbero!


    "private:"? def: {
      resetCounter: $ => {
        $.counter = 0
        $.counterReset.emit()
      }, 

      utils: { // def namespace example
        toUppercase: ($, txt) => txt.toUppercase()
      }
    },

    alias: { // nice to have, alias, per permettere di vedere all'esterno alcune proprietà interne e ridefinirle con la use senza toccare la logica o via prop extra!
      ctx: {
        counter_txt: $ => $.ctx.counter_value.text
      }
    }

    "private:"? attrs | a : { // html attr  -> // altri nomi possibili: "has" | "viewProps" | "</>" P.S: qui magari veramente che potrebbe starci il fatto che qualsiasi altra cosa che non sia tra quelle descritte da noi diventa un attribute o un $.this.el.XXX

      style: {
        width: 200,
        height: $ => 200
      }, // oppure style: $ => ({ width... }) su questo devo ancora ragionare..

      class: "someclass"
    
      // todo: style e class devono stare separati?? in roba apposita? in teoria si..perchè così potremmo anche andare a utilizzarli per creare l'anchors system definitivo..visto che starebbero in qualcosa di separato è anche più facile la sovrascrittura..
    },
    // NB: ricordarsi che è possibile osservare i changes degli attributi tramite un semplicissimo "mutationObserver"..questo ci permette di fare il 2 way binding in modo super semplice! infatti basta fare questa cosa: https://stackoverflow.com/a/41425087 unita al una classe che usiamo come trap per configurare il 2 way binding! ovviamente dovrà essere possibile configurare anche solo il flusso attr to property, in modo p.es da bindre la select a una nostra property in modo unidirezionale


    // hAttr ... "harmfulAttr" todo, capire se ha senso..in pratica qui non settiamo via "setAttribute", ma direttamente via this.el.xxxx = 


    handle: { // html event
      onclick: ($, e) => $.count++
    },

    define_css: ".class { bla:bli ... }" // todo..magari qualcosa di più complesso..come hoisting (via replacer, o anche per i subel), or namaed definition (tipo le)

    states: {
      // "initial": "this", // implicit, always chang

      "bigger": { // 

        attrs: {
          style: {
            width: 400
          }
        }
      }

    },

    state: "initial" // optional different starting state
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


      { Model | Controller: { // OBJECT
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
"attrs", "private:attrs", "a", "private:a", define_css, states, state, stateChangeStrategy, onState, contains | childs | text | '>>' | '=>' | _???



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

    { div: { meta: [{ forEach:"todo",  of: $ => $.parent.todolist, ,  index:"idx", first:"isFirst", last:"isLast", length:"len", key/comparer: el=>... }], // opzionale, per fare es Obj.keys --> extractor:($, blabla)=>Object.keys(blabla)
      
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
    { div: { meta: { swich: $ => $.ctx.root.todolist.length, cases: new Map([
        [($, len) => len > 50, { div: { text: "ohhh nooo, hai molti todo"} }]
        [($, len) => len == 0, { div: { text: "hurrraaa, non hai nulla da fare!"} }]
        ["default", undefined]
      ])},
    }},

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
const pass = undefined
const none = ()=>undefined


// utils
const copyObjPropsInplace = (copy_from, copy_into, props) => {
  Object.keys(copy_from).forEach(p=>{
    if (props.includes(p)){
      copy_into[p] = copy_from[p]
    }
  })
}

const toInlineStyle = /** @param {CSSStyleDeclaration | ()=>CSSStyleDeclaration} styles - use "::" on single style name to specify no name translation! */(styles)=>{ 
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


// Framework

class Property{
  constructor(valueFunc, onGet, onSet, onDestroy, executionContext, registerToDepsHelper, init=true){
    // execution context per fare la bind poco prima di chiamare (o per non bindare e chiamare direttamente..)
    // "registerToDepsHelper..un qualcosa che mi fornisce il parent per registrarmi alle mie dpes..in modo da poter settare anche altro e fare in modo da non dover conoscere il mio padre, per evitare ref circolari"
    this.executionContext = (Array.isArray(executionContext) ? executionContext : [executionContext]).map(ec=>isFunction(ec) ? ec : ()=>ec) // interface for "dynamic execution context"..wrap in lambda aslo if not passed..
    this.registerToDepsHelper = registerToDepsHelper
    this.onChangedHandlers = []
    this.dipendency = undefined
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
  }
  removeHandler(who){
    this.handlers = this.handlers.filter(h=>h.who !== who)
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


//const Use = (component, redefinition, initialization_args=$=>({p1:1, p2:"bla"}), passed_props= $=>({prop1: $.this.prop1...}) )=>{ 
const Use = (component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined }={})=>{ return new UseComponentDeclaration(component, redefinitions, { strategy:strategy, init:init, passed_props:passed_props } ) } // passed_props per puntare a una var autostored as passed_props e seguirne i changes, mentre init args per passare principalmente valori (magari anche props) ma che devi elaborare nel construct
// todo: qui potrebbe starci una connect del signal con autopropagate, ovvero poter indicare che propago un certo segnale nel mio parent! subito dopo la redefinitions, in modo da avere una roba molto simile a quello che ha angular (Output) e chiudere il cerchio della mancanza di id..
// di fatto creiamo un nuovo segnale e lo connettiamo in modo semplice..nel parent chiamo "definePropagatedSignal"
// perdo solo un po di descrittività, in favore di un meccanismo comodo e facile..

// nella init il punto di vista del this E' SEMPRE IL MIO

class UseComponentDeclaration{
  constructor(component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined }={}){
    this.component = component
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

    this.proxy = new Proxy(this, {
      get: function (target, prop, receiver){
        console.log(target, prop, target[prop], target[prop].$this.this)
        return target[prop].$this.this
      }
    })

  }
}



const RenderApp = (html_root, definition)=>{

  let component_tree_root = new ComponentsTreeRoot(html_root, definition)
  component_tree_root.initAndRenderize()

  return component_tree_root

}


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


  // Frontend for Dev
  $this  // ComponentProxy -> binded on user defined function, visible to the dev as $.this
  $parent // ComponentProxy ==> in realtà è this.parent.$this, visible to the dev as $.parent
  $le // ComponentsContainerProxy - passed, visible to the dev as $.le
  $ctx // ComponentsContainerProxy - created if is a ctx_component, visible to the dev as $.ctx
  isA$ctxComponent = false
  // $bind // ComponentProoxy -> contains the property as "binding"..a sort of "sentinel" that devs can use to signal "2WayBinding" on a property declaration/definition, visible to the dev as $.bind, usefull also to define intra-property "alias"
  $dbus 
  $meta


  htmlElementType
  isObjComponent
  html_pointer_element
  html_end_pointer_element // future use, per i componenti dinamici e liste..

  // step 1: build
  constructor(parent, definition, $le){
    this.isA$ctxComponent = ((definition instanceof UseComponentDeclaration) || !(parent instanceof Component))
    this.parent = parent
    this.isMyParentHtmlRoot = (parent instanceof HTMLElement) // && !((parent instanceof Component) || (parent instanceof UseComponentDeclaration)) // if false it is a parent HTML node

    this.$le = $le
    this.$ctx = this.getMy$ctx()

    this.oj_definition = definition

    this.htmlElementType = getComponentType(definition)
    this.isObjComponent = ["Model", "Controller"].includes(this.htmlElementType)
    this.convertedDefinition = Component.parseComponentDefinition( (definition instanceof UseComponentDeclaration ? definition.computedTemplate : definition) [this.htmlElementType])

    this.id = this.convertedDefinition.id
    this._id = this.convertedDefinition._id

    if (this.id !== undefined){
      this.$le[this.id] = this
      this.$ctx[this.id] = this
    }
    if (this._id !== undefined){
      this.$ctx[this._id] = this
    }

  }
  
  // step 2: build skeleton (html pointer and child)
  buildSkeleton(){

    this.buildHtmlPointerElement()


    this.buildChildsSkeleton()

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


  // step 3: create and renderize
  create(){
    // t.b.d
    this.properties.el = this.html_pointer_element // ha senso??? rischia di spaccare tutto..
    this.properties.parent = this.parent?.$this?.this // ha senso??? rischia di spaccare tutto.. recursive this.parent.parent & parent.parent le.x.parent.. etc..

    // todo: qualcosa del genere per gli attr
    // this.properties.attr = ComponentProxy(this.attrProperties)

    // todo: parent and le visible properties only..
    this.$parent = (this.parent instanceof Component) ? ComponentProxy(this.parent.properties) : undefined
    this.$this = ComponentProxy(/*new ComponentProxySentinel(*/{this: ComponentProxy(this.properties), parent: this.$parent, le: this.$le.proxy, ctx: this.$ctx.proxy /*, dbus: this.$dbus, meta: this.$meta*/} /*)*/ ) //tmp, removed ComponentProxySentinel (useless)

    // mettere private stuff in "private_properties" e "private_signal", a quel punto una strada potrebbe essere quella di avere un "private_this" qui su..ma in teoria dovrebbe essere qualcosa di context, e non solo in me stesso..

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
        let manualMarkSignalName = "_"+k+"_changed" // nome visible ai dev per marcare manualmente la property come changed
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
              this.signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
            })
          }
          if (typologyNamespace === "parent"){
            Object.entries(defs).forEach(([s, fun])=>{
              this.parent.signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
            })
          }
          if (typologyNamespace === "le"){
            Object.entries(defs).forEach(([leItem, leItemDefs])=>{ // get requested element name
              Object.entries(leItemDefs).forEach(([s, fun])=>{
                // exponential retry to handle signal
                const setUpSignalHandler = (num_retry=0)=>{
                  try{
                    // console.log("provo ad agganciare signal", leItem, s)
                    this.$le[leItem].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
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
                    this.$ctx[ctxItem].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
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
      Object.entries(this.convertedDefinition.attrs).forEach(([k,v])=>{
        debug.log("attr: ", k,v)
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
        else {

          if (isFunction(v)){
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
      })

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
    this.childs.forEach(child=>child.destroy())
    this.html_pointer_element.remove()
    try { delete this.$ctx[this.id] } catch {}
    try { delete this.$ctx[this._id] } catch {}
    delete this.$le[this.id]
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
      "alias", "handle", "define_css", 
      "states", "stateChangeStrategy", "onState"
    ])



    // maybe private def

    let { 
      id, "private:id": _id, 
      def, "private:def": _def, 
      attrs, "private:attrs":_attrs, 
      a, "private:a": _a, 
    } = definition

    unifiedDef.id = id || "TODO: RANDOM ID"
    unifiedDef._id = _id || id || "TODO: RANDOM ID"

    def && (unifiedDef.def = def)
    _def && (unifiedDef._def = _def)
    
    attrs && (unifiedDef.attrs = attrs || a)
    _attrs && (unifiedDef._attrs = _attrs || _a)


    
    // maybe private def and multichoice

    let { 
      data, "private:data": _data, 
      props, "private:props": _props, 
    } = definition

    unifiedDef.data = data || props || {}
    unifiedDef._data = _data || _props || {}


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

    this.staticAnDeps.$this_deps?.forEach(d=>this.parent.properties[d].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps
    this.staticAnDeps.$parent_deps?.forEach(d=>this.parent.parent.properties[d].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps
    this.staticAnDeps.$le_deps?.forEach(d=>this.parent.$le[d[0]].properties[d[1]].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps
    this.staticAnDeps.$ctx_deps?.forEach(d=>this.parent.$ctx[d[0]].properties[d[1]].addOnChangedHandler(this, ()=>this._renderizeText())) // take it easy for now..one deps

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
}

class SwitchConditionalComponent extends Component{
  visible = false
}

class IterableViewComponent{
  visible = false
}






// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// TESTING


// TODO: Mutation Observer to handle 2wayPropertyBinding

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

//// TODO OOOOO: tutto è un signal: ovvero le prop hanno dei signal associati (signal particolari, che portano con se il vecchio e il nuovo valore al triggher.. ergo: on, on_s e on_a sono solo degli alias (sovrapponibili a differenza di children etc) che servono allo sviluppatore pià che altro.
// conseguenza esistono solo due cose da gestire: i dati (le property) e i signal. da qui va da se che anche gli attr sono property, con tutto quello che ne derive (signal etc)

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
          
          onInit: $ => {
            console.log("heeeeeey sono visibile solo nel contestooooo", $.ctx, $.ctx.myCtxRoot, $.le)
          }
      }}

    ]

  }
}

console.log(
RenderApp(document.body, {
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
            { div: { "=>": { div: { "=>": { div: { "=>": {div: { afterInit: $ => console.log("ooooooooooooooooo", $.this, $.this.parent.parent.parent.parent.counter, $.this, $.parent.parent.parent.parent.counter)}}}}}}}}

        ] 
    }
})
)





// TODO LIST DEMO
/*
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
        setTimeout(()=>{
          $.le.input.text = ""
          $.le.input.el.value = ""
        }, 1)
      }
    },
    
    on_s: { le: { input: {
      newInputConfirmed: $ => {
        $.this.addTodoFromInput();
      }
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

		attrs: {
			value: $ => $.this.text
		},

		handle: {
			oninput: ($, e) => { $.this.text = e.target.value },
      
			onkeypress: ($, e) => { e.key === "Enter" && $.this.newInputConfirmed.emit($.this.text) },
		},

	}
}

const AddTodoButton = { 
  button: {  
    text: "Add Todo", 
    handle: { onclick: $ => $.le.controller.addTodoFromInput() },
  }
}

const ReGenTodoView = $ => {

    let $$ = $

    $.this.oldRenderized?.destroy()
    $.this.el.innerText = "" // simple clear all content..[without remove handlers etc..] to be sure all is clear!

    $.this.oldRenderized = RenderApp($$.this.el, {
      
      div: { 
        "=>": $.le.model.todolist.map( todo => ( {
          
          div: { "=>": [

            { button: {
              text: "remove",
              handle: {
                onclick: $ => $$.le.model.remove(todo)
              }
            }},

            { span: {text: todo, attrs: { style: {marginLeft:"15px"}}}},
          ]}

        })) 
      }
    })
}
const TodoListContainer = { 
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

RenderApp(document.body, {
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

      Use(TodoListContainer)

    ]
  }
})
*/
import { Bind, Extended, f, fArgs, LE_BackendApiMock, LE_LoadCss, LE_LoadScript, pass, Placeholder, RenderApp, smart, Alias, SmartAlias, ExternalProp, useExternal, toInlineStyle, Use, cle, Switch, Case, str, str_ , ExtendSCSS} from "../lib/caged-le.js"
import { NavSidebarLayout } from "../layouts/layouts.js"

/*

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

    afterChildsInit: $ => { // dopo la onInit dei childs

    }

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
      my_alias: Alias(getter $=>..., setter $,v=>..., caching(new, old)=>new!==old...),
      my_alias2: SmartAlias('@counter')
    },

    on: { // on props | alias changes
      this: {
        counterChanged: ($, newCounter, oldCounter) => console.log($.this.counter),
      }, 
      parent: ...
      scope: ... any prop in self or any parent anchestor
      le: ..byname.. : {props | alias changed},
      ctx: ...qui mettiamo solo i nomi dei sub_componenti + this di questo componente! 
      // ci vorrebbe anche un $.subel, (un array, non obj con in le) in cui è possibile filtrare by type: es $.subel.get("div")[0]..oppure il concetto di tref di le..o magari questa in realtà con ctx si risolve.. vedi sotto che ho descritto bene
      
      TODO: direct_child: ... // in alternativa alle menate di sopra. conscio del fatto che è una "multicast", e in congiunzione con l'inserimento in properties di una ".childs" in grado quindi di poter fare $.this.childs[0].doSomething
      // todo: reserved keyword for property signal etc naming
    },

    on_s: { // on signal
      this: {
        counterReset: $ => console.log("counter reset!")
      }, 
      parent: ...
      scope: ... any prop in self or any parent anchestor
      le: .component byname.. : { signal},
      ctx: ...qui mettiamo solo i nomi dei sub_componenti + this di questo componente! 
      dbus: ...qui mettiamo i signals globali che ascolto

      // valitare anche "child:0" & "child:*" | child: { "0" | "*" : .. }

      // è anche possibile "autopropagare" i segnali che elaboro, senza ridefinirli (per favorire sub child to parent flow, o evitare inutili remap), come?  con una classe/costante che instanziamo e dunque definire: ctx: {subchildSignal: Autopropagate}
    },

    TODO: on_a { /////// AL MOMENTO NON PREVISITO!!!
      this: {
        "class" | "style.width" : $ => ... 
      }
      ... come sopra
    },

    // todo: valutare anche i "transoformer/reducer" in quanto con il sistema di auto change propagation per fare una op in blocco dovrei avere un mega stato..ma poi ho il problema che ci sono troppi update inutili..i reducer/transformer aiuterebbero!


    "private:"? def: {
      resetCounter: $ => {
        $.this.counter = 0
        $.this.counterReset.emit() // also lazy: $.this.counterReset.emitLazy(10)
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

    // novità: ora è anche possibile usare le shortcuts: "ha.style.color": "red"  oppure "a.style": {color: "red"}

    handle: { // html event
      onclick: ($, e) => $.this.count++
    },

    when: { // html event (in the form of addEventListener) configurable!
      focusin: ($, e) => $.this.count++
      focusout: { options: {capture: true, useCapture: true}, handler: ($, e) => $.this.count++, }
    },

    css: [ ".class { bla:bli ... }", $=>".r0 { .."+$.this.somedeps +"}" ] | {rule1: ".class { bla:bli ... }", rule2: $=>".r0 { .."+$.this.somedeps +"}"} // todo..magari qualcosa di più complesso..come hoisting (via replacer, o anche per i subel), or namaed definition (tipo le)..oppure per automatizzare l'hoisting =>  css: [ ".class { bla:bli ... }", ".class2 { foo:bar; ...", NoHoisting("sostanzialmente ::ng-dep..")]
    
    s_css:{
      ".myClass": [{
        display: "inline"
      }]
      ".myClassDynRule": [$=>({
        display: $.scope.condition ? "inline" : "none"
      })]
    } // Use/Extended(component, {s_css: {".myClass": [ExtendSCSS, {opacity: 0.8}]}})
    
    TODO: states: {
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

    TODO: state: "default" // optional different starting state
    TODO: stateChangeStrategy: "merge XXXstatenameXXX" | "replace" | "remove" // magari questa cosa va dentro i singoli state..

    TODO: onState: ($, newState, oldState)=> {

    }


    contains | childs | text | view | '>>' | '=>' | '' | _ : [

      { 
        h1: { ctx_id: "counter_name", text: $ => $.parent.name }
      },
      { 
        span: { ctx_id: "counter_value", text: $ => "count:" + $.parent.counter }
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


      { Model | Controller | Connector..etc: { // OBJECT, invisible, usefull for app logic and data manipulation, with meta: { hasViewChilds: true } can be materialized into the view as <leobj></lepbj>
        data: {prop1: 23},

        ["=>"]: [

          { Model: { // sub model/obj
            data: {prop2: 25},
            afterInit: $ => console.log($.this.prop2),
            text: $ => $.parent.prop1, // but also: $.scope.prop1, because $scope use dynamic binding (and shadowing) and compact all the props and signal from me and my parents
          }
        },
        ]
      }},

    ],

  }
}

// COMPONENT REDEFINITION SEPARATION

impossible_to_redefine = ["ctx_id"]
direct_lvl = ["id", "constructor", "beforeInit", "onInit", "afterChildsInit", "afterInit", "onUpdate", "onDestroy"]
first_lvl = ["signals", "dbus_signals", "data", "private:data", "props", "private:props", "alias", "handle"]
second_lvl = ["on", "on_s", "on_a"]
first_or_second_lvl = ["def", "private:def"] // check for function (may exist "first lvl namespace")
// TODO: actually merge unsupported
"hattrs", "ha", "private:hattrs", "private:ha", "attrs", "private:attrs", "a", "private:a", css, states, state, stateChangeStrategy, onState, contains | childs | text | view | '>>' | '=>' | '' | _???



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


    { div: { meta: { forEach:"todo",  of: $ => $.parent.todolist,  define:{ index:"idx", first:"isFirst", last:"isLast", length:"len", iterable:"arr",    ...CUSTOM_PROP_NAME: value | ($: "parent" $this (same as meta), $child: real $this of the child)=> ... }, define_alias:{ // my_var_extracted_with_meta_identifier..easy alias! //, todo_label: $ => $.this.todo_label_mapping[$.meta.todo]},  key,comparer: el=>... extractor/converter: $=> // opzionale, per fare es Obj.keys --> extractor:($, blabla)=>Object.keys(blabla) e i comparer per identificare i changes // 
                     ,comparer: (_new, _old)=>_new !== _old
                     ,newScope: bool, noThisInScope: bool, noMetaInScope: bool, hasViewChilds: bool, metaPushbackAutomark: bool}], (le ultime sono le "scope options") 
      
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
            init: { todoIndex: $ => $.meta.idx } // nella init il punto di vista del this E' SEMPRE IL MIO PARENT, qui meta è sempre quello DEL MIO PARENT
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


*/


// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
// TESTING


// BUGFIX:

  // todo: in css non devo reinserire se ho già inserito..specie per le-for

  // todo: MEGA->al momento è imposibile registrarsi a proprità di elementi che sono dopo di me..perchè l'elemento è vero che esiste, ma non esistono sncora le sue prop! quindi fallirà sempre, e con il "?" non esplode e non trovi il bu facilmente. la soluzione è la retry, da implementare alla riga 1327 e ovunque ci sia questa logica! alternativa semplice: spostare (e testare!) la creazione delle Property nella fase 2 (build skeleton) e non nella 3 (create). nella fase 2 all'ultimo, dopo la creazione dei contesti..perchè tanto definiamo solo le prop, senza dargli val ne deps ne nulla, ma esistendo tutte non avremo problemi ad agganciarle dopo..aka codice da riga 1300 a 1288
  //       --> ancora meglio fare un componente che gestisce queste cose a lungo termine..ovvero quando provo a fare lu sub e non riesco mando la richiesta un gestore che la completerà per me dopo. qundo? quand un componente viene creato (le sue prop etc) chiede prima della fine al rgistro se qualcuno lo ha cercato, e il registro completa le op pending. l'importanza del registro (oltre a dover implementare sta roba anche nei signal al posto della retry) è quella dei componenti dinamici: dovrà anche essere avvisato delle destroy, in modo che possa ricreare i binding quando il componente viene eventualmente ricreato.
  //           ciò ovviamenete ci porta anche a dover migliorare le destroy e soprattutto la parte dinamica..che al momento è solo abbozzata: vedi sotto

  // todo: bugfix reale della _onSet che sparisce per gli le-if nested in un le-for

  // todo: rendere i _debug e _info sensati, fare i warn/err

  // done: support def deps on TextNode..only for ordinary def (not namespaces). easy: only need to test & find in defDep for "namespace.defname"
  // todo: dipendenze delle def..perchè al momento non posso usare in una Property e avere l'autoaggiornamneto..anche se a dirla tutta, avrebbe poco senso! nel caso pensare ai "trasformer" ovvero delle "pure_def" che sono appunto funzioni pure senza side effects e quinid utilizzabili in modo safe da noi --> quetsa nota deriva dal questo commento // noooo...potenzialmente buggato! specialmente in ricorsione..perchè se uso una funzione che assegna invece di usare aggiungo una dipendenza inutile.. dovrei accertarmi che non sto a sinistra di un uguale..ma non solo! forse va specificata questa cosa e usato un paradigma appisito, "pure_def", ovvero funzioni pure senza side effects! poi sta al dev capire che fare..
  // todo: analisi dipendenze funzioni (in cascata..ovvero se uso func le "importo")..qui il senso è NON rielaborare la funzione ad ogni changes delle deps, ma segnalare le deps, in modo che le property che veramente la usano e devono autoupdatarsi possono agganciarsi alle deps..in modo da "far funzionare l'auto aggiornamento" in quanto il signal delle deps delle func farà si che si uppi la prop/text etc che la segue e tutto funge. in cascata perchè se uso altre func devo agganciarmi a tutto. 
  // todo/nota: una cosa molto figa che viene fuori da questa cosa è che posso anche "dichiarare" le dipendenze , ovvero: se scrivo in una def tipo "myVarDeps": $ => ($.this.dep1, $.this.dep2..., "") posso usarla in un text o una property o qualsiasi altra cosa e stabilire le deps a piacimento (non so se veramnete utile..)

  // todo: l'analisi delle dipendenze al momento avviene via testo..questo significa che legge anche i commenti! qui ho un mezzo bug/feature: da un lato posso inserire le dipendenze in un commento, es /* deps: $.this.counter */, dall'altro se commento un pezzo di codice ne continuo a seguire le deps..


  // todo: il bugfix dei text node va anche da altre parti..ovvero di avere $.this.miavar.something.. il parser restituisce [miavra, something] e non miavar..qui devo fozare di prendere [0]..alternativa farlo bene perchè in effetti potrei bindarmi a tutto..e poi mi serve per la catena dei parent
  // todo: al momento la catena dei parent non è contemplata nella risoluzione delle dipendenze..migliorare. per farlo: durante l'analisi delle deps ho bisogno di un nuovo items che si chiama "$parentChain": qui ci devono far finire il numero di ".parent" a partire da "$.this" e "$.parent". in questo modo risolvo anche per bene il bug che ho segnalato sopra, ovvero quello dei TextNode

  // todo: visto che il punto di vista nella redefine dei componenent è sempre se stessi..quando faccio una use component non posso in alcun modo usare $.ctx per riferirmi al mio contesto visibile al momento della definizione..quindi forse ho due "problemi", il primo è che i context dovrebbero essere inclusivi (ovvero il mio as subchild è l'insieme del mio e di tutti quelli sopra di me. in alternativa devo avere il concetto di "supctx" ovvero ctx di mio padre (che deve rimanere tale anche per i miei child interni al componente). in effetti è semplice da fare, sostanzialmente è: this.getMyCtx().parent.getMyCtx()). in alternativa devo poter andare in cascata come per parent.. oppure: definisco "elemento speciale" in ogni context "super_ctx" e modifico il codice affinche si possa fare: $.ctx.super_ctx.myElId.Prop..però così mi perdeo la possibilità di definire in on on_s etc l'aggancio a un super ctx element..per cui la migliore sarebbe un $.super_ctx.. oppure la ricorsione


// NEW FEATURES:
  // semi-done: injector palceholders: meccanismo per permettere di inserire sottocomponenti in punti specifici di un componente Use: sostanzialmente in una Use possiamo definire dei Placeholder (classe Placeholder), che hanno dei "nomi", e dunque possiamo passare alla Use un dict con i nome i componenti che vogliamo ignettare (via passaggio params). la semplicità del meccanismo è tutta nella definizione della Use, che si occupa di matchare i placeholder (tra i subel) e di rimuovere quelli inutilizzati. trasparente per la factory! ovviamente possibilità di default if not set, e opzione per forzare il match con un id specifico (private) o un rename forzato di un id privato (per far si che si possano definire "interfacce" e usarle)
  // done: ricorsione nei sottochild? (solo se stesso ctx, aka non per i nested Use..però se potessi andare anche dentro gli use potrei sustituire la qualunque! il problema è che nella use sostituisco i placeholder..quoindi diventa dura..)
  // todo: valutare se fare copia del default placeholders e/o dell injected

  // todo: smart id component: qualcosa per cui al posto di { div: { id: "myElId" }}  posso scrivere: { "div -> myElId": {..} }. ovvero sfruttare un po di parsing per avere lil fatto che così vedo struttura e id insieme..
  // todo: smart shortcuts: l'idea è di poter scrivere "attrs.style": ... per evitare l'obj e compattare la sintassi..ovviamente con "_" come sep sarebbe migliore, in quanto si eviterebbero un po di cose..
  // todo: questa cosa come molte altre in realtà mette in luce il fatto che ogni componente e sottocomponete dovrebbe subire una prima "trasformazione" in una sintassi migliori per il framework, che ha diverse opzioni e modi di scrivere..come più o meno avvine già, ma dovrebbe essere la "first of all"

  // todo: concetto di "re_emit_as" -> combina in automatico la possibilità di gestire un segnale e rialnciarlo con un altro nome..per propagare i sengali! ovviamente devo inserire il nome di un mio segnale e non di altri.. potrebbe avere senso avere una sentinel del tipo "NewSignal("xxx") per indicare un nuovo segnale ? eìsenza stare a dichiaraare 2 volte..per easy propagation.. vedere bene su..di fatto questa cosa è da realizzare nella on_s lato dev

  // todo: "SelfStyle" o altro meccanismo per esplicitare hoisting del css..vedi su..alternativa andare di replace e tutto è "pubblico" (aka ng-deep) di default..in questo caso è compito dello sviluppatore inserire un "replacer" che indica all'engine che quella classe è "locale"
  // todo: tutti gli elementi devono avere un attributo che mappa un identificativo univoco dell'elemento (stabile nel tempo, anche per gli ng-if e ng-for) per poter aiutare l'hoisting..

  // todo: state
  // todo: behavioural property: utilty per creare animazioni, clone di quelle QML. in pratica l'idea è quella di definire una serie di azioni (in modo dichiarativo e non imperativo) all'acadere di un'azione, es all'on change di una property (ma anche eventi, tipo onclick), seguendo una linea temporale e/o quantizzando il valore della property che sta cambiando. l'idea è quella di definire che ad es: quando una property assume valore "vero" o ad un "click" vengono eseguiti una serie di step in sequenza (ovvero una serie di set timeout). tipo subito cambio il colore in blue e dopo 0.5 sec lo cambio nell'originale. ma anche 

  // todo: private..come realizzo il meccanismo dei private? name mangling in python style? (più semplice ma "inutile") o reale (e quindi tentare di capire come filtrare le properties visibili..)

  // todo: le-switch
  
  // todo: routing (also partial!) con history api

  // todo: per supportare al meglio il passaggio di un componente come data ad un altro componente, e poterne seguire le sue proprietà: è possibile autoanalizzare (ad ogni set) se la prop passata è un component. in caso positivo potrei sottoscrivermi al meglio nelle prop che la usano, visto che un'eventuale chiamata a una sottoproperty implica in realtà "l'hook" originale alle su property, (e non una sottoproperty che non saprei gestire di un altro tipo di dato), ergo posso fare $.this.selectedEl.property..basta solo modificare i subscruber di conseguenza. e ovviamente devono essere notificati del cambio di tipo, per eventuale risottoscrizione

  // todo: component scafholding via notazione semplice..anche natural lang like (script a se)

  // todo: debug, possibilità di avere albero struttura rendered con id
  
  // todo: all'interno degli iterable component potrebbe essere utile (nel meta) definire previus e next: due variabili in cui mettiamo l'elemento precedente e quello successivo. in questo modo posso fare $.meta.previus.prop/def etc etc..utile ad esempio in anchors, per fare flow like interface..ù

  // todo: cached property..ovvero la get non deve rieseguire se ha già eseguito e la cache è valida (non è stata marked as changed..)

  // todo: standardizzare un po la parte di syncback di una var nel local storage..in modo da poter indicare "@autosync_in_local_storage", o nel name come per lazy o in altra roba apposita. in quest'ultimo caso possiamo anche specificare come scriverle, quali e l'ordine di recupero

  // todo: possibilità di definire la "struct" di una Property, in modo da provare a seguire i cambiamenti di valore nested..es se ho un dict o un array..deve essere un cosa persistente anche a successive set di valore..nonchè trasparente, in modo da dare problemi agli sviluppatori
  //       una cosa carina sarebbe definire una classe che eredita da una nostra classe base, per cui definiamo delle cose e che fa la magia automaticmante!

  // todo: $scope deve contenere anche meta..in modo da superare il problema del meta bloccato con Use in se stesso e poter usare il meta del parent anche negli use. in alternativa fixare la Use per vedere anche sopra..


// IMPROVEMENTS:

  // todo: tipi

  // todo: lanciare eccezioni quando parso dei componenenti (anche Use) con nome di proprietà non conosciuti! magari regole di similarità per hint su cosa si voleva scrivere!

  // todo: anche se abbiamo fatto una prima versione di le-for, in realtà molto è da fare..al momento distruggo e ricreo, e dunque non posso neanche legarmi agli aggiornamenti delle property in meta..anche perchè non è semplice recuperare il who/what id-metaOfComponent. anche perchè i componenti non sopravvivono mai ad un aggiornamento!
  // todo: le-for e le-if: se qualcuno seguiva qualche proprità e distruggo, devo riagganciare al rebuild!

  // todo: le dipendenze in cascata devono avere il meccanismo della retry, altrimenti al primo undefined ciaone
  // todo: destroy delle dipendenze, properties, signal, attr etc alla destroy! fatte per bene! anche in Text etc..


  // todo: ragionare se ci piace davveero "private: xxx": "blabla"   o è meglio un   private_xxx: "blibli"
  //       allo stesso tempo potrebbe eanche essere utile invertire: normalmente tutto è privato (aka by $ctx), con public: si va in modalità pubblica..quantomeno per gli id!

  // todo: la computed_template della UseDeclaration dovrebbe essere un gettr con singleton, in modo che venga calcolato solo se utilizzato..cercando di minimizzare le elaborazioni inutili all'avvio


// IDEAS:
  // todo: novita della novità rispetto a tutto quello che c'è dopo: il modo più semplice per una handle di qualcosa di un mio figlio ma senza nome è usare il concetto di slot e connect: in pratica il parent dichiara uno slot: ovvero una funzione che ha un nome e che gestisce un segnale di un qualcuno generico, e i figli possono fare la connect di un proprio signal allo slot del parent. in questo modo davvero si elimina il problema di non avere id, visto che per il contrario (parent to child) basta una property o un signal che i figli interessati seguono..dove mettiamo la logica per discriminare se è o meno interessante per me. infine, se si vuole andare di codice imperativo si possono definire delle var (es selected, se c'è una cosa del genere) in cui i figli inseriscono se stessi alla init..
  //       anche se in realtà alla fine la child to parent non è un problema..visto che in modo imperativo posso sempre fare parent.blabla

  // todo: resta il fatto che 99% delle problematiche si risolverebbero in realtà con: catena dei parent, meta che ingloba i super meta, ctx che ingloba i super ctx (o è già così?), e infine un flag per dire di riportare tutte le props del mio parent (anche in scrittura!! ergo ci vuole una sorta di Bind)
  
  // todo: una cosa più semplice da fare sarebbe quella di avere un nuovo campo "ref_id" e poi $.ref.up/down/same|lvl.refxxx oer andare in ricerca sull'albero del ref..ovviamente first is return


  // todo: rispetto a tutto quello che ho scritto qui sotto, forse la cosa migliore per gestire le on e on_s (non ovviamente tutti gli altri problemi..) almeno di 1 livello (child diretti) è quella di aggiungere una on: {direct_childs: ... }, che da realizzare sarebbe mooolto semplice..in quanto devo solo andare sui miei child (dopo la creazione dei child, o con retry) a cercare di sottoscrivermi..easy e via! in congiunzione con l'inserimento in properties di una ".childs" in grado quindi di poter fare $.this.childs[0].doSomething. a quel punto posso sottoscrivermi alle onchange e ai signal del figlio (per attaccarmi alle props), e chiamare su di lui cose senza nome!

  // todo: anche se non voglio farlo, potremmo usare un meccanismo per gestire anche le cose dei figli senza usare il nome..la prima cosa è andare alla angular maniera..ovvero aggiungere dettagli nel meta quando definisco un componente..in questo modo non ho problemi e posso risalire facile! -- altrimenti un qualcosa tipo  " on: {this: Child(0, {dataChanged: $=>...})} "..occhio che deve essere lazy!! o fatto dopo i child..
  // ---v
  // todooo: in realtà la cosa migliore sarebbe utilizare una nomencalutura particolare per tutti i figli (che non hanno definito un id e un _id). ovvero dare il nome del padre + indice figlio (contanto eventuale figli con nome as ++) es: Root => [ undefeined => [undefined], myElementName, undefined ] diventerebbe: Root => [Root_cld_0 => [Root_cld_0_cld_0], myElementName, Root_cld_2]  oppure: Root => [Root.0 => [Root.0.0], myElementName, Root.2]
  // un'altra cosa figa di questa cosa è che ora possiamo avere il "full name", ovvero il nome completo di un elemento, come Root.Root_cld_0.Root_cld_0_cld_0  oppure  Root.0.0 (prendendo solo index)
  // todo: quindi a questo punto gli elementi dovrebbero stare anche anche in una property "child", accessibile sia come array che by name (realizzabile tramite "proxy", tenendo gli elementi come dict [solo se unordered] altrimenti come array)

  // todo: per la comunicazion "child to parent" potremmo srubacchiare da angular..ovvero nuova proprietà oltre id e _id in cui dichiaro il nome del children dal punto di vista del parent (e solo di lui! come quando in angular dichiari un #nome, ma li va per "contesto" ovvero il nostro ctx), quindi ogni parent avrà un nuovo $.child.XXXNAMEXXX da poter usare e di conseguenza ovunque..ovviamente è un extra rispetto a quanto definito

  // todo: iniziare a pensare alla questione che posso definire e usare anche pezzi dei children nel parent (se quello di sopra dovesse realizzarsi), in partiolare gli alias..portano dritto questo problema alla luce

  // todo: potrebbe essere più semplice per il discorso "padre deve seguire il figlio senza replace/merge" definire nella "Use" una parte specifica dove posso definire delle "add" in modo da non compromettere il funzionamento di un componente..e quindi poter definire delle "on" etc che si aggiungono e non sovrappongono (basta duplicare on etc per la Use in una nuova property)
  // todo/note: come fare per fare in modo che un padre possa operare su un child senza nome? (neanche di contesto) opz 1: proprietà child come array (ma questo richiede la specifica di un estrapolatore etc, nonchè una nuova logica per gestire tutte le paturnie degli array..es: [x], find.. etc etc..). opzione 2: ogni elemento che ha figli ha al suo interno delle proprità "_child_XXX" con XXX numero/indice del child. essendo proprietà a tutti gli effetti potrei seguirle e bona, e al suo interno ci troverei il suo $this. per poter tenere in piedi il meccanismo di estrapolazione deps dovrei realizzare un $.childs.c_xxx

  // todo??: namespace anche per i data (solo di 1 livello)..via "namespace:xxx" come nome della prop..quindi quello diventa il primo livello, es=> data: {miaPropObj: {a: 12}, "@namespace:myNamespace": {prop1:..., prop2:.., prop3:..}} --> questo complica parecchio l'estrazione delle deps etc..
  // todo: 2wayBinding anche property to property..utile per trattare come "mia" una property di un altro..e isolare da "$.parent.." 

  // todo: full name di un elemento..come insieme del suo nome e dei suoi parent separati da punto: "parentParentId.parentId.thisId"


  // todo: deduplicare le deps prima della subscribe..anche e soprattutto per via delle deps dell func, ma probabilemnte lo abbiamo già adesso questo problema! a meno della "buona gestione" in Property per cui non riaggiungiamo se siamo già subscribed (visto che passo this come who), ancdrebbe però comunque migliorato, per evitre aggiornamenti multipli! qui si capisce l'importanza di angular e del change detector..ovvero un loop per "ridurre" i repaint "accorpandoli". come? al posto di iposta al change l'azione diretta, basta segnalarla in un array con "esecuzione a scadenza" ovvero timeout ad es 2 ms dell'esecuzione delle azioni, con autodelete delle azioni "replicate" all'esecuzione, e auto reset del timeout con l'avanzare del codice. questo garantisce la separazione tra rendering e prop, ma potrebbe incasinare il codice che faceva affidamento su di essa.

  // todo??: nuova idea su come bindare il this con qualunque funzione (anche => ) (che però annulla la possibilità di avere cose extra framework..): basta fare il toString della func, e poi ricostruirla con new Function assegnando il this..però si perdono tutti gli extra ref!
  

  // todo: relative name componenti: questa è da ragionare..l’effetto che vorrei è poter fare: .parent.MyObj.SubObj2 .. in this, parent, le e ctx. In pratica è come se i componenti dovessere stare dentro i $.X attraverso gli id (se definito) come delle props speciali, e poterle usare nelle deps..

  // todo: Nuova classe helper per le func in cui non voglio usare dollaro ma non ho voglia di modificare il retriver delle deps:
  // todo: Nuova classe che accetta una func e una explain o un retriver diverso. L’explain accetta (con “;” come separatore) una stringa di deps nel formato senza dollaro, es: “parent.x;this.y”

  // todo: per aiutare il sistema a identificare i changes anche per obj mutabili: il type system, ovvero nelle props posso wrappare i dati in CLE.List(func.., description), in modo che per queste cose specifiche possiamo andare a wrappare con un nostro modo l’array etc i metodi base, al fine di pushare i changes automaticamente)

  // todo: Funzione per disabilitare temporaneamente il mark for changes, per evitare troppi ricolcoli inutili e abilitarlo manualmente dopo

  // todo: classe Exetrnal, che mi permette di definire delle property esterne e bindarmi ovunque (props, attr, view etc)

  // todo: validation rules, qualcosa che posso definire nella mia definizione (solo this) di proprietà, per cui definisco delle regole di validazione per le assegnazioni alle Props. in pratica poi prima di assegnare esweguo le validazioni e nel caso lancio errore. così quando assegno mi basta fare try catch e centralizzo le regole
  // todo: in realtà questa cosa può diventare più figa e complessa: con anche le pre/post action, in pratica così ho anche gli alias, perchè posso per esempio andare a dire che come post action ho la possibilità di settare indietro una var (e riagganciare l'hook, senza essere nel loop della on changed..)
  // todo: sicuramente questa cosa è semi-ridondante, ma non è "inutile"

  // todo: lazy negli on e on_s..da capire ancora come, se con keyword lazy o come..a quel punto anche un bel "throttle"

  // todo: oggetto Channel instanziabile che posso utilizzare in modo da mettere in contatto due o + elementi. creo il channel con new, lo passo a un param "cannels: {xxx: myChannel.onMessage($=>dosomething), ...}" e poi lo posso usare con this.xxx.send. easy
  




// DONE:

  //// note: tutto è un signal: ovvero le prop hanno dei signal associati (signal particolari, che portano con se il vecchio e il nuovo valore al triggher.. ergo: on, on_s e on_a sono solo degli alias (sovrapponibili a differenza di children etc) che servono allo sviluppatore pià che altro.
  // conseguenza esistono solo due cose da gestire: i dati (le property) e i signal. da qui va da se che anche gli attr sono property, con tutto quello che ne derive (signal etc)

  // done/note: i Model/Controller (object) devono poter definire css? sarebbe mooolto utile, in quanto sarebbe il modo naturale (magari via Css) per definirlo, integrando anche l'auto update dei dati..ovvero le classi possono dipendere dai dati e quinid non devo più aggiornare la classe css dell'elemento, ma una property, che in cascata aggiornerà tutto. questo porta alla necessità di avere gli ng-if anche per gli object in modo obbligatorio! [done]

  // note: forse per le-for la cosa migliore è andare con una classe sentinel apposita, ForEach($=>blabla, {options}, {...component to repeat..}) perchè altrimenti devo eliminare dal meta prima di replicare e non è facile..a quel punto nella factory ricevo la sentinel e creo la classe che wrappa come pensavo in modo semplice..riutilizzando molto codice

  // done: "smart component", ovvero la possibilità di scrivere {div: "mio text"} e in automatico venga parsata in modo corretto con l'autoespansione in {div: { text: "mio text" }}
    
  // todo (old?): ng if, ng for, ng switch.. => per poter fare questa cosa c'è bisogno di un refactoring abbastanza importante, affiche ogni componente sia di fatto un contenitore per N elementi. questa è la base. per i componenti nomrmali ho solo 1 elemento, mentre per gli ngfor ne ho N. questo è l'uncio modo per poter continuare ad andare in questa direzione. altrimenti l'albero perde completamente di senso, a meno di non creare una sorta di "wrapper" per tutte le proprietà e quindi far diventare trasparente quell'operazione
  // di fatto questa visione torna con l'originale dell'idea di avere dei "pointer html" via commento. ovvero ho un albero di componenti virtuali, nella quale in ogni fogli posso avere un albero di componenti reali. i cui sottocomponenti sono ancora una volta virtuali.
  // in alternativa: devo agire a livello di factory..creando un qualcosa che wrappa ma solo per l'ng for..visto che switch e if sono già ok..ma a quel punto il controllo della situazione chi ce l'ha??

  // todo/done?: iniziare a strutturare come funziona "meta" lato dev, nel senso che il mio meta è in realtà l'insieme di tutti i meta dei miei parent (nello stesso componente? in teoria si, perchè il il compoente è entità "atomica", non dividibile, quindi dentro e fuori non si "conoscono") compreso il mio..a questo punto tutto deve andare con retry incrementale?

  // done: $scope, un meccanismo che permette di superare molti problemi di cle, tra cui la parent chain. il suo obbiettivo è vedere i componenti come codice js, per cui posso vedere tutte le variabili, segnali etc, che sono definiti nel mio blocco e nei blocchi sopra di me. è dynamic (leggermente più lento), funziona su props e signal, (posso bindarmi ovunque con $.scope.xxx) e ha il concetto di shadowing. di fatto è una vista al nome più vicino a me per quella cosa
  // done: possibile usare meta per bloccare lo scope, taggando in meta: {newScope: true}
  // done: {noThisInScope: true} per indicare che non voglio il this nello scope


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
          Use({ span: { // meta: {newScope: true},
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

    let_adata: SmartAlias(`@t.data`, (_new, _old)=>_new.p1!==_old.p1),


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
    await axios.get('https://raw.githubusercontent.com/vcamelblue2/import-cle/main/lib/caged-le.js'),
    await axios.get('https://raw.githubusercontent.com/vcamelblue2/import-cle/main/routing/lite_routing.js'),
    await axios.get('https://raw.githubusercontent.com/vcamelblue2/import-cle/main/layouts/layouts.js')
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


  const Nested = cle.div({ meta: { forEach: "x", of: [1,2]}, // test also foreach!
    a_class: "demo-nested",

    s_css: {
      ".demo-nested": [$=>({
        width: "50px",
        height: "50px",
        backgroundColor: !$.scope.darkTheme ? "black":"#cdcdcd",
      })],
    }
  })
  const MyComponentWithNested = cle.div({
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
appDemoSCSS()


// todo nuove definizioni: "input_" un alias di let_ e "output_" un alias di signal
// todo callback: nuova "property like" a cui non bisogna bindarsi, in sostanza qualcosa che ci permetta di passare una funzione as property..tendenzialmente in realtà basterebbe definirla come funzione, in particolare si userebbe come Callback($=>blablabla). nella pratica questa fa la return di Callback(cback)=>($=>cback($)). per il meccanismo delle deps NON troverò dipendenze, e quindi sarà passata senza problemi..
// todo: un nuovo nome per alias, perchè deve essere passato ai componenti già fatti magari per binding, e non si capisce..magari "bindable". alternativa: se si passa un Bind a una property diventa un alias..senza estrazione del .value, quindi ho già tutto per fare il bind al di sotto


// todo: BUGFIX, in getCleElementByDom deve essere necessario poter scegliere se è body.querySelector oppure this.hmtl_el.querySelector..

// todo: in lazyRender necessario poter scegliere se appendere su o giù..al momento solo giù, ma per robe alla facebook può servire appendere su!

// todo: capire se estendere $.xxx con qualcosa tipo: $.query(""), ovvero usare la logica di $.u.getCleElementByDom etc, per trovare gli elementi le anche in props etc. basterebbe migliorare static parser per aggiungere le parentesi e apici..problema: porta un tema non indifferente, ovvero che le persone devono sapere che NON verrà aggiornata la deps cambiando proprietà "querybili" (ovvero cose native HTML), a meno di: observer su quella roba li, oppure (più semplice) funzione disponibile lato dev "recompute_XXXpropXXX_deps" necessaria per ricompilare le deps (anche se in realtà basta un nuovo "set value" come lambda identico per riaggiornare le deps..)

// todo: migliorare Extended e Use, in particolare al posto della signature: (component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined, inject=undefined})   dovrei avere    (component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined, inject=undefined}, inject=undefined, ...extra_childs)   in modo da poter 1) evitare un dict con injetc:, 2) avere extrachild per migliorare la sintassi di inserimento figli (solo diretti!) [questo da esplorare meglio, potrebbe avere una sintassi tipo: "before", "after", "idx: 0" per avere inserimenti mirati! ], 3) controllare il supporto ad array!! per inject di N elementi e non uno solo..(posto che attualmente potresti injettare un wrapper con gli N childs..)


// todo: rispetto ai dynamic signal di sotto in realtà a me per disaccoppiare il child dal parent mi basta davvero solo poter creare segnali dbus a runtime e fare in modo che i child li invino ai parent..per il parent to child invece è composizione e delga, quindi lo devo conoscere ed esporre metodi intermedi (interfaccia) all'esterno, più stabili.
//       in alternativa mi basta davvero gestire un external Signal, per avere la certezza che non ho problemi di riutilizzo del componente (es un figlio è una func che necessita dell'ext signal per essere erogato..interfaccia!)

// todo: dynamic de/register to signals (included) props sign. at run time (in init, functions etc, something like: $.dynamic.on.parent.someSignal(...args=>..etc)  e  $.dynamic.detach.on.parent.someSignal. sarebbe utile anche dichiarare nuovi segnali dinamicamente..
//       il motivo è molto semplice: in questo modo pui semplicemente creare un segnale parent per i children, e fare in modo che puoi manadare un segnale solo a certi tipi.. al momento in realtà questa cosa è fattibile creando una prop/trap nel parent, e creando una props nel child che punta ad undefined, a runtime poi passare una $=>func che punta alla var del padre (solo quando serve) e gestire la change di questo value (filtrato per !== undefined)
//       ma in generale questo risolve mooolti problemi..ad esempio, per dare un nome ad una sottoview nel "root" del componente mi basta fare: creao una prop nel padre chiamata: "myChild1", nella onInit del child mi imposto nel parte come valore. a quel punto con i dynamic on mi basta nel root registrarmi a $.this.myChild1.anySignal..ed il gioco e fatto!

//       in realtà ci sono modi per cui si potrebbe anche creare una property che segue un'altra in modo dinamico..basterebbe passare nella set una DynamicProp($=>$.this.someLeElAsProp.someprop, ["le."+$.this.someLeElAsProp.uuid+".someprop"] OPPURE [[$.this.someLeElAsProp, "someProp"]]), ovvero passare la lista di deps in modo dinamico as str. questo perchè megari posso impostare in una prop un $.this (ovvero un el) e segure una prop in modo dinamico (senza analisi statica) sfruttando il fatto che tutti in le hnno un id..e quindi potrei esporlo in una riba tipo "uuid" oppure getId()
//       questo significherebbe che in una situazione parent-child potrei settare un child come "selected" nel parent, e poi avere delle prop (as alias) che seguono quelle del child, esponendole (perchè magari lui ha un nome..)

// IDEA: ATTENZIONE,  ma sulla base di sopra..perchè per risolvere il problema del "namedChildren" non creare una proprietà che devono definire i root chiamata "namedChildrens": { child1: {on: {prop1Changed}}, child2: [{}] (in un array) per indicare che è un le-for / ne troverò diversi }. lato children in realtà basta un "childId": "child1". a questo punto avrò $.childs.child1 da usare SU TUTTI i componenti di un nuovo scope che risale fino al primo che ha quel child definito. in questo modo la "redefinition" avviene in bg: l'aggancio lato padre è fatta dopo la generate child, e nella create del child mi basta registrarmi al root "giusto" (in alternativa chiamare la generazione dal figlio direttamente (chiamata a metodo root), senza aspettare la fine di tutti i child 
//                    ovviamente questa cosa dovrebbe essere coerente con il comportamento dello scope in caso di Use..ovvero capire se rompere componente e risalire sempre oppure se andare fino al root del componente
//                    un nome migliore sarebbe $.view.xxx proprio perchè è la view del component. oppure $.lle. (locals le) oppure ancora $.local.
//                    !!! molto importante che (per rispettare anche la natura dynamic by design) che questa volta tengo conto che un figlio può vivere e morire, e dunque devo raccogliere i riferimenti che appartengono a lui (come follow) ed eseguire dopo la create child (in timeout), ma anche dopo OGNI distruzione e creaizone del child: per farlo basta che l'autoaggancio da parte del child chiami una funione nel parent del tipo "connectChildDeps(child)" ed è nella logica del padre avere questa cosa.
//                    -- resta obbligatorio ragionare ancora bene sul tema che non è detto che il child sia univoco..potrebbero essercene N (classico quando è in un lefor). dovrei cioè avere o non avere un array. questo funziona coi segnali (registrarsi a N segnali), ma poco coi valori (devo avere l'array?). il secondo lo risolvo con gli alias. devo comunque mantere una var nel parent dei named child per andare con l'imperativo,e devo sapere che PUO essere un array.. AKA: parto sempre senza array, se poi mi sto registrando e c'è già allora DEVO convertirlo in array..questo risolve il problema in maneira definitiva ll'interno degli LE FOR, basta che il root che cicla dichiara il child, e quindi si registrerà LOCALMENTE, e tutti i sub potranno usarlo..la risoluzione resta DINAMICA (come scope)
//                    - forse per risolvere il problema che se imposto il nome in un certo root, poi in un figlio le-for (che magari lo definisce) non posso usare questo meccanismo perchè dovrebbe LUI impostrae chi è il named, e quindi nel parent non può risalire. anche se questo comportamneto è coerente con ciò che fa angular: in un ng-for non puoi usarlo esternamente..AKA: a prescindere non puoi usare il named al di fuori di un le-for, quindi o trovo uno che lo definisce prima o lo metto nel primo le-for, altrimenti sto in un array!
//                    - e per i casi in cui il name è se stesso? ..forse questa cosa non funziona bene com in angular..

// todo: altra cosa carina nella Use e Extend è quella di aggiungere un parametro "viewRedefinition", che accetta un dict e come value una func che ha questa signature: (requestedSubView, fullView)=>return undefined || obj
//       es: { "0/div/1": (span)=>{return {...span, p1: "redefined!"} }}

// todo: possibilità di ricevere nella RenderApp un "super" ovvero per i casi di dynamic component in app la possibilità di condividere il "parent" e quindi usare "$.super.this/parent/scope..." per riferirisi alla variabile del parent che lo genera, e fare in modo che sia semplice condividere var etc..
//       in realtà questa cosa dovrebbe essere più ampia e fare in modo che ci possano essere dei "dynamic sub child" dichiarati con una condizione in if, in modo da avere una prop per creare e distruggere i sub component..

// todo: possibilità di dichiarare interfaccia che uso via scope: expect: { required: ["prop1", "prop2"], optional: ["prop3"]}. in pratica faccio un test all'avvio, e se non trovo quanto richiesto mi spacco



// idea pure server side component: in pratica mi basta scrivere all inizio di ogni cosa in props '$=>' es "$=>@counter" e quella viene riconosciuta come espressione..bisognerebbe farla a livello di framework per non rallentare, alternativa una classe che rielabora es ServersideComponent e passargli la def/json
// todo: "SmartChain", ovvero un modo per nestare facilmente strutture es: SmartChain.table.tr.td(...)


// idea: non ha senso realizzare un #ref alla angular qui..ha però senso copiare la sua modalità "input & output", ovvero l'idea è quella di fare una cosa tipo
// { div: {
//   '=>': [
//     Use(Subel, pass, {
//       in: {
//         myVar: xxx --> FOLLOWING, REDEFINE WITH PARENT $ IN MIND
//       },
//       on: {
//         subelSignal: $=>$_is_parent_here..
//       },
//       // eventualmente anche
//       refAs: "subel"
//     }
//   ]
// }}

//////// OLD

// OLD, superato dal ref sopra..
// // todo
// const appDemoChildNoNameConnection = async ()=>{

//   const MyComponent = { 
//     div: {
//       let_text: ""
//     }
//   }
//   RenderApp(document.body, { div: {
//     id: "app",

//     '': [

//     // TMP: test syntax for child
//     Use(MyComponent, pass, pass, /* NEW TO BE CREATED */{
//       ref: "myComponent",
//       on: { textChanged: ($,t)=> $.this.data=t} // qui this è dal punto di vista del parent / main component
//     }),

//     ]

//   }})
// }

// old, ora superato da lazyRender in u
// todo: real dynamic childs definition, SOLO per i tipo con meta (if e le-for). in pratica nella childs si potrebbe passare qualcosa del tipo: '=>': LazyViewEval(($parent)=>[...]), ovvero qualcosa che viene richiamato (la parse) prima della create.. in modo da poter cambiare dinamicamente il template! visto che loro già supportano la lazy eval in un certo senso del template.
//       -- per questa idea al posto della roba di sopra, qualcosa di più strutturato, che ti porta nel modo "react" style: ci vorrebbe una signature tipo LazyComponentDef(ifCondition: $parent=>bool [usare anche per agganciarsi alle dipendenze!], cachingComparerFunc: $parent=>bool, templateGenFunc: ($parent, state)=>compoent_obj_def[]) BY Design Support Array! (se possibile..)
//       -- es LazyComponentDef($=>$.scope.todolist.length > 0, pass, ($p, state)=>[{ div: {
//              '': { li: $p.scope.todolist.map((todo)=>({li: "TODO: "+ todo}) }
//          }})]
//       -- state serve per far sopravviviere lo stato alle varie changes (se deve!) in modo che possa tenere anche un suo stato..

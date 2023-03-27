# CLE - Welcome to  Clean.js

Clean.js is a declarative Javascript Framework, with pure POJO in mind (for ui, data model & logic), a "caged" environment, a TRUE reactive nature and "static" analysis (used to build dependencies between componentes). Optionally imperative code can still be used for some dynamic parts.
 
 Inspired mostly by: 
  - QML (id, scoping & naming, true "reactive" properties, signals & slot, mangling for declarations, coding by convention, everything has a signal, components sub-editing from external, elements/ref by ID, auto context/scope)
  - Angular (declarative & templatingm ng-for, ng-if, 2 way data binding, "auto-update", Hooks & life-cycle)
  - React (non-verbose, render library first, light & dynamic, with very limited size & memory footprint, easy to learn)
  - Python (function declaration must have "self" as first parameter, natural langauge syntax like)
  - and many more

 For his POJO nature one of it's major improve w.r.t other frameworks is that components are just object, still editable, customizable and extensible, also if taken from NPM (in other frameworks everything a component can do should be "prepared" from developers). This lead for eg. UI library developers to create and handle less code, because components are not sealed.

 Clean.js it's also a "meta-language" first. In other words something like JSON: a syntax readable both by Humans & Computers. This means that it's easy to build other syntax/frameworks with CLE. In this framework you will find differents styles & technique, each with pro and cons, but ALL styles can be used together and mixed as you prefer.

## Quick Start
[![Try in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/web-platform-xezbjg?file=main.js)

```javascript
import { RenderApp, cle, f, Bind, Use, pass } from '/lib/caged-le.js'

// App Definition
const app = async () => RenderApp(document.body, cle.root({},
 
   { h1: "Hello World!" },
   
   { div: ["This is the body", "!"] },
   
   { div: {
     myVariable: "123", // shortcut of let: { myVariable } for NON reserved names

     style: { color: "green"},

     text: $ => "And a component with some definition, myVariable:" + $.myVariable }
   },
   
 
   { hr: {}},
 
   // Use components
   Use(MyReusableInputBar, {
     
    // setup variable
     let_val: "ABC", 
 
     // handle signals & variable changes
     on_valChanged: ($, txt, oldtxt) => console.log("new text: ", txt, " - old: ", oldtxt),
     on_hiLogged: $ => console.log("hi has been logged!"), 

   }),
 
   cle.hr({}),
 
 
 
   { div: {
 
     id: "hiddenDiv", // unique id in app!
 
     let: {
       isHidden: true
     },
     
     // define depens on computed attr
     style: $ => ({ 
       display: $.isHidden ? 'none' : null 
     }),
 
     // hooks & lifecycle
     onInit: $ => { console.log("I'm Hidden?", $.isHidden) },
     
     text: "Secret Message!"
   }},
 
 
   { h4: {
     
     // handle html events
     handle: {
       onclick: $ => { 
           $.le.hiddenDiv.isHidden = !$.le.hiddenDiv.isHidden 
       }
     },
 
     text: ["The div is ", $ => $.le.hiddenDiv.isHidden ? 'hidden' : 'visible', " (click to toggle)"],
 
   }},
 
   // same using smart definition:
   cle.h4({
 
     handle_onclick: $ => { 
       $.le.hiddenDiv.isHidden = !$.le.hiddenDiv.isHidden 
     }
 
   }, "The div is ", f`$.le.hiddenDiv.isHidden ? 'hidden' : 'visible'`, " (click to toggle)")
   
 ))


// A reusable component
const MyReusableInputBar = cle.div({ 
  // definition
 
  let: {  // variables
    val: "",
    doubleVal: $ => 'x2: ' + $.val + ' - ' + $.val, // computed
    tripleVal: f`'x3: ' + @val + ' - ' + @val + ' - ' + @val`
  },
 
  def: {  // functions
    sayHi: $ => { 
      console.log("hi!"); 
      $.this.hiLogged.emit(new Date()) 
    }
  },
 
  signals: { // signals
    hiLogged: "stream => (date: Date)"
  }
 
 }, 
 
  // childs
  cle.h5({}, "Insert a value"),

  { input: { // 2 way data binding using 'Bind'
      attrs: { value: Bind(f`@val`),  placeholder: "Insert a value..", style: "margin-right: 10px" }
  }},

  { span: { text: f`'You have inserted: ' + @val + ' -> ' + @doubleVal`} },

  cle.button({ // mix modes as you prefer!
    
    handle_onclick: $ => $.sayHi(),
    
    style: { marginLeft: "10px" }

  }, "Say Hi!" )
  
);


await app();

```

# IT Docs
# Basic Concept

 Un elemento CLE è un POJO (Plain Old Javascript Object) la cui unica e prima chiave è un tag html. Il valore associato a questo tag può essere invece: 
  - un POJO contenente la `definizione` delle caratteristiche dell'elemento HTML che si vuole renderizzare, nonchè dati, metodi etc.
  - una stringa
  - un Valore-Funzione (Evaluable)

Per esempio, un elemento HTML `h1` può essere scritto come:

 ```javascript
 // Standard Definition
 { h1: {
    ...definition...
 }}

// String Constants (shortcut)
 { h1: "some text" }

 // Evaluable (shortcut)
 { h1: $ => ...something that return text... }
 ```

 i sotto-elementi possono essere: 

 - un elemento CLE 
    - { span: ... }
 - una stringa 
 - un Valore-Funzione (Evaluable)
    - funzione lambda il cui primo argomento è sempre $ => ...
 
 e possono essere definiti come valori di un array all'interno della `definition` attraverso una qualsiasi di queste chiavi: 
- `'childs'`
- `'text'` 
- `'view'`
- `'=>'`
- `''` 

```javascript
{ div: { 
    childs: [
        ...
    ]
}}
```
Nei casi di un singolo sotto-elemento l'array può essere omesso.

Per avere un elemento html di tipo `h1` contenente un `"Hello World!"` (ovvero il cui unico sotto-elemento è un testo) basta scrivere:

 ```javascript
 { h1: {
    text: "Hello World!"
 }}
 ```

Nel caso di più sotto-elementi basta semplicemente utilizzare un Array:

 ```javascript
 { h1: {
    text: [ "Hello ", "World!" ]
 }}
 ```

 Esistono poi delle shortcuts:

 1) Se la `definition` dichiara un solo sotto-elemento e nulla più, si può passare il sotto-elemento direttamente come valore al tag. 
 2) Nel caso di più sotto-elementi (definiti come array), è possibile passare direttamente come valore al tag.

 ```javascript
 // Shortcuts
 { h1: "Hello World!" } // 1 
 { h1: [ "Hello ", "World!" ]} // 2 
 ```

## Rendering
 L'unità minima che è possibile rendirizzare in CLE è un singolo elemento CLE (ovvero un unico elemento HTML), che si può immaginare come un "componente" per come è inteso in altri framework.

 Per renderizzare un Componente possiamo utilizzare la funzione `RenderApp(htmlContainer, cleComponent)` importandola da `lib`.

 ```javascript
import {RederApp} from "lib/caged-le.js"

RenderApp(document.body, { h1: "Hello World!" })
 ```

 Generalmente, per convenzione,  le app iniziano con un `cle.root`:

 ```javascript
import {RederApp, cle} from "lib/caged-le.js"

RenderApp(document.body, cle.root({}, 

    { h1: "Hello World!" },
    
    { div: "This is the body" }
))
 ```
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/web-platform-zpqsmf?file=main.js)


## Component Lyfecicle & Hooks
Il lifecycle di un componente CLE prevede di fatto che prima venga renderizzato l'albero "spoglio" di elementi HTML, dopodichè vengono inizializzati e lanciati gli Hooks che si possono definire con le seguenti keywords:
    
- `constructor`: async? ($, {...args}) => { } 
    - Constructor, called at component creations, useful to setup properties from external with the `Use` declaration. use onInit in other cases. Only called in Use components.
- `onInit`: async? $ => { } 
    - on Init, after constructor, but before childs creation. This is the standard initializer.
- `afterChildsInit`: async? $ => { } 
    - After every childs "onInit". Useful to setup special things into childs after creation.
- `afterInit`: $ => { } 
    - After 1ms of the afterChildsInit. a convenient `auto-lazy` method for pseudo-async init

Infine, sotto determinate condizioni l'elemento viene distrutto
- `onDestroy`: $ => { } 
    - After Childs Destroy, Before Destroing "this" element. Usefull to clean imperative action and so on.



## Standard Definition - Declare by keyword
La standard `definition` di un componente prevede che all'interno della definizione possano essere esplicitati, oltre ai sotto-elementi tramite una delle chiavi di cui sopra, molte altre cose.

E' ad esempio possibile definire variabili, funzioni, segnali, attributi html, classi css, nonchè gestire eventi html, segnali locali, di properità o globali. Per una lista approfondita si rimanda alla sezione `#Full Reference`. 

------------

## Data & Variables 
Vediamo ora com'è possibile creare una variabile in un componente.

 ```javascript
 // Component is just a POJO and can be assigned to any variable

 const TheCounter =  { div: {
    id: "myCounter",

    props: {
        counter: 0
    },

    onInit: $ => {
        console.log($.counter)
    }

 }} 
 ```

 In questo esempio stiamo definendo un componente "TheCounter", la cui rappresentazione grafica è un div. Possiamo definire una variabile `counter` con valore iniziale `0` grazie alla keyword "`props`".

Abbiamo inoltre assegnato al nostro componente un identificativo (`myCounter`), tramite la keyword "`id`", che sarà univoco in tutta l'app. 
Vedremo meglio com'è possibile utilizzare gli id in seguito. 

Abbiamo anche definito l'hook `onInit` che verrà chiamato all'inizializzazione del componente.

 Per referenziare e mostrare all'utente il contenuto della variabile è possibile utilizzare:

  ```javascript
 const TheCounter =  { div: {
    id: "myCounter",

    props: {
        counter: 0
    },

    text: $ => "The Counter Is: " + $.this.counter
 }}
 // Rendered as <div>The Counter Is: 0</div>
 ```
 Per la definizione degli Evaluable (funzioni il cui primo argomento è sempre '`$`') ci si rifà alla definizione di funzione in python, per cui il primo argomento è sempre "`self`". Nel caso di CLE, invece, è sempre `$`, anche se l'argomento `$` è qualcosa di più complesso di un mero riferimento al '`this`' del Componente.

`$` here is a special variable that contains some reference to certain `scope selector`. It contains:
    
- '`this`' scope selector, wich is a refernce to `this` CLE element. like the 'self' in python
    - here we can find variables, methods, signals, a reference to the parent element ("parent"), and a reference to the renderized html element via "`el`" property
- '`parent`' scope selector, wich contain a refernce to the parent
- '`scope`' scope selector, wich contain all the variables and methods of this element, it's meta and of all the parents in his parent chain (equivalent to: `this` & `meta` & `parent` & `parent.parent` & `parent.parent.parent` + ...). With normal  shadowing rule.
- '`meta`' scope selector, wich contain all the variables and methods of all the parents 'meta' in his parent chain. mostly used in the list-like components, using `leFor`
- '`le`' scope selector, wich is a container of the element by id (global). 
- '`ctx`' scope selector, wich is a container of the element by id (local of the so called 'component', that are created with the 'Use' key)
- '`ref`' scope selector, wich is a container of the element by id (local of the so called 'component', where the 'name' is registered in the childsRef, and a 'name' is assigned)
- '`dbus`' scope selector, where you can find the global dbus channels. useful to connetc different application part.
- '`u`' scope selector, that contains some metaprogramming utils, like signal creation and subscribe, dynamic child retrive, creation and destruction
- '`oos`' out of scope selector, a free (untracked and non bindable) per-object space where can be manually defined (imperative code) anything, for example for data where binding is not required. This space will be "shared" with all the components instance, also in "Use". To have a per-instance space declare it as a function that return an object (with $ arg) and will be generated at run-time before init.

- `#Final Tip`: is always possible to use directly `$.xxx` wich will be resolved as `$.scope.xxx` ( scope selector '`scope`' is the default used in resolution).

Visto che abbiamo definito un id univoco per questo componente (`myCounter`) è dunque possibile referenziare la variabile counter come:
 ```javascript
    $.le.myCounter.counter
 ```

 Questo implica che è possibile utilizzare anche una proprietà di un componente NON nella propria parent chain, semplicemente riferendosi al componente che la contiene e chiamandola per nome:

  ```javascript
 const TheCounter =  { div: {
    id: "myCounter",

    props: {
        counter: 0
    },
    ...
 }}


 const TheCounterStats =  { div: {

    props: {
        isEven: $ => $.le.myCounter.counter % 2 === 0,
        isBig: $ => $.le.myCounter.counter > 100,
    },

    text: [
        "Is Counter Even? ", $ => $.isEven, { br: {}},
        "Is Counter Big? ", $ => $.isBig
    ]
 }}
 

 RenderApp(dcoment.body, cle.root({},
    
    { h2: "Welcome to Clean.js" },

    TheCounter,

    TheCounterStats

 ))
 ```

Inoltre, grazie a `$.parent` e `$.scope` possiamo utilizzare le proprietà nella nostra parent chain. Questo di fatto permette di creare dei veri e propri "`Componenti`" riutilizzabili
  ```javascript
 const TheCounter =  { div: {
    id: "myCounter",

    props: {
        counter: 0
    },

    // Childs
    '=>': [
        { h3: "Hello Dev!" },
        { div: $ => "The Counter Is: " + $.scope.counter } // Explicit
        { div: $ => "The Counter Is: " + $.counter } // Implicit $.scope.counter
        { div: $ => "The Counter Is: " + $.parent.counter } // Referencing the direct parent only. Not suitable for frequent changing component.
    ]
 }}

 /* Rendered as:
    <div>
      <h3>Hello Dev!<h3>
      <div>The Counter Is: 0</div>
      <div>The Counter Is: 0</div>
    </div>
 */
 ```

 Per concludere sulle variabili andiamo a valutare il meccanismo di change detection adottato da CLE, più simile a quello di React che a quello di Angular.

 Data infatti una variabile contenente un oggetto:
 ```javascript
 props: {
    calendarEvent: { id: 0, dueDate: "2022-01-01", title: "Go to grocery store" }
 }
 ```
 Il meccanismo di change detection, che scatena un rerendering dei componenti che `seguono` tale proprietà, è quello dell'uguaglianza semplice (===). Nel caso dell'oggetto calendarEvent, la modifica del `title`, ad esempio, NON verrà identificata (il riferimento non è cambiato!), mentre per una property string questo succederà (è una nuova stringa!). Ciò ovviamente vale, rispettivamente, per tutti i tipi riferimento e valore. 

 E' necessario dunque trattare le property come costanti (come in React): per modificare il title è necessario riassegnare un nuovo oggetto, ad esempio usando lo `spread operator`

 ```javascript
 ... $ => {
    $.calendarEvent =  { ...$.calendarEvent, title: "Go to the mall" }
 }
 ```
Esiste però un'altra possibilità, ovvero utilizzare un metodo che viene autogenerato per ogni property, nello stesso scope della property, e che viene generato come '`_mark_XXX_as_changed()`'.

In questo caso potremmo modificare il codice precedente in:

 ```javascript
 ... $ => {
    $.calendarEvent.title = "Go to the mall"
    $._mark_calendarEvent_as_changed()
 }
 ```

 Come vedremo in seguito, per ogni property viene anche generato un `Signal`, nella forma '`xxxChanged`', che i componenti (incluso se stesso) possono decidere di ascoltare e reagire al fine di disaccoppiare azioni/responsabilità e ridurre gli orchestratori.

Nell'esempio precedente per la proprietà `calendarEvent` verrà generato un segnale `calendarEventChanged`.


Una shortcut al patter edit "ref-prop and mark as changed" è utilizzare la funzionalità built-in nel this `editRefVal`, il quale permette di effetuare modifiche interne a un ref e segnalare il cambiamento automaticamente.
```javascript
 $ => $.this.editRefVal.calendarEvent(cv => { cv.title = "Go to the mall" })
   
```

## Props alternatives & data declaration shortcuts:
La keyword "props" non è l'unica che si può utilizzare per dichiarare delle variabili. Le altre sono:
- let
- data

e sono determinate solo dalla semantica che lo sviluppatore vuole utilizzare.

Inoltre, come vedremo anche per le altre "keyword", è possibile evitare di scriverele in un oggetto assegnato alla keyword, utilizzando una definizione compatta "inline" con dash-case. E' quindi possibile dichiarare una variabile come:
- "let_" + "myPropName"

es: 
```javascript
{ div: {
    let_property1: "a value", // preferred way!
    let_property2: 123
}}
```

In ultima analisi, nel caso in cui si inserisca una "keyword" nella definizione che NON è tra le reserved e/o non viene riconosciuta, questa diventerà per CLE una definizione di una variabile. Dunque per dichiarare una variabile è sufficiente scrivere:

```javascript
{ div: {
    property1: "a value", // preferred way!
    property2: 123
}}
```

## Functions
Le funzioni vengono definite tramite la key "`def`" e devono avere come primo argomento un riferimento allo scope `$`, come in Python, seguito dagli altri argomenti.

Riprendendo il nostro esempio del counter:

  ```javascript
 const TheCounter =  { div: {
    id: "myCounter",

    props: {
        counter: 0
    },

    def: {
        increment: ($, incAmount=1) => {
            $.counter += incAmount
        }
    },

    '=>': [
        ...

        { button: {
            text: "Counter +1",
            handle: { onclick: $ => $.inctrement(1) }
        }},

        { button: {
            text: "Counter +5",
            handle: { onclick: $ => $.inctrement(5) }
        }},
    ]
 }}
 ```

 Per le sole funzioni è possibile definire dei `namespace` in cui inserire funzioni (massimo 1 livello di profondità). Ad esempio:

  ```javascript
 {
    def: {
        increment: ($, incAmount=1) => {
            $.counter += incAmount
        },
        appUtils: {
            getRandomNum: $ => Math.random()
            capitalize: ($, str) => str[0].toUpperCase() + str.slice(1)
        }
    },
}

...

$ => $.appUtils.capitalize("hello world!")
 ```

E' anche possibile definire delle funzioni come costanti in una props utilizzando l'utils `asFunc`

```javascript
import {asFunc} from "lib/caged-le.js"

{
    myFunc: asFunc(($, ...args)=>{ ... }) // const/prop function 
}

// using standard usage: $ => $.scope.myFunc()
```

Come per le variabili, esiste poi la possibilità di collassare la definizione `keyword: object` tramite:
- "def_" + "myFunction"

```javascript
{ div: {
    def_myFunc: $ => { ... }
}}
```

## Signals
I Segnali in CLE sono un meccanismo PUB/SUB like di tipo stream che i componenti possono definire e lanciare affinchè altri componenti (o essi stessi) possano decidere di ascoltare per reagire ad eventi ad esso collegati. 

I segnali, come gli Event in Angular, possono trasmettere diversi tipi di dato, al fine di poter essere utilizzati non solo come notifica ma come meccanismo di Input/Outut, disaccoppiando prodicer dal consumer, e dunque codice.

Esistono due tipi di segnali:
- `Segnali "Puri`"
    - definiti tramite keyword "`signal`: { [`name`]: "`stream => (myData: string)`" }" // definition as descriptive string
- `Segnali connessi a variabili`
    - autogenerati da CLE per ogni variabile definita, nella forma "`xxxChanged`"

I primi trasportano solo i valori "emessi", mentre i secondi si differenziano dai primi in quanto trasportano il nuovo e il vecchio valore della property puntata, al fine di fare opportuni ragionamenti.

I segnali "puri" possono anche essere lanciati in modo imperativo utilizzando `$.yyy.signal_name.emit(...args)`, mentre i secondi non possono essere lanciati direttamente ma vengono emessi da CLE al change del dato, o dopo una "`mark as changed`" esplicita.

I segnali sono dunque locali al componente e vivono nel namespace dello stesso. Per ascoltarli sarà necessario poter puntare a quel namespace, (es via $.scope, $.parent, $.le, $.ref, ...). Come vedremo in seguito, è però possibile creare segnali globali (univoci) grazie al DBUS di CLE.

E' possibile definire un segnale con:
```javascript
 const TheCounter =  { div: {
    ...

    signals: {
        counterReset: "stream => (void)",
        counterEditedFromUser: "stream => (newValue: string)"
    }
    
    ...
 }}
```

Per emettere un segnale possiamo riferirci ad esso con `$.xxxx.signalname` e usare `.emit(...args)` (con xxxx scopeSelector)

```javascript
 const TheCounter =  { div: {
    ...

    def_reset: ($, newVal) => {
        ...
        $.this.counterReset.emit()
    }

    def_userManualEdit: ($, newVal) => {
        ...
        $.this.counterEditedFromUser.emit(newVal)
    }
    
    ...
 }}
```

E' possibile collassare la definizione inline `keyword: object` tramite:
- "signal_" + "signalName"
- "s_" + "signalName"

```javascript
 const TheCounter =  { div: {
    ...

    signal_counterReset: "stream => (void)",
    signal_counterEditedFromUser: "stream => (newValue: string)"
    
    // or
    s_counterReset: "stream => (void)",
    s_counterEditedFromUser: "stream => (newValue: string)"
    ...
 }}
```

### Subscribe to Signals
Per ascoltare un segnale è sufficiente dichiararne la gestione tramite keyword "`on_s`" oppure "`on`". Ad esempio, per agganciarsi ai due segnali precedenti:

```javascript
{
    ...

    on: {
        // scope selector
        this: { 
            // signal
            counterReset: $ => { // action
                console.log("counter has ben reset")
            },
            counterEditedFromUser: ($, newVal) => {
                console.log("counter edited from user, new value:", newVal)
            }
        },
        // scope: {
        //     ...signalInScope...
        // },
        // exception for: le, ctx and ref scopes:
        // le: {
        //     ...leComponentById... : {
        //         signal
        //     }
        // }
    }
    ...
 }
```
Esiste poi una shortcut per dichiarare la gestione inline:

```javascript
{
    ...

    // "on"_"scope selector"_"signal": action
    on_this_counterReset: $ => { ... },
    on_this_counterEditedFromUser: ($, newVal) => { ... }
    
    // exception for le and ctx:
    // "on"_"le"_"id"_"signal": $ => { ... }
    ...
 }
```

In case of "scope" selector it can be omitted as it's the default:

```javascript
{
    ...

    on_counterReset: $ => { ... }
    on_counterEditedFromUser: ($, newVal) => { ... }
    
    ...
 }
```
Allo stesso modo è possibile registrarsi a una propertyChanges (tramite scope selector e mangling "propertyName" + "Changed"):

```javascript
const myComponent = { div: {
    
    props: {
        status: "active"
    }

    on_this_statusChanged: ($, newStatus, oldStatus) => { // action
        if (newStatus !== oldStatus){
            console.log("status changed!")
        }
    }
    ...
 }}
```

E' sempre possibile utilizzare codice imperativo per creare segnali e fare subscribe/unsubscribe dinamicamente. All'interno di `$.this` troviamo infatti i metodi:
- `subscribe`:
    - subscribe to signal and return the unsubscriber
- `subscribeAsync`
    - same as subscribe but async
- `unsubscribe`

Per generare nuovi segnali è invece possibile utilizzare lo scope "`u`" (utils), in cui si trova `$.u.newSignal`.

#### Emit variants
E' possibile inviare un segnale a un tempo stabilito con: 
- emitLazy(t=1, ...args)

E' anche possibile aspettare la gestione del segnale e ricevere le risposte tramite:

- emitWaitResp - wait for all handlersa and capture the response data (if any). To send back a response in a on_xxx_signalName simply return a value in the handler function
- emitWaitFirstToResp - wait only the first response not "undefined" and STOP subsequent handlers. Signal delivered at most once.
- emitWaitRespCondition - same as first to resp but with a specific condition (func as first argument).

```javascript
// on the emitter:
const responses = $.scope.newElement.emitWaitResp($.element)
...
// on the handlers
on_newElement: ($, el) => {
    return el.prop1 === "type1" ? $.someData : undefined
}
```

### DBUS
Dbus è un meccanismo di eventi globale, del tutto simile a Signals ma a livello globale. 

Per dichiarare un segnale DBUS è necessario utilizzare la "keyword" `dbus_signals`:

```javascript
 { div: {
    ...

    dbus_signals: {
        globalCounterReset: "stream => (void)",
    }
    
 }}
```

Per ascoltare un segnale DBUS si utilizza lo scope selector "dbus" in una "on" / "on_s"
```javascript
 { div: {
    ...

    on: { 
        dbus: { 
            globalCounterReset: $ => { ... }
        }
    }
    
 }}
```
Per lanciare un segnale DBUS basta utilizzare lo scope speciale `$.dbus` in cui si possono trovare tutti i segnali globali ed emetterli con `$.dbus.dbus_sginal_name.emit(...args)`

L'utilità di un sistema come DBUS è quello di avere un meccanismo di eventi dipendente da un concetto / contratto. Basta infatti conoscere il nome del segnale per poter far sì che diverse parti dell'applicazione possano seguirlo.

Anche per i segnali DBUS è possibilie collassare la definizione inline tramite:
- "dbus_signal_" + "signalName"

```javascript
 { div: {
    dbus_signal_globalCounterReset: "stream => (void)"
 }}
```

Anche per dbus troviamo le varianti della emit definite per i Signals.


## HTML Attributes - attrs & hattrs
Gli attributi HTML in CLE vengono dichiarati dalla keyword "`attrs`" e la sua shortcut "`a`". Gli attributi permessi in questa definizione sono solo quelli `testuali` (quindi non le funzioni come onclick etc, che vanno gestiti in "handle").

```javascript
const coloredDiv = { div: {

    attrs: {
        class: "colored-div full-height",
        style: "color: red",
        mycustomattr: "abc",
        ...
    }
    
    // shortcut inline:
    // "a_" + "attributeName":
    //    a_class: "colored-div full-height"
    //    a_style: "color: red"
 }}
```
Per i soli attributi style e class è possibile anche omettere la shortcuts "a_" e scriverli direttamente come:

```javascript
const coloredDiv = { div: {
    
    class: "colored-div full-height",
    style: "color: red"

 }}
```

Per il solo attributo "style" è possibile scrivere lo stile inline come object (camel case, automaticamente convertito in kebab-case ad eccezione delle proprietà che iniziano per "::" passate come stringhe)

```javascript
const coloredDiv = { div: {
    
    attrs: { 
        style: {
            color: "red",
            fontSize: "15px",
            
            // start with :: to keep key untouched
            "::-webkit-box-shadow": "0px 6px 32px -1px rgb(0 0 0 / 42%)"
        }
    }

 }}
```
Gli attributi possono essere dichiarati anche come Evaluable, e dunque seguire cambiamenti nei dati come per le property

```javascript
const coloredDiv = { div: {

    props: { 
        status: 'active' 
    },

    attrs: {

        class: $=>"colored-div full-height " + ($.status === 'active' ? 'actv-sts' : '')
        
        style: $=>({
            color: $.status === 'active' ? "red" : "black"
        }),
        
        mycustomattr: "abc",
    }
 }}
```

Grazie a questo meccanismo è possibile realizzare `2 way data binding` utilizzando la funzione "`Bind`" (vista meglio nella sezione dedicata).

Per esempio, su un campo di input:

```javascript
import { Bind } from "lib/caged-le.js"

const inputBar = { input: {

    props: { 
        text: 'Initial Text' 
    },

    attrs: {
        value: Bind($=>$.text)
    }
 }}
```
o per esempio con una select

```javascript
import { Bind } from "lib/caged-le.js"

const mySelect = { select: {
      
    props: { 
        selected: "val1" 
    },

    attrs: {
        value: Bind($ => $.selected)
    },

    '=>': [
        { option: { a_value: "val1", text: "Value 1" }},
        { option: { a_value: "val2", text: "Value 2" }},
    ]
}}
```

### hattrs - Potential Harmfull Attribute
E' inoltre possibile definire gli attributi / proprietà NON inline dell'elemento html associato via `hattrs` e la sua shortcut "`ha_`".

a differenza degli attributi attrs, che vengono impostati in modo safe tramite setAttribute, questi NON sono attributi safe, e dunque potenzialmente pericolosi se non si sa cosa si sta facendo. Vengono comunque messi a disposizione in quanto per la maggior parte utili (tutti quelli che non sono funzioni o che possono essere valutati come funzioni, come gli onclick etc) e sicuri. Inoltre rappresentano, in certi casi, l'unico modo per impostare alcuni attributi in modo dichiarativo con l'aggiunta della detect changes.

Possono essere utilizzati per definire proprietà nested, oppure proprietà non presenti nella dichiarazione HTML, come `scrollTop`

```javascript
const scrollableDiv = { div: {

    props: { 
        scrollPosition: 0 
    },

    hattrs: {
        "scrollTop": Bind($ => $.scrollPosition)
        // possibile anche dichiarare la detectChanges come lazy:
        // "@lazy:scrollTop": Bind($ => $.scrollPosition)

        // nested prop:
        'myAttr.nested.prop': "some-value",

        // ad esempio in una form: 
        // "@lazy:form.elements.formElement.value": Bind(...) // lazy necessario per accedere a "formElement"
    }
    // shortcut:
    // "ha_" + "objectAttributeName":
    //    ha_scrollTop: ...
 }}
```

un suo utilizzo molto particolare come nested prop è per esempio poter definire un evaluable per un singolo componente dello style:

```javascript
const coloredDiv = { div: {

    props: { 
        status: 'active' 
    },

    "ha.style.fontSize": "15px"
    "ha.style.color": $ => $.status === 'active' ? "red" : "black"
    
 }}
```
## Event Handling
Per gestire gli eventi HTML come ad esempio onclick è necessario usare la keyword "`handle`" o la sua shortcut "`h_`". 

L'evento HTML originale viene passato come secondo parametro (il primo è e deve sempre essere "`$`")

```javascript
const myButton = { button: {

    text: "Do Some Action",

    handle: { 
        onclick: ($, event) => ...,
        onmouseenter: $ => ...,
        onmouseleave: $ => ...
    }

    // shortcuts inline:
    // "handle_" + "oneventname"
    // "h_" + "oneventname"
    // "ev_" + "oneventname"
    //    handle_onclick: ($, event) => ...,
    //    h_onclick: ($, event) => ...,
    //    ev_onclick: ($, event) => ...,

    // ma anche:
    // "oneventname" + "_event"
    //    onclick_event: ($, event) => ...,


 }}
```

Unico caso speciale per "onclick" che può essere definito senza shortcut come per gli attr "style" e "class".
```javascript
{
    onclick: ($, evt) => ...
}
```

Esistono però casi in cui bisogna personalizzare in modo più importante gli eventi. in questo caso si può utilizzare la keyword "`when`" e la sua shortcut "`w_`"

si può utilizzare per catturare eventi particolari, oppure per cambiare la stategia capture. Questo perchè di fatto gestisce gli html event come addEventListener (che è configurabile!).

Possiamo passare un evaluable/handler direttamente come per "handle" oppure un `oggetto` contenete l'handler e le options della addEventListener

```javascript
{
    ...
    when: {
        focusin: ($, e) => ...standardAction...
        focusout: { 
            options: {capture: true, useCapture: true}, // addEventListener options!
            handler: ($, e) => ...standardAction...
        }
    }

    // shortcuts:
    // "w_" + "eventName"
    //    when_focusin: ($, e) => ...,
}
```

## Styling & CSS
per lo styling conigliamo l'utilizzo di una librearia di css-in-js come csz (https://github.com/lukejacksonn/csz). Con questa libreria è possibile definire classi css direttamente nella definizione delle classi usate dall'elemento

```javascript
const css = (await import('https://unpkg.com/csz')).default;

// declare global style
const globalStyle = css`
  :global(body){
    padding: 10px; margin: 0px; width: 100% 
  }
  :global(*){
    box-sizing: border-box !important;
  }`

// reusable class
const highlightOnHover = css`&:hover{ transform: scale(1.05)}`

{ div: {
    class: [
        css`display: flex; justify-content: space-between;`, 
        highlightOnHover
    ].join(" "),
}}
```

Esistono però due keywords dedicate al css per scrivere classi css  senza l'uso di librerie esterne
### css
la keyword "`css`" accetta una lista di stringhe, contenenti le definizini css da appendere al foglio.

```javascript
{ div: {
    let_transformScale: 1.05,

    css: [
        `
        div { padding: 5rem }

        .flex-item {
            display: flex; 
            justify-content: space-between;
        }`, 

        $=>`.flex-item:hover{ 
            transform: scale(${$.transformScale})
        }`,

    ]
}}
```
Il problema di questo approccio sta nella separazione delle classi nei vari componenti, in quanto agisce come style globale.

### s_css
come miglioramento troviamo il complesso sistema di “s_css", che permette di rendere le classi css dichiarate solo nei sottofigli, (incapsulando all'indietro). Con questo meccanismo è inoltre anche possibile modificare dall'esterno le regole css definite quando veine riutilizzato un componente tramite Use/Extended.

```javascript
{ div: {
    s_css: {
      ".myClass": [{
        display: "inline"
      }]
      ".myClassDynRule": [$=>({
        display: $.scope.condition ? "inline" : "none"
      })]
    } // Use/Extended(component, {s_css: {".myClass": [ExtendSCSS, {opacity: 0.8}]}})
}}   
```
visita la demo demo/misc-example.js/ -> appDemoSCSS per altre info

-------

## CLE Shortcuts: Smart Component (`cle`) & Smart Function (`f`, `fArgs`, ) 
Tra le varie shortcuts linguistiche presenti in cle, in grado di migliorare la sintassi e al tempo stesso la velocità di scrittura del codice troviamo gli `Smart Component` e le `Smart Function` (Evaluable).

Per utilizzare gli `Smart Component` è sufficiente importare `cle`.

 ```javascript
import { cle } from "lib/caged-le.js"
 ```

 cle è una shortcuts linguistica che permette di scrivere componenti CLE come :
 ```javascript
 cle.xxxHTMLTAGxxx(standardDefinition, ...childs)
 ```
 convertendoli in:
 ```javascript
 { xxxHTMLTAGxxx: {
    ...standardDefinition,
    "=>": [
        ...childs
    ]
 }}
 ```

Con l'eccezione per ciu `standardDefinition` può essere anche una Stringa o un Evaluable, e in quel caso viene convertito in:
 ```javascript
 { xxxHTMLTAGxxx: [ ...childs ]}
 ```

Possiamo riscrivere il componente `TheCounter` di prima come:

  ```javascript
 import { cle } from "lib/caged-le.js"

 const TheCounter =  cle.div(
    // Definition
    { 
      id: "myCounter",

      props: {
          counter: 0
      },
    },

    // Childs
    cle.h3("Hello Dev!"),
    cle.div($ => "The Counter Is: " + $.scope.counter)
    cle.div($ => "The Counter Is: " + $.counter)
    cle.div($ => "The Counter Is: " + $.parent.counter)
    
 )
 ```
 Allegerendone la sintassi.

 Nel caso in cui i figli siano tutti stringhe o evaluable e non ci sia una definition è possibile anche scrivere:
 ```javascript
 cle.div("Text ", $=>$.evaluable, ...)
 ```

La seconda shortcuts riguarda invece la possibilità di scrivere Funzioni (Evaluable) inline tramite stringhe di testo, inserendo dei riferimenti a variabili dei componenti CLE tramite "`@`". Ricorda, anche se scritte come testo sono a tutti gli effetti Funzioni, dunque NON provare a fare metaprogrammazione combinando o manipolando le Smart Function come faresti con le stringhe ed eviterai spiacevoli attacchi XSS!

Per utilizzarla basta importare le funzioni `f` o `fArgs`
 ```javascript
import { f, fArgs } from "lib/caged-le.js"
 ```
Il funzionamento di f è quello di un Template literals
(https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) pr cui viene chiamata non con delle parentesi ma scrivendo prima di una stringa con "`backtick`". 
- Nota: viene utilizzata tale sintassi solo per allegerire visivamente la definizione, non per dei veri e propri templating!

 Potremo dunque referenziare le variabili xxx nello `scope` con f\`@xxx\` oppure quelle del parent come f\`@p.xxx\`.

 Possiamo riscrivere il componente `TheCounter` di prima come:

  ```javascript
 import { cle, f } from "lib/caged-le.js"

 const TheCounter =  cle.div(
    // Definition
    { 
      id: "myCounter",

      props: {
          counter: 0
      },
    },

    // Childs
    cle.h3("Hello Dev!"),
    cle.div(f`"The Counter Is: " + @counter`)
    cle.div(f`"The Counter Is: " + @p.counter`)
 )
 ```

 Full shortcuts Reference:
 - "`@.xxx`"  -> $.scope.xxx
 - "`@s.xxx`"  -> $.scope.xxx
 - "`@p.xxx`"  -> $.parent.xxx
 - "`@t.xxx`"  -> $.this.xxx
 - "`@l.xxx`"  -> $.le.xxx
 - "`@c.xxx`"  -> $.ctx.xxx
 - "`@m.xxx`"  -> $.meta.xxx
 - "`@d.xxx`"  -> $.dbus.xxx

Nel caso di Evaluable più complessi è possibile utilizzare le parentesi graffe per indicare che il codice è su più righe e gestiremo da noi la return (non è inline):


```javascript
...
  cle.div(f`{ 
      const txt = "The Counter Is: ";
      return txt + (@counter * 2);
  }`)
...
```

Le fArgs entrano in gioco quando vogliamo invece definire funzioni che però accettano più parametri, come ad esempio la gestione di un evento HTML, che può essere definito come:

```javascript
...
  cle.div({
    handle_onclick: fArgs("$event")`{ 
      console.log("The html target is:", $event.targt);
      console.log("Counter incremented! New: ", @counter);
    }`
  })
...
```

# Conditional Component - leIf
Per la definizione di componenti che devono essere presenti o meno in base ad una condizione (es *ngIf in Angular) utilizziamo la keyword "`if`" nel "meta".

la keyword `meta` di fatto è un contenitore di meta-programmazione, per cui si stabilisce il funzionamento di ogni componente.

Per realizzare un componente "opzionale" basta scrivere: 
```javascript
{ div: {
    meta: { if: $ => $.scope.condition === true },
    ...
}}
```

# Repeated Component - leFor
Per realizzare componenti ripetuti, come una lista di elementi, si utilizza la definzione "`forEach`": "meta-var-definition-name", "`of`": evaluable/const nella keyword "`meta`"

```javascript
{ div: {
    meta: { forEach: "item", of: $ => $.scope.items },
    ...
}}

// tips: 'f' is encuraged here:
// meta: { forEach: "item", of: f`@items` },
```
 grazie a questa sintassi il componente verrà ripetuto N volte, e verrà generata la variabile descritta in "forEach" nello scope selector "meta" (e ovviamente nello scope, essendo il meta incluso), al cui interno si potrà trovare il valore dell'elemento corrispondente alla propria posizione.

 Qui a a differenza di altri framework come React, in cui la generazione di componenti ripetuti è realizzata tramite codice imperativo (es .map, o in generale cicli), si utilizza un approccio più descrittivo, alla Angular. L'idea è che basta dichiarare nel meta che è da ripetere per avere N elementi simili. Ciò implica che NON è possibile fare
 ```javascript
 // Error!
{ div: {
    '': $ => $.scope.items.map(item=>(
        { h2: { text: item }}
    ))
}}
```

questa sintssi non farebbe altro che generare un evaluable che CLE proverebbe a renderizzare come testo alla sua risoluzione, e dunque il risultato a video sarebbe un [Object, Object..].

Questo perchè CLE è un framework prettamente dichiarativo, non avrebbe senso mischiare codice imperativo/funzionale in un contesto del genere.
```javascript
 // Correct!
{ div: {
    '': 
        { h2: { meta: { forEach: "item", of: $ => $.scope.items },
            text: $ => $.meta.item // also $.scope.item or $.item
        }}
}}
```
### Abaout variables in meta & pushback
a differenza di framework come react in cui è impossibile modificare un elemento di una lista in una map senza passare dalla useState in CLE è possibile modificare direttamente un singolo item via semplice assegnazione con `$.item = ...` 

questo perchè il meccanismo interno di CLE possied il vero riferimento e fa in modo che l'utente modifichi realmente quello.

Come già detto però modificare un singolo elemento di una lista non porterebbe a una detect changes, quindi come in react bisognerebbe comunque riassegnare l'intero array.

E' però possibile abilitare nel meta l'opzione `metaPushbackAutomark: true`. Questo farà si che il changes venga identificato correttamente per le assegnazioni dirette: `$.item` = 123

### Performance Tips
Al fine di ottenre un boost delle performance nel repaint è consigliato l'utilizzo del flag `optimized: true` nel meta. Il repaint in questo caso sarà solo dal primo elemento che cambia in poi.

Questo farà si che sia possibile definire anche un nuovo `comparer` per la detect dei changes dell'intero array e/o dei singoli elementi con `idComparer`

Per ridurre al minimo il repaint è consigliato abilitare la modalità `full_optimized: true` che migliora la optimize e il comparer con un algoritmo più lento ma che garantisce di non effettuare repaint se non per gli elementi realmente modificati. In questa modalità l'idComparer con id stabili è altamente consigliato.


```javascript
{ meta: {
    optimized: true, // enable optimization
    full_optimized: true, // full optimizatione (slower). disable ALL repaint not required by near-full comparison

    // Array Comparer, per identificare i changes dell'array, to change the "edit ref by new val" pattern
    comparer: (newArr, oldArr) => newArr !== oldArr

    // Comparer of each elements of the Array, to boost performance
    idComparer: (newEl, oldEl) => newEl !== oldEl
}}
```


### Helpers
Tramite la keyword "`define`" in "meta" è possibile definire delle variabili "helpers" che verranno inserite nel meta. Le 5 variabili standard sono: index, first, last, length, iterable, che possono essere utilizzate per avere info sull'elemento dell'array ripetuto.

```javascript
{ meta: { 
    forEach: "item", of: $ => $.scope.items,

    define:{ 
        // helpers: "set-local-name-in-meta"
        index: "idx", 
        first: "isFirst", 
        last: "isLast", 
        length: "len", 
        iterable: "myArr",    
    }
}}
```


# Switch..Case Component
Pur essendo sostituibile con degli leIf esiste una definizione specifica per gli switch-case:

```javascript
import {Switch, Case} from "lib/caged-le.js"

{ div: {
    ...

    '': [

        ...Switch(
            
            Case(
                value | evaluable,
                component // { h2: { ... }}
            ),

            Case(
                value | evaluable,
                component // { h2: { ... }}
            ),
            ...
        )
    ]
}} 
```

# More About Meta

Scope Options, inside meta:

```javascript
meta: {
    newScope: bool (false) // block scope visibility
    noThisInScope: bool (false) //remove this from the scope
    noMetaInScope: bool (false) // remove meta variable in scope
    
    hasViewChilds: bool (false) // materialize CLE Object
}
```


## Componentization
Componentizzare in CLE significa principalmente 'splittare' il codice in diversi oggetti riutilizzabili (variabili/costanti). A differenza di altri framwork non esiste un vero e proprio concetto di "Componente" da dover definire obbligatoriamente. 

Un vero componente CLE è di fatto un singolo elemento HTML. Grazie però allo `scope` e al `ctx`, nonchè alle due funzioni `Use` ed `Extend` è possibile definire un 'componente' in modo abbastanza simile a ciò che siamo abituati a usare.

Questa scelta di fatto aiuta a pensare alla separazione e componentizzazione del codice come un operazione facile e veloce come in React (ctrl+c, ctr+v), piuttosto che onerosa come in Angular (ng-generate, ctrl+c, ctr+v).

Inoltre, rispetto a framework come React, non è necessario passare in avanti esplicitamente (o con i context manager..) le i getter e setter dello stato, in quanto grazie allo `scope` queset sono esposte e visibili automaticamente, a meno di non essere splicitamente disabilitato. In questo modo si evita di passare in avanti infinite props e in particolare l'uso di `id` e `name` (aka reference) permette di evitare l'effetto "move state into parent components" per permettere la comunicazione, e dunque si ritorna ad avere uno "stato" vicino all'owner naturale.

Pur sembrando un antipattern, rilassare questo vincolo, ovvero che i child possono vedono proprietà del padre, se ben utilizzato tramite i CLE Object (Model/Controller/Service..) permette un incredibile modularità, spostando il concetto di dipendenza come accoppiamento di codice (che tende a generare boilerplate code) a dipendenza come "convenzione" / "concetto atteso" (Coding By Convention, DI like). Per non cadere nel loop del "what is used?" consigliamo di esplicitare sempre le dipendenze tramite "deps". 

Resta però sempre possibile decidere di bloccare lo scope automatico e passare in modo imperativo proprietà, metodi etc tramite costruttore.

----------

# Component Templating, Extension & Use
Dal momento che un componente CLE è un POJO, per definire dei componenti riutilizzabili basta semplicemente assegnare questi oggeti ad una variabile e dunque per utilizzarli basterà usare tali variabili come childs.

```javascript
const ReusableH1 = { h1: { text: "I'm reusable!" }}
const ReusableH3 = { h2: { text: "Whenever you want" }}

const App = { root: {
    
    '': [

        ReusableH1,
        ReusableH3,

        { br: {}}, 

        ReusableH1,
        ReusableH3,
        
        { div: "other definitions.." }

    ]
}}
```

Grazie alla sua natura POJO, allo scoping veso il basso e agli id/ctx_id, la modalità predefinita per `"passare" valori` ad un componente è quella della "ridefinizione". Questo concetto, molto familiare agli utilizzatori di QML, è quello di fare "override" di una qualsiasi definizione/keyword del componente, e dunque impostare i valori, le properità da seguire, le reazioni ai segnali. E' possibile addirittura cambiare il comportamento originale. Possiamo infatti utilizzare la funzione `"Use"` da lib per dichiarare l'utilizzo di un componente e allo stesso tempo passare delle `"redefinitions"`. 

```javascript
Use(
    component, 
    redefinitions = { [keyword]: value } | undefined, 
    // options
    { 
        strategy = "merge" | "override", // merge is default
        init = { [arg]: value } | undefined, 
        inject = { [placeholderName]: cle component } | undefined
    }
)
```

possiamo pensare a redefinitios come una shortcuts per:

```javascript
{...definition, ...redefinitions}
```
ma molto più evoluta, in quanto effettua, è possibile infatti decidere la strategia della redefinitions: 
- "override" assume che la redefinitions è a cura dell'utente e dunque è in tutto e per tutto identico al codice precedente
- "merge" effettua una merge delle nuove chiavi in cascata (senza cancellare le vecchie)

Ad esemprio la merge strategy (default) in questa redefinition:
```javascript
const Component = { div: {
    props: {
        var1: "",
    }
}}

Use( Component, { 
    props: { var2: "content" } 
}) 
```
produrrebbe di fatto:
```javascript
{ div: { 
   props: { var1: "", var2: "content" }
}}
```

Inoltre l'utilizzo di Use su un cle element farà si che questo diventi il root di un nuovo context (ctx), valido per lui stesso e tutti i suoi sottofigli che NON sono componenti Use, ovvero un vero e proprio componente.


```javascript
import {RederApp, Use, Bind, cle} from "lib/caged-le.js"

const InsertPercentageComponent = cle.div({ // ctx id is by defult "root" for component in Use
    
    // component's public scope (via ctx.root...)
    let_initialText: "",

    def: {
        getInitialInputText: $ => $.initialText,
        getOriginalInputText: $ => $.ctx.inputBar.text,
        getCorrectedInputText: $ => $.ctx.output.correctedText,

        setText: ($, txt) => { $.ctx.inputBar.text = txt },
        resetText: $ => { $.ctx.inputBar.text = "" },
    }

  },
    // Component's private scope can be created in this way (accessed in this component via ctx.private...)
    { Model: {  ctx_id: "private", 
        let_privateVar: "hello i'm private",
    }},

    // Ordinary childs, their scope are not visible from outside
    cle.input({  ctx_id: "inputBar",
        let_text: $ => $.initialText, // Because of Bind it's copied once, then overwritten!
        a_value: Bind(f`@text`) 
    }),

    cle.div({  ctx_id: "output",
        let_correctedText: $ => $.ctx.inputBar.text.length > 0 ? ($.ctx.inputBar.text.toFixed(1) + "%") : ""
    }, 
        $ => $.correctedText
    ),

    cle.div($ => $.ctx.private.privateVar)
)

// Usage 
RenderApp(document.body, cle.root({}, 

    Use( InsertPercentageComponent, { ctx_ref_id: "nameInParentContext", // or define a "name" and use childsRef in root

        let_initalText: "0.0"
    }),

    { Controller: { // refer to used component by name in this context
        onInit: $ => console.log($.ctx.nameInParentContext.getCorrectedInputText())
    }}
))
```

Con l'utilizzo della Use è anche possibile utilizzare l'opzione `"init"` per passare valori al "constructor". Il suo funzionamento è molto semplice, basta passare un dizionario contenete le variabile del constructor e il loro valore, tenendo in considerazione che il punto di vista degli evaluable sarà quello del parent. Questa modalità è da preferire per i casi di componenti per cui si vuole creare un nuovo scope (bloccando in sostanza la visibilità dello scope parent), e si vuole passare una variabile "bindata"

Visita la demo in demo/misc-example.js/ -> appDemoConstructor per altre info sui constructor.

### Placeholder
Una delle possibilità della Use è quella di andare a definire in maniera dichiarativa quali sono i sotto-componenti che è possibile "sostituire", ovvero quelli che si possono "iniettare" all'interno di un componente che verrà utilizzato tramite Use. In particolare basterà definire dei "Placeholder" nel componente che prevede l'injection, e utilizzare il parametro "inject" della Use. 

```javascript
// Signature
Placeholder(name, {default_component=undefined | cle element, must_be_redefined=false, forced_id=undefined, forced_ctx_id=undefined, replace_if_different=true})
```
Per dichiarare un titolo e un body di deafult all'interno del nostro componente che però potrebbe essere sostituito in altre parti ci basta definire dei Placeholder:

```javascript
const EditableComponent = cle.div({
    title: "This is the title"
  },

    Placeholder("titleEl", { defualt_component: { h2: $ => $.title } }),
    { h5: "Sub-title NOT EDITABLE" },

    Placeholder("bodyEl", { defualt_component: { p: "This is the body" }, must_be_redefined: true }),

    cle.div({}, 
        cle.subelement({},
            Placeholder("nestedEl") // no default defined. will be "evicted" if not injected.
    ))
    
    ...
)

Use(EditableComponent, pass, { inject: {
    titleEl: { h1: "A Simple Title" },
    bodyEl: cle.div({},  cle.b("A Simple Bold Body")),
}})
```
è anche possibile specificare che un elemento deve essere necessariamente specificato, e inoltre è possibile devinire dei Placeholder in tutti i sotto-childs per iniezioni profonde.

### Extended
Se non vogliamo creare un nuovo contesto ma vogliamo comunque sfruttare le potenzialità della Use è possibile utilizzare la "Extended". Questa utility è in tutto e per tutto identica alla Use, ma la differenza principale è che "inietterà" il componente nell contesto padre, senza generarne uno nuovo.

### Factory
Un terzo modo in cui è possibile creare componenti è quello delle Factory, ovvero funzioni che restituiscono componenti, e dunque una modalità più "React" style. tenendo però bene a mente che la risoluzione del componente NON sarà a run-time, e dunque NON è possibile modificare il componente a run time come in React negli "High Order Components". Tale possibilità è però raggiungile tramite le modalità Dinamiche come per esempio Dynamic Lazy Render e i SubRenderer.

L'idea alla base è quella di sfruttare lo scope o altre sofisticazioni come le external props etc, per passare a una funzione che costruirà il componente come serve a noi, ovvero come se lo avessimo scritto all'interno della definzione del parent direttamente.

```javascript
  const MyComponentByFactory({getText, setText, counter, incCounterFunc, onCounterChanged, bodyElement, ...subElements}) => cle.myComponent({
    
    readOnlyCounter: counter, // read only! because every set will replace the evaluable to a value!

    txt: Alias(getText, setText), // react style..this is a convenient method to recompose property

    def_incCounterFunc: incCounterFunc,
    
    on_readOnlyCounterChanged: onCounterChanged,
  },
    
    cle.h1($ => $.txt),

    cle.div("The counter is: ", $ => $.readOnlyCounter) // or cle.div("The counter is: ", counter) if counter is in scope!
    
    cle.button({h_onclick: $ => $.incCounterFunc()}, "Inc Counter"),

    cle.div({}, 
        cle.subelement({}, 
            bodyElement || ""
        )
    ),

    ...subElements
  )


  RenderApp(document.body, cle.root({
    
    aCounter: 10,

    aTxt: "Hi this is a Text",

    def_incCounter: $ => { $.aCounter += 1 }

  },
    cle.h2("Hello from component factory"),

    MyComponentByFactory({

      getText: $ => $.aTxt, 
      setText: ($, v)=>{ $.aTxt = v }, 
      
      counter: $ => $.aCounter,
      incCounterFunc: $ => $.incCounter()
      onCounterChanged: ($, v)=> console.log("do something, aCounteris changed!", v)

      bodyElement: { div: "this is the body" },
      subElements: [ 
        cle.div("hi"), 
        cle.b("bold") 
      ]
    })
  ))

```

visita la demo demo/misc-example.js/ -> appDemoComponentFactory per altre info


# More About Evaluable: Bind, Alias, SmarAlias/PropertyBinding/CachedProp

# Html Element Reference

# CLE Object

# Childs Ref By Name

# Advanced: FromHtmlTemplate

# Advanced: Nested Detached Renderer
# Advanced: Dynamic Lazy Renderer

# Advanced: Imperative & Dynamic - DynamicSignal
# Advanced: Imperative & Dynamic - ExternalProps
# Advanced: Imperative & Dynamic - GetCleElByDomEl
# Advanced: Imperative & Dynamic - getAsExternalProperty

# Advanced: SubRenderer
# Advanced: React Mashup


# Full Component Definition Reference

 ```javascript
 { div: {

    // Component Identifier
    id: "String"  // A UNIQUE Identifier in the whole app
    ctx_id: "String" // A UNIQUE Identifier in the Component Context
    ctx_ref_id: "String" // A UNIQUE Identifier in the PARENT Context, used to be finded by ctx in the parent ctx.
    name: "String" // A NON-UNIQUE Name, used to be finded by ref


    // Life-Cycle Hooks
    constructor: ($, {...args}) => { } // Constructor, called at component creations
    onInit: $ => { } // on Init, After constructor, but before childs creation
    afterChildsInit: $ => { } // After childs onInit
    afterInit: $ => { } // After 1ms of the afterChildsInit (auto-lazy)
    onDestroy: $ => { } // After Childs Destroy, Before Destoing this


    // Component Data / Property definition
    let | data | props: {
      counter: 0 // a counter property

      computedProp: $ => $.scope.myProp * 10 // evaluable / computed props

      my_alias: Alias(getter $=>..., setter $,v=>..., cachingComparer true | (new, old)=>new!==old...) // Alias of a property, with custom op on set and get! // caching comparer can also be set to "true" for default caching strategy enabled!

      my_alias2: SmartAlias('@counter') // Same as alias but simple def (second parametr is cachingComparer, set to true to enable default comparer stategy)
      
      my_alias3: Bind('@counter') //Same as Smart Alias, but more generic

      myFunc: asFunc(($, ...args)=>{...}) // declare function costants as props (to be passed)
    },
    // shortcuts -> let_counter: 0


    // Functions definition 'a-la-python'
    def: {
      resetCounter: $ => {
        $.this.counter = 0
        $.this.counterReset.emit() // also lazy: $.this.counterReset.emitLazy(10) or wait signal responses emitWaitResp, emitWaitFirstToResp, emitWaitRespCondition
      }, 
      // You can also define a first lvl namespace for functions
      utils: { // def namespace example
        toUppercase: ($, txt) => txt.toUppercase()
      }
    },
    // shortcuts -> def_resetCounter: $ => ...


    // Signals Declaration
    signals: {
      counterReset: "stream => (void)" // definiamo il tipo di segnale, poi "=>" e infine una descrizione dei params (es il tipo dei parametry, la signature etc etc..è solo testo che documenta!)
    },
    // shortcuts -> signal_counterReset: ".." | s_counterReset: ".."


    dbus_signals: { // qui definiamo i segnali globali..un modo per creare uno stream su un canale comune con un compagno che non riesco a raggiungere facilmente "by name", e che entrambi conosciamo
      iEmitThisGlobalSignal_UniqueName: "stream => (int: counter status)"
    }
    // shortcuts -> dbus_signal_XXXX: ".." | dbs_XXXX: ".."


    // Props Change Handlers
    on: {
      // on who?
      this: {
        // on what?
        // Mangling! propertyName + "Changed"
        counterChanged: ($, newCounter, oldCounter) => console.log($.this.counter)
      }, 
      parent: ...
      scope: ... any prop in self or any parent anchestor
      le: ..byname.. : {props | alias changed},
      ctx: ...qui mettiamo solo i nomi dei sub_componenti + this di questo componente!
      ref: ... by name ...
    },

    // shortcuts -> on_this_counterChanged: ... | on_XXX_YYY:

    // Signal Handlers
    on_s: { 
      // on who?
      this: {
        // on what?
        counterReset: $ => {
            console.log("counter reset!")
            // return a value that can be captured in an emitWaitResp
        }
      }, 
      parent: ...
      scope: ... any prop in self or any parent anchestor
      le: .component byname.. : { signal},
      ctx: ...qui mettiamo solo i nomi dei sub_componenti + this di questo componente! 
      ref: ... by name ...
      dbus: ...qui mettiamo i signals globali che ascolto
    },

    // shortcuts -> on_this_counterReset: ... | on_XXX_YYY:


    // HTML Attributes, setted via setAttribute
    attrs | a : {

      class: "someclass"

      style: $=>({
        width: 200,
        height: $ => 200
      }),

      "@lazy:scrollTop": 100 // con il prefisso '@lazy:' indico che quell'attributo lo voglio inizializzare lazy!

      value: Bind($ => $.this.counter) // per effettuare 2 way data binding!
    
    },
    // shortcuts: 
    // "a.style": {color: "red"}
    // a_style: {color: "red"}


    // hattrs ... "harmfulAttr" in pratica qui non settiamo via "setAttribute", ma direttamente via this.el.xxxx = e anche in ricorsione..potenzialmente pericoloso se non si sa cosa si sa facnedo.
    hattrs | ha: {
      scrollTop: "0px",
      'style.backgroundColor': "red",
      'myAttr.nested.prop': $ => "follow some stuff"
      "@lazy:scrollTop": Bind($ => $.this.counter) // per lazy binding!
    }
    // shortcuts: 
    // "ha.style.color": "red" 
    // "ha_style": "color: red" 

    
    // extreme attributes shortcut:
    // style: ... -> attr: { style: ... }
    // class: ... -> attr: { class: ... }



    // Html Event Handlers
    handle: {
      onclick: ($, e) => $.this.count++
    },
    // shortcuts
    // handle_onclick: $=>...
    // h_onclick: $=>...
    // ev_onclick: $=>...
    
    // Configurable Html Event Handlers
    when: { // html event (in the form of addEventListener). More configurable!
      focusin: ($, e) => $.this.count++
      focusout: { options: {capture: true, useCapture: true}, handler: ($, e) => $.this.count++, }
    },
    // w_focusin: $=>...

    // CSS Rule Definition
    css: [ 
        ".class { bla:bli ... }", 
        $=>".r0 { .."+$.this.somedeps +"}" 
    ] | {
        rule1: ".class { bla:bli ... }", 
        rule2: $=>".r0 { .."+$.this.somedeps +"}"
    }
    
    // Better HOISTED CSS Definition
    s_css:{
      ".myClass": [{
        display: "inline"
      }]
      ".myClassDynRule": [$=>({
        display: $.scope.condition ? "inline" : "none"
      })]
    } // Use/Extended(component, {s_css: {".myClass": [ExtendSCSS, {opacity: 0.8}]}})

    // Dependency Checks
    deps: { // check a runtime dell'esistenza delle deps
      scope: ["myTextProp", "myFunc"],
      parent: ["myParentDepsProp"],
      ...
    },

    // Meta-programming
    meta: {
        if: $ => ...condition ... // Conditional Component
        
        forEach: "myVar", of: $ => $.MyArrayVar, // Element Repeater
        // Repeater Helpers
        optimized: false, bool // enable leFor optimization (RECOMANDED)
        full_optimized: false, bool // enable leFor optimization (RECOMANDED)
        define:{ 
            // define in meta this variables with this name 
            index:"idx", 
            first:"isFirst", 
            last:"isLast", 
            length:"len", 
            iterable:"myArr",    
            
            //...CUSTOM_PROP_NAME: value | ($: "parent" $this (same as meta), $child: real $this of the child)=> { ... }
            // todoLabel: $ => $.this.todos[$.meta.idx].label } // easy alias! todo_label: $ => $.this.
        }, 
        
        //comparer, per identificare i changes
        comparer: (_new, _old)=>_new !== _old
        // comparer for leFor Elements
        idComparer: (_new, _old)=>_new !== _old
        
        // Scope Options
        newScope: false, bool, // block scope visibility
        noThisInScope: false, bool, //remove this from the scope
        noMetaInScope: false, bool, // remove meta variable in scope
        hasViewChilds: false, bool, // materialize CLE Object
        metaPushbackAutomark: true, bool // autoset value into array when a 'forEach' variable is edited and mark array as changed.
    }

    // Sub Elements
    contains | childs | text | view | '>>' | '=>' | '' | _ : [

      "A Pure Text. Counter is: ", 
      $ => $.scope.counter, // evaluable, autoupdated

      { div: {  
        text: $ => $.scope.counter 
      }},

      { Model | Controller | Service | Component | Connector | Signals | Style | Css : { // Pure Object, invisible, usefull for app logic and data manipulation. Using meta: { hasViewChilds: true } can be materialized into the view as <leobj></lepbj> and also is childs.

      }},

      // Reusage / Componentizzation
      Use( MyComponent, 
        // redefinition / edit component
        { 
          let_prop1: 123 || $=>$.prop3 || Alias || Bind ...  // basic setup a property-value example!

          handle: {
            onclick: ...
          }
          on_s: { 
            this: { 
              mySignal: ($, ...args) => do whatever
            }
          } 
          ...
        }, 
        // Options & init for constructor
        {
          strategy: "merge" | "override", // define redefinition strategy. Override will replace on 1st lvl
          // constructor parametrer. the second option to pass data to child (specially for newScope components.)
          init: { 
            childPropToInitInConstructorByValue: $ => $.meta.idx // copy by value ONCE
            childPropToInitInConstructor2WayBinded: BindToProp("text") || BindToProp("$.le.app.text")// pass & bind value to. search in scope or pass a full name. This require constructor to use .getter & .setter
          },
          // Placeholder Injection/Substitution
          inject: {
            placeholderName: cle-element 
          }
        }, 
      ),

    ], // can also be a single compnent, avoiding the unecessary [].

    // define component as owner of the specified "named sub.childs components"
    childsRef: {
      myName: "single",
      myNameMulti: "multi"
    },
  }
  // any others unknonw key that cannot be deducted will become a props
  // this way you can also declare myProp: ... without props/let etc.
}
 ```
# Full Scope Selectors Standard Content Reference
```javascript
$ => {

    $.this = {

        el // renderized html element 

        parent // parent $.this
        
        comp_id // user defined id via "id" keyword
        comp_ctx_id // user defined id via "ctx_id" keyword
        comp_ctx_ref_id // user defined id via "ctx_ref_id" keyword

        t_uid // tecnical id, the cle unique id overall, setted as attr over html element. used for css hoist

        getAsExternalProperty = (prop_name)=>{ return Property instance } // dumb utils to retrive the real Property behind the $.this proxy..useful to be used as "external" deps in a dynamic context.. (via set value as useExternal([extractedProp], $=>extractedProp.value))
        getAsExternalSignal = (signal_name)=>{ return Signal instance } // dumb utils to retrive the real Signal behind the $.this proxy..useful to be used as "external" deps in a dynamic context.. 
        
        // dynamic signals subscribe & unsubscribe
        subscribe = (name, who, handler, upsearch=false) => { return unsubscribe function } 
        subscribeAsync = async (name, who, handler) => { return unsubscribe function } 
        unsubscribe = (name, who, upsearch=false) => { void }
        
        // edit reference prop inline without manually mark as changed!
        // use: $.this.editRefVal.myProp(p=>p.value=12)
        editRefVal // Proxy with getter: .name(v => action function)
        
        // edit array reference prop inline without manually mark as changed! this will change array ref (eg [...array])
        // use: $.this.editArrRefVal.myProp(p=>p.value=12)
        editArrRefVal // Proxy with getter: .name(v => action function)
    },

    $.u = {

      // dynamic new signal
      newSignal: (name, definition="stream => void")=>{ },
      
      // fastSetScopedVarsAsChanged,
      changed: (scope, ...scopedVars)=>{ },


      // block and await for property condition, then get value.. (instant get if true)
      // to be used to await for a prop! tester can be: function | array of values IN OR
      // onInit: async $=>{
      //   let ready = await $.u.propCondition($=>$.le.db, "readyProp", v=>v===true, 60*1000) [wait max 60 sec]
      //   $.initData()
      // }
      propCondition: (scopeGetter, prop, tester=v=>(v !== null && v !== undefined), ms_timeout=undefined, retry=5)=>{ return Promise },
      
      // block and await for signal fired (eventually with condition filter), then get value
      signalFired: (scopeGetter, signal, condition=v=>true, ms_timeout=undefined, retry=5) => { return Promise }

      // utils per andare ad ottenre l'elemento CLE da elementi HTML/DOM .. per fare cosy tricky :(
      getCleElementByDom: (dom_el)=>{ return cleElement | throw Error("Null-Query-Sel") },
      getCleElementsByDom: (...dom_els)=>{ return cleElements | throw Error("Null-Query-Sel") },

      // alias for $.ref.xxx return One child if single, Many childs if multi
      getChildsRef: (name)=>{ return childsRefList | childRef },
      //serach only DOWN, breadth first algo
      getSubChildRef: (name)=>{ return result | null },
      //serach only DOWN, breadth first algo, return all match or limit
      getSubChildsRef: (name, limit=0)=>{ return results },

      // Lazy Render: dynamic create, get and render template at run time!
      /**definition_as_func signature:  (parent.$this.this, state, ...args) => obj || obj[] */
      lazyRender: (definition_as_func, {afterCreate=undefined, beforeDestroy=undefined, afterDestroy=undefined, auto=false}={}, ...args)=>{ return rendered.map(e=>el.$this) }, // restituisco il loro $this (per la rimozione by ref)
      getLazyRenderState: () => dynamicChildsState,
      clearLazyRender: (generatedDynComp, clearState=false, clearDestroyHook=false)=>{ },

      // UTILS PER SUB - SUB APP NESTING! necessario che oj_definition sia una definition standard! { xxx: {yyy}} 
      // called on $.u.new... use the $ as parent, but a specific html element as mount point (maybe a react element..)
      newConnectedSubRenderer: (html_mount_point, oj_definition, lazy=false)=>{ return SubRendererComponent }
    }
}
```
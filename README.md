# CLE - Welcome to  Clean.js

Clean.js is a declarative Javascript Framework, with pure POJO in mind (for ui, data model & logic), a "caged" environment, a TRUE reactive nature and "static" analysis (used to build dependencies between componentes). Optionally imperative code can still be used for some dynamic parts.
 
 Inspired by: 
  - QML (id, scoping & naming, true "reactive" properties, signals & slot, mangling for declarations, coding by convention, everything has a signal, components sub-editing from external, elements/ref by ID, auto context/scope)
  - Angular (declarative & templatingm ng-for, ng-if, 2 way data binding, "auto-update", Hooks & life-cycle)
  - React (non-verbose, render library first, light & dynamic, with very limited size & memory footprint, easy to learn)
  - Python (function declaration must have "self" as first parameter, natural langauge syntax like)
  - and many more

 For his POJO nature one of it's major improve w.r.t other frameworks is that components are still editable, also if taken from NPM etc. This lead UI library developers to create and handle less code, because in other frameworks everything that a component can do should be "prepared" from developers.

# IT Docs

# Basic Concept
 Un elemnto CLE è un POJO la cui unica e prima chiave è un tag html. Il valore associato a questo tag può essere invece: 
  - un POJO contenente la definizione delle caratteristiche del elemento HTML che si vuole rendereizzare, nonchè dati, metodi etc.
  - una Stringa
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
    - funzione lambda che inizia con $ => ...
 
 e possono essere definiti come valori di un array all'interno della `definition` attraverso una qualsiasi di queste chiavi (da scegliere solo il preferito a livello semantico): 
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
Nei casi di un singolo sott-elemento l'array può essere omesso.

Per avere un `h2` con un `"Hello World!"` (ovvero il cui unico sottoelemnto è un testo) basta scrivere:

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

 - Se la definizione contiene solo sotto-elementi posso passarli direttamente come valore al tag. 
 - Come prima, l'array può essere omesso in caso di un solo sotto-elemento.

 ```javascript
 // Shortcuts
 { h1: "Hello World!" }
 { h1: [ "Hello ", "World!" ]}
 ```

## Rendering
 Per renderizzare il Componente possiamo utilizzare la funzione `RenderApp(htmlContainer, cleComponent)` importandola da lib.

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
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/web-platform-kcbzic?file=index.html,main.js)


## Component Lyfecicle & Hooks
Il lifecycle di un componente CLE prevede di fatto che prima venga renderizzato l'albero "spoglio" di elementi HTTML, dopodichè vengono inizializzati e lanciati gli Hooks che si possono definire con le keywords:
    
- `constructor`: async? ($, {...args}) => { } 
    - Constructor, called at component creations, useful to setup properties from external with the `Use` declaration. use onInit in other cases
- `onInit`: async? $ => { } 
    - on Init, After constructor, but before childs creation. This is the standard initializer.
- `afterChildsInit`: async? $ => { } 
    - After every childs "onInit". Useful to setup special things into childs after creation.
- `afterInit`: $ => { } 
    - After 1ms of the afterChildsInit. a convenient `auto-lazy` method for pseudo-async init

Infine, sotto determinate condizioni l'elemento viene distrutto
- `onDestroy`: $ => { } 
    - After Childs Destroy, Before Destroing "this" element. Usefull to clean imperative action and so on.



## Standard Definition
La standard definition di un componente prevede che all'interno della definizione possano essere esplicitati, oltre ai sotto-elementi tramite una delle chiavi di cui sopra, molte altre cose.

E' Ad esempio possibile definire variabili, funzioni, segnali, attributi html, classi css, nonchè gestire eventi html, segnali locali, di properità o globali. Per una lista Approfondita si rimanda alla sezione `#Full Reference` 

------------

## Data & Variables 
Vediamo ora com'è possibile creare una variabile in un componente.

 ```javascript
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

 In questo esempio stiamo definendo una variabile `counter` con valore iniziale `0`. Abbiamo inoltre anche assegnato un identificativo (univoco in tutta l'app) al nostro componente `myCounter`. Vedremo meglio com'è possibile utilizzare gli id in seguito. Abbiamo anceh definito l'hook onInit che verrà chiamato all'inizializzazione del componente.

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
 Per la definizione degli Evaluable (funzioni il cui primo argomento è sempre '`$`') ci si rifà alla definizione di funzione in python, per cui il primo argomento è sempre "`self`". Nel caso di CLE, invece, è sempre `$`, anche se l'argomento `$` è qualcosa di pià complesso che un mero riferimento al '`this`' del Componente.

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

- `#Final Tip`: is always possible to use directly `$.xxx` wich will be resolved as `$.scope.xxx` ( scope selector '`scope`' is the default used in resolution).

Visto che abbiamo definito un id univoco per questo componente (`myCounter`) è in dunque possibile referenziare la variabile counter come:
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

 Per concludere sulle variabili andiamo a valutare il meccanimso di change detection adottato da CLE, più simile a quello di React che a quello di Angular.

 Data infatti una variabile contenente un oggetto es:
 ```javascript
 props: {
    calendarEvent: { id: 0, dueDate: "2022-01-01", title: "Go to grocery store" }
 }
 ```
 Il meccanismo di change detection, che scatena un rerendering dei componenti che seguono tale proprietà, è quello dell'uguaglianza semplice (===), dunque nel caso dell oggetto calendarEvent, la modifica ad esempio del `title` NON verrà identificata (il riferimento non è cambiato!), mentre per una property string questo succederà (è una nuova stringa!). Ciò ovviamente vale, rispettivamente, per tutti i tipi riferimento e valore. 

 E' necessario dunque trattare le property come costanti, come in React, e dunque per modificare il title è necessario riassegnare un nuovo oggeto, es. usando lo `spread operator`

 ```javascript
 ... $ => {
    $.calendarEvent =  { ...$.calendarEvent, title: "Go to the mall" }
 }
 ```
Esiste però un'altra possibilità, ovvero utilizzare un metodo che viene generato per ogni property, nello stesso scope della property, e che viene generato come '`_mark_XXX_as_changed()`'.

in questo caso potremmo modificare il codice precedente in:

 ```javascript
 ... $ => {
    $.calendarEvent.title = "Go to the mall"
    $._mark_calendarEvent_as_changed()
 }
 ```

 Come vedremo nel seguito, per ogni property viene anche generato un `Signal`, nella forma '`xxxChanged`', che i componenti (incluso se stesso) possono decidere di ascoltare e reagire al fine di disaccoppiare azioni / responsabilità e diminuire gli orchestratori.

Nell'esempio precedente per la properità `calendarEvent` verrà generato un segnale `calendarEventChanged`.

## Functions
Le funzioni vengono definite tramite la key "`def`". Come detto in precedenza devono avere come primo argomento un riferimento a `$`, come in python, e a seguire gli altri argomenti.

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

 Per le sole funzioni è possibile definire dei `namespace` in cui inserire funzioni (massimo 1 livello di prfondità). es:

  ```javascript
 {
    def: {
        increment: ($, incAmount=1) => {
            $.counter += incAmount
        },
        utils: {
            getRandomNum: $ => Math.random()
            capitalize: ($, str) => str[0].toUpperCase() + str.slice(1)
        }
    },
}

...

$ => $.utils.capitalize("hello world!")
 ```
## Signals
I Segnali in CLE sono un meccanismo PUB/SUB like di tipo stream che i componenti possono definire e lanciare affinchè altri componenti (o essi stessi) possano decidere di ascoltare, al fine di reagire ad eventi ad esso collegati. I segnali, come gli Event in Angular possono inviare diversi tipi di dato, al fine di poter essere utilizzati non solo come notifica, ma come meccanismo di Input/Outut, disaccoppiando prodicer dal consumer, e dunque codice.

Esistono due tipi di segnali:
- `Segnali "Puri`"
    - definiti tramite keyword "`signal`: { [`name`]: "`stream => (myData: string)`" }" // definition as descriptive string
- `Segnali connessi a variabili`
    - autogenerati da CLE per ogni variabile definita, nella forma "`xxxChanged`"

i primi trasportano solo i valori "emessi", mentre i secondi si differenziano dai primi in quanto trasportano il nuovo e il vecchio valore della property puntata, al fine di fare opportuni ragionamenti.

I segnali "puri" inoltre possono essere lanciati in modo imperativo utilizzando `$.yyy.signal_name.emit(...args)`, mentre i secondi non possono essere lanciati direttamente, ma viene emesso da CLE al change del dato, o dopo una "`mark as changed`" esplicita.

I segnali sono dunque locali al componente e dunque vivono nel namespace del componente. Per ascoltarli sarà necessario poter puntare a quel namespace, (es via $.scope, $.parent, $.le, $.ref, ...). Come vedremo nel seguito, è però possibile creare segnali globali (univoci) grazie al DBUS di CLE.

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

Per emettere un segniale possiamo riferirci a lui con `$.xxxx.signalname` ed usare `.emit(...args)` (con xxxx scopeSelector)

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

### Subscribe to Signals
Per ascoltare un segnale è sufficiente dichiararne la gestione tramite keyword "`on_s`" oppure "`on`". Per esempio per agganciarsi ai due segnali precedenti

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
Esiste poi una shortcuts per dichiarare la gestione inline:

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

in case of "scope" selector it can be omitted as it's the default:

```javascript
{
    ...

    on_counterReset: $ => { ... }
    on_counterEditedFromUser: ($, newVal) => { ... }
    
    ...
 }
```
Allo stesso modo è possibile registrarsi a una propertyChanges:

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

E' sempre possibile poi utilizzare codice imperativo per creare segnali e fare subscribe/unsubscribe dinamicamente. all'interno di `$.this` troviamo infatti i metodi:
- `subscribe`:
    - subscribe to signal and return the unsubscriber
- `subscribeAsync`
    - same as subscribe but async
- `unsubscribe`

Per generare nuovi segnali è invece possibile utilizzare lo scope "`u`" (utils), in cui si trova `$.u.newSignal`

### DBUS
Dbus è un meccanismo di eventi globale. Sostanzialmente è lo stesso meccanismo di Signals ma a livello globale. In particolare per utilizzare un segnale DBUS è necessario dichiararne l'utilizzo tramite  
```javascript
 { div: {
    ...

    dbus_signals: {
        globalCounterReset: "stream => (void)",
    }

    on: { 
        dbus: { 
            globalCounterReset: $ => { ... }
        }
    }
    
    ...
 }}
```
per lanciare un segnale DBUS basta utilizzare lo scope speciale all'interno di `$.dbus` in cui si possono trovare tutti i segnali globali ed emetterli con `$.dbus.sginal.emit(...args)`

L'utilità di un sistema di DBUS è quello di avere un meccanismo di eventi dipendenta da un concetto / contratto. Basta infatti conoscere il nome del segnale per poter far si che diverse parti dell'applicazione possano seguirlo.

per agganciarsi a un evento DBUS basta utilizzarlo come "scope selector" nella definizione di "on" oppure "on_s":

## HTML Attributes - attrs & hattrs
Gli attributi HTML in CLE vengono dichiarati dalla keyword "`attrs`" e la sua shortcut "`a`". Gli attributi permessi in questa definizione sono solo gli attributi testuali (quindi non funzioni cmoe onclick etc, che vanno gestiti in "handle").

```javascript
const coloredDiv = { div: {

    attrs: {
        class: "colored-div full-height",
        style: "color: red",
        mycustomattr: "abc",
        ...
    }
    
    // shortcut inline:
    // a_class: "colored-div full-height"
    // a_style: "color: red"
 }}
```
per i soli attributi style e class è possibile omettere la shortcuts "a_" e scriverli direttamente come

```javascript
const coloredDiv = { div: {
    
    class: "colored-div full-height",
    style: "color: red"

 }}
```

Inoltre per il solo attributo style è possibile scrivere lo stile inlne come object (camel case)

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
Gli attributi possono essere dichiarti anche come evaluable, e dunque seguire dati come per le property

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

Grazie a questo meccanismo è possibile realizzare `2 way data binding` per esempio con un campo di input graazie alla funzione "`Bind`", vista meglio nella sezione dedicata

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
E' inoltre possibile definire gli attributi / proprietà NON inline dell'elemento html associato via `hattrs` e la sua shortcut "`ha`".

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
Per gestire gli eventi HTML come ad esempio onclick è necessario usare la keyword "`handle`" o la sua shortcut "`h`". 

L'evento HTML originale viene passato come secondo parametro (il primo è e deve sempre essere "`$`")

```javascript
const myButton = { button: {

    text: "Do Some Action",

    handle: { 
        onclick: ($, event) => ...,
        onmouseenter: $ => ...,
        onmouseleave: $ => ...
    }

    // shortcuts inline
    // handle_onclick: ($, event) => ...,
    // h_onclick: ($, event) => ...,

 }}
```

Esistono però casi in cui bisogna personalizzare in modo più importante gli eventi. in questo caso si può utilizzare la keyword "`when`" e la sua shortcut "`w`"

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
visita la demo tests/test-caged-le.js/ -> appDemoSCSS per altre info

-------

## Componentization
Componentizzare in CLE significa principalmente 'splittare' il codice in diversi oggetti riutilizzabili (variabili/costanti). A differenza di altri framwork non esiste un vero e proprio concetto di "Componente" da dover definire obbligatoriamente. 

Un vero componente CLE è di fatto un singolo elemento HTML. Grazie però allo `scope` e al `ctx`, nonchè alle due funzioni `Use` ed `Extend` è possibile definire un 'componente' in modo abbastanza simile a ciò che siamo abituati a usare.

Questa scelta di fatto aiuta a pensare alla separazione e componentizzazione del codice come un operazione facile e veloce come in React (ctrl+c, ctr+v), piuttosto che onerosa come in Angular (ng-generate, ctrl+c, ctr+v).

Inoltre, rispetto a framework come React, non è necessario passare in avanti esplicitamente (o con i context manager..) le i getter e setter dello stato, in quanto grazie allo `scope` queset sono esposte e visibili automaticamente, a meno di non essere splicitamente disabilitato. In questo modo si evita di passare in avanti infinite props e in particolare l'uso di `id` e `name` (aka reference) permette di evitare l'effetto "move state into parent components" per permettere la comunicazione, e dunque si ritorna ad avere uno "stato" vicino all'owner naturale.

Pur sembrando un antipattern, rilassare questo vincolo, ovvero che i child possono vedono proprietà del padre, se ben utilizzato tramite i CLE Object (Model/Controller/Service..) permette un incredibile modularità, spostando il concetto di dipendenza come accoppiamento di codice (che tende a generare boilerplate code) a dipendenza come "convenzione" / "concetto atteso" (Coding By Convention, DI like). Per non cadere nel loop del "what is used?" consigliamo di esplicitare sempre le dipendenze tramite "deps". 

Resta però sempre possibile decidere di bloccare lo scope automatico e passare in modo imperativo proprietà, metodi etc tramite costruttore.

----------

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
Al fine di ottenre un boost delle performance nel repaint è consigliato l'utilizzo del flag `optimized: true` nel meta. 

Questo farà si che sia possibile definire anche un nuovo `comparer` per la detect dei changes dell'intero array e/o dei singoli elementi con `idComparer`

```javascript
{ meta: {
    // Array Comparer, per identificare i changes dell'array
    comparer: (_new, _old) => _new !== _old

    // Comparer for Elements of the Array
    idComparer: (_new, _old) => _new !== _old
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
Pur essendo sostituibile con degli leIf

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

# Bind, Alias, SmarAlias/PropertyBinding/CachedProp

# Html Element Reference

# CLE Object

# Childs Ref By Name

# Component Templating, Extension & Use

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

      computedProp: $ => $.scope.myProp * 10 // computed props

      my_alias: Alias(getter $=>..., setter $,v=>..., caching(new, old)=>new!==old...) // Alias of a property, with custom op on set and get!

      my_alias2: SmartAlias('@counter') // Same as alias but simple def
      
      my_alias3: Bind('@counter') //Same as Smart Alias, but more generic
    },
    // shortcuts -> let_counter: 0


    // Functions definition 'a-la-python'
    def: {
      resetCounter: $ => {
        $.this.counter = 0
        $.this.counterReset.emit() // also lazy: $.this.counterReset.emitLazy(10)
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
        counterReset: $ => console.log("counter reset!")
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
    // h_onclick: $=>...
    
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

      }}
    ], // can also be a single compnent, avoiding the unecessary [].

    // define component as owner of the specified "named sub.childs components"
    childsRef: {
      myName: "single",
      myNameMulti: "multi"
    },
  }
}
 ```
# Full Scope Selectors Standard Content Reference
```javascript
$ => {

    $.this = {

        el // renderized html element 

        parent // parent $.this
        
        comp_id // user defined id via "id" keyword

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
    }
}
```
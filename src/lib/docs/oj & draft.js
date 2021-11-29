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



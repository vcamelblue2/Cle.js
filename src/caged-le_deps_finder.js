\$.this\.([_$a-zA-Z]+[0-9]*[.]?)+

\$.parent\.([_$a-zA-Z]+[0-9]*[.]?)+

\$.le\.([_$a-zA-Z]+[0-9]*[.]?)+

oppure
$. etc.. -> per le e parent. quindi $.parent e $.le, passato come arg


con sta roba però non vedo obj access ['xxxx'] e neanche i dinamici..e neanche l'uso di funzioni (che potrebbero avere dipendenze..)

const f = $ => $.this.title + $.parent.width + $.le.navbar.height

let to_inspect = f.toString()

// replace va perchè fa la replace solo della prima roba..alternativa un bel cut al numero di caratteri che sappiamo già
let $this_deps = to_inspect.match(/\$.this\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
$this_deps = $this_deps.map(d=>d.replace("$.this.", "").split("."))
let $parent_deps = to_inspect.match(/\$.parent\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
$parent_deps = $parent_deps.map(d=>d.replace("$.parent.", "").split("."))
let $le_deps = to_inspect.match(/\$.le\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
$le_deps = $le_deps.map(d=>d.replace("$.le.", "").split(".")) 


ps: this diretto inutilizzabile visto che le ()=> hanno chiusura lessicale e non si può fare bind



molto meglio andare con i "trap" aka Proxy..
magari una combo di trap e pattern, che sarebbe perfetto
e opzionalmente poterle indicare manualmente..in un array dopo la func, in modo da poter usare anche "props like" locali
sarebbe anche interesante valutare di inserire in un punto specifico del template un mapping prop-deps..esempio { text: $=>$.this.width+$.parent.height, deps: {text: ["width", "parent.width"]} }
in quanto ha comunque il suo perchè..visto che centralizza in un unico luogo tutte le deps

class MyObj{ 
  constructor(obj){
  	Object.assign(this, obj)
	//Object.entries(obj).forEach([k,v]=> this[k]=v) 
  } 
}

const $ctx = new MyObj({
	this: new MyObj ({ 
		width: 10, 
		height: 20, 
		nestedInfo: new MyObj({ 
			color: "red"
		}) 
	}),
	parent: new MyObj({
		text: "goooo"
	}),
	le: new MyObj({
		todolist: new MyObj({ // potrebbe essere le o parent
			todo: [10, 20],
			done: [0]
		}),
	})
})
const f = $ => $.this.width + $.this.height + $.le.todolist.todo + $.le.todolist.done + $.parent.text + $.this.nestedInfo.color

let deps_stack = [];
const recursive_proxy_getter_gen = (context, lvl=0)=>{
	return new Proxy(context, {
	    get: (target, prop, receiver)=>{
	    	console.log(prop, "--", lvl, "--->", target); 
	    	deps_stack.push([prop, lvl]);
	    	let ret = target[prop];

	    	if (ret instanceof MyObj){
	    		return recursive_proxy_getter_gen(ret, lvl+1)
	    	}
	    	else{
	    		return ret
	    	}
	    }
	})
}

f.bind(undefined, recursive_proxy_getter_gen($ctx))()

console.log(deps_stack)

// ora basta solo ricostruire
// 0 ["this", 0] (2)
// 1 ["width", 1] (2)
// 2 ["this", 0] (2)
// 3 ["height", 1] (2)
// 4 ["le", 0] (2)
// 5 ["todolist", 1] (2)
// 6 ["todo", 2] (2)
// 7 ["le", 0] (2)
// 8 ["todolist", 1] (2)
// 9 ["done", 2] (2)
// 10 ["parent", 0] (2)
// 11 ["text", 1] (2)
// 12 ["this", 0] (2)
// 13 ["nestedInfo", 1] (2)
// 14 ["color", 2] (2)

Array prototipo







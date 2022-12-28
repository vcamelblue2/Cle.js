// Import cle lib
import * as cle_lib from "../../lib/caged-le-module-to-global.js";

// Import cle-react mashup utils
import { ReactInCle, UseReact, UseReactMixin, useCleProp, useCleProps } from './react-in-cle.js';
import { CleInReact, UseCle, UseDumbCle } from './cle-in-react.js';

// Import css-in-js via csz
import css from 'https://unpkg.com/csz';

// Import React
const { useState, useRef, useEffect } = React;

// Import Primereact
const { Button } = primereact.button;
const { Chip } = primereact.chip;
const { DataTable } = primereact.datatable;
const { Column } = primereact.column;

// Import cle lib
const { RenderApp, cle, html, f, fArgs, pass, LE_LoadCss, Bind, Alias, Switch, Case } = cle_lib // import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf}



// DEMO DATA
const demoTableData = [
  {"id": "1000","code": "f230fh0g3","name": "Bamboo Watch","description": "Product Description","image": "bamboo-watch.jpg","price": 65,"category": "Accessories","quantity": 24,"inventoryStatus": "INSTOCK","rating": 5},
  {"id": "1001","code": "nvklal433","name": "Black Watch","description": "Product Description","image": "black-watch.jpg","price": 72,"category": "Accessories","quantity": 61,"inventoryStatus": "INSTOCK","rating": 4},
  {"id": "1002","code": "zz21cz3c1","name": "Blue Band","description": "Product Description","image": "blue-band.jpg","price": 79,"category": "Fitness","quantity": 2,"inventoryStatus": "LOWSTOCK","rating": 3},
  {"id": "1003","code": "244wgerg2","name": "Blue T-Shirt","description": "Product Description","image": "blue-t-shirt.jpg","price": 29,"category": "Clothing","quantity": 25,"inventoryStatus": "INSTOCK","rating": 5},
  {"id": "1004","code": "h456wer53","name": "Bracelet","description": "Product Description","image": "bracelet.jpg","price": 15,"category": "Accessories","quantity": 73,"inventoryStatus": "INSTOCK","rating": 4},
  {"id": "1005","code": "av2231fwg","name": "Brown Purse","description": "Product Description","image": "brown-purse.jpg","price": 120,"category": "Accessories","quantity": 0,"inventoryStatus": "OUTOFSTOCK","rating": 4},
  {"id": "1006","code": "bib36pfvm","name": "Chakra Bracelet","description": "Product Description","image": "chakra-bracelet.jpg","price": 32,"category": "Accessories","quantity": 5,"inventoryStatus": "LOWSTOCK","rating": 3},
  {"id": "1007","code": "mbvjkgip5","name": "Galaxy Earrings","description": "Product Description","image": "galaxy-earrings.jpg","price": 34,"category": "Accessories","quantity": 23,"inventoryStatus": "INSTOCK","rating": 5},
  {"id": "1008","code": "vbb124btr","name": "Game Controller","description": "Product Description","image": "game-controller.jpg","price": 99,"category": "Electronics","quantity": 2,"inventoryStatus": "LOWSTOCK","rating": 4},
  {"id": "1009","code": "cm230f032","name": "Gaming Set","description": "Product Description","image": "gaming-set.jpg","price": 299,"category": "Electronics","quantity": 63,"inventoryStatus": "INSTOCK","rating": 3}
]


// REACT AS ROOT
const APP_1_ROOT_IS_REACT = ()=>{
const App = ()=>{

  const [data, setData] = useState({number: 0})

  const incNumber = ()=>{
    setData({...data, number: data.number+1})
  }

  return (
  <div>
    
    <h3>Hi from Primereact. this is primarly a react app, with a nested CLE part and a subnested React components. to demostrate they are interchangeble!</h3>

    <div className="card">
      
        <h5>Icon</h5>
        <div className="flex align-items-center flex-wrap">
          <Chip label="Apple" icon="pi pi-apple" className="mr-2 mb-2" />
          <Chip label="Facebook" icon="pi pi-facebook" className="mr-2 mb-2" />
          <Chip label="Google" icon="pi pi-google" className="mr-2 mb-2" />
          <Chip label="Microsoft" icon="pi pi-microsoft" className="mb-2" removable />
        </div>

        <h5>Buttons</h5>
        <Button label="Inc Number" onClick={incNumber} />

    </div>

    <h3>Hello World from React!! The number is: <i>{data.number}</i></h3>

    <br/>
    <hr/>
    
		{/* use cle with rerendering on changes.. */}

    <UseDumbCle def={ 
      html(`
        <div style="color: green">

          <h3>Hello World from CLE in React!! The number is: <i>{{@num}}</i></h3>

          <button class="p-button p-component" (onclick)="@incNumFromCle()">
            <span class="p-button-label p-c">Inc Number (Primereact button from CLE!)</span>
          </button>

          <nested-react style="color: red"></nested-react>
        </div>
      `, 
      {
        let_num: data.number,
        let_squaredNum: $=>$.this.num*$.this.num,

        def_incNumFromCle: $ => {
          incNumber()
        },

        ...UseReactMixin(({$})=>{
          console.log("im react! this is $", $)
          return (
          <h3 style={{marginLeft: '25px'}}>
            Hello from React Nested in CLE!! Squared number: <i>{$.squaredNum}</i>
          </h3>
        )})
      })
    }/>

    <hr/>
    
		{/* use cle with rerendering on changes.. */}
    <UseDumbCle def={
    { div: {

      let_num: data.number,
      let_squaredNum: $=>$.this.num*$.this.num,
    
      def_incNumFromCle: $ => {
        incNumber()
      },

      style: "color: green",

      '':[

        cle.h3({}, "Hello World from CLE in React!! The number is: ", cle.i(f`@num`), " (again in different form)"),

        { button: {
          class: "p-button p-component" ,
          handle: { onclick: $=> $.incNumFromCle() },
          '': { span: {
            class: "p-button-label p-c",
            text: 'Inc Number (Primereact button from CLE!)'
          }}
        }},

        UseReact(({$})=>{
          console.log("im react! this is $", $)

          return (
            <h3 style={{marginLeft: '25px'}}>
              Hello from React Nested in CLE!! Squared number: <i>{$.squaredNum}</i>
            </h3>
        )})

    ]}}} />

  </div>
  
)}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
// ReactDOM.unmountComponentAtNode(rootElement)
}


// CLE AS ROOT
const APP_2_ROOT_IS_CLE = ()=>{
RenderApp(document.getElementById("root"), cle.root({
  let_number: 0,
  let_squaredNum: $=>$.this.number * $.this.number,
  let_demoTableData: demoTableData,

  def_incNumber: $ => {
    $.number+=1
  }
},
  { h3: ["Hello From CLE!! The number is: ", cle.i($=>$.number)] },
  
  { button: {
    class: "p-button p-component" ,
    handle: { onclick: $=> $.number+=1 },
    '': { span: {
      class: "p-button-label p-c",
      text: 'Inc Number'
    }}
  }},

  // first version, simple but full replace..
  UseReact(({$})=>{
    return (<>
      <h3>Hello World from React v1!! The number is: <i>{$.number}</i></h3>
      <Button label="Inc Number" onClick={$.incNumber} />
    </>)
  }, pass, ['number']), // easy declare the use of variable from cle to handle update!

  // second version, explicit but full replace..
  UseReact(({$})=>{

    useEffect(()=>{
      return $.subscribe("numberChanged", $.this, ()=>{$.update()}, true);
    }, []) // oninit, return ondestroy

    return (<>
      <h3>Hello World from React v2!! The number is: <i>{$.number}</i></h3>
      <Button label="Inc Number" onClick={$.incNumber} />
    </>)
  }), // manual declare the use if $.scope.number!

  // third version, verbose but no re-rendering
  UseReact(({$})=>{
    const [num, _setNum] = useState($.number)
    const setNum = (number)=>{
      _setNum(number);
      $.number=number
    }

    useEffect(()=>{
      return $.subscribe("numberChanged", $.this, _setNum, true); // subscribe automatic rturn unsubscribe
    }, []) // oninit, return ondestroy

    return (<>
      <h3>Hello World from React v3!! The number is: <i>{num}</i></h3>
      <Button label="Inc Number" onClick={$.incNumber} />
    </>)
  }), // pure binding without $.update..


  // 4 VERSION (FINAL), no rerendering, no verbose, has local var copy..
  UseReact(({$})=>{
    const [num, setNum] = useCleProp($, "number")

    return (<>
      <h3>Hello World from React v4!! The number is: <i>{num}</i></h3>
      <Button label="Inc Number" onClick={$.incNumber} />
    </>)
  }), // pure binding without $.update..


  // 5 version (FINAL ALT), no rerendering, no verbose, no local cvar copy
  UseReact(({$})=>{ 
    
    useCleProps($, "number", "squaredNum")

    return (<>
      <h3>Hello World from React v5!! The number is: <i>{$.number}</i>, square: <i>{$.squaredNum}</i></h3>
      <Button label="Inc Number" onClick={$.incNumber} />
    </>)
  }), // pure binding without $.update..


  // STUPID DEMO: 
  UseReact(({$})=>{ 
    
    useCleProps($, "demoTableData")

    return (
        <div>
          <div className="card">
            <DataTable value={$.demoTableData} responsiveLayout="scroll">
              <Column field="code" header="Code"></Column>
              <Column field="name" header="Name"></Column>
              <Column field="category" header="Category"></Column>
              <Column field="quantity" header="Quantity"></Column>
            </DataTable>
          </div>
        </div>
    );
  }), // pure binding without $.update..

))
}


// REACT AS ROOT
const APP_3_ROOT_IS_REACT_NO_CLE_REPAINT = ()=>{
const App = ()=>{

	const [counter, setCounter] = useState(0)

	const incNumber = ()=>{
		setCounter(counter+1)
	}

	return (
	<div>
		
		<h3>Hello World from React!! The number is: <i>{counter}</i></h3>
    <Button label="Inc Number" onClick={incNumber} />
		
		<hr/>
		
		<UseCle usedProps={{counter: [counter, setCounter]}} alsoSetter={true} def={
		{ div: {

			style: "color: green",
			class: css`font-size: 25px; h3 { font-weight: 900}`, // TEST use csz in cle!

			onInit: $=>console.log("cle rerenderd!", $),
			onDestroy: $=>console.log("cle destroy!", $),

			'':[

				cle.h3({}, "Hello World from CLE in React!! The number is: ", cle.i(f`@counter`), " (again in different form)"),

				{ button: {
					class: "p-button p-component" ,
					handle: { onclick: $=> $.set_counter($.counter+1) },
					'': { span: {
						class: "p-button-label p-c",
						text: 'Inc Number (Primereact button from CLE!)'
					}}
				}},


		]}}} />

	</div>
	
)}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
}


// CLE AS ROOT
const APP_4_TODOLIST_ROOT_IS_CLE = async ()=>{

	const { InputText } = primereact.inputtext;
	const { InputTextarea } = primereact.inputtextarea;

	const { Checkbox } = primereact.checkbox;
	const { Divider } = primereact.divider;

	// https://milligram.io/#getting-started
	// await Promise.all([
	// 	LE_LoadCss('https://fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic'),
	// 	LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css'),
	// 	LE_LoadCss('https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.min.css'),
	// ])

	const fReact = ($, ...otherArgs)=>( (code, funcCall=false)=>(()=>f(code, funcCall, ...otherArgs)($)) )

	RenderApp(document.body, cle.div({

		id: "app",

		let_todos: undefined, // {todo: string, done: boolean}[]

		onInit: $ => { $.this.db.load() },

		on_this_todosChanged: ($, _, old_v)=>{old_v !== undefined && $.this.db.store()}, // is an init?

		def: {

			db: {
				store: $ => {
					localStorage.setItem("cle.mashup-demopushback.todos-data", JSON.stringify({ todos: $.this.todos }))
				},
				load: $ => {
					let loaded = localStorage.getItem("cle.mashup-demopushback.todos-data")
					try{ $.this.todos = JSON.parse(loaded).todos } 
					catch { $.this.todos = [{todo: "Test pushback!", done: true}] }
				}
			},

			create: ($, todo) => {
				return {todo: todo, done: false}
			},

			add: ($, todo) => {
				$.this.todos = [...$.this.todos, todo]
			},

			remove: ($, todo) => {
				$.this.todos = $.this.todos.filter(t=>t!==todo)
			},
		},

		// a_style: { marginLeft: "25%", marginRight: "25%", marginTop: "25px", padding: "25px", border: "0.5px solid #dedede", minHeight: "540px" , fontFamily: "var(--font-family)"},
		class: css`margin-left: 25%; margin-right: 25%; margin-top: 25px; padding: 25px; border: 0.5px solid #dedede; min-height: 540px ; font-family: var(--font-family)`
	
	},

		cle.h1({
			text: "Cle - React: To Do List",
			a_style: { textAlign: "center", fontSize: "3.5rem"}
		}),

		cle.div({ // input bar
			a_style: { display: "flex", gap: "10px" }
		},
			
			// cle.input({
			// 	ctx_id: "input",
			// 	let_text: "",
			// 	ha_value: Bind(f`@text`),
			// 	a_style: { flexGrow: "1"},
			// 	h_onkeypress: ($, e) => { 
			// 		if(e.key === "Enter") {
			// 			$.scope.add($.scope.create($.this.text))
			// 			$.ctx.input.text = ""
			// 		}
			// 	}
			// }),

			// cle.button({
			// 	text: "Add",
			// 	a_style: { minWidth: "120px" },
			// 	h_onclick: $=>{ 
			// 		$.scope.add($.scope.create($.ctx.input.text))
			// 		$.ctx.input.text = ""
			// 	}
			// }),

			// this 2 components can be made of 1 react component..
			UseReact(({$})=>{

				useCleProps($, "text")

				const shouldAddItem = e=>{
					if(e.key === "Enter" && $.text !== undefined && $.text.length > 0) {
						console.log("add", $.text)
						$.scope.add($.scope.create($.text))
						$.text = ""
					}
				}

				return <InputText 
					className={css`width: 100%`} 
					value={$.text} onChange={(e) => $.text=e.target.value}
					onKeyPress={shouldAddItem}
				/>

			}, pass, pass, { ctx_id: "input", let_text: "", a_style: 'flex-grow: 1'}), // in theory this local variable can be moved up to the "inputbar"

			UseReact(({$})=>(
				<Button className={css`min-width: 120px`} label="Add" 
					onClick={()=>{
						$.scope.add($.scope.create($.ctx.input.text))
						$.ctx.input.text = ""
					}}
				/>
			))

		),

		// cle.hr({}),
		UseReact(({$})=> <Divider /> ),
		
		cle.div({
			a_style: { overflowY: "auto", height: "310px", overflowY: "auto", display: 'flex', flexDirection: 'column', gap: '10px', marginRight: '-18px', paddingRight: '18px'}
		}, 

			cle.div({ meta: {forEach: "todo", of: f`@todos`, optimized: true},
				let_in_edit: false,

				a_style: { display: "flex", justifyContent: "space-between", alignItems: "center" },
			},
				
				// todo with checkbox
				cle.span({ a_style: { display: "flex", marginLeft: "2px", alignItems: 'baseline' }},

					// cle.input({ 
					// 	ha_type: "checkbox", 
					// 	ha_checked: f`@todo.done`,
					// 	a_style: { height: "3rem", width: "3rem"},
					// 	h_onchange: f`{ @todo = {...@todo, done: !@todo.done} }`
					// }), 

					UseReact(({$})=>{
						useCleProps($, "todo")

						const switchTodo = fReact($)`{ @todo = {...@todo, done: !@todo.done} }`

						return ( //"field-checkbox "+
							<div className={css`height: 3rem, width: 3rem`} >
								<Checkbox inputId="todo" checked={$.todo.done} onChange={switchTodo} />
								{/* <label htmlFor="todo">$.todo</label> */}
							</div>
					)}),
					
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
				// cle.button({  
				// 	text: "remove", 
				// 	a_style: { marginLeft: "15px", minWidth: "120px" }, 
				// 	h_onclick: f`@remove(@todo)`
				// }),

				UseReact(({$})=>(
					<Button className={css`margin-left: 15px; min-width: 120px`} label="Remove" 
						onClick={fReact($)`@remove(@todo)`}
					/>
				))
			
			)
		),

		// cle.textarea({ 
		// 	a_style: { position: "absolute", bottom: "10px", left: "25.2%", width: "calc(50% - 5px)", height: "110px"}
		// }, 
		// 	$=>("DATA: "+JSON.stringify($.le.app.todos, pass, 2))
		// ),

		UseReact(({$})=>{
			useCleProps($, '$.le.app.todos')

			return <InputTextarea 
				value={"DATA: "+JSON.stringify($.le.app.todos, pass, 2)} 
				className={css`position: absolute; bottom: 10px; left: 25.2%; width: calc(50% - 5px); height: 110px; font-size: 0.7rem`}
			/>
		})
	

	))
}


// APP_1_ROOT_IS_REACT()
// APP_2_ROOT_IS_CLE()
// APP_3_ROOT_IS_REACT_NO_CLE_REPAINT()
APP_4_TODOLIST_ROOT_IS_CLE()


// // REQUIRED ONLY FOR BABEL (to parse as jsx instead of js)
const exports = {}
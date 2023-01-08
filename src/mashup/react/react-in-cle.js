// By Default:
// - ReactDOM must be in window.ReactDOM! 
// - React must be in window.React! 

const ReactInCle = {
  DEBUG: { ENABLED: false },

  nestedReactTag: "nested-react",

  deps: {
    react: {
      React: window.React,
      ReactDOM: window.ReactDOM,
      useState: window.React?.useState, 
      useEffect: window.React?.useEffect, 
    },
    cle: window.cle_lib
  },

  manualSetup: (React, ReactDOM, cle_lib )=>{
    if (React !== undefined){
      ReactInCle.deps.react.React = React
      ReactInCle.deps.react.ReactDOM = ReactDOM
      ReactInCle.deps.react.useState = React.useState
      ReactInCle.deps.react.useEffect = React.useEffect
    }
    if (cle_lib !== undefined){
      ReactInCle.deps.cle = cle_lib
    }
  }
}
const _debug = { log: (...args)=> ReactInCle.DEBUG.ENABLED && console.log(...args) }

// HOOKS FOR MASHUPS
// TO BE USIED INSIDE CLE

// to use a react component declared directly in cle clid
const UseReact = (Def=()=>{}, props={}, changeDetectionVars=[], extraDefinitions={}, oninit=($)=>{}, ondestroy=($)=>{})=>{
	let definition = {
		onInit: $=>{
			oninit($)
			_debug.log("mount subreact!")
			// ReactInCle.deps.react.ReactDOM.render(<Def $={$} {...props} />, $.this.el );
			ReactInCle.deps.react.ReactDOM.render(ReactInCle.deps.react.React.createElement(Def, {$:$, ...props}), $.this.el );
		},
		onDestroy: $=>{
			_debug.log("destroy subreact!")
			ReactInCle.deps.react.ReactDOM.unmountComponentAtNode( $.this.el )
			ondestroy($)
		},
		def_update: $=>{
			_debug.log("update subreact!")
			ReactInCle.deps.react.ReactDOM.unmountComponentAtNode( $.this.el )
			// ReactInCle.deps.react.ReactDOM.render(<Def $={$} {...props} />, $.this.el );
			ReactInCle.deps.react.ReactDOM.render(ReactInCle.deps.react.React.createElement(Def, {$:$, ...props}), $.this.el );
		},
		...extraDefinitions
	}
	changeDetectionVars.forEach(v=>{
		definition['on_'+v+"Changed"] = $=>{
			$.update()
		}
	})
	return { [ReactInCle.nestedReactTag]: definition }
}

// F smartfunc declarations in react elements 
const fReact = ($, ...otherArgs)=>( (code, funcCall=false)=>(()=>ReactInCle.deps.cle.f(code, funcCall, ...otherArgs)($)) )

// to replace react in a EXISTING cle component wrapper eg: <nested-react></nested-react>
const UseReactMixin = (Def=()=>{}, props={}, mountElQuery="nested-react", oninit=($)=>{}, ondestroy=($)=>{})=>{
	return {
		
		onInit: $=>{
			_debug.log("mount subreact!")
			// ReactInCle.deps.react.ReactDOM.render(<Def $={$} {...props} />, $.u.getCleElementByDom(mountElQuery).el );
			ReactInCle.deps.react.ReactDOM.render(ReactInCle.deps.react.React.createElement(Def, {$:$, ...props}), $.u.getCleElementByDom(mountElQuery).el );
			oninit($)
		},
		onDestroy: $=>{
			_debug.log("destroy subreact!")
			ReactInCle.deps.react.ReactDOM.unmountComponentAtNode( $.u.getCleElementByDom(mountElQuery).el )
			ondestroy($)
		}
	}
}

// bind cle Prop to a local copy of a react state prop, then use react prop in react code
const useCleProp = ($, propName)=>{ 
	
	const [ojGetFunction, ojSetFunction] = ReactInCle.deps.react.useState($.scope[propName])

	const trueSetter = (v)=>{
		ojSetFunction(v);
		$.scope[propName] = v
	}

	ReactInCle.deps.react.useEffect(()=>{

    if (propName.startsWith("$.") && propName.split(".").length>=3){
      let [dollarMark, ...pNoDollar] = propName.split(".")
      let [prop, ...parts] = pNoDollar.reverse()
      parts = parts.reverse()
      const new$ = parts.reduce((a,b)=>a[b], $)
      return new$.subscribe(prop+'Changed', $.this, (v)=>ojSetFunction(v), true); // subscribe automatic return the unsubscribe func, called on unmount..
    } else {
		  return $.subscribe(propName+"Changed", $.this, (v)=>ojSetFunction(v), true); // subscribe automatic return the unsubscribe func, called on unmount..
    }
	}, []) // oninit, return ondestroy

	return [ojGetFunction, trueSetter, ojSetFunction] // value, setter on cle and locally, original ReactInCle.deps.react.useState setter
}

// declare the use of some cle props, than use directly cle prop into react code!..
const useCleProps = ($, ...propsName)=>{ 
	const [_, lrid] = ReactInCle.deps.react.useState(new Date()); 
	const rerenderize = ()=>{lrid(new Date())};

	propsName.forEach(p=>ReactInCle.deps.react.useEffect(()=>{
    if (p.startsWith("$.") && p.split(".").length>=3){
      let [dollarMark, ...pNoDollar] = p.split(".")
      let [prop, ...parts] = pNoDollar.reverse()
      parts = parts.reverse()
      const new$ = parts.reduce((a,b)=>a[b], $)
      return new$.subscribe(prop+'Changed', $.this, rerenderize, true); // subscribe automatic rturn unsubscribe
    } else {
		  return $.subscribe(p+'Changed', $.this, rerenderize, true); // subscribe automatic rturn unsubscribe
    }
	}, [])) // oninit, return ondestroy

	return [_, lrid, rerenderize]
}

const onCleSignal = ($, signal, handler, upsearch=false)=>{
	const [tmpUID, tmpSetUID] = ReactInCle.deps.react.useState({})
	$.this.subscribe(signal, tmpUID, handler, upsearch )

	ReactInCle.deps.react.useEffect(()=>{
		return $.this.subscribe(signal, tmpUID, handler, upsearch )
	}, []) // oninit, return ondestroy
}

export { ReactInCle, UseReact, UseReactMixin, fReact, useCleProp, useCleProps, onCleSignal }
const DEBUG_ENABLED = false
const DEBUG_INFO_ENABLED = false
const DEBUG_WARNING_ENABLED = true
const _debug = { log: (...args)=> DEBUG_ENABLED && console.log(...args) }
const _info = { log: (...args)=> DEBUG_INFO_ENABLED && console.log(...args) }
const _warning = { log: (...args)=> DEBUG_WARNING_ENABLED && console.log(...args) }

// syntatic sentinel..maybe use symbol in future..
/* export */ const pass = undefined
/* export */ const none = ()=>undefined
/* export */ const voidF = ()=>{}


// utils
const copyObjPropsInplace = (copy_from, copy_into, props) => {
  Object.keys(copy_from).forEach(p=>{
    if (props.includes(p)){
      copy_into[p] = copy_from[p]
    }
  })
}

// export 
const toInlineStyle = /** @param {CSSStyleDeclaration | ()=>CSSStyleDeclaration} styles - use "::" on single style name to specify no name translation! */(styles)=>{ 
  if((typeof styles) === "function"){styles=styles()}; 

  let style = ""

  Object.keys(styles).forEach(s=>{
      if (s.startsWith("::")){
          style += s.substring(2)+":"+styles[s]+";"
      }
      else {
          style += s.split(/(?=[A-Z])/).join('-').toLowerCase()+":"+styles[s]+";"
      }
  })

  return style
}

const isFunction = (what)=>typeof what === "function"

const recursiveAccessor = (pointer, toAccess)=>{
  // _debug.log("recursiveAccessor", pointer, toAccess)
  if (toAccess.length === 1)
    return [pointer, toAccess[0]]
  else {
    // _debug.log("ritornerò: ", pointer, toAccess[0], pointer[toAccess[0]])
    return recursiveAccessor(pointer[toAccess[0]], toAccess.slice(1))
  }
}

// exponential retry utils..should be a promise, instead use some "return obj" or function
const exponentialRetry = (func, args=[], customResAsFunc=undefined, resultObj={expRetryObj: true}, msgonerr="", maxNumRetry=maxNumRetry, num_retry=0)=>{

  try{
    resultObj.result = func(...args)
  }
  catch (e){
    if (num_retry < maxNumRetry) {
      setTimeout(()=>exponentialRetry(func, args, customResAsFunc, resultObj, msgonerr, maxNumRetry, num_retry+1), Math.min(10*(num_retry+1), maxNumRetry))
    }
    else{
      _warning.log("CLE - WARNING! unable to execute after 5 retry! "+msgonerr)
      _warning.log(e)
    }
  }
  return customResAsFunc !== undefined ? (customResAsFunc(()=>resultObj.result)) : resultObj
}

const cloneDefinitionWithoutMeta = (definition)=>{
  let componentType = getComponentType(definition)
    
  let {meta, ...oj_definition_no_meta} = definition[componentType]
  return {[componentType]: oj_definition_no_meta}
}

// Framework

class PropAlias {
  constructor(getter=()=>{}, setter=()=>{}, markAsChanged=()=>{}, cachingComparer, onChangesRegisterFunc, externalDeps){
    this.getter = getter
    this.setter = setter
    this.markAsChanged = markAsChanged
    this.cachingComparer = cachingComparer // AKA is different? (newVal, oldVal)=>bool
    this.externalDeps = externalDeps

    this.isExternal = this.externalDeps !== undefined && this.externalDeps.length > 0
  }
}
// export
const Alias = (getter=()=>{}, setter=()=>{}, markAsChanged=()=>{}, cachingComparer, onChangesRegisterFunc, externalDeps)=>new PropAlias(getter, setter, markAsChanged, cachingComparer, onChangesRegisterFunc, externalDeps)
// export
const SmartAlias = (getterAndSetterStr, cachingComparer)=>{
  return new PropAlias(
    smartFunc(getterAndSetterStr, true),
    smartFuncWithCustomArgs("v")("("+getterAndSetterStr+" = v)", true), 
    pass,
    cachingComparer
  )
}
// export
/** Better Naming for "SmartAlias"*/
const PropertyBinding = SmartAlias

// export
const ExternalProp = (value, onSet) => {
  return new Property(value, none, onSet || none, none, none, none, none, true)
}
class _UseExternal extends PropAlias {}
// export
// a simply renamed alias! (reordered params..). 
// externalDeps must be array, or a smart version (if getter & setter not provided) will be used (auto use only the single deps provided!) --> useExternal(myProp) equals to: useExternal([myProp], $=>myProp.value)
const useExternal = (externalDeps, getter=()=>{},  setter=()=>{}, markAsChanged=()=>{}, cachingComparer, onChangesRegisterFunc )=>{
  if (!Array.isArray(externalDeps) && externalDeps instanceof Property){
    const prop = externalDeps;
    getter = $=>prop.value;
    externalDeps = [externalDeps];
  }
  return new _UseExternal(getter, setter, markAsChanged, cachingComparer, onChangesRegisterFunc, externalDeps)
}
const isUseExternalDefinition = f=>f instanceof _UseExternal;

class Property{
  constructor(valueFunc, onGet, onSet, onDestroy, executionContext, registerToDepsHelper, init=true){
    // execution context per fare la bind poco prima di chiamare (o per non bindare e chiamare direttamente..)
    // "registerToDepsHelper..un qualcosa che mi fornisce il parent per registrarmi alle mie dpes..in modo da poter settare anche altro e fare in modo da non dover conoscere il mio padre, per evitare ref circolari" restituisce i "remover"
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
    this.isAlias = valueFunc instanceof PropAlias
    this.hasExternalDeps = this.isAlias && valueFunc.externalDeps !== undefined && valueFunc.externalDeps.length > 0

    this.oj_valueFunc = valueFunc
    
    if (this.isAlias) { valueFunc = valueFunc.getter }

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
      _info.log("analysis - dependency: ", this, this.dependency)
      this.registeredDependency = this.registerToDepsHelper(this, this.dependency, this.hasExternalDeps ? this.oj_valueFunc.externalDeps : undefined) // it's my parent competence to actually coonect deps!
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
    try{this._onGet()}catch(e){_warning.log("CLE - WARNING: the onGet is undefined! (ERROR)", e, this)}
    // this._onGet() // this._onGet?.()
    return this.__getRealVaule()
  }
  set value(v){
    if(this._onSet === undefined){_warning.log("CLE - WARNING: the onSet is undefined! (ERROR)", this);return} // todo: teeemp!! c'è un bug più subdolo da risolvere..riguarda gli le-for e le-if nested..
    if(isUseExternalDefinition(v)){ // set at runtime new useExternal!
      this.init(v, this._onGet, this._onSet, this._onDestroy)
      v = v.getter
    }
    if(this.isAlias){
      this.oj_valueFunc.setter(...this.executionContext.map(ec=>ec()), v)
      if (this.hasExternalDeps){
        _debug.log("fire use ext changed!!")
        this.fireOnChangedSignal()
      }
    }
    else {
      this.isFunc = isFunction(v)
      this._valueFunc = v
      this.__analyzeAndConnectDeps()
      let _v = this.__getRealVaule()
      this._onSet(_v, v, this)
      this.fireOnChangedSignal()
      this._latestResolvedValue = _v // in this way during the onSet we have the latest val in "_latestResolvedValue" fr caching strategy
    }
  }

  // manually, useful for deps
  markAsChanged(){
    _debug.log("marked as changed!", this)
    if(this._onSet === undefined){_warning.log("CLE - WARNING: the onSet is undefined!", this);return} // todo: teeemp!! c'è un bug più subdolo da risolvere..riguarda gli le-for e le-if nested..
    if (this.isAlias){
      this.oj_valueFunc.markAsChanged(...this.executionContext.map(ec=>ec()))
    } // always execute this to retrive myDeps changes
    let _v = this.__getRealVaule()
    this._onSet(_v, this._valueFunc, this)
    if (this.isAlias && this.oj_valueFunc.cachingComparer !== undefined ){
      if (this.oj_valueFunc.cachingComparer(_v, this._latestResolvedValue)){ // AKA is different?
        this.fireOnChangedSignal()
        this._latestResolvedValue = _v
      }
      else { _debug.log("cached!")}
    }else{
      this.fireOnChangedSignal()
      this._latestResolvedValue = _v
    }
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

  /** return [Prop, getter, setter] */
  get asFunctions(){
    return [this, ()=>this.value, (v)=>{this.value=v}]
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
  static getSignalProxy = (realSignal)=> ( {emit: (...args)=>realSignal.emit(...args), emitLazy: (t=1, ...args)=>setTimeout(() => {realSignal.emit(...args)}, t), subscribe: (who, handler) => realSignal.addHandler(who, handler), unsubscribe: (who) => realSignal.removeHandler(who) })

}

class DBus {
  // signals = {
  //   s1: new Signal("s1", "stream => void")
  // }
  // handlersToRegister = { // waiting for signal creation..then will be attached!
  //   s1: [{who: 0, handler: 0}]
  // }

  constructor(){
    this.signals = {}
    this.handlersToRegister = {}
    this.proxy = {
      newSignal: (name, definition="stream => void")=>this.addSignal(name, definition),
      // todo: destroy signal
      subscribe: (name, who, handler) => this.addSignalHandler(name, who, handler),
      unsubscribe: (name, who) => this.signals[name].removeHandler(who)
    }
  }

  hasSignal(name){
    return this.signals[name] !== undefined
  }

  addSignal(name, definition){
    if (!this.hasSignal(name)){
      this.signals[name] = new Signal(name, definition)
      this.proxy[name] = Signal.getSignalProxy(this.signals[name])
      if (this.handlersToRegister[name]){
        Object.values(this.handlersToRegister[name]).forEach(({who, handler})=>{
          this.addSignalHandler(name, who, handler)
        })
        this.handlersToRegister[name] = undefined
      }
    }
    return this.signals[name]
  }
  addSignalHandler(name, who, handler){

    if(!this.hasSignal(name)){
      if (this.handlersToRegister[name] === undefined){ this.handlersToRegister[name] = [] }
      this.handlersToRegister[name].push({who: who, handler: handler})
    } 
    else {
      this.signals[name].addHandler(who, handler)
    }
    return ()=>this.signals[name].removeHandler(who)
  }

  getProxy(){
    return this.proxy
  }

}


// smart component: convert {div: "hello"} as {div: {text: "hello"}}
// export 
const smart = (component, otherDefs={}) => {
  return Object.entries(component).map( ([tag, text])=>( {[tag]: {text: text, ...otherDefs }} ) )[0]
}

//const Use = (component, redefinition, initialization_args=$=>({p1:1, p2:"bla"}), passed_props= $=>({prop1: $.this.prop1...}) )=>{ 
// export 
const Use = (component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined, inject=undefined}={})=>{ return new UseComponentDeclaration(component, redefinitions, { strategy:strategy, init:init, passed_props:passed_props, inject: inject } ) } // passed_props per puntare a una var autostored as passed_props e seguirne i changes, mentre init args per passare principalmente valori (magari anche props) ma che devi elaborare nel construct
// todo: qui potrebbe starci una connect del signal con autopropagate, ovvero poter indicare che propago un certo segnale nel mio parent! subito dopo la redefinitions, in modo da avere una roba molto simile a quello che ha angular (Output) e chiudere il cerchio della mancanza di id..
// di fatto creiamo un nuovo segnale e lo connettiamo in modo semplice..nel parent chiamo "definePropagatedSignal"
// perdo solo un po di descrittività, in favore di un meccanismo comodo e facile..

// nella init il punto di vista del this E' SEMPRE IL MIO PARENT

class UseComponentDeclaration{
  constructor(component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined, inject=undefined }={}){
    this.component = component // Todo: e se voglio ridefinire un componente già Use??
    this.init = init
    this.passed_props = passed_props
    this.redefinitions = redefinitions
    // assert strategy in "merge" | "override"
    this.strategy = strategy

    this.inject = inject

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
        const impossible_to_redefine = []
        const direct_lvl = ["id", "ctx_id", "constructor", "beforeInit", "onInit", "afterChildsInit", "afterInit", "onUpdate", "onDestroy"] // direct copy
        const first_lvl = ["signals", "dbus_signals", "data", "private:data", "props", "private:props", "let", "alias", "handle", "when"] // on first lvl direct
        const first_lvl_special = ["s_css"] // first lvl direct + eventual overwrite
        const second_lvl = ["on", "on_s", "on_a"]
        const first_or_second_lvl = ["def", "private:def"] // check for function (may exist "first lvl namespace")

        const merge_no_warning_starts_with = ['let_', 'on_'] // todo: mettere anche le altre shortcuts
 
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
              // _info.log(k, kk, vv)
              resolved[k][kk] = vv
            })
          }
          else if (first_lvl_special.includes(k)){ //SPECIAL per SCSS - copio il primo lvl special, in cui tento di usare una extend quando richiesto
            if (!(k in resolved)){ 
              resolved[k] = {}
            }
            else {
              resolved[k] = {...resolved[k]}
            }
            Object.entries(v).forEach(([kk,vv])=>{
              const oj_val = resolved[k][kk]
              if (oj_val !== undefined && vv[0] === ExtendSCSS){ // se ho un valore e ho una extendCSS:
                vv = [...oj_val, ...vv]
              }
              // _info.log(k, kk, vv)
              resolved[k][kk] = vv.filter(rule=>rule!==ExtendSCSS)
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
            _warning.log("CLE - WARNING!", k, "cannot be redefined!")
          }
          else if (merge_no_warning_starts_with.map(mval=>k.startsWith(mval)).includes(true)){
            // merge and do not warn
            resolved[k] = v
          }
          else {
            _warning.log("CLE - WARNING! ACTUALLY", k, "is not supported in merge strategy! i simply FULL override it! assuming you can control the amount of override..")
            resolved[k] = v
          }


        })
        
        _info.log("RESOLVED!", this.component[componentType], this.redefinitions, resolved)

      }
    }
    
    // now check for injections!
    let injections = this.inject || {}
    let childs_def_typology = ['', "=>", "text", "_", ">>", "view", "contains", "childs"] // reverse più probabilità..
    const get_childs_def_typology = (component_def => {
      for (let t of childs_def_typology) {
        if (t in component_def){
          return t
        }
      }
      return null
    })
    const recursive_check_childs_injection = (resolved_component, lvl=0) =>{
      // _debug.log("Level: ", lvl, resolved_component)

      if (typeof resolved_component === "function" || typeof resolved_component === "string" || (resolved_component instanceof UseComponentDeclaration) ){
        // _debug.log("Level: ", lvl, "not a component")
        return resolved_component
      }
      else {
        let ctype = getComponentType(resolved_component)
        let cdef = Object.assign({}, resolved_component[ctype]) // shallow copy def
        let childs_def_key = get_childs_def_typology(cdef)
        
        // _debug.log("Level: ", lvl, "Is a component: ", resolved_component)

        if (childs_def_key !== null){
          if (Array.isArray(cdef[childs_def_key])){
            cdef[childs_def_key] = [...cdef[childs_def_key]] // shallow copy childs
          }
          else {
            cdef[childs_def_key] = [cdef[childs_def_key]] // define always as array! also if monochild
          }

          cdef[childs_def_key] = cdef[childs_def_key].map(
            child => child instanceof PlaceholderDeclaration ? child.getCheckedComponent(injections[child.name]) : recursive_check_childs_injection(child, lvl+1)
          ).filter(c=>c!==undefined)

        }

        return {[ctype]: cdef }
      }

    }
    
    return recursive_check_childs_injection({ [componentType]: resolved })
  }

  cloneWithoutMeta(){
    let redefinitions_no_meta = undefined

    if (this.redefinitions !== undefined){
      let {meta, ..._redefinitions_no_meta} = this.redefinitions
      redefinitions_no_meta = _redefinitions_no_meta
    }

    return new UseComponentDeclaration(
      cloneDefinitionWithoutMeta(this.component), redefinitions_no_meta, { strategy:this.strategy, init:this.init, passed_props:this.passed_props, inject:this.inject }
    )
  }

}

// export // utils per fare estensioni rapide senza dichiarare un nuovo meta..
const Extended = (...args) => Use(...args).computedTemplate

class _BindToPropInConstructor {
  constructor(name){
    // this.extractor
    
    if (name.includes(".")){
      this.extractor = $=>{ 
        let fqdnComponents = name.split(".") // $.le.item.prop
        let root = $
        name = ''
        fqdnComponents.forEach((p, idx)=>{
          // skip first and last
          // console.log(root, p)
          if (idx === 0){ }
          else if (idx === (fqdnComponents.length-1)){
            name = p
          }
          else if (idx < (fqdnComponents.length-1)){
            root = root[p]
          }
        })
        let prop = root.getAsExternalProperty(name); 
        let signal = root.getAsExternalSignal(name+'Changed'); 
        return {prop: prop, signal: signal}
      }
    }
    else {
      this.extractor = $=>{ 
        let prop = $.getAsExternalProperty(name); 
        let signal = $.getAsExternalSignal(name+'Changed'); 
        return {prop: prop, signal: signal}
      }
    }
    console.log("thiss", this)
  }
  build($context){
    const {prop, signal} = this.extractor.bind(undefined, $context)()
    return {getter: useExternal(prop), setter: $=>v=>{prop.value=v}, signal: signal}
  }
}

// export
/** utils to set props in component with Use and costructor. just set in init { componentPropName: BindToPropInConstructor('prop' || '$.le.xx.prop' ) } - namer in scope or full name
*/
const BindToPropInConstructor = (name)=>new _BindToPropInConstructor(name)

// export: Symbol/utils per estendere s_css senza pippe strane..in pratica shortcuts per [*rule, bla bla]
/**
 * 
    const component = cle.div({ s_css:{
      ".myClass": [{
        display: "inline"
      }]
      ".myClassDynRule": [$=>({
        display: $.scope.condition ? "inline" : "none"
      })]
    }})

    Use/Extended(component, {s_css: {".myClass": [ExtendSCSS, {opacity: 0.8}]}})
    Use/Extended(component, {s_css: {".myClass": [{opacity: 0.8}]}}) // OVERWRITE!
 */
const ExtendSCSS = {}

// export // todo: valutare se qui ci vuole la copia!
const Placeholder = (name, {default_component=undefined, must_be_redefined=false, forced_id=undefined, forced_ctx_id=undefined, replace_if_different=true}={}) => {
  return new PlaceholderDeclaration(name, {default_component:default_component, must_be_redefined:must_be_redefined, forced_id:forced_id, forced_ctx_id:forced_ctx_id, replace_if_different:replace_if_different})
}
class PlaceholderDeclaration{
  constructor(name, {default_component=undefined, must_be_redefined=false, forced_id=undefined, forced_ctx_id=undefined, replace_if_different=true}={}){
    this.name = name
    this.default_component = default_component
    this.must_be_redefined = must_be_redefined
    this.forced_id = forced_id
    this.forced_ctx_id = forced_ctx_id
    this.replace_if_different = replace_if_different
  }
  getCheckedComponent(component){
    if (component === undefined){
      if (this.must_be_redefined){
        throw new Error("Injected Component (Placeholder repl) must be redefined by contract!")
      }
      return this.default_component
    }
    // _debug.log("ho una inject!!", component)
    if ((typeof component === "function") || (typeof component === "string") || (component instanceof UseComponentDeclaration) ){ // todo: è giusto che passi liscia una use?
      return component
    }

    let [componentType, component_def] = Object.entries(component)[0]
    if (this.replace_if_different === false){
      
      if( (this.forced_id !== undefined && component_def.id !== this.forced_private_id) ||
          (this.forced_ctx_id !== undefined && component_def.ctx_id !== this.forced_ctx_id) ){
        throw new Error("Injected Component (Placeholder repl) must have specific ID by contract")
      } else {
        return component
      }
    }
    else {
      return {
        [componentType]: { 
          ...component_def, 
          id: this.forced_id || component_def.id,
          ctx_id: this.forced_ctx_id || component_def.ctx_id,
        }
      }
    }
  }
}

const extractChildsDef = (definition)=>{
  let extracted_childs = undefined
  let { childs, contains: childs_contains, text: childs_text, view: childs_view, ">>":childs_ff, "=>": childs_arrow, _: childs_underscore, '': childs_empty } = definition
  extracted_childs = childs || childs_contains || childs_text || childs_view || childs_ff || childs_arrow || childs_underscore || childs_empty
  if (extracted_childs !== undefined && !Array.isArray(unifiedDef.childs)) {extracted_childs = [extracted_childs]}
  return extracted_childs
}

const getComponentType = (template)=>{
  // let componentDef;

  if (template instanceof UseComponentDeclaration){
    // componentDef = template
    template = template.computedTemplate
  }
  
  let entries = Object.entries(template)
  _info.log(template, entries)
  if(entries.length > 1){
    throw new Error()
  }
  let [elementType, definition] = entries[0]

  return elementType
  // return [elementType, componentDef ?? definition] // per i template veri restituisco la definizione (aka la definizione del componente), mentre per gli UseComponent il template/classe passata
}

const analizeDepsStatically = (f, isUseExt=false)=>{

  // const f = $ => $.this.title + $.parent.width + $.le.navbar.height

  let to_inspect = isUseExt ? f.getter.toString() : f.toString()

  // replace va perchè fa la replace solo della prima roba..alternativa un bel cut al numero di caratteri che sappiamo già
  let $this_deps = to_inspect.match(/\$.this\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $this_deps = $this_deps?.map(d=>d.replace("$.this.", "").split(".")[0]) // fix sub access!
  
  let $parent_deps = to_inspect.match(/\$.parent\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $parent_deps = $parent_deps?.map(d=>d.replace("$.parent.", "").split(".")[0]) // fix sub access!

  let $scope_deps = to_inspect.match(/\$.scope\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $scope_deps = $scope_deps?.map(d=>d.replace("$.scope.", "").split(".")[0]) // fix sub access!

  let $le_deps = to_inspect.match(/\$.le\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $le_deps = $le_deps?.map(d=>d.replace("$.le.", "").split(".").slice(0,2)) 

  let $ctx_deps = to_inspect.match(/\$.ctx\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $ctx_deps = $ctx_deps?.map(d=>d.replace("$.ctx.", "").split(".").slice(0,2)) 

  let $ref_deps = to_inspect.match(/\$.ref\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $ref_deps = $ref_deps?.map(d=>d.replace("$.ref.", "").split(".").slice(0,2)) 

  let $meta_deps = to_inspect.match(/\$.meta\.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $meta_deps = $meta_deps?.map(d=>d.replace("$.meta.", "").split(".")[0]) // fix sub access!

  let $full_deps = to_inspect.match(/\$.([_$a-zA-Z]+[0-9]*[.]?)+/g)
  $full_deps?.map(d=>d.split(".").filter(x=>x!=='$')).forEach(els=>{
    if (['this', 'parent', 'scope', 'le', 'ctx', 'ref', 'meta', 'u'].includes(els[0])){ pass }
    else {
      // console.log("aaaa push!!", $scope_deps, els, $full_deps)
      if($scope_deps !== undefined){
        $scope_deps.push(els[0])
      }
      else {
        $scope_deps = [els[0]]
      }
    }
  })

  let $external_deps
  if (isUseExt){
    $external_deps = [...f.externalDeps]
  }

  return {
    // todo: vedere se hanno senso
    $this_deps: $this_deps, 
    // $pure_this_deps: $this_deps.length === 1 && $this_deps[0]==="", 

    $parent_deps: $parent_deps, 
    // $pure_parent_deps: $parent_deps.length === 1 && $parent_deps[0]==="", 

    $scope_deps: $scope_deps, 
    // $pure_scope_deps: $scope_deps.length === 1 && $scope_deps[0]==="", 

    $le_deps: $le_deps, 
    // $pure_le_depss: $le_deps.length === 1 && $le_deps[0]==="", 

    $ctx_deps: $ctx_deps, 
    // $pure_ctx_deps: $ctx_deps.length === 1 && $ctx_deps[0]==="", 

    $ref_deps: $ref_deps, 
    // $pure_ref_deps: $ref_deps.length === 1 && $ref_deps[0]==="", 

    $meta_deps: $meta_deps, 
    // $pure_meta_deps: $meta_deps.length === 1 && $meta_deps[0]==="", 

    $external_deps: $external_deps
  }

}


// Property proxy, frontend for the dev of the component Property, usefull to hide the .value mechanism (get/set) of Property
// let deps_stack = [];
const ComponentProxy = (context, lvl=0)=>{

  return new Proxy(context, {

      get: (target, prop, receiver)=>{
        let prop_or_value_target = target[prop];
        if (prop_or_value_target instanceof Property){
          // _debug.log("GET", prop, "--", lvl, "--->", target, "isProperty!");
          return prop_or_value_target.value
          // todo: questo sarebbe un ottimo punto per intervenire dinamicamente su array e object, per far si che una modifica di 1,2 o x livello diretta possa effettivamente scatenare la change..esempio proxando i metodi tipo push etc per fare una markAsChanged
        }
        // _debug.log("GET", prop, "--", lvl, "--->", target);
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
        // _debug.log("SET", target, prop, value)

        let prop_or_value_target = target[prop];
        if (prop_or_value_target instanceof Property){
          // not-todo, intercept and setup dependency again --> done inside Property
          prop_or_value_target.value = value
          return true
        } // you can only set existing prpoerty value..to avoid stupid imperative tricks!

      }
  })
}
// on - off veloce
// const ComponentProxyBasev2 = ComponentProxy

// $this proxy like ComponentProxy, specific to expose $.scope.xxx as $.xxx 
const ComponentProxyBase = (context, lvl=0)=>{

  return new Proxy(context, {

      // todo: il secondo if potrebbe non avere senso..o meglio potrei già sapere se sono in un proxybase (settando qualche prop da testare) e testando che la prop cercata non è this, scope, le meta, ctx etc, potrei già sapere se provare con l'estrazione value, andare nello scope o valore diretto..questo per evitare la prima in, che di fatto ricerca nello scope prima della get, e quindi duplicando la ricerca a run time "costosa"
      
      get: (target, prop, receiver)=>{
        if (prop in target){
          let prop_or_value_target = target[prop];
          if (prop_or_value_target instanceof Property){
            return prop_or_value_target.value
          }
          return prop_or_value_target
        }
        // new: is a pure scope call?? ($.myvar)
        else if(target.scope !== undefined && prop in target.scope){
          let prop_or_value_target = target.scope[prop]

          // this condition will never be true, because of the scope-proxy..when you get from proxy this will be the .value and not hte Property!
          // if (prop_or_value_target instanceof Property){
          //   return prop_or_value_target.value
          // }
          return prop_or_value_target
        }
        else{
          throw Error("Property Not Found")
        }
      },

      set: function(target, prop, value) {

        if (prop in target){
          let prop_or_value_target = target[prop];

          if (prop_or_value_target instanceof Property){
            prop_or_value_target.value = value
            return true
          }
        }
        else if(target !== undefined && prop in target.scope){
          // re-assign! ( use the scope-proxy..so it's a simple remap on $.scope.xxx)
          target.scope[prop] = value
          return true
        }
        else{
          throw Error("Property Not Found")
        }
      }
  })
}

// $scope proxy..dynamically resolve 
const ComponentScopeProxy = (context)=>{

  const findComponentPropHolder = (component, prop, search_depth=0, noMetaInScope=false)=>{
    if(search_depth === 0){
      noMetaInScope = component.meta_options.noMetaInScope
    }
    if (component === undefined || component.$this === undefined){
      return {}
    }

    if (search_depth === 0 && component.meta_options.noThisInScope){ // salta il this e vai a parent..
      return findComponentPropHolder(component.parent, prop, search_depth+1, noMetaInScope)
    }

    if (prop in (component.properties || {})){ // fix IterableViewComponent, cannot habe $this..
      return component.properties
    }
    if (!noMetaInScope && prop in (component.meta || {})){ // fix IterableViewComponent, cannot habe $this..
      return component.meta
    }
    else if(component.meta_options.isNewScope){
      throw Error("Properties cannot be found in this scope..blocked scope?")
    }
    else {
      return findComponentPropHolder(component.parent, prop, search_depth+1, noMetaInScope)
    }
  }

  return new Proxy({}, {

      // has is required now! to find the prop holder and return the real result of "xxx in scope"
      has(target, key) {
        target = findComponentPropHolder(context, key)
        return key in target //|| target.hasItem(key);
      },

      get: (_target, prop, receiver)=>{
        let target = findComponentPropHolder(context, prop)
        let prop_or_value_target = target[prop];
        if (prop_or_value_target instanceof Property){
          return prop_or_value_target.value
        }
        return prop_or_value_target
      },

      set: function(_target, prop, value) {

        let target = findComponentPropHolder(context, prop)
        // console.log("setting:", target, prop, value)
        // console.log("type:", target[prop], target[prop] instanceof Property)

        let prop_or_value_target = target[prop];
        if (prop_or_value_target instanceof Property){
          prop_or_value_target.value = value
          return true
        } // you can only set existing prpoerty value..to avoid stupid imperative tricks!

      }
  })
}


// $ref proxy..dynamically resolve 
const ComponentRefProxy = (context)=>{

  const findChildsRefHolder = (component, ref, search_depth=0)=>{
    if (component === undefined){
      return {}
    }

    if (ref in (component.convertedDefinition?.childsRef || {})){ // fix IterableViewComponent, cannot habe $ref..
      return component.childsRefPointers
    }
    else {
      return findChildsRefHolder(component.parent, ref, search_depth+1)
    }
  }

  return new Proxy({}, {

      // // useless ? 
      // has(target, ref) {
      //   target = findChildsRefHolder(context, ref)
      //   return ref in target //|| target.hasItem(ref);
      // },

      get: (_target, ref, receiver)=>{
        let target = findChildsRefHolder(context, ref)[ref]
        return Array.isArray(target) ? target.map(t=>t.$this.this) : target.$this.this
      },

      set: function(_target, prop, value) {
        return undefined // disable set
      }
  })
}

class ComponentsContainerProxy {
  // public proxy

  constructor(){

    this.proxy = new Proxy(this, { // todo..proxy è visibile all'interno?????? bug???
      get: function (target, prop, receiver){
        // _debug.log(target, prop, target[prop], target[prop].$this.this)
        return target[prop].$this.this
      }
    })

  }
}

// TODO: manually specify the remap event, throttling, lazy..
class HAttrBinding {
  constructor(bindFunc, remap, event){
    this.bindFunc = bindFunc
    this.remap = remap
    this.event = event
  }
}
const HAttrBind = (bindFunc, {remap=undefined, event=undefined}={}) => new HAttrBinding(bindFunc, remap, event)

// export 
/** may be:
 * - HAttrBind, for ha_value etc, signature: (bindFunc, {remap=undefined, event=undefined) => 
 * - PropertyBinding, signature: (getterAndSetterStr, cachingComparer)
 */
const Bind = (bindigDefinition, ...args) => {
  if (isFunction(bindigDefinition)){
    return HAttrBind(bindigDefinition, ...args)
  }
  else if (typeof bindigDefinition === 'string'){
    return PropertyBinding(bindigDefinition, ...args)
  }
}



class ComponentRUUIDGen{
  static __counter = 0;
  static __modifier_on_max = ""
  static generate(){ if(this.__counter >= Number.MAX_SAFE_INTEGER){this.__counter = 0; this.__modifier_on_max+="-"}; return "t-le-id-" + (this.__counter++) + this.__modifier_on_max }
  static reset(){ this.__counter = 0 }
};
// const CRUUID =  () => ComponentRUUIDGen.generate()

class ComponentTechnicalRUUIDGen{
  static __counter = 0;
  static __modifier_on_max = ""
  static generate(){ if(this.__counter >= Number.MAX_SAFE_INTEGER){this.__counter = 0; this.__modifier_on_max+="-"}; return "cle-" + (this.__counter++) + this.__modifier_on_max }
  static reset(){ this.__counter = 0 }
};

// export 
const RenderApp = (html_root, definition)=>{

  let component_tree_root = new ComponentsTreeRoot(html_root, definition)
  component_tree_root.initAndRenderize()

  return component_tree_root

}

// Exposed as $.u (utils), return array of components, for a bettere "react style" rendere (via func). this will share $le, $dbus, parent, scope etc
const LazyRender = (parent, definition_func, state, ...args)=>{

  let definitions = definition_func(parent.$this.this, state, ...args)

  if (!Array.isArray(definitions)){
    definitions = [definitions]
  }
  
  let components = definitions.map(d=>Component.componentFactory(parent, d, parent.$le, parent.$dbus))
  components.map(c=>c.buildSkeleton())
  components.map(c=>c.create())

  return components
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
  $dbus
  $cssEngine // todo: una classe che tiene i css definiti e tiene il "counting" (riferimenti attivi) e che è responsabile degli N css (al posto di ogni componente per se..), però mantiene 1 style per ogni componente. in pratica evita duplicazioni di regole inutili..

  // step 1: build
  constructor(html_root, definition){
    this.html_root = html_root
    this.oj_definition = definition

    this.$le = new ComponentsContainerProxy()
    this.$dbus = new DBus()
  }

  // step 2 & 3: build skeleton (html pointer & child) and renderize
  initAndRenderize(){

    this.buildSkeleton()

    this.components_root.create()

  }

  buildSkeleton(){

    this.components_root = Component.componentFactory(this.html_root, this.oj_definition, this.$le, this.$dbus)
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
  
  t_uid // technical id

  id  // public id
  _id // private (or $ctx) id
  
  oj_definition
  convertedDefinition
  
  isMyParentHtmlRoot // boolean
  parent // Component
  childs // Component []
  dynamicChilds = [] // Component [] solo per la lazy render!
  dynamicChildsBeforeDestroy = ($parent, state)=>{} // function to call before childs being destroyed (maybe to save state!)
  dynamicChildsAfterDestroy = ($parent, state)=>{} // function to call after childs being destroyed (maybe to save state!)
  dynamicChildsState = {} // obj useful to restore and save state

  properties = {}// real Props Container, exposed (in a certain way) to the dev. Contains: [Property, ()=> ... manual property changes signal launcher, SignalProxy (aka signals api for dev, .emit..), def namespace (std object), def]
  // attrProperties = {}// real attr Props Container // todo: qualcosa del genere per gli attr
  signals = {} // type {signalX: Signal}
  hooks = {}// hook alle onInit dei componenti etc..
  meta = {} // container of "local" meta variable (le-for)
  
  signalsHandlerRemover = []
  attrHattrRemover = []
  handlerRemover = []

  // todo: def dependency mechanism
  // typeOfPropertiesRegistry = { // todo: registry to identify the type of an exposed properties, for now only def will be here
  //   // key: "def", "defContainer" | "property", "manualPropertyMarker"| "signal"
  // }
  defDeps = {} // to keep track of def dependencies


  // Frontend for Dev
  $this  // ComponentProxy -> binded on user defined function, visible to the dev as $.this
  $parent // ComponentProxy ==> in realtà è this.parent.$this, visible to the dev as $.parent
  $scope // ComponentProxy ==> in realtà è l'insieme di $this e di tutti i this.parent.$this in ricorsione, visible to the dev as $.scope
  $le // ComponentsContainerProxy - passed, visible to the dev as $.le
  $ctx // ComponentsContainerProxy - created if is a ctx_component, visible to the dev as $.ctx
  isA$ctxComponent = false
  // $bind // ComponentProoxy -> contains the property as "binding"..a sort of "sentinel" that devs can use to signal "2WayBinding" on a property declaration/definition, visible to the dev as $.bind, usefull also to define intra-property "alias"
  $dbus 
  $meta // ComponentProxy => contains all "meta", local and from parents, in the same Component

  $ref // ComponentRefProxy => contains childsRefPointers  as Proxy, visible to dev as $.ref
  childsRefPointers = {} // { refName: Component}


  htmlElementType
  isObjComponent
  html_pointer_element
  html_end_pointer_element // future use, per i componenti dinamici e liste..
  css_html_pointer_element
  s_css_html_pointer_element

  // step 1: build
  constructor(parent, definition, $le, $dbus){
    this.t_uid = ComponentTechnicalRUUIDGen.generate()

    this.isA$ctxComponent = ((definition instanceof UseComponentDeclaration) || !(parent instanceof Component))
    this.parent = parent
    this.isMyParentHtmlRoot = (parent instanceof HTMLElement) // && !((parent instanceof Component) || (parent instanceof UseComponentDeclaration)) // if false it is a parent HTML node

    this.$le = $le
    this.$dbus = $dbus
    this.$ctx = this.getMy$ctx()
    this.$meta = this.getMy$meta()

    this.oj_definition = definition

    this.htmlElementType = getComponentType(definition)
    this.isObjComponent = ["Model", "Controller", "Service", "Component", "Connector", "Signals", "Style", "Css"].includes(this.htmlElementType)
    this.convertedDefinition = Component.parseComponentDefinition( (definition instanceof UseComponentDeclaration ? definition.computedTemplate : definition) [this.htmlElementType])
    this.meta_options = {
      isNewScope: this.convertedDefinition.meta?.newScope,
      noThisInScope: this.convertedDefinition.meta?.noThisInScope,
      noMetaInScope: this.convertedDefinition.meta?.noMetaInScope,
      hasViewChilds: this.convertedDefinition.meta?.hasViewChilds,
      metaPushbackAutomark: this.convertedDefinition.meta?.metaPushbackAutomark === undefined ? true : this.convertedDefinition.meta?.metaPushbackAutomark,
    } 

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

  // todo: questa cosa potrebbe essere super buggata..perchè io in effetti faccio una copia delle var e non seguo più nulla..
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
      _info.log("Component meta:", this.meta, this.oj_definition, this)
      return ComponentProxy(this.meta)
    }

    else{
      if (this.parent !== undefined && (this.parent instanceof Component)){
        _info.log("Parernt meta:", this.parent.meta, this.oj_definition, this)
        return ComponentProxy(this.getMyFullMeta())
      }
      
      return undefined
    }
  }


  get$ScopedPropsOwner(prop, search_depth=0, noMetaInScope=false, searchInSignals=false){
    if(search_depth === 0){
      noMetaInScope = this.meta_options.noMetaInScope
    }

    if (this.parent === undefined || !(this.parent instanceof Component)){ // || this.parent instanceof IterableViewComponent)){
      return [this, /*isPropertiesProp = */ true]
    }

    if (search_depth === 0 && this.meta_options.noThisInScope){ // salta il this e vai a parent..
      return this.parent.get$ScopedPropsOwner(prop, search_depth+1, noMetaInScope, searchInSignals)
    }

    if (prop in this.properties || (searchInSignals && prop in this.signals)){
      return [this, true]
    }
    else if (!noMetaInScope && prop in this.meta){
      return [this, false]
    }
    else if (this.meta_options.isNewScope){
      throw Error("Properties cannot be found in this scope..blocked scope?")
    }
    else {
      return this.parent.get$ScopedPropsOwner(prop, search_depth+1, noMetaInScope, searchInSignals)
    }

  }

  get$ScopedSignalOwner(sign, search_depth=0){ // utility per la dynamic subscribe e unsub da un segnale..

    if (this.parent === undefined || !(this.parent instanceof Component)){ // || this.parent instanceof IterableViewComponent)){
      return [this, /*isPropertiesProp = */ true]
    }

    if (search_depth === 0 && this.meta_options.noThisInScope){ // salta il this e vai a parent..
      return this.parent.get$ScopedSignalOwner(sign, search_depth+1)
    }

    if (sign in this.signals){
      return [this, true]
    }
    else if (this.meta_options.isNewScope){
      throw Error("Signal cannot be found in this scope..blocked scope?")
    }
    else {
      return this.parent.get$ScopedSignalOwner(sign, search_depth+1)
    }

  }

  defineAndRegisterId(){

    this.id = this.convertedDefinition.id
    this._id = this.convertedDefinition._id

    if (this.id !== undefined){
      // if (this.id in this.$le){ _warning.log("CLE - WARNING: Duplicated ID in LE, ", this.id) }
      // if (this.id in this.$ctx){ _warning.log("CLE - WARNING: Duplicated ID in CTX, ", this.id) }
      this.$le[this.id] = this
      this.$ctx[this.id] = this
    }
    if (this._id !== undefined){
      // if (this._id in this.$ctx){ _warning.log("CLE - WARNING: Duplicated ID in CTX, ", this._id) }
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

    this.buildPropertiesRef() // bugfix: devo creare ogni $xxx prima di andare in basso nei children..altrimenti il processo di discesa inverte l'esecuzione

    this.buildChildsSkeleton()
  }

  buildHtmlPointerElement(){

    if ( this.isObjComponent ){

      this.html_pointer_element = document.createElement("leobj")

      if( this.meta_options.hasViewChilds ){
        if (this.isMyParentHtmlRoot){
          this.parent.appendChild(this.html_pointer_element)
        }
        else {
          this.parent.html_pointer_element.appendChild(this.html_pointer_element)
        }
      }

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

    this.html_pointer_element.setAttribute(this.t_uid, "")

  }

  buildChildsSkeleton(){

    this.childs = (this.convertedDefinition.childs?.map(childTemplate=>Component.componentFactory(this, childTemplate, this.$le, this.$dbus)) || [] )

    this.childs.forEach(child=>child.buildSkeleton())

  }

  buildPropertiesRef(){

    // t.b.d
    this.properties.el = this.html_pointer_element // ha senso??? rischia di spaccare tutto..nella parte di sotto..
    this.properties.parent = this.parent?.$this?.this // ha senso??? rischia di spaccare tutto.. recursive this.parent.parent & parent.parent le.x.parent.. etc..
    this.properties.comp_id = this.id
    this.properties.comp_ctx_id = this._id
    this.properties.t_uid = this.t_uid
    // Object.defineProperty( // dynamic get childs $this
    //   this.properties, 'childs', {get: ()=>this.childs.map(c=>c instanceof Component || c instanceof IterableViewComponent? c.$this.this : undefined).filter(c=>c!==undefined)}
    // )
    this.properties.getAsExternalProperty = (prop_name)=>{let found = this.properties[prop_name]; if (found instanceof Property){return found}} // stupid utils to retrive the real Property behind the $.this proxy..useful to be used as "external" deps in a dynamic context.. (via set value as useExternal([extractedProp], $=>extractedProp.value))
    this.properties.getAsExternalSignal = (signalName)=>{let found = this.signals[signalName]; if (found instanceof Signal){return Signal.getSignalProxy(found)}} // stupid utils to retrive the real Signal behind the $.this proxy..useful to be used as "external" deps in a dynamic context..
    
    // dynamic signals
    this.properties.subscribe = (name, who, handler, upsearch=false) => {
      // if (who instanceof Proxy){ throw Error("Must Be $.this!") } NON è FATTIBILE! non si può sapere se è un proxy o no, a meno di nonn modificare la get della Proxy con una if prop === "isProxy" return true
      if (name in this.signals){
        return this.signals[name].addHandler(who, handler) // return remover
      }
      else if (name.includes(".")){
        if (name.startsWith("dbus.")){
          return this.$dbus.addSignalHandler(name.slice(5), who, handler)
        }
        else if (name.startsWith("le.")){
          const [_, leItem, leSignal] = name.split(".")
          return this.$le[leItem].signals[leSignal].addHandler(who, handler)
        }
        else if (name.startsWith("ctx.")){
          const [_, leItem, leSignal] = name.split(".")
          return this.$ctx[leItem].signals[leSignal].addHandler(who, handler)
        }
        else if (name.startsWith("ref.")){
          const [_, refName, leSignal] = name.split(".")
          const pointer = this.getChildsRefOwner(refName).childsRefPointers[refName]
          if (Array.isArray(pointer)){
            return pointer.map(ptr=> ptr.signals[leSignal].addHandler(who, handler) )
          }
          else {
            return pointer.signals[leSignal].addHandler(who, handler)
          }
        }
      }
      else if (upsearch){
        const [ref, _] = this.get$ScopedSignalOwner(name)
        return ref.signals[name].addHandler(who, handler)
      }
      
      throw Error("Signal does not exists")
    }
    this.properties.subscribeAsync = async (name, who, handler) => {
      return new Promise((resolve, reject)=>{

        const subscribeHandler = (num_retry=0)=>{
          try{
            // if (name in this.signals){
              let remover = this.signals[name].addHandler(who, handler) // return remover
              resolve(remover)
            // }
            // else {
            //   throw Error("Signal does not exists")
            // }
          }
          catch{
            if (num_retry < 5) {
              setTimeout(()=>subscribeHandler(num_retry++), Math.min(1*(num_retry+1), 5))
            }
            else{
              _warning.log("CLE - WARNING! unable to subscribe to the signal!")
              reject("Signal does not exists")
            }
          }
        }

        subscribeHandler()
      })
    }
    this.properties.unsubscribe = (name, who, upsearch=false) => {
      // if (who instanceof Proxy){ throw Error("Must Be $.this!") } NON è FATTIBILE! non si può sapere se è un proxy o no, a meno di nonn modificare la get della Proxy con una if prop === "isProxy" return true
      if (name in this.signals) {
        this.signals[name].removeHandler(who)
      }
      else if (name.includes(".")){

        if (name.startsWith("dbus.")){
          return this.$dbus.signals[name.slice(5)].removeHandler(who)
        }
        else if (name.startsWith("le.")){
          const [_, leItem, leSignal] = name.split(".")
          return this.$le[leItem].signals[leSignal].removeHandler(who)
        }
        else if (name.startsWith("ctx.")){
          const [_, leItem, leSignal] = name.split(".")
          return this.$ctx[leItem].signals[leSignal].removeHandler(who)
        }
        else if (name.startsWith("ref.")){
          const [_, refName, leSignal] = name.split(".")
          const pointer = this.getChildsRefOwner(refName).childsRefPointers[refName]
          if (Array.isArray(pointer)){
            return pointer.map(ptr=> ptr.signals[leSignal].removeHandler(who) )
          }
          else {
            return pointer.signals[leSignal].removeHandler(who)
          }
        }
      }
      else if (upsearch){
        const [ref, _] = this.get$ScopedSignalOwner(name)
        return ref.signals[name].removeHandler(who)
      }

      throw Error("Signal does not exists")
    }
    // edit reference prop inline without manually mark as changed!
    // use: $.this.editRefVal.myProp(p=>p.value=12)
    this.properties.editRefVal = new Proxy({}, {
      get: (_, prop)=>{ 
        return (action)=>{
          action(this.$this.this[prop])
          this.properties["_mark_"+prop+"_as_changed"]() //better also if sacrify performance.. eg for Alias & co
        }
      },
      set: function() {}
    })


    // todo: qualcosa del genere per gli attr
    // this.properties.attr = ComponentProxy(this.attrProperties)

    // rigester in a parent (if a name was given)
    this.registerAsChildsRef()

    // todo: parent and le visible properties only..
    this.$parent = (this.parent instanceof Component) ? ComponentProxy(this.parent.properties) : undefined
    this.$scope = ComponentScopeProxy(this)
    this.$ref = ComponentRefProxy(this)
    this.$this = ComponentProxyBase(/*new ComponentProxySentinel(*/{this: ComponentProxy(this.properties), parent: this.$parent, scope: this.$scope,  le: this.$le.proxy, ctx: this.$ctx.proxy, dbus: this.$dbus.proxy, meta: this.$meta, ref: this.$ref, u: this.getUtilsProxy() } /*)*/ ) //tmp, removed ComponentProxySentinel (useless)

    // mettere private stuff in "private_properties" e "private_signal", a quel punto una strada potrebbe essere quella di avere un "private_this" qui su..ma in teoria dovrebbe essere qualcosa di context, e non solo in me stesso..
  }

  getUtilsProxy(){
    return ComponentProxy({ 
      
      // dynamic signals
      // new signal
      // todo: destroy signal
      newSignal: (name, definition="stream => void")=>{
        const realSignal = new Signal(name, definition)
        this.signals[name] = realSignal
        this.properties[name] = Signal.getSignalProxy(realSignal)
      },
      
      // fastSetScopedVarsAsChanged,
      changed: ((scope, ...scopedVars)=>{ // todo: capire moolto bene..perchè è utile ma rompe concetti e 
        for (let v of scopedVars){
          scope['_mark_'+v+'_as_changed']()
        }
      }).bind(undefined, this.$scope),

      // utils per andare ad ottenre l'elemento CLE da elementi HTML/DOM .. per fare cosy tricky :(
      getCleElementByDom: (dom_el)=>{
        if (typeof dom_el === 'string'){
          dom_el = document.querySelector(dom_el)
        }
        if (dom_el === null){
          throw Error("Null-Query-Sel")
        }
        return Object.values(this.$le).find(component=>(component instanceof Component) && component.html_pointer_element === dom_el).$this.this
      },
      getCleElementsByDom: (...dom_els)=>{
        // console.log(dom_els)
        if (dom_els.length === 1 && typeof dom_els[0] === 'string'){
          dom_els = [...document.querySelectorAll(dom_els)]
        }
        if (dom_els.length === 0){
          throw Error("Null-Query-Sel")
        }
        return Object.values(this.$le).filter(component=>(component instanceof Component) && dom_els.includes(component.html_pointer_element)).map(el=>el.$this.this)
      },

      // alias for $.ref.xxx
      getChildsRef: (name)=>{
        const owner = this.getChildsRefOwner(name)
        return Array.isArray(owner.childsRefPointers[name]) ? owner.childsRefPointers[name].map(c=>c.$this.this) : owner.childsRefPointers[name].$this.this
      },
      getSubChildRef: (name)=>{ //serach only DOWN, breadth first algo
        let toInspect = [...this.childs]
        for (let c of toInspect){
          try {
            // console.log(c)
            if ((c instanceof Component)) {
              if (c.convertedDefinition.name === name){
                return c.$this.this
              }
              else {c.childs.forEach(sc=>toInspect.push(sc))}
            } else if (c instanceof IterableViewComponent) {
              c.childs.forEach(sc=>toInspect.push(sc))
            }
          }
          catch {}
        }
        return null
      },
      getSubChildsRef: (name, limit=0)=>{ //serach only DOWN, breadth first algo, return all match or limit
        let toInspect = [...this.childs]
        let results = []
        for (let c of toInspect){
          try {
            // console.log(c)
            if ((c instanceof Component)) {
              if (c.convertedDefinition.name === name){
                results.push(c.$this.this)
                if (limit > 0 && results.length >= limit){
                  break;
                }
              }
              else {c.childs.forEach(sc=>toInspect.push(sc))}
            } else if (c instanceof IterableViewComponent) {
              c.childs.forEach(sc=>toInspect.push(sc))
            }
          }
          catch {}
        }
        return results
      },

      // Lazy Render: dynamic create, get and render template at run time!
      /**definition_as_func signature:  (parent.$this.this, state, ...args) => obj || obj[] */
      lazyRender: (definition_as_func, {afterCreate=undefined, beforeDestroy=undefined, afterDestroy=undefined, auto=false}={}, ...args)=>{
        if (auto){
          this.destroyDynamicChilds(undefined, false, false)
        }

        if(beforeDestroy){
          this.dynamicChildsBeforeDestroy = beforeDestroy
        }
          
        if (afterDestroy){
          this.dynamicChildsBeforeDestroy = afterDestroy
        }

        let dynComp = LazyRender(this, definition_as_func, this.dynamicChildsState, ...args)
        this.dynamicChilds = this.dynamicChilds.concat(dynComp)
        
        if (afterCreate !== undefined){ setTimeout(() => { afterCreate() }, 10); }
        
        return dynComp.map(e=>e.$this) // restituisco il loro $this (per la rimozione by ref)
      },
      getLazyRenderState: () => this.dynamicChildsState,
      clearLazyRender: (generatedDynComp, clearState=false, clearDestroyHook=false)=>{
        this.destroyDynamicChilds(generatedDynComp, clearState, clearDestroyHook)
      },

      // UTILS PER SUB - SUB APP NESTING! necessario che oj_definition sia una definition standard! { xxx: {yyy}} 
      // called on $.u.new... use the $ as parent, but a specific html element as mount point (maybe a react element..)
      newConnectedSubRenderer: (html_mount_point, oj_definition, lazy=false)=>{
        if (html_mount_point === undefined){
          html_mount_point = this.html_pointer_element
        }
        return SubRendererComponent.SubRendererComponentFactory(this, html_mount_point, oj_definition, lazy)
      }
    })
  }


  getChildsRefOwner(name){
    if (name in (this.convertedDefinition.childsRef || {})){
      return this
    }
    else if (!this.isMyParentHtmlRoot){
      return this.parent.getChildsRefOwner(name)
    }
    // todo: raise exception if on root..
  }
  registerAsChildsRef(){
    let name = this.convertedDefinition.name
    if (name !== undefined){
      const owner = this.getChildsRefOwner(name)
      if( owner != undefined ){
        if (owner.childsRefPointers[name] === undefined){
          owner.childsRefPointers[name] = owner.convertedDefinition.childsRef[name] === "multi" ? [this] : this
        }
        else {
          owner.childsRefPointers[name] = Array.isArray(owner.childsRefPointers[name]) ? [...owner.childsRefPointers[name], this] : this
        }
      }
      else (
        _warning.log("CLE Warning - Cannot find a ref owner")
      )
    }
  }
  unregisterAsChildsRef(){
    let name = this.convertedDefinition.name
    if (name !== undefined){
      const owner = this.getChildsRefOwner(name)
      if(owner !== undefined){
        if (owner.childsRefPointers[name] !== undefined){
          owner.childsRefPointers[name] = Array.isArray(owner.childsRefPointers[name])  ? owner.childsRefPointers[name].filter(e=>e!==this) : undefined
        }
      }
      else {
        _warning.log("CLE Warning - Cannot find a ref owner")
      }
    }
  }

  // step 3: create and renderize
  create(){

    // check dependencies
    if (this.convertedDefinition.checked_deps !== undefined) {
      Object.entries(this.convertedDefinition.checked_deps).forEach(([kind,deps])=>{
        for(let depName of deps){
          if (!(depName in this.$this[kind])){
            throw Error(`Unsatisfied Dep! ${kind}: ${depName}`)
          }
        }
      })
    }

    // html event in the form of obj.onxxx = ()=>...
    if (this.convertedDefinition.handle !== undefined){
      Object.entries(this.convertedDefinition.handle).forEach(([k,v])=>{
        if (isFunction(v)){
          this.html_pointer_element[k] = (...e)=>v.bind(undefined, this.$this, ...e)()
          this.handlerRemover.push(()=>{ this.html_pointer_element[k] = undefined })
        }
        else if (typeof v === 'object'){
          
          let condition = v.if
          let if_true_handler = v.use
          let if_false_handler = v.else_use

          if(condition !== undefined){
            const setupThenElseHandler = (condition_val)=>{
              if (condition_val){
                this.html_pointer_element[k] = (...e)=>if_true_handler.bind(undefined, this.$this, ...e)()
              }
              else {
                this.html_pointer_element[k] = (...e)=>if_false_handler.bind(undefined, this.$this, ...e)()
              }
            }
            const setupThenOnlyHandler = (condition_val)=>{
              if (condition_val){
                this.html_pointer_element[k] = (...e)=>if_true_handler.bind(undefined, this.$this, ...e)()
              }
              else {
                this.html_pointer_element[k] = undefined
              }
            }
            const handler_remover = ()=>{ this.html_pointer_element[k] = undefined }

            const selected_handler = if_false_handler === undefined ? setupThenOnlyHandler : setupThenElseHandler

            const P = new Property(pass, pass, pass, pass, ()=>this.$this, (thisProp, deps)=>{

              let depsRemover = []

              // deps connection logic
              deps.$this_deps?.forEach(d=>{
                let depRemover = this.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
                depRemover && depsRemover.push(()=>{depRemover(); handler_remover()})
              })

              deps.$parent_deps?.forEach(d=>{
                let depRemover = this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
                depRemover && depsRemover.push(()=>{depRemover(); handler_remover()})
              })

              deps.$scope_deps?.forEach(d=>{
                let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
                let depRemover = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() );
                depRemover && depsRemover.push(()=>{depRemover(); handler_remover()})
              })

              deps.$le_deps?.forEach(d=>{ // [le_id, property]
                let depRemover = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
                depRemover && depsRemover.push(()=>{depRemover(); handler_remover()})
              })

              deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
                let depRemover = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
                depRemover && depsRemover.push(()=>{depRemover(); handler_remover()})
              })

              deps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
                depsRemover.push(()=>{depRemover(); handler_remover()})
              })

              return depsRemover
            }, false)

            this.handlerRemover.push(()=>P.destroy(true))

            setTimeout(() => {

              P.init( condition, none, selected_handler )

              P.markAsChanged()

            }, 10);
          }
        }
      })
    }
    // html event in the form of event listener (declared with the "when")
    if (this.convertedDefinition.when_event_listener !== undefined){
      Object.entries(this.convertedDefinition.when_event_listener).forEach(([k,v])=>{
        if(typeof v === 'object'){
          let {handler, options} = v
          let remover = this.html_pointer_element.addEventListener(k, (...e)=>handler.bind(undefined, this.$this, ...e)(), options)
        } 
        // else if ( typeof v === 'function'){
        let remover = this.html_pointer_element.addEventListener(k, (...e)=>v.bind(undefined, this.$this, ...e)())
        // }
      })
    }

    // first of all: declare all "data" possible property changes handler (in this way ww are sure that exist in the future for deps analysis) - they also decalre a signal!
    if (this.convertedDefinition.data !== undefined){
      Object.entries(this.convertedDefinition.data).forEach(([k,v])=>{

        // Create but do not init
        this.properties[k] = new Property(pass, pass, pass, pass, ()=>this.$this, (thisProp, deps, externalDeps=[])=>{

          // deps connection logic

          let depsRemover = []

          deps.$this_deps?.forEach(d=>{
            let depRemover = this.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ) // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
            depRemover && depsRemover.push(depRemover)
          }) // supporting multiple deps, but only of first order..

          deps.$parent_deps?.forEach(d=>{
            let depRemover = this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            depRemover && depsRemover.push(depRemover)
          })

          deps.$scope_deps?.forEach(d=>{
            let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
            let depRemover = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ); // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
            depRemover && depsRemover.push(depRemover)
          }) // supporting multiple deps, but only of first order..


          deps.$le_deps?.forEach(d=>{ // [le_id, property]
            // let depRemover;
            // exponentialRetry(()=>{
            //   depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            // }, pass, pass, pass, "Cannot connect to CLE Obj by ID", 5)
            // depsRemover.push(()=>depRemover())

            let depRemover = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            depRemover && depsRemover.push(depRemover)

          })

          deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
            let depRemover = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            depRemover && depsRemover.push(depRemover)
          })

          deps.$ref_deps?.forEach(d=>{ // [refName, property]
            // _debug.log("try match", d, this.getChildsRefOwner(d[0]));
            let depRemover;
            exponentialRetry(()=>{
              // _debug.log("try match", d, this.getChildsRefOwner(d[0]), this.getChildsRefOwner(d[0])?.childsRefPointers, this.getChildsRefOwner(d[0])?.childsRefPointers?.[d[0]]?.properties[d[1]]);
              const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
              if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
              depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
            depsRemover.push(()=>depRemover())
          })

          externalDeps?.forEach(extDep=>{
            let depRemover = extDep?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            depRemover && depsRemover.push(depRemover)
          })
          
          return depsRemover

        }, false)

        // Create associated Signal -> Every property has an associated signal, fired on change, that we use to notify interested components
        let signalName = k+"Changed" // nomde del segnale che useranno i dev per definirlo nelle on.. name used to store signal
        let manualMarkSignalName = "_mark_"+k+"_as_changed" // nome visible ai dev per marcare manualmente la property come changed
        this.signals[signalName] = new Signal(signalName, "stream => (newValue: any, oldValue: any) - property change signal")
        this.properties[manualMarkSignalName] = ()=>this.properties[k].markAsChanged() // via on set scatenerà il signal etc!
      })
      _info.log("Parsed data definition: ", this, this.signals, this.properties)
    }

    // signals def
    if (this.convertedDefinition.signals !== undefined){
      Object.entries(this.convertedDefinition.signals).forEach(([s,s_def])=>{
        const realSignal = new Signal(s, s_def)
        this.signals[s] = realSignal
        this.properties[s] = Signal.getSignalProxy(realSignal)
      })
      _info.log("Parsed signals definition: ", this, this.signals, this.properties)
    }

    // dbus signals def
    if (this.convertedDefinition.dbus_signals !== undefined){
      Object.entries(this.convertedDefinition.dbus_signals).forEach(([s,s_def])=>{
        const realSignal = this.$dbus.addSignal(s, s_def)
        // this.properties[s] = Signal.getSignalProxy(realSignal)
      })
    }

    // function def // NO DEPS SCAN AT THIS TIME
    if (this.convertedDefinition.def !== undefined){
      Object.entries(this.convertedDefinition.def).forEach(([k,v])=>{
        let _isFunc = isFunction(v)
        if (!_isFunc){ // is a namespace
          this.properties[k] = {}
          Object.entries(v).forEach(([kk,vv])=>{
            this.properties[k][kk] = (...args)=>vv.bind(undefined, this.$this, ...args)()

            let staticDeps = analizeDepsStatically(vv) // TODO: static deps analysis
            this.defDeps[k+"."+kk] = staticDeps

          })
          this.properties[k] = ComponentProxy(this.properties[k]) // maby is a normal obj?? -> to avoid to create a point where user can write without permission
        }
        else{
          this.properties[k] = (...args)=>v.bind(undefined, this.$this, ...args)()

          let staticDeps = analizeDepsStatically(v) // TODO: static deps analysis
          this.defDeps[k] = staticDeps
          
        }
      })
    }

    // on (property) | on_s (signal) def // todo: trigger on inti?
    [this.convertedDefinition.on, this.convertedDefinition.on_s /*, this.convertedDefinition.on_a*/].forEach( handle_on_definition => {
      if (handle_on_definition !== undefined){
        _info.log("Found on/on_s/on_a definition", this)
        Object.entries(handle_on_definition).forEach(([typologyNamespace, defs ])=>{
          if (typologyNamespace === "this"){
            Object.entries(defs).forEach(([s, fun])=>{
              let remover = this.signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
              this.signalsHandlerRemover.push(remover)
            })
          }
          else if (typologyNamespace === "parent"){
            Object.entries(defs).forEach(([s, fun])=>{
              let remover = this.parent.signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
              this.signalsHandlerRemover.push(remover)
            })
          }
          else if (typologyNamespace === "scope"){
            Object.entries(defs).forEach(([s, fun])=>{
              let remover = this.get$ScopedPropsOwner(s, pass, pass, true)[0].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
              this.signalsHandlerRemover.push(remover)
            })
          }
          else if (typologyNamespace === "dbus"){
            Object.entries(defs).forEach(([s, fun])=>{
              let remover = this.$dbus.addSignalHandler(s, this, (...args)=>fun.bind(undefined, this.$this, ...args)())
              this.signalsHandlerRemover.push(remover)
            })
          }
          else if (typologyNamespace === "le"){
            Object.entries(defs).forEach(([leItem, leItemDefs])=>{ // get requested element name
              Object.entries(leItemDefs).forEach(([s, fun])=>{
                // exponential retry to handle signal
                const setUpSignalHandler = (num_retry=0)=>{
                  try{
                    // _info.log("provo ad agganciare signal", leItem, s)
                    let remover = this.$le[leItem].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
                    this.signalsHandlerRemover.push(remover)
                  }
                  catch{
                    if (num_retry < 5) {
                      setTimeout(()=>setUpSignalHandler(num_retry++), Math.min(1*(num_retry+1), 5))
                    }
                    else{
                      _warning.log("CLE - WARNING! unable to connect to the signal! -> ", this, defs,)
                    }
                  }
                }
                setUpSignalHandler()
              })
            })
          }
          // todo: fattorizzare con le, se possibile!
          else if (typologyNamespace === "ctx"){
            Object.entries(defs).forEach(([ctxItem, ctxItemDefs])=>{ // get requested element name
              Object.entries(ctxItemDefs).forEach(([s, fun])=>{
                // exponential retry to handle signal
                const setUpSignalHandler = (num_retry=0)=>{
                  try{
                    // _info.log("provo ad agganciare signal", leItem, s)
                    let remover = this.$ctx[ctxItem].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
                    this.signalsHandlerRemover.push(remover)
                  }
                  catch{
                    if (num_retry < 5) {
                      setTimeout(()=>setUpSignalHandler(num_retry++), Math.min(1*(num_retry+1), 5))
                    }
                    else{
                      _warning.log("CLE - WARNING! unable to connect to the signal! -> ", this, defs,)
                    }
                  }
                }
                setUpSignalHandler()
              })
            })
          }
          // todo: fattorizzare con le, se possibile!
          else if (typologyNamespace === "ref"){

            Object.entries(defs).forEach(([refName, refSignal])=>{ // get requested element name
              Object.entries(refSignal).forEach(([s, fun])=>{

                // exponential retry to handle signal
                const setUpSignalHandler = (num_retry=0)=>{
                  try{
                    // _info.log("provo ad agganciare signal", leItem, s)
                    const pointer = this.getChildsRefOwner(refName).childsRefPointers[refName]
                    if (Array.isArray(pointer)){
                      pointer.forEach(ptr=>{
                        let remover = ptr.signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
                        this.signalsHandlerRemover.push(remover)
                      })
                    }
                    else {
                      let remover = this.getChildsRefOwner(refName).childsRefPointers[refName].signals[s].addHandler(this, (...args)=>fun.bind(undefined, this.$this, ...args)())
                      this.signalsHandlerRemover.push(remover)
                    }
                  }
                  catch{
                    if (num_retry < 5) {
                      setTimeout(()=>setUpSignalHandler(num_retry++), Math.min(1*(num_retry+1), 5))
                    }
                    else{
                      _warning.log("CLE - WARNING! unable to connect to the signal! -> ", this, defs,)
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
          ()=>_debug.log(k, "getted!"), 
          (v, ojV, self)=>{ _debug.log(k, "setted!", this); 
            this.signals[k+"Changed"].emit(v, this.properties[k]._latestResolvedValue);
          },
          //()=>{console.log("TODO: on destroy clear stuff and signal!!")}
        )
        _debug.log("Parser, data initialized: ", this, this.properties)
      })
    }

    // attributes, TODO: support function etc
    if (this.convertedDefinition.attrs !== undefined){
      _debug.log("Found attrs: ", this.convertedDefinition.attrs)

      // let has2WayBinding = Object.values(this.convertedDefinition.attrs).find(v=>v instanceof Binding) !== undefined
      let _2WayPropertyBindingToHandle = {}

      Object.entries(this.convertedDefinition.attrs).forEach(([k,v])=>{
        
        const toExecMabyLazy = (k)=>{
          _debug.log("Parsing attr: ", k,v)

          if (k.includes(".")){ // devo andare a settare l'attr as property dinamicamente [nested!]
            _warning.log("CLE - WARNING! ATTRS does not support '.' property navigation!")
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
                _debug.log("Attr static deps analysis: ", staticDeps)

                staticDeps.$this_deps?.forEach(d=>{
                  let deps = this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) ) // questa cosa da rivdere...il who non lo salviam ma in generale ora questa roba deve essere una prop, fully automated!
                  deps && this.attrHattrRemover.push(deps)
                }) // supporting multiple deps, but only of first order..

                staticDeps.$parent_deps?.forEach(d=>{
                  let deps = this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                  deps && this.attrHattrRemover.push(deps)
                })
                
                staticDeps.$scope_deps?.forEach(d=>{
                  let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
                  let deps = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) );
                  deps && this.attrHattrRemover.push(deps)
                })

                staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                  let deps = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                  deps && this.attrHattrRemover.push(deps)
                })

                staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                  let deps = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                  deps && this.attrHattrRemover.push(deps)
                })

                staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                  let depRemover;
                  exponentialRetry(()=>{
                    const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                    if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                    depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupStyle(v) )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
                  this.attrHattrRemover.push(()=>depRemover())
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
                _debug.log("Attr static deps analysis: ", staticDeps)

                staticDeps.$this_deps?.forEach(d=>{
                  let deps = this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                }) // supporting multiple deps, but only of first order..

                staticDeps.$parent_deps?.forEach(d=>{
                  let deps = this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                })
                
                staticDeps.$scope_deps?.forEach(d=>{
                  let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
                  let deps = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler([this, "attr", k], ()=>setupValue() );
                  deps && this.attrHattrRemover.push(deps)
                })

                staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                  let deps = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                })

                staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                  let deps = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                })

                staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                  let depRemover;
                  exponentialRetry(()=>{
                    const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                    if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                    depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
                  this.attrHattrRemover.push(()=>depRemover())
                })

                setupValue()

            }
            else if (v instanceof HAttrBinding){ 
              _info.log("Found HAttrBinding attr: ", k,v, this)

              const _binding = v;
              v = v.bindFunc

              const setupValue = ()=>{ 
                const val = v.bind(undefined, this.$this)(); 
                if (val !== this.html_pointer_element[k]){ //set only if different!
                  this.html_pointer_element[k] = val?.toString()
                }
                
              }

              let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
              _info.log("Attr static deps analysis: ", staticDeps)
              // todo: in realtà è mutualmente escusivo, e solo 1 dep il property binding!
              staticDeps.$this_deps?.forEach(d=>{
                let deps = this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.properties[d]
              }) 

              staticDeps.$parent_deps?.forEach(d=>{
                let deps = this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.parent.properties[d]
              })
              
              staticDeps.$scope_deps?.forEach(d=>{
                let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
                if (isPropertiesProp){
                  let deps = propsOwner.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                  _2WayPropertyBindingToHandle[k] = ()=>propsOwner.properties[d]
                }
                else {
                  let deps = propsOwner.meta[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                  _2WayPropertyBindingToHandle[k] = ()=>propsOwner.meta[d]
                }
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                let deps = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let deps = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
                this.attrHattrRemover.push(()=>depRemover())
                _2WayPropertyBindingToHandle[k] = ()=>this.getChildsRefOwner(d[0]).childsRefPointers[d[0]].properties[d[1]]
              })

              // now manually configure the binding
              if ((this.htmlElementType === "input" || this.htmlElementType === "div") && ["value", "checked"].includes(k)){
                if ( ( ! ["button", "hidden", "image", "reset", "submit", "file"].includes(this.convertedDefinition.attrs.type)) ){
                  _info.log("Found 2 way binding", k, this)
                  let handlerFor2WayDataBinding = (e)=>{ 
                    _info.log("2way binding changes handled!")
                    // e.stopPropagation(); 
                    let bindedProps = _2WayPropertyBindingToHandle[k]()
                    let newValue = _binding.remap !== undefined ? _binding.remap.bind(undefined, this.$this)(e.target[k], e) : e.target[k]
                    if(bindedProps.value !== newValue) {
                      bindedProps.value = newValue
                    }
                  }
                  _info.log("2way Chose event: ", _binding.event ?? "input", k, this)
                  this.html_pointer_element.addEventListener(_binding.event ?? "input", handlerFor2WayDataBinding)
                  let remover = ()=>this.html_pointer_element.removeEventListener(_binding.event ?? "input", handlerFor2WayDataBinding) // per la destroy..
                  this.signalsHandlerRemover.push(remover)
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
                this.signalsHandlerRemover.push(remover)
              
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
          _info.log("Found lazy attr!")
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
      _debug.log("Found hattrs: ", this.convertedDefinition.hattrs)

      let _2WayPropertyBindingToHandle = {}

      Object.entries(this.convertedDefinition.hattrs).forEach(([k,v])=>{
        
        const toExecMabyLazy = (k)=>{

          
          _debug.log("Exec HAttr: ", k,v)

          let _oj_k = k

          if (k.includes(".")){ // devo andare a settare l'attr as property dinamicamente [nested!]

            if (isFunction(v)){
              const setupValue = ()=>{ 
                let [pointer, final_k] = recursiveAccessor(this.html_pointer_element, k.split("."))

                const val = v.bind(undefined, this.$this)(); 
                
                pointer[final_k] = val
              }

              let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
              _info.log("HAttr static deps analysis: ", staticDeps)

              staticDeps.$this_deps?.forEach(d=>{
                let deps = this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              }) // supporting multiple deps, but only of first order..

              staticDeps.$parent_deps?.forEach(d=>{
                let deps = this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$scope_deps?.forEach(d=>{
                let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
                let deps = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler([this, "attr", k], ()=>setupValue() );
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                let deps = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let deps = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
                this.attrHattrRemover.push(()=>depRemover())
              })

              setupValue()

            }
            else if (v instanceof HAttrBinding){ 
              _info.log("Found binding hattr: ", k,v, this)

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
              _info.log("HAttr static deps analysis: ", staticDeps)
              // todo: in realtà è mutualmente escusivo, e solo 1 dep il property binding!
              staticDeps.$this_deps?.forEach(d=>{
                let deps = this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.properties[d]
              }) 

              staticDeps.$parent_deps?.forEach(d=>{
                let deps = this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.parent.properties[d]
              })

              staticDeps.$scope_deps?.forEach(d=>{
                let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
                if (isPropertiesProp){
                  let deps = propsOwner.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                  _2WayPropertyBindingToHandle[k] = ()=>propsOwner.properties[d]
                }
                else {
                  let deps = propsOwner.meta[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                  deps && this.attrHattrRemover.push(deps)
                  _2WayPropertyBindingToHandle[k] = ()=>propsOwner.meta[d]
                }
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                let deps = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let deps = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
                this.attrHattrRemover.push(()=>depRemover())
                _2WayPropertyBindingToHandle[k] = ()=>this.getChildsRefOwner(d[0]).childsRefPointers[d[0]].properties[d[1]]
              })

              // now manually configure the binding
              _info.log("Exec 2 way bidning", k, this)
              let handlerFor2WayDataBinding = (e)=>{ 
                _info.log("2way binding changes handled!")
                // e.stopPropagation(); 
                let bindedProps = _2WayPropertyBindingToHandle[k]()

                let [pointer, final_k] = recursiveAccessor(e.target, k.split("."))

                let newValue = _binding.remap !== undefined ? _binding.remap.bind(undefined, this.$this)(pointer[final_k], e) : pointer[final_k]
                if(bindedProps.value !== newValue) {
                  bindedProps.value = newValue
                }
              }
              _info.log("Chosing event: ", _binding.event ?? "input", k, this)
              this.html_pointer_element.addEventListener(_binding.event ?? "input", handlerFor2WayDataBinding)
              let remover = ()=>this.html_pointer_element.removeEventListener(_binding.event ?? "input", handlerFor2WayDataBinding) // per la destroy..
              this.signalsHandlerRemover.push(remover)

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
              _info.log("HAttr static deps analysis: ", staticDeps)

              staticDeps.$this_deps?.forEach(d=>{
                let deps = this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              }) // supporting multiple deps, but only of first order..

              staticDeps.$parent_deps?.forEach(d=>{
                let deps = this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$scope_deps?.forEach(d=>{
                let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
                let deps = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler([this, "attr", k], ()=>setupValue() );
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
                let deps = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let deps = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
                this.attrHattrRemover.push(()=>depRemover())
              })

              setupValue()

          }
          else if (v instanceof HAttrBinding){ 
            _info.log("Found binding hattr: ", k,v, this)

            const _binding = v;
            v = v.bindFunc

            const setupValue = ()=>{ 
              const val = v.bind(undefined, this.$this)(); 
              if (val !== this.html_pointer_element[k]){ //set only if different!
                this.html_pointer_element[k] = val
              }
              
            }

            let staticDeps = analizeDepsStatically(v) // WARNING actally w're bypassing the "deps storage" machenism..this wil break deps update in future!!!
            _info.log("hattr static deps analysis: ", staticDeps)
            // todo: in realtà è mutualmente escusivo, e solo 1 dep il property binding!
            staticDeps.$this_deps?.forEach(d=>{
              let deps = this.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              deps && this.attrHattrRemover.push(deps)
              _2WayPropertyBindingToHandle[k] = ()=>this.properties[d]
            }) 

            staticDeps.$parent_deps?.forEach(d=>{
              let deps = this.parent.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
              deps && this.attrHattrRemover.push(deps)
              _2WayPropertyBindingToHandle[k] = ()=>this.parent.properties[d]
            })

            staticDeps.$scope_deps?.forEach(d=>{
              let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
              if (isPropertiesProp){
                let deps = propsOwner.properties[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>propsOwner.properties[d]
              }
              else {
                let deps = propsOwner.meta[d]?.addOnChangedHandler([this, "attr", k], ()=>setupValue() )
                deps && this.attrHattrRemover.push(deps)
                _2WayPropertyBindingToHandle[k] = ()=>propsOwner.meta[d]
              }
            })
            
            staticDeps.$le_deps?.forEach(d=>{ // [le_id, property]
              let deps = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              deps && this.attrHattrRemover.push(deps)
              _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
            })

            staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
              let deps = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              deps && this.attrHattrRemover.push(deps)
              _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
            })

            staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
              let depRemover;
              exponentialRetry(()=>{
                const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
              this.attrHattrRemover.push(()=>depRemover())
              _2WayPropertyBindingToHandle[k] = ()=>this.getChildsRefOwner(d[0]).childsRefPointers[d[0]].properties[d[1]]
            })



            // now manually configure the binding
            _info.log("Exec 2 way bidning", k, this)
            let handlerFor2WayDataBinding = (e)=>{ 
              _info.log("2way binding changes handled!")
              // e.stopPropagation(); 
              let bindedProps = _2WayPropertyBindingToHandle[k]()
              let newValue = _binding.remap !== undefined ? _binding.remap.bind(undefined, this.$this)(e.target[k], e) : e.target[k]
              if(bindedProps.value !== newValue) {
                bindedProps.value = newValue
              }
            }
            _info.log("Chosing event: ", _binding.event ?? "input", k, this)
            this.html_pointer_element.addEventListener(_binding.event ?? "input", handlerFor2WayDataBinding)
            let remover = ()=>this.html_pointer_element.removeEventListener(_binding.event ?? "input", handlerFor2WayDataBinding) // per la destroy..
            this.signalsHandlerRemover.push(remover)
          

            setupValue()

          }
          else {
            this.html_pointer_element[k] = v 
          }

        }

        if (k.startsWith("@lazy:")){
          _info.log("Found lazy!")
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
                  
            let depsRemover = []

            // deps connection logic
            deps.$this_deps?.forEach(d=>{
              let depRemover = this.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ) // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
              depRemover && depsRemover.push(depRemover)
            }) // supporting multiple deps, but only of first order..

            deps.$parent_deps?.forEach(d=>{
              let depRemover = this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              depRemover && depsRemover.push(depRemover)
            })

            deps.$scope_deps?.forEach(d=>{
              let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
              let depRemover = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() );
              depRemover && depsRemover.push(depRemover)
            })

            deps.$le_deps?.forEach(d=>{ // [le_id, property]
              let depRemover = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              depRemover && depsRemover.push(depRemover)
            })

            deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
              let depRemover = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              depRemover && depsRemover.push(depRemover)
            })

            deps.$ref_deps?.forEach(d=>{ // [refName, property]
              let depRemover;
              exponentialRetry(()=>{
                const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
              depsRemover.push(()=>depRemover())
            })

            return depsRemover
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
          if (v instanceof _BindToPropInConstructor){
            args[p] = v.build(this.parent.$this) // args will be: {getter: useExernal, setter:$=>..., signal}
          } else {
            args[p] = isFunction(v) ? v.bind(undefined, this.parent.$this) : v // todo: questo è un mezzo errore..perchè in questo modo non ruisciro a parsare le dipendenze nel caso di set di una prop..perchè è già bindata! d'altro canto in realtà init nasce per passare valori, quindi è corretto!
            // todo: forse la cosa migliore qui è abbandonare l'idea del constructor e andare con i passed args, ovvero lato declaration già indico a chi assegno cosa, mettendo una prop nel mezzo con punto di vista "parent" ma nel figlio, in modo da notifcare i changes!
            // todo: o meglio, forse basta che creo una prop con exec context del parent in loop come questo (ma dedicato ai passed), e agganciarci alla onChange una semplicissima mark as changed della prop (this) che conterrà quella passata (del parent)
          }
        })
      }
      this.hooks.constructor = this.convertedDefinition.constructor.bind(undefined, this.$this, args)
    }

    // onInit
    if (this.convertedDefinition.onInit !== undefined){
      this.hooks.onInit = this.convertedDefinition.onInit.bind(undefined, this.$this)
    }

    // afterChildsInit (non lazy!)
    if (this.convertedDefinition.afterChildsInit !== undefined){
      this.hooks.afterChildsInit = this.convertedDefinition.afterChildsInit.bind(undefined, this.$this)
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
    for (let _child of this.childs){
      _child.create()
    }

    // afterChildsInit (non lazy!)
    this.hooks.afterChildsInit !== undefined && this.hooks.afterChildsInit()

    // trigger afterInit (lazy..)
    this.hooks.afterInit !== undefined && setTimeout(()=>this.hooks.afterInit(), 1)


    // s_css, TODO: support function etc. must be AFTER childs creation, because NESTED redefinition require ORDER PRESERVATION (to use natural css overwrite) todo: is it buggy for le-for & le-if component? 
    if (this.convertedDefinition.s_css !== undefined){
      if (this.s_css_html_pointer_element === undefined){
        this.s_css_html_pointer_element = document.createElement('style');
        document.getElementsByTagName('head')[0].appendChild(this.s_css_html_pointer_element);
      }

      let rules = []

      // vedi ExtendSCSS

      const renderize_css = ()=>{
        this.s_css_html_pointer_element.innerText = rules.map(
          ([selector, rr])=>`[${this.t_uid}]${selector},[${this.t_uid}] ${selector}{${toInlineStyle(rr.value)}}`
        ).join(" ")
      }
      Object.entries(this.convertedDefinition.s_css).forEach(([selector, rule_defs])=>{rule_defs.forEach(rr=>{
        rules.push(
          // [selector, rule_defs]
          [selector, new Property(rr, none, renderize_css, none, ()=>this.$this, (thisProp, deps)=>{
                  
            let depsRemover = []

            // deps connection logic
            deps.$this_deps?.forEach(d=>{
              let depRemover = this.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ) // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
              depRemover && depsRemover.push(depRemover)
            }) // supporting multiple deps, but only of first order..

            deps.$parent_deps?.forEach(d=>{
              let depRemover = this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              depRemover && depsRemover.push(depRemover)
            })

            deps.$scope_deps?.forEach(d=>{
              let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
              let depRemover = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() );
              depRemover && depsRemover.push(depRemover)
            })

            deps.$le_deps?.forEach(d=>{ // [le_id, property]
              let depRemover = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              depRemover && depsRemover.push(depRemover)
            })

            deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
              let depRemover = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              depRemover && depsRemover.push(depRemover)
            })

            deps.$ref_deps?.forEach(d=>{ // [refName, property]
              let depRemover;
              exponentialRetry(()=>{
                const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
              depsRemover.push(()=>depRemover())
            })

            return depsRemover

          }, true)]
        )})
      })

      renderize_css()

    }

  }
  // update(){
  //   this.childs.forEach(child=>child.update())
  // }
  // regenerate(){}
  destroy(){
    this.hooks.onDestroy !== undefined && this.hooks.onDestroy()
    this.childs?.forEach(child=>child.destroy())
    this.destroyDynamicChilds(undefined, true, true)

    
    this.html_pointer_element?.remove()
    this.css_html_pointer_element?.remove()
    this.css_html_pointer_element=undefined
    this.s_css_html_pointer_element?.remove()
    this.s_css_html_pointer_element=undefined
    try { delete this.$ctx[this.id] } catch {}
    try { delete this.$ctx[this._id] } catch {}
    try { if(this.isMyParentHtmlRoot){ delete this.$le["_root_"] } } catch {}
    try { if(this.isA$ctxComponent){ delete this.$ctx["_ctxroot_"] } } catch {}
    delete this.$le[this.id]
    
    this.unregisterAsChildsRef()

    this.handlerRemover?.forEach(remover=>{
      try{remover()} catch{}
    })
    this.attrHattrRemover?.forEach(remover=>{
      try{remover()} catch{}
    })
    Object.values(this.signals).forEach(s=>{
      try{s.destroy()} catch{}
    })
    this.signalsHandlerRemover?.forEach(remover=>{
      try{remover()} catch{}
    })
    Object.values(this.properties).forEach(p=>{
      try{p.destroy(true)} catch{}
    })

    // todo: destroy properties and signal well..

  }

  destroyDynamicChilds(childsToDestroy, clearState=false, clearDestroyHook=false){ // array of component.$this

    this.dynamicChildsBeforeDestroy(this.parent.$this, this.dynamicChildsState)

    if (childsToDestroy === undefined){
      this.dynamicChilds?.forEach(child=>child.destroy())
      this.dynamicChilds = []
    }
    else {
      this.dynamicChilds?.forEach(child=>childsToDestroy.includes(child.$this) && child.destroy())
      this.dynamicChilds = this.dynamicChilds?.filter(child=>!childsToDestroy.includes(child.$this))
    }

    this.dynamicChildsAfterDestroy(this.parent.$this, this.dynamicChildsState)

    if (clearState){
      this.dynamicChildsState = {}
    }
    if (clearDestroyHook){
      this.dynamicChildsBeforeDestroy = ($parent, state)=>{}
      this.dynamicChildsBeforeDestroy = ($parent, state)=>{}
    }
  }

  static parseComponentDefinition = (definition) => {
    let unifiedDef = { }
    
    let already_resolved = []
    const addToAlreadyResolved = (...v)=>{already_resolved = [...already_resolved, ...v]}


    // multi choice def

    let { childs, contains: childs_contains, text: childs_text, view: childs_view, ">>":childs_ff, "=>": childs_arrow, _: childs_underscore, '': childs_empty } = definition
    unifiedDef.childs = childs || childs_contains || childs_text || childs_view || childs_ff || childs_arrow || childs_underscore || childs_empty
    if (unifiedDef.childs !== undefined && !Array.isArray(unifiedDef.childs)) {unifiedDef.childs = [unifiedDef.childs]}
    // can be: template | string | $ => string | array<template | string | $ => string>
    addToAlreadyResolved('childs', 'contains', 'text', 'view', ">>", "=>", '_', '')

    // standard def

    unifiedDef.state = definition.state || "initial"
    addToAlreadyResolved('state')

    copyObjPropsInplace(definition, unifiedDef, [
      "constructor", 
      "beforeInit", "onInit", "afterInit", "afterChildsInit", "onUpdate", "onDestroy", 
      "signals", "dbus_signals", "on", "on_s", "on_a", 
      "alias", "handle", "when", "css", "s_css", 
      "states", "stateChangeStrategy", "onState",
      "name", "childsRef"
    ])
    addToAlreadyResolved(
      "constructor", 
      "beforeInit", "onInit", "afterInit", "afterChildsInit", "onUpdate", "onDestroy", 
      "signals", "dbus_signals", "on", "on_s", "on_a", 
      "alias", "handle", "when", "css", "s_css", 
      "states", "stateChangeStrategy", "onState",
      "name", "childsRef"
    )

    // renamed def
    unifiedDef.checked_deps = definition.deps
    addToAlreadyResolved('deps')
    



    // maybe private def

    let { 
      id, ctx_id: _id, 
      def, "private:def": _def, 
      attrs, "private:attrs":_attrs, 
      a, "private:a": _a, 
      hattrs, "private:hattrs":_hattrs, 
      ha, "private:ha": _ha, 
    } = definition
    addToAlreadyResolved('id', 'ctx_id',
      'def', "private:def",
      'attrs', "private:attrs",
      'a', "private:a", 
      'hattrs', "private:hattrs",
      'ha', "private:ha"
    )

    unifiedDef.id = id || ComponentRUUIDGen.generate()
    unifiedDef._id = _id || unifiedDef.id

    if (def !== undefined) { unifiedDef.def = def }
    if (_def !== undefined) { unifiedDef._def = _def }
    
    if (attrs !== undefined || a !== undefined) { unifiedDef.attrs = attrs || a }
    if (_attrs !== undefined || _a !== undefined) { unifiedDef._attrs = _attrs || _a }

    if (hattrs !== undefined || ha !== undefined) { unifiedDef.hattrs = hattrs || ha }
    if (_hattrs !== undefined || _ha !== undefined) { unifiedDef._hattrs = _hattrs || _ha }

    // a/ha & attrs/hattrs 1st lvl shortcuts: (eg: a.style or attrs.style) -> only public for nuw!
    let attrs_shortcuts_key = Object.keys(definition).filter(k=>k.startsWith("a.") || k.startsWith("attrs."))
    addToAlreadyResolved(...attrs_shortcuts_key)

    if (attrs_shortcuts_key.length > 0){
      let attrs_shortcuts_definition = {}
      attrs_shortcuts_key.forEach(sk=>{ attrs_shortcuts_definition[sk.split(".")[1]] = definition[sk] })
      if (unifiedDef.attrs !== undefined){
        unifiedDef.attrs = { ...unifiedDef.attrs, ...attrs_shortcuts_definition }
      }
      else {
        unifiedDef.attrs = attrs_shortcuts_definition
      }
    }

    let hattrs_shortcuts_key = Object.keys(definition).filter(k=>k.startsWith("ha.") || k.startsWith("hattrs."))
    addToAlreadyResolved(...hattrs_shortcuts_key)
    if (hattrs_shortcuts_key.length > 0){
      let hattrs_shortcuts_definition = {}
      hattrs_shortcuts_key.forEach(sk=>{let new_sk = sk.split("."); new_sk.shift(); new_sk=new_sk.join("."); hattrs_shortcuts_definition[new_sk] = definition[sk] })
      if (unifiedDef.hattrs !== undefined){
        unifiedDef.hattrs = { ...unifiedDef.hattrs, ...hattrs_shortcuts_definition }
      }
      else {
        unifiedDef.hattrs = hattrs_shortcuts_definition
      }
    }

    // meta
    let {meta} = definition
    addToAlreadyResolved('meta')

    unifiedDef.meta = meta
    

    // maybe private def and multichoice

    let { 
      data, "private:data": _data, 
      props, "private:props": _props, 
      "let": data_let, "private:let": _data_let, 
    } = definition
    addToAlreadyResolved(
      'data', "private:data", 
      'props', "private:props", 
      "let", "private:let"
    )

    unifiedDef.data = data || props || data_let || {}
    unifiedDef._data = _data || _props || _data_let || {}


    const dash_shortucts_keys = {
      attrs: {},
      hattrs: {},
      data: {},
      def: {},
      handle: {},
      when_event_listener: {},
      signals: {},
      dbus_signals: {},
      on_this: {},
      on_parent: {},
      on_scope: {},
      on_dbus: {},
      // on_le: {}, // TODO: support on le & ctx shortcuts!
      // on_ctx: {},
      // on_ref: {},
    }

    // let has_dash_shortucts_keys = false // todo performance by skip next if series

    Object.keys(definition).forEach(k=>{
      if (k.includes("_")){

        let val = definition[k]

        if (k.startsWith('a_')){
          dash_shortucts_keys.attrs[k.substring(2)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('attr_')){
          dash_shortucts_keys.attrs[k.substring(5)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('ha_')){
          dash_shortucts_keys.hattrs[k.substring(3)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('hattr_')){
          dash_shortucts_keys.hattrs[k.substring(6)] = val
          addToAlreadyResolved(k)
        }
        
        else if (k.startsWith('p_')){
          dash_shortucts_keys.data[k.substring(2)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('let_')){
          dash_shortucts_keys.data[k.substring(4)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('let ')){
          dash_shortucts_keys.data[k.substring(4)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('d_')){
          dash_shortucts_keys.def[k.substring(2)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('def_')){
          dash_shortucts_keys.def[k.substring(4)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('h_')){
          dash_shortucts_keys.handle[k.substring(2)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('handle_')){
          dash_shortucts_keys.handle[k.substring(7)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('w_')){
          dash_shortucts_keys.handle[k.substring(2)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('when_')){
          dash_shortucts_keys.when_event_listener[k.substring(5)] = val
          addToAlreadyResolved(k)
        }
        
        else if (k.startsWith('s_')){
          dash_shortucts_keys.signals[k.substring(2)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('signal_')){
          dash_shortucts_keys.signals[k.substring(7)] = val
          addToAlreadyResolved(k)
        }
        
        else if (k.startsWith('dbs_')){
          dash_shortucts_keys.dbus_signals[k.substring(4)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('dbus_signal_')){
          dash_shortucts_keys.dbus_signals[k.substring(12)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('on_this_')){
          dash_shortucts_keys.on_this[k.substring(8)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('on_parent_')){
          dash_shortucts_keys.on_parent[k.substring(10)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('on_scope_')){
          dash_shortucts_keys.on_scope[k.substring(9)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('on_dbus_')){
          dash_shortucts_keys.on_dbus[k.substring(8)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('on_s_')){ // ultra shortcuts! use scope (ideally for signals..)
          dash_shortucts_keys.on_scope[k.substring(5)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('on_')){ // ultra shortcuts! use scope
          dash_shortucts_keys.on_scope[k.substring(3)] = val
          addToAlreadyResolved(k)
        }
      }
      
      else if (['class', 'style'].includes(k)){ // Extreme shortcuts for style & class
        dash_shortucts_keys.attrs[k] = definition[k]
        addToAlreadyResolved(k)
      }

    })


    // all done! now everithing NOT already_resolved is a prop!
    Object.keys(definition).forEach(k=>{
      if (!already_resolved.includes(k)){
        dash_shortucts_keys.data[k] = definition[k]
        _warning.log('CLE-INFO: unrecognized ', k, " converted into props!")
      }
    })

    // now compact everithing

    if (Object.keys(dash_shortucts_keys.attrs).length > 0){
      if (unifiedDef.attrs !== undefined){ unifiedDef.attrs = { ...unifiedDef.attrs, ...dash_shortucts_keys.attrs } }
      else { unifiedDef.attrs = dash_shortucts_keys.attrs }
    }
    if (Object.keys(dash_shortucts_keys.hattrs).length > 0){
      if (unifiedDef.hattrs !== undefined){ unifiedDef.hattrs = { ...unifiedDef.hattrs, ...dash_shortucts_keys.hattrs } }
      else { unifiedDef.hattrs = dash_shortucts_keys.hattrs }
    }
    if (Object.keys(dash_shortucts_keys.data).length > 0){
      if (unifiedDef.data !== undefined){ unifiedDef.data = { ...unifiedDef.data, ...dash_shortucts_keys.data } }
      else { unifiedDef.data = dash_shortucts_keys.data }
    }
    if (Object.keys(dash_shortucts_keys.def).length > 0){
      if (unifiedDef.def !== undefined){ unifiedDef.def = { ...unifiedDef.def, ...dash_shortucts_keys.def } }
      else { unifiedDef.def = dash_shortucts_keys.def }
    }
    if (Object.keys(dash_shortucts_keys.handle).length > 0){
      if (unifiedDef.handle !== undefined){ unifiedDef.handle = { ...unifiedDef.handle, ...dash_shortucts_keys.handle } }
      else { unifiedDef.handle = dash_shortucts_keys.handle }
    }
    if (Object.keys(dash_shortucts_keys.when_event_listener).length > 0){
      if (unifiedDef.when_event_listener !== undefined){ unifiedDef.when_event_listener = { ...unifiedDef.when_event_listener, ...dash_shortucts_keys.when_event_listener } }
      else { unifiedDef.when_event_listener = dash_shortucts_keys.when_event_listener }
    }
    if (Object.keys(dash_shortucts_keys.signals).length > 0){
      if (unifiedDef.signals !== undefined){ unifiedDef.signals = { ...unifiedDef.signals, ...dash_shortucts_keys.signals } }
      else { unifiedDef.signals = dash_shortucts_keys.signals }
    }
    if (Object.keys(dash_shortucts_keys.dbus_signals).length > 0){
      if (unifiedDef.dbus_signals !== undefined){ unifiedDef.dbus_signals = { ...unifiedDef.dbus_signals, ...dash_shortucts_keys.dbus_signals } }
      else { unifiedDef.dbus_signals = dash_shortucts_keys.dbus_signals }
    }
    if (Object.keys(dash_shortucts_keys.on_this).length > 0){
      if (unifiedDef.on !== undefined){ 
        if (unifiedDef.on.this !== undefined){
          unifiedDef.on.this = { ...unifiedDef.on.this, ...dash_shortucts_keys.on_this } 
        }
        else {
          unifiedDef.on.this = dash_shortucts_keys.on_this
        }
        
      }
      else { unifiedDef.on = { this: dash_shortucts_keys.on_this }}
    }
    if (Object.keys(dash_shortucts_keys.on_parent).length > 0){
      if (unifiedDef.on !== undefined){ 
        if (unifiedDef.on.parent !== undefined){
          unifiedDef.on.parent = { ...unifiedDef.on.parent, ...dash_shortucts_keys.on_parent } 
        }
        else {
          unifiedDef.on.parent = dash_shortucts_keys.on_parent
        }
        
      }
      else { unifiedDef.on = { parent: dash_shortucts_keys.on_parent }}
    }
    if (Object.keys(dash_shortucts_keys.on_scope).length > 0){
      if (unifiedDef.on !== undefined){ 
        if (unifiedDef.on.scope !== undefined){
          unifiedDef.on.scope = { ...unifiedDef.on.scope, ...dash_shortucts_keys.on_scope } 
        }
        else {
          unifiedDef.on.scope = dash_shortucts_keys.on_scope
        }
        
      }
      else { unifiedDef.on = { scope: dash_shortucts_keys.on_scope }}
    }
    if (Object.keys(dash_shortucts_keys.on_dbus).length > 0){
      if (unifiedDef.on !== undefined){ 
        if (unifiedDef.on.dbus !== undefined){
          unifiedDef.on.dbus = { ...unifiedDef.on.dbus, ...dash_shortucts_keys.on_dbus } 
        }
        else {
          unifiedDef.on.dbus = dash_shortucts_keys.on_dbus
        }
        
      }
      else { unifiedDef.on = { dbus: dash_shortucts_keys.on_dbus }}
    }


    return unifiedDef

  }

  // step 0: Analyze, convert and Create
  static componentFactory = (parent, template, $le, $dbus) => {

    let component;

    if ((typeof template === "string") || (typeof template === "function") || isUseExternalDefinition(template)){
      component = new TextNodeComponent(parent, template)
      return component
    }

    _info.log("Component Factory: ", parent, template)
    let componentType = getComponentType(template)
    let componentDef = (template instanceof UseComponentDeclaration ? template.computedTemplate : template) [componentType]

    // support smart component natively! must recreate template
    if ((typeof componentDef === "string") || (typeof componentDef === "function") || Array.isArray(componentDef)){
      componentDef = {text: componentDef}
      template = {[componentType]: componentDef}
    }


    if("meta" in componentDef){
      if ("if" in componentDef.meta){ // is a conditionalComponet
        component = new ConditionalComponent(parent, template, $le, $dbus)
      }
      else if ("forEach" in componentDef.meta) { // is a foreach component (IterableViewComponent)
        component = new IterableViewComponent(parent, template, $le, $dbus)

      }
      else {
        component = new Component(parent, template, $le, $dbus)
      }
    }
    else {
      component = new Component(parent, template, $le, $dbus)
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
    this.html_pointer_element.textContent = isFunction(this.definition) || isUseExternalDefinition(this.definition) ? (isUseExternalDefinition(this.definition) ? this.definition.getter : this.definition).bind(undefined, this.parent.$this)() : this.definition
  }
  
  depsRemover = []
  staticAnDeps = {} // TEST, DEMO
  analizeDeps(){
    let isUseExt = isUseExternalDefinition(this.definition)
    if (typeof this.definition === "function" || isUseExt){
      this.staticAnDeps = analizeDepsStatically(this.definition, isUseExt)
      _debug.log("Text Deps Analysis: ", this, this.staticAnDeps)
    }

  }
  // step 3: create and renderize
  create(){
    
    this.analizeDeps()
    _debug.log("Text Node Created!")

    // todo: fattorizzare perchè così non ha senso..

    // todo: questo bugfix va anche da altre parti // aka il d[0] : d..questo mappa il problema della parent chian lato dev!
    this.staticAnDeps.$this_deps?.forEach(d=>{
      let propName = Array.isArray(d) ? d[0] : d
      let pointedProp = this.parent.properties[propName]
      if ("addOnChangedHandler" in pointedProp){
        this.depsRemover.push(pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
      }
      else if (propName in this.parent.defDeps){ // is a function!
        let staticDeps = this.parent.defDeps[propName]
        let pointedComponentEl = this.parent
        
        staticDeps.$this_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$parent_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.parent.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })
        
        staticDeps.$scope_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d

          let [propsOwner, isPropertiesProp] = pointedComponentEl.get$ScopedPropsOwner(d);
          let _pointedProp  = isPropertiesProp ? propsOwner.properties[_propName] : propsOwner.meta[_propName];

          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$le_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })
      }
    })

    this.staticAnDeps.$parent_deps?.forEach(d=>{
      let propName = Array.isArray(d) ? d[0] : d
      let pointedProp = this.parent.parent.properties[propName]
      if ("addOnChangedHandler" in pointedProp){
        this.depsRemover.push(pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
      }
      else if (propName in this.parent.parent.defDeps){ // is a function!
        let staticDeps = this.parent.parent.defDeps[propName]
        let pointedComponentEl = this.parent.parent
        
        staticDeps.$this_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$parent_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.parent.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$scope_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d

          let [propsOwner, isPropertiesProp] = pointedComponentEl.get$ScopedPropsOwner(d);
          let _pointedProp  = isPropertiesProp ? propsOwner.properties[_propName] : propsOwner.meta[_propName];

          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$le_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })
      }
    })    
    
    this.staticAnDeps.$scope_deps?.forEach(d=>{
      let propName = Array.isArray(d) ? d[0] : d
      let [pointedScope, isPropertiesProp] = this.parent.get$ScopedPropsOwner(propName);
      let pointedProp  = isPropertiesProp ? pointedScope.properties[propName] : pointedScope.meta[propName];
      if ("addOnChangedHandler" in pointedProp){
        this.depsRemover.push(pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
      }
      else if (propName in pointedScope.defDeps){ // is a function!
        let staticDeps = pointedScope.defDeps[propName]
        let pointedComponentEl = pointedScope
        
        staticDeps.$this_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$parent_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.parent.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })
        
        staticDeps.$scope_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d

          let [propsOwner, isPropertiesProp] = pointedComponentEl.get$ScopedPropsOwner(d);
          let _pointedProp  = isPropertiesProp ? propsOwner.properties[_propName] : propsOwner.meta[_propName];

          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$le_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })
      }
    })

    this.staticAnDeps.$le_deps?.forEach(d=>{
      let propName = d[1]
      let pointedProp = this.parent.$le[d[0]].properties[propName]
      if ("addOnChangedHandler" in pointedProp){
        this.depsRemover.push(pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
      }
      else if (propName in this.parent.$le[d[0]].defDeps){ // is a function!
        let staticDeps = this.parent.$le[d[0]].defDeps[propName]
        let pointedComponentEl = this.parent.$le[d[0]]
        
        staticDeps.$this_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$parent_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.parent.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$scope_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d

          let [propsOwner, isPropertiesProp] = pointedComponentEl.get$ScopedPropsOwner(d);
          let _pointedProp  = isPropertiesProp ? propsOwner.properties[_propName] : propsOwner.meta[_propName];

          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$le_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })
      }
    })

    this.staticAnDeps.$ctx_deps?.forEach(d=>{
      let propName = d[1]
      let pointedProp = this.parent.$ctx[d[0]].properties[propName]
      if ("addOnChangedHandler" in pointedProp){
        this.depsRemover.push(pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
      }
      else if (propName in this.parent.$ctx[d[0]].defDeps){ // is a function!
        let staticDeps = this.parent.$ctx[d[0]].defDeps[propName]
        let pointedComponentEl = this.parent.$ctx[d[0]]
        
        staticDeps.$this_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$parent_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d
          let _pointedProp = pointedComponentEl.parent.properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$scope_deps?.forEach(_d=>{
          let _propName = Array.isArray(_d) ? _d[0] : _d

          let [propsOwner, isPropertiesProp] = pointedComponentEl.get$ScopedPropsOwner(d);
          let _pointedProp  = isPropertiesProp ? propsOwner.properties[_propName] : propsOwner.meta[_propName];
          
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$le_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          let _propName = _d[1]
          let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
          if ("addOnChangedHandler" in _pointedProp){
            this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
          }
          // todo: recoursive def deps!
        })
      }
    })

    this.staticAnDeps.$ref_deps?.forEach(d=>{// [refName, property]

      let depRemover;
      exponentialRetry(()=>{
        const owner = this.parent.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
        if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
        if ("addOnChangedHandler" in owner.properties[d[1]]){
          depRemover = owner.properties[d[1]].addOnChangedHandler(this, ()=>this._renderizeText())
        }
        else { _warning.log("CLE Warning - function in ref in text as deps not supported at this time")}
      }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
      
      this.depsRemover.push(()=>depRemover())

    })

    this.staticAnDeps.$external_deps?.forEach(extProp=>{
      if (extProp !== undefined && "addOnChangedHandler" in extProp){
        this.depsRemover.push(extProp.addOnChangedHandler(this, ()=>this._renderizeText()))
      }
    })

    this._renderizeText()
    
  }

  // update(){
  //   this.childs.forEach(child=>child.update())
  // }

  // regenerate(){}
  destroy(){
    this.html_pointer_element.remove()
    this.depsRemover?.forEach(dr=>dr())
    // todo: optimization: on destroy i must unsubscribe from deps!
  }

}

// Special Component for ConnectedSubRenderer (submount a cle app to anoother cle app, but with a different mount point (html elemnt))
class SubRendererComponent extends Component{

  // intermediate step!
  setupMountPoint(html_mount_point){
    this.html_mount_point = html_mount_point
  }

  // @override step 2: DO NOT CREATE HTML EL ON PARENT, use mount point instead!
  buildHtmlPointerElement(){
    this.html_pointer_element = document.createElement(this.htmlElementType)

    this.html_mount_point.appendChild(this.html_pointer_element)

    this.html_pointer_element.setAttribute(this.t_uid, "")
  }

  static SubRendererComponentFactory($parent, html_mount_point, oj_definition, lazy=false){
    const maybeLazy = ()=>{
      const components_root = new SubRendererComponent($parent, oj_definition, $parent.$le, $parent.$dbus)
      components_root.setupMountPoint(html_mount_point)
      components_root.buildSkeleton()
      components_root.create()
      return components_root
    }
    return lazy ? maybeLazy : maybeLazy()
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

      this.html_pointer_element = document.createElement("leobj")

      if( this.meta_options.hasViewChilds ){
        
        this.html_pointer_element_anchor.after(this.html_pointer_element)
      }

    }
    else {

      this.html_pointer_element = document.createElement(this.htmlElementType)

      this.html_pointer_element_anchor.after(this.html_pointer_element)

      _info.log("Created after comment anchor!")

    }
    
    this.html_pointer_element.setAttribute(this.t_uid, "")

  }

  // real "create", wrapped in the conditional system
  _create(){
    _info.log("Start recreating: ", this)
    super.defineAndRegisterId()
    super.buildSkeleton()
    super.buildChildsSkeleton()
    super.create()
  }
  // @overwrite
  create(){
    this.buildPropertiesRef()
    // step 1: geenrate If property, and configure to create (that build) or destry component!
    this.visible = new Property(this.convertedDefinition.meta.if, none, (v, _, prop)=>{ _info.log("set: ", v, _, prop); if (v !== prop._latestResolvedValue) { v ? this._create() : this._destroy() } }, pass, ()=>this.$this, (thisProp, deps, externalDeps=[])=>{

      let depsRemover = []
      
      _info.log("LEIF - Calculating deps")
      // deps connection logic
      deps.$parent_deps?.forEach(d=>{
        let depRemover = this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        depRemover && depsRemover.push(depRemover)
      })

      deps.$scope_deps?.forEach(d=>{
        let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
        let depRemover = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ); // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
        depRemover && depsRemover.push(depRemover)
      })

      deps.$le_deps?.forEach(d=>{ // [le_id, property]
        let depRemover = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        depRemover && depsRemover.push(depRemover)
      })

      deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
        let depRemover = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        depRemover && depsRemover.push(depRemover)
      })


      deps.$ref_deps?.forEach(d=>{ // [refName, property]

        let depRemover;
        exponentialRetry(()=>{
          const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
          if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
          depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
        
        depsRemover.push(()=>depRemover())
      })

      
      externalDeps?.forEach(extDep=>{
        let depRemover = extDep?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        depRemover && depsRemover.push(depRemover)
      })
      

      return depsRemover
    }, true)

    _info.log("Last if condition: ", this, this.convertedDefinition.meta.if)
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



class IterableComponent extends Component{
  
  constructor(parent, definition, $le, $dbus, parentIterableView, iterableIndex, meta_config, meta_options, is_full_rebuild){
    super(parent, definition, $le, $dbus)

    this.parentIterableView = parentIterableView
    this.iterableIndex = iterableIndex
    this.meta_config = meta_config
    this.meta_options = meta_options
    this.is_full_rebuild = is_full_rebuild

    // now with the onSet it's possible to sync back to the original array the value!
    this.meta[this.meta_config.iterablePropertyIdentifier] = new Property(this.meta_config.value, none, 
      (v)=>{
        _info.log("META: push back value edit!"); 
        this.meta_config.define_helper.iterable[this.meta_config.define_helper.index]=v; 
        this.meta_options.metaPushbackAutomark && this.meta_config.realPointedIterableProperty.markAsChanged(); 
        this.signals[this.meta_config.iterablePropertyIdentifier+"Changed"].emit(v, this.meta[this.meta_config.iterablePropertyIdentifier]._latestResolvedValue); // NEW FOR REACT MASHUP: force to emit a xxxChanged also for meta vars..
      }, none, ()=>this.$this, none, true
    )
    if (this.meta_config.define !== undefined){
      // define:{ index:"idx", first:"isFirst", last:"isLast", length:"len", iterable:"arr" }
      Object.entries(this.meta_config.define).forEach(([define_var, dev_var_name])=>{
        if (define_var in this.meta_config.define_helper){
          this.meta[dev_var_name] = new Property(this.meta_config.define_helper[define_var], none, none, none, ()=>this.$this, none, true)
        }
        // altre var custom!
        else {
          const custom_definition = dev_var_name
          this.meta[define_var] = new Property(custom_definition, none, ()=>{ throw Error("meta define variable cannot be setted") }, none, [()=>this.parent.$this, ()=>this.$this], none, true)
          // todo: on destroy
        }
        _info.log("I have some 'define' inside meta!", this.meta, define_var, dev_var_name, this.meta_config.define)
      })
    }
    let manualMarkSignalName = "_mark_"+this.meta_config.iterablePropertyIdentifier+"_as_changed"
    this.meta[manualMarkSignalName] = ()=>this.meta[this.meta_config.iterablePropertyIdentifier].markAsChanged()
    let signalName = this.meta_config.iterablePropertyIdentifier+"Changed"
    this.signals[signalName] = new Signal(signalName, "stream => (newValue: any, oldValue: any) - property change signal")

    _info.log("before meta: ", this.$meta, this.parent.$meta, this.meta, this.parent.meta, this.parent)
    this.$meta = this.getMy$meta() // rebuild
    _info.log("after meta: ", this.$meta, this.parent.$meta, this.meta, this.parent.meta, this.parent)
  }

  // ridefinisco la crezione dell'html pointer, e definisco anche se devo autoeliminarmi..o ci pensa il parent
  // @overwrite, delegate html el construction to the Iterable View Hanlder (real parent)
  buildHtmlPointerElement(){

    this.parentIterableView.buildChildHtmlPointerElement(this, this.iterableIndex, this.is_full_rebuild)

  }
  // la destroy funziona già bene, perchè rimuoverò me stesso (pointer)..!

  updateDataRerencesAndMeta(newIterableIdx, newMetaConfig, skip_identifier_value=true){
    this.iterableIndex = newIterableIdx
    this.meta_config = newMetaConfig
    Object.entries(this.meta).forEach(([k,v])=>{
      if ( !(skip_identifier_value && k === this.meta_config.iterablePropertyIdentifier)){
        (v instanceof Property) && v?.markAsChanged() // force update
      }
    })
  }
}

class IterableViewComponent{
  iterableProperty
  iterablePropertyIdentifier

  parent
  $le
  $dbus

  oj_definition
  real_iterable_definition
  meta_def

  properties = {} // only for the "of" execution context, as child instead of parent!
  signals = {} // useless, only for consisentcy
  $this
  $parent

  childs = []

  html_pointer_element_anchor
  html_end_pointer_element_anchor

  real_pointed_iterable_property // = {markAsChanged: ()=>{}} // the "of" of as Property (not value) to be able to mark as changed!

  // step 1: build
  constructor(parent, definition, $le, $dbus){
    this.parent = parent
    this.$le = $le
    this.$dbus = $dbus

    this.oj_definition = definition
    this.meta_def = ((definition instanceof UseComponentDeclaration ? definition.computedTemplate : definition)[getComponentType(definition)]).meta
    this.real_iterable_definition = (definition instanceof UseComponentDeclaration ? definition.cloneWithoutMeta() : cloneDefinitionWithoutMeta(definition))
    this.meta_options = {
      isNewScope: this.meta_def?.newScope,
      noThisInScope: this.meta_def?.noThisInScope,
      noMetaInScope: this.meta_def?.noMetaInScope,
      hasViewChilds: this.meta_def?.hasViewChilds,
      metaPushbackAutomark: this.meta_def?.metaPushbackAutomark === undefined ? true : this.meta_def?.metaPushbackAutomark,
    }
    this.real_pointed_iterable_property = {markAsChanged: ()=>{}}
  }

  get$ScopedPropsOwner(prop, search_depth=0, noMetaInScope=false, searchInSignals=false){
    if(search_depth === 0){
      noMetaInScope = this.meta_options.noMetaInScope
    }

    if (this.parent === undefined || !(this.parent instanceof Component)){ // || this.parent instanceof IterableViewComponent)){
      return [this, true]
    }

    if (search_depth === 0 && this.meta_options.noThisInScope){ // salta il this e vai a parent..
      return this.parent.get$ScopedPropsOwner(prop, search_depth+1, noMetaInScope, searchInSignals)
    }

    if (prop in this.properties || (searchInSignals && prop in this.signals)){
      return [this, true]
    }
    else if (this.meta_options.isNewScope){
      throw Error("Properties cannot be found in this scope..blocked scope?")
    }
    else {
      return this.parent.get$ScopedPropsOwner(prop, search_depth+1, noMetaInScope, searchInSignals)
    }

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

  buildChildHtmlPointerElement(child, childIndex, is_full_rebuild){
    // create
    child.html_pointer_element = document.createElement(child.htmlElementType)
    
    // check insert position
    if (is_full_rebuild){
      this.html_end_pointer_element_anchor.before(child.html_pointer_element) 
    }
    else { 
      // child index to insert in right position
      if(childIndex === 0){
        this.html_pointer_element_anchor.after(child.html_pointer_element)
      }
      else {
        this.childs[childIndex-1].html_pointer_element.after(child.html_pointer_element)
      }
    }

    // setup uid
    child.html_pointer_element.setAttribute(child.t_uid, "")
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
    // Object.defineProperty( // dynamic get childs $this
    //   this.properties, 'childs', {get: ()=>this.childs.map(c=>c instanceof Component || c instanceof IterableViewComponent? c.$this.this : undefined).filter(c=>c!==undefined)}
    // )

    this.$parent = (this.parent instanceof Component) ? ComponentProxy(this.parent.properties) : undefined
    this.$scope = ComponentScopeProxy(this)
    this.$this = ComponentProxyBase({parent: this.$parent, le: this.$le.proxy, scope: this.$scope, ctx: this.parent.$ctx.proxy, meta: this.parent.$meta }) // qui $.u nonha senso di esister, visto che viene valutato usato solo per valutare la "of", quindi per cercare le deps. utils non serve!
  }

  detectChangesAndRebuildChilds(currentItems, oldItems){
    // keep track of wich items in the list have changed
    const changedItems = {}
    const currentChilds = this.childs

    const childComparer = this.meta_def.idComparer !== undefined && isFunction(this.meta_def.idComparer) ? this.meta_def.idComparer : (_new, _old)=> _new !== _old;

    // Compare each item in the current state with the corresponding item in the DOM
    for (let i = 0; i < currentItems.length; i++) {
      const item = currentItems[i];

      // check for new or changed
      if (currentChilds[i] === undefined || childComparer(item, currentChilds[i].meta_config.value)) {
        // If the item is new or has changed, add it to the list of changed items
        changedItems[i] = item;
      }
    }

    // Update the changed items in the DOM
    const iterableComponentsToInit = []
    
    for (const idx in changedItems) {
      const index = parseInt(idx)

      let newChild = new IterableComponent(
        this.parent, 
        this.real_iterable_definition, 
        this.$le, 
        this.$dbus, 
        this, 
        index, 
        {realPointedIterableProperty: this.real_pointed_iterable_property, iterablePropertyIdentifier: this.iterablePropertyIdentifier, value: currentItems[index], define: this.meta_def.define, define_helper: {index: index, first: index === 0, last: index === currentItems.length-1, length: currentItems.length, iterable: currentItems}}, 
        this.meta_options,
        false
      )

      if (currentChilds[index] === undefined) {
        // If the item is new, create a new element in the DOM and append it to the list
        currentChilds[index] = newChild
        newChild.buildSkeleton()
        iterableComponentsToInit.push(newChild)
      } else {
        // If the item has changed, recreate the element
        currentChilds[index].destroy()

        currentChilds[index] = newChild
        newChild.buildSkeleton()
        iterableComponentsToInit.push(newChild)
      }
    }


    // Check for deleted items in the DOM
    // _debug.log("new, old", currentItems, oldItems)
    if (currentItems.length < oldItems.length) {
      // If there are more items in the DOM than in the current state, remove the excess items from the DOM
      for (let i = currentItems.length; i < oldItems.length; i++) {
        currentChilds[i].destroy()
        currentChilds.splice(i,1)
      }
    }

    iterableComponentsToInit.forEach(i=>i.create())

    // _debug.log(this.childs)

    // update all childs meta (array, index, islast, etc)
    this.iterableProperty.value?.forEach((arrValue, idx, arr)=>{
      this.childs[idx].updateDataRerencesAndMeta(idx, {realPointedIterableProperty: this.real_pointed_iterable_property, iterablePropertyIdentifier: this.iterablePropertyIdentifier, value: arrValue, define: this.meta_def.define, define_helper: {index: idx, first: idx === 0, last: idx === arr.length-1, length: arr.length, iterable: arr}}, true)
    })

  }

  //@override, per utilizzare nella Factory this.parent come parent e non this. inoltre qui in realtà parlo dei children come entità replicate, e non i child del template..devo passare una versione del template senza meta alla component factory! altrimenti errore..
  // in realtà dovrebbe essere un "build child skeleton and create child"
  buildChildsSkeleton(rebuild_for_changes=false, latestResolvedValue=undefined){
    if (rebuild_for_changes && this.meta_def.optimized){
      this.detectChangesAndRebuildChilds(this.iterableProperty.value, latestResolvedValue)
    }
    else {
      this._destroyChilds()
  
      this.childs = (this.iterableProperty.value?.map((arrValue, idx, arr)=>new IterableComponent(this.parent, this.real_iterable_definition, this.$le, this.$dbus, this, idx, {realPointedIterableProperty: this.real_pointed_iterable_property, iterablePropertyIdentifier: this.iterablePropertyIdentifier, value: arrValue, define: this.meta_def.define, define_helper: {index: idx, first: idx === 0, last: idx === arr.length-1, length: arr.length, iterable: arr}}, this.meta_options, true)) || [] )
  
      // devo sicuramente fare una roba come per il conditional..un componente che estende component, perchè devo per forza gestire meglio la parte di append all'html pointer..
  
      this.childs.forEach(child=>child.buildSkeleton())
      this.childs.forEach(child=>child.create())
    }

  }

  _destroyChilds(){
    if (this.childs.length > 0){
      this.childs.map(c=>c.destroy())
      this.childs = []
    }
  }

  // real "create", wrapped in the conditional system
  _create(rebuild_for_changes=false, latestResolvedValue=undefined){
    _info.log("start recreating: ", this)
    this.buildChildsSkeleton(rebuild_for_changes, latestResolvedValue)
  }

  // @overwrite
  create(){

    // step 1: generate Of clausole property, and configure to create (build) or destry component!
    this.iterablePropertyIdentifier = this.meta_def.forEach

    this.iterableProperty = new Property(
      this.meta_def.of, 
      none, 
      (v, _, prop)=>{ 
        _info.log("set iterable", v, _, prop); 
        if (this.meta_def.comparer !== undefined){
          if (this.meta_def.comparer(v, prop._latestResolvedValue)) { 
              this._create(true, prop._latestResolvedValue) // rebuild_for_changes, latestResolvedValue
            }
        }
        else if (v !== prop._latestResolvedValue) { 
          this._create(true, prop._latestResolvedValue) // rebuild_for_changes, latestResolvedValue
        } 
      }, 
      pass, 
      // aggancio gli autoaggiornamenti della property per far in modo che la set vada a buon fine senza una "set" reale e diretta
      ()=>this.$this, (thisProp, deps, externalDeps=[])=>{
        let depsRemover = []
        _info.log("calculating deps")
        // deps connection logic
        deps.$parent_deps?.forEach(d=>{
          let depRemover = this.parent.properties[d]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          depRemover && depsRemover.push(depRemover)

          this.real_pointed_iterable_property.markAsChanged = ()=>{this.parent.properties[d]?.markAsChanged()}
        })

        deps.$scope_deps?.forEach(d=>{
          let [propsOwner, isPropertiesProp] = this.get$ScopedPropsOwner(d);
          let depRemover = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() ); // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
          depRemover && depsRemover.push(depRemover)

          this.real_pointed_iterable_property.markAsChanged = ()=>{(isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.markAsChanged()}
        }) // supporting multiple deps, but only of first order..

        deps.$le_deps?.forEach(d=>{ // [le_id, property]
          let depRemover = this.$le[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          depRemover && depsRemover.push(depRemover)

          this.real_pointed_iterable_property.markAsChanged = ()=>{this.$le[d[0]].properties[d[1]]?.markAsChanged()}
        })

        deps.$ctx_deps?.forEach(d=>{ // [le_id, property]
          let depRemover = this.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          depRemover && depsRemover.push(depRemover)

          this.real_pointed_iterable_property.markAsChanged = ()=>{this.$ctx[d[0]].properties[d[1]]?.markAsChanged()}
        })


        deps.$ref_deps?.forEach(d=>{ // [refName, property]

          let depRemover;
          exponentialRetry(()=>{
            const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
            if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
            depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
          depsRemover.push(()=>depRemover())

          this.real_pointed_iterable_property.markAsChanged = ()=>{this.getChildsRefOwner(d[0]).childsRefPointers[d[0]].properties[d[1]].markAsChanged()}
        })


        externalDeps?.forEach(extDep=>{
          let depRemover = extDep?.addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          depRemover && depsRemover.push(depRemover)

          this.real_pointed_iterable_property.markAsChanged = ()=>{extDep?.markAsChanged()}
        })
        
        return depsRemover
      }, 
      true
    )

    _info.log("last of condition: ", this, this.meta_def.of)
    
    // try {
    this.iterableProperty.value.length > 0 && this._create(false, undefined) // rebuild_for_changes, latestResolvedValue
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


// export 
const Case = (clausole, definition)=>{ 

  let componentType = getComponentType(definition)
    
  let {meta, ...oj_definition_no_meta} = definition[componentType]
  return {[componentType]: { meta: {if: clausole}, ...oj_definition_no_meta }}

}
// export 
/*
const x = { div: {
  "=>":[
    { h6: { text: "hello" }},

    ...Switch(
      Case( $=>$.parent.var1===0,
        { span: { text: "i'm var 1!!"}}
      ),
      Case( $=>$.parent.var1!==0,
        { span: { text: "i'm var 1 not 0!!"}}
      )
    )
  ]
}}*/
const Switch = (...conditions)=>{
  return conditions
}



// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// DYNAMIC JS/CSS LOADING -- TESTING --
// TODO: TEST!!!! assolutamente temporaneo..importato da LE originale
const _init_LE_Loaded_Sentinel_ = ()=>{ if (window._Caged_LE_Loaded === undefined){ window._Caged_LE_Loaded = {} } }
/** 
 * Dynamic JS Loading
 * - When resolved the loaded script HTMLEL is returned, so you can remove the js from the page at any time with ".LE_removeScript()"
 * - alternatively you can remove using document.querySelector('[src="..CSS_URL.."]').LE_removeStyle()
 * NOTE: remotion does not have any effect without a "destructor" tht clean all vars etc in window and so on, because once a script is loaded it's keept in ram forever (also if .removed)
*/
// export 
const LE_LoadScript = (url, {do_microwait=undefined, attr={}, scriptDestructor=()=>{}, debug=false}={})=>{
    _init_LE_Loaded_Sentinel_()

    return new Promise(function(resolve, reject) {
        
        if (window._Caged_LE_Loaded[url] !== undefined){
            debug && _info.log("js already loaded!")
            if (do_microwait !== undefined){ setTimeout(() => { resolve(window._Caged_LE_Loaded[url]) }, do_microwait); }
            else{ resolve(window._Caged_LE_Loaded[url]) }
            return;
        }

        let script = document.createElement("script");
        
        script.onload = (e)=>{
            window._Caged_LE_Loaded[url] = script; 
            script.LE_removeScript = ()=>{window._Caged_LE_Loaded[url].remove(); scriptDestructor(); delete window._Caged_LE_Loaded[url] } 
            debug && _info.log("resolved!", e)
            if (do_microwait !== undefined){ setTimeout(() => { resolve(window._Caged_LE_Loaded[url]) }, do_microwait); }
            else{ resolve(window._Caged_LE_Loaded[url]) }
        };
        script.onerror = reject;
        
        script.setAttribute('src', url);
        Object.keys(attr).map(k=>script.setAttribute(k, attr));

        document.head.appendChild(script);
    });
}
/** 
 * Dynamic Css Loading
 * - When resolved the loaded css HTMLEL is returned, so you can remove the style from the page at any time with ".LE_removeStyle()"
 * - alternatively you can remove using document.querySelector('[href="..CSS_URL.."]').LE_removeStyle()
*/
// export 
const LE_LoadCss = (url, {do_microwait=undefined, attr={}, debug=false}={})=>{
    _init_LE_Loaded_Sentinel_()

    return new Promise(function(resolve, reject) { 
        
        if (window._Caged_LE_Loaded[url] !== undefined){
            _info.log("css already loaded!")
            if (do_microwait !== undefined){ setTimeout(() => { resolve(window._Caged_LE_Loaded[url]) }, do_microwait); }
            else{ resolve(window._Caged_LE_Loaded[url]) }
            return;
        }

        let s = document.createElement('link');
        
        s.setAttribute('rel', 'stylesheet');
        s.setAttribute('href', url);
        Object.keys(attr).map(k=>s.setAttribute(k, attr));

        s.onload = (e)=>{
            window._Caged_LE_Loaded[url] = s;
            debug && _info.log("resolved!", e)
            s.LE_removeStyle = ()=>{window._Caged_LE_Loaded[url].remove(); delete window._Caged_LE_Loaded[url] } 
            if (do_microwait !== undefined){ setTimeout(() => { resolve(window._Caged_LE_Loaded[url]) }, do_microwait); }
            else{ resolve(window._Caged_LE_Loaded[url]) }
        };
        s.onerror = reject;
            
        document.head.appendChild(s);
    })
}
// export 
const LE_InitWebApp = (appDef)=>{ document.addEventListener("DOMContentLoaded", appDef ) }
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

// export
/**
 * @returns {($)=>any}
 * */
const smartFunc = (code, funcCall=false, ...oterArgs)=>{
  if (!funcCall) { code = code[0] }
  code=code.replaceAll("@m.", "$.meta.").replaceAll("@s.", "$.scope.").replaceAll("@p.", "$.parent.").replaceAll("@t.", "$.this.").replaceAll("@l.", "$.le.").replaceAll("@c.", "$.ctx.").replaceAll("@d.", "$.dbus.").replaceAll("@", "$.scope.")
  code=code.replaceAll(":m:", "$.meta.").replaceAll(":s:", "$.scope.").replaceAll(":p:", "$.parent.").replaceAll(":t:", "$.this.").replaceAll(":l:", "$.le.").replaceAll(":c:", "$.ctx.").replaceAll(":d:", "$.dbus.").replaceAll(":::", "$.meta.").replaceAll("::", "$.scope.")
  if (code.includes("return") || code.startsWith("{")){
    return new Function("$", ...oterArgs, code)
  } else {
    return new Function("$", ...oterArgs, "return "+code)
  }
}

const smartFuncWithCustomArgs = (...oterArgs)=>{
  return (code, funcCall=false)=>smartFunc(code, funcCall, ...oterArgs)
}

/** define usable func into properties, without changes detection deps analyasis! not suitable to be used for change detection.. */
const asFunc = (f)=>{
  return $=>f.bind(undefined, $)
}
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 


/*
class TodoModelApiMock extends LE_BackendApiMock{
  constructor(apiSpeed=100){
    super(apiSpeed)
    this.model = { todos: [ { id: 0, todo:"hi", done: false } ] }
    this.services = {
      "/num-todos": ()=>{return {len: this.mode.todos.length} }
    }
  }
  getTodo(args){
    let {id} = this.request(args)
    return this.response(this.model.todos.find(t=>t.id === id))
  }
}
let todoModelApi = new TodoModelMockApi()
setTimeout(async ()=>{
  console.log("calling..")
  let res = await todoModelApi.getTodo({id: 0})
  console.log(typeof res, res)
}, 10)
*/
// export 
class LE_BackendApiMock{ // base class for backend api mock -> purpose is to have a "model" and some api call (wrapped), with some jsonization, to avoid "refernece" effect
  
  constructor(apiSpeed=100){
    this.services = {}
    this.apiSpeed = apiSpeed
  }
  
  response(value){
    return new Promise((resolve, reject)=>{setTimeout(()=>resolve(JSON.parse(JSON.stringify(value))), this.apiSpeed) })
  }
  failResponse(error){
    return new Promise((resolve, reject)=>{setTimeout(()=>reject(JSON.parse(JSON.stringify(error))), this.apiSpeed) })
  }
  request(value){
    if (value !== undefined)
      return JSON.parse(JSON.stringify(value))
    return undefined
  }

  // only json..
  get(route, params){ return this.response(this.services[route](this.request(params))) }
  post(route, data){ return this.response(this.services[route](this.request(data))) }
  put(route, data){ return this.response(this.services[route](this.request(data))) }
}

// export 
/** Syntactic Sugar to define component using cle.div({ DEFINITION }, ...CHILDS), instead of normal object.*/
const cle = new Proxy({}, {
  get: (_target, prop, receiver)=>{ return (args_dict, ...childs)=>( args_dict===undefined && childs.length === 0 ? {[prop]: {}} : (typeof args_dict === "string" || typeof args_dict ==="function" ? {[prop]: args_dict} : {[prop]:{...args_dict, ...(childs.length ? {'':childs} : {}) }}) ) },
  set: function(_target, prop, value) {}
})

// export 
// fast define string (without "") with this function, e.g to assign id { id: str.app }
const str = new Proxy({}, { get: (_, prop, __)=>{ return prop },set: function(_target, prop, value) {} })
// export 
// fast define string (without "") with this function with "_" as " ", eg to: { button: { text: str_.inc_counter }}
const str_ = new Proxy({}, { get: (_, prop, __)=>{ return prop.replaceAll("_", " ")  },set: function(_target, prop, value) {} })

// export
const input = (def, val) => ({['let_'+def]:val})
// export
const output = (sig_name, def='stream => void') =>({['s_'+sig_name]:def})

// export // lang utils to chain class using condition, eg: class: "cls1" + clsIf($.this.condition, 'cls2', 'cls3')
const clsIf = (condition, clsTrue, clsFalse='')=>condition ? ' '+clsTrue : clsFalse
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

// EXPERIMENTAL: from html-like template!
function stringWithOnlySpaces(str) {
  return /^\s*$/.test(str);
}
const htmlConverterHookRemap = {
  beforeinit: 'beforeInit',
  oninit: 'onInit',
  afterchildsinit: 'afterChildsInit',
  afterinit: 'afterInit',
  ondestroy: 'onDestroy',
  constructor: 'constructor',
}
const resolveAndConvertHtmlElement = (element, tagReplacers, extraDefs )=>{
  // console.log("parsing: ", element)
  if (element.nodeType === 8){ // is a comment, skip
    return undefined
  }

  if (element.nodeName === "#text"){
    let text = element.textContent
    
    if (stringWithOnlySpaces(text)){
      return undefined
    }

    if (text.startsWith("{{")){
      return smartFunc(text.replace("{{", "").replace("}}", ""), true)
    } 
    else {
      return text
    }
  }
  else {
    let tag = element.tagName.toLowerCase()

    const properties = {}
    const signals = {}
    const on_handlers = {}
    const attributes = {}
    const dynamic_attributes = {}
    const hattributes = {}
    const dynamic_hattributes = {}
    const handlers = {}
    const meta = {}
    const hooks = {}

    let extra_def_id = undefined

    for (let attr of element.attributes || []){
      
      // extra/external def
      if (attr.name === "extra-defs"){
        extra_def_id = attr.value
      }
      // meta
      else if (attr.name.startsWith("meta-")){
        let name = attr.name.substring(5)
        if (name === "foreach"){
          let [foreach_var, of_clausole] = attr.value.split(" of ")
          meta.forEach = foreach_var
          meta.of = smartFunc(of_clausole, true)
        }
        else if (name === "if"){
          meta.if = smartFunc(attr.value, true)
        }
        else if (name === "optimized"){
          meta.optimized = attr.value==='true'
        }
        else if (name.startsWith("define-")){
          name = name.substring(7)
          if (meta.define === undefined){
            meta.define = {}
          }
          meta.define[name] = attr.value
        }
        else {
          console.log("UNSUPPORTED AT THIS TIME: ", attr)
        }
      }
      // hooks
      else if (attr.name.startsWith("hook-")){
        // todo, risolvere problema per cui gli attr arrivano lowercase
        let name = htmlConverterHookRemap[attr.name.substring(5)]
        hooks[name] = smartFunc(attr.value, true)
      }
      // standard signal definition
      else if (attr.name.startsWith("signal-")){
        let name = attr.name.substring(7)
        signals["signal_"+name] = attr.value || "stream => void"
      }
      // signals handlers 
      else if (attr.name.startsWith("(on-") && attr.name.endsWith("-changed)")){
        let name = attr.name.substring(4, attr.name.length-9) // for property changes..always dash-case
        let value = smartFuncWithCustomArgs("newValue", "oldValue")(attr.value, true)
        // console.log(attr, name, value, "on_scope_"+name+"Changed")
        on_handlers["on_"+name+"Changed"] = value
      }
      // dbus handlers
      else if (attr.name.startsWith("(on-dbus-")){
        let name = attr.name.substring(9, attr.name.length-1)
        let value = smartFuncWithCustomArgs("$val", "$val1", "$val2", "$val3", "$val4", "$val5", "$val6", "$val7", "$val8", "$val9")(attr.value, true)
        // console.log(attr, name, value)
        on_handlers["on_dbus_"+name] = value
      }
      // properties change handlers 
      else if (attr.name.startsWith("(on-")){
        let name = attr.name.substring(4, attr.name.length-1)
        let value = smartFuncWithCustomArgs("$val", "$val1", "$val2", "$val3", "$val4", "$val5", "$val6", "$val7", "$val8", "$val9")(attr.value, true)
        // console.log(attr, name, value)
        on_handlers["on_"+name] = value
      }
      // handlers (onclick)
      else if (attr.name.startsWith("(")){
        let name = attr.name.substring(1, attr.name.length-1)
        let value = smartFuncWithCustomArgs("evt")(attr.value, true)
        handlers["h_"+name] = value
      }
      // standard properties
      else if (attr.name.startsWith("let-") || attr.name.startsWith("set-")){
        let name = attr.name.substring(4)
        properties["let_"+name] = attr.value
      }
      // evaluable properties
      else if (attr.name.startsWith("[let-") || attr.name.startsWith("[set-")){
        // todo, risolvere problema per cui gli attr arrivano lowercase
        let name = attr.name.substring(5, attr.name.length-1)
        properties["let_"+name] = smartFunc(attr.value, true)
      }
      // dynamc hattrs [ha-style.color]="$.xxx + 'px'" or camel case properties using dash-case
      else if (attr.name.startsWith("[ha-")){
        let name = attr.name.substring(4, attr.name.length-1)
        if (name.includes("-")){ // specific for subproperties where camel case should be mantained: [ha-style.font-size]="$.xxx + 'px'". (must convert dash-case to camelCase)
          name = name.split(".").map(subname=>subname.split("-").map((word, i)=> i===0 ? word : word.charAt(0).toUpperCase()+word.substring(1)).join("")).join(".") // convert in camelCase, each .xxx-yyy subproperty in .xxxYyy
        }
        let value = smartFunc(attr.value, true)
        dynamic_hattributes["ha_"+name] = value
      }
      // standard hattributes
      else if (attr.name.startsWith("ha-")){
        let name = attr.name.substring(3)
        hattributes["ha_"+name] = attr.value
      }
      // dynamc attrs [style]="$.xxx + 'px'"
      else if (attr.name.startsWith("[")){
        let name = attr.name.substring(1, attr.name.length-1)
        let value = smartFunc(attr.value, true)
        dynamic_attributes["a_"+name] = value
      }
      // standard attributes
      else {
        attributes["a_"+attr.name] = attr.value
      }
    }

    const parsedDef = {
      ...attributes, 
      ...dynamic_attributes, 
      ...hattributes, 
      ...dynamic_hattributes, 
      ...handlers, 
      ...hooks, 
      ...properties, 
      ...signals, 
      ...on_handlers,
      ...(meta? {meta: meta} : {}),

      ...(extra_def_id !== undefined && extra_def_id in extraDefs ? extraDefs[extra_def_id] : {})
    }
    
    if (tag.startsWith("use-") && tag.substring(4) in tagReplacers){
      return Use(tagReplacers[tag.substring(4)], {...parsedDef})
    }
    else if (tag.startsWith("extended-") && tag.substring(9) in tagReplacers){
      return Extended(tagReplacers[tag.substring(9)], {...parsedDef})
    }
    else {
      const children = Array.from(element.childNodes).map(c=>resolveAndConvertHtmlElement(c, tagReplacers, extraDefs)).filter(c=>c !== undefined)
      return { [tag]: {...parsedDef, "=>": children}}
    }
  }
}
// export - convert and generate cle components from html string and a definition and component tag-replacer. extraDefs to add xtra definition vai obj, using a template id in template and as key in extraDefs
const fromHtml = (text, definition={}, tagReplacers={}, extraDefs={})=>{
  const dp = new DOMParser()

  let elements = dp.parseFromString(text, 'text/html').body
  // console.log(elements)

  let root = {}

  if (elements.childNodes.length === 0){
    throw Error("No html found")
  }
  else{
    let children = Array.from(elements.childNodes).map(c=>resolveAndConvertHtmlElement(c, tagReplacers, extraDefs)).filter(c=>c !== undefined) 
    // console.log("child", children)
    if (children.length === 1){
      let tag = Object.keys(children[0])[0]
      root = { [tag] : {...definition, ...children[0][tag]}}
    }
    else{
      root = { 'multi': {...definition, "=>": children }}
    }
  }

  return root
}


// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

export { pass, none, smart, smartFunc as f, smartFuncWithCustomArgs as fArgs, asFunc, Use, Extended, Placeholder, Bind, Alias, SmartAlias, PropertyBinding, ExternalProp, useExternal, BindToPropInConstructor as BindToProp, Switch, Case, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, cle, str, str_, input, output, ExtendSCSS, clsIf, fromHtml as html }
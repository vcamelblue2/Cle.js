/* export */
const CLE_FLAGS = {
  LOG_DEBUG_ENABLED: false,
  LOG_INFO_ENABLED: false,
  LOG_WARNING_ENABLED: true,

  PROPERTY_OPTIMIZATION: true,
  
  REMOTE_HTML_V2_AUTOSTYLE: true,
  
  COMPONENT_REGISTRY_BASE_HTML_EL: 'div',

  DEFAULTS: {
    META: {
      FULL_OPTIMIZED: false,
      PUSHBACK_AUTOMARK: true,
    }
  }
}

const _debug = { log: (...args)=> CLE_FLAGS.LOG_DEBUG_ENABLED && console.log(...args) }
const _info = { log: (...args)=> CLE_FLAGS.LOG_INFO_ENABLED && console.log(...args) }
const _warning = { log: (...args)=> CLE_FLAGS.LOG_WARNING_ENABLED && console.log(...args) }

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

const dashCaseToCamelCase = (str) => {
  return str.split("-").map((word, idx) => idx === 0 ? word : (word.charAt(0).toUpperCase() + word.substring(1))).join("")
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
const exponentialRetry = (func, args=[], customResAsFunc=undefined, resultObj={expRetryObj: true}, msgonerr="", maxNumRetry=maxNumRetry, onDone=undefined, onError=undefined, num_retry=0)=>{

  try{
    resultObj.result = func(...args)
    onDone !== undefined && onDone(num_retry === 0, resultObj.result) // args: firstTry, result
  }
  catch (e){
    if (num_retry < maxNumRetry) {
      setTimeout(()=>exponentialRetry(func, args, customResAsFunc, resultObj, msgonerr, maxNumRetry, onDone, onError, num_retry+1), Math.min(10*(num_retry+1), maxNumRetry))
    }
    else{
      _warning.log("CLE - WARNING! unable to execute after 5 retry! "+msgonerr)
      _warning.log(e)
      onError !== undefined && onError(num_retry, e, resultObj.result)
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
    this.cachingComparer = (typeof cachingComparer === 'boolean') && (cachingComparer === true) ? ((n,o)=>n!==o) : cachingComparer // AKA is different? (newVal, oldVal)=>bool
    this.externalDeps = externalDeps

    this.isExternal = this.externalDeps !== undefined && this.externalDeps.length > 0
  }
}
// export
/** 
 * cachingComparer can be also setted to true to enable caching with default straegy 
 * comparer should check ineqaulity: return true if different and false if equals
 * */
const Alias = (getter=()=>{}, setter=()=>{}, markAsChanged=()=>{}, cachingComparer, onChangesRegisterFunc, externalDeps)=>new PropAlias(getter, setter, markAsChanged, cachingComparer, onChangesRegisterFunc, externalDeps)
// export
/** 
 * cachingComparer can be also setted to true to enable caching with default straegy
 * comparer should check ineqaulity: return true if different and false if equals
 * */
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
/** usage: 
 * ...DefineSubprops("todo", ["desc", "done"]) 
 * ...DefineSubprops("todo", "desc, done") 
 * ...DefineSubprops("todo => desc, done") 
 * comparer should check ineqaulity: return true if different and false if equals
 * */
const DefineSubprops = (scope_prop="", subprops="", prefix="", comparers={})=>{

  if (scope_prop.includes("=>")){
    return DefineSubprops(...scope_prop.split("=>").map(v=>v.trim()), prefix, comparers)
  }

  let definition = {}
  
  if (typeof subprops === 'string'){
    subprops = subprops.split(",").map(sp=>sp.trim())
  }

  subprops.forEach(sp=>{
    definition["let_"+prefix+sp] = new PropAlias(
      smartFunc("@"+scope_prop+"."+sp, true),
      smartFuncWithCustomArgs("v")("{ "+"@"+scope_prop+"."+sp+" = v; "+"$._mark_"+scope_prop+"_as_changed(); return v }", true), 
      pass,
      comparers[sp] ?? true
    ) // SmartAlias("@"+scope_prop+"."+sp, comparers[sp] ?? true)
  })

  return definition
}

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
    this.mustRetriveRealValue = true
    this.lastRetrivedRealValue = undefined
    this.setupRetriverFunc()

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
    this.setupRetriverFunc()

    this._onGet = onGet
    this._onSet = onSet
    this._onDestroy = onDestroy

    this._latestResolvedValue = undefined
    this._valueFunc = valueFunc
    this.__analyzeAndConnectDeps()

    this.mustRetriveRealValue = true
    this.lastRetrivedRealValue = undefined
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
    return this.retriver_func()
  }

  get value(){
    try{this._onGet()}catch(e){_warning.log("CLE - WARNING: the onGet is undefined! (ERROR)", e, this)}
    // this._onGet() // this._onGet?.()
    return this.__getRealVaule()
  }
  set value(v){
    this.mustRetriveRealValue = true
    this.lastRetrivedRealValue = undefined
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
      this.setupRetriverFunc()
      this._valueFunc = v
      this.__analyzeAndConnectDeps()
      let _v = this.__getRealVaule()
      this._onSet(_v, v, this)
      this.fireOnChangedSignal()
      this._latestResolvedValue = _v // in this way during the onSet we have the latest val in "_latestResolvedValue" fr caching strategy
    }
  }
  setupRetriverFunc(){
    if(CLE_FLAGS.PROPERTY_OPTIMIZATION){
      if (this.isFunc){
        this.retriver_func = () => {
          if (this.mustRetriveRealValue){
            this.lastRetrivedRealValue = this._valueFunc(...this.executionContext.map(ec=>ec()))
            this.mustRetriveRealValue = false
          }
          return this.lastRetrivedRealValue
        }
      }
      else {
        this.retriver_func = () => this._valueFunc;
      }
    }
    else {
      this.retriver_func = this.isFunc ? 
        ()=>this._valueFunc(...this.executionContext.map(ec=>ec())) 
        : 
        ()=>this._valueFunc;
    }

  }
  // manually, useful for deps
  markAsChanged(){
    _debug.log("marked as changed!", this)
    this.mustRetriveRealValue = true
    this.lastRetrivedRealValue = undefined
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
    let v = this.__getRealVaule()
    this.onChangedHandlers.forEach(h=>h.handler(v, this._latestResolvedValue))
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

  // utils per quando si aggancia ai segnali di una prop che però è un alias/smartalias/subprop è necessario controllare che se è cachabile non triggero il segnale se non è veramente cambiata!
  isCachable(){ 
    return this.isAlias && this.oj_valueFunc.cachingComparer !== undefined
  }
  isCacheInvalid(v){
    return this.oj_valueFunc.cachingComparer(v, this._latestResolvedValue) // comparer return true if different and false if equals
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
  emitWaitResp(...args){
    return this.handlers.map(h=>h.handler(...args))
  }
  emitWaitFirstToResp(...args){
    for (let h of this.handlers){
      const resp = h.handler(...args)
      if (resp !== undefined){
        try {
          return { consumer: h.who.$this, response: resp}
        }
        catch {
          return { consumer: h.who, response: resp}
        }
      }
    }
    return undefined
  }
  emitWaitRespCondition(condition, ...args){
    for (let h of this.handlers){
      const resp = h.handler(...args)
      if (condition(resp)){
        try {
          return { consumer: h.who.$this, response: resp}
        }
        catch {
          return { consumer: h.who, response: resp}
        }
      }
    }
    return undefined
  }

  awaitSignalFired(who, condition=()=>true, timeout=undefined){

    let timeout_handler = undefined;
    let cancelTimeoutHandler = ()=>{ if (timeout !== undefined) { clearTimeout(timeout_handler); timeout_handler = undefined; } };

    return new Promise((resolve, reject)=>{

      // set timeout (if any)
      if (timeout) { timeout_handler = setTimeout(()=>{reject({error: "TIMEOUT"})}, timeout) }

      this.addHandler(who, (...values)=>{
        if (condition === undefined || condition(...values)){
          cancelTimeoutHandler()
          this.removeHandler(who)
          resolve(...values)
        }
      })
    })
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
  static getSignalProxy = (realSignal)=> ( {
    emit: (...args)=>realSignal.emit(...args), 
    emitWaitResp: (...args)=>realSignal.emitWaitResp(...args), 
    emitWaitFirstToResp: (...args)=>realSignal.emitWaitFirstToResp(...args), 
    emitWaitRespCondition: (condition, ...args)=>realSignal.emitWaitRespCondition(condition, ...args), 
    emitLazy: (t=1, ...args)=>setTimeout(() => {realSignal.emit(...args)}, t), 
    subscribe: (who, handler) => realSignal.addHandler(who, handler), 
    unsubscribe: (who) => realSignal.removeHandler(who),
    /*await*/ signalFired: async (condition=()=>true, timeout=undefined) => await realSignal.awaitSignalFired({}, condition, timeout),
  })

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
const Use = (component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined, inject=undefined}={}, extraChilds=[])=>{ return new UseComponentDeclaration(component, redefinitions, { strategy:strategy, init:init, passed_props:passed_props, inject: inject }, extraChilds ) } // passed_props per puntare a una var autostored as passed_props e seguirne i changes, mentre init args per passare principalmente valori (magari anche props) ma che devi elaborare nel construct
// todo: qui potrebbe starci una connect del signal con autopropagate, ovvero poter indicare che propago un certo segnale nel mio parent! subito dopo la redefinitions, in modo da avere una roba molto simile a quello che ha angular (Output) e chiudere il cerchio della mancanza di id..
// di fatto creiamo un nuovo segnale e lo connettiamo in modo semplice..nel parent chiamo "definePropagatedSignal"
// perdo solo un po di descrittività, in favore di un meccanismo comodo e facile..

// nella init il punto di vista del this E' SEMPRE IL MIO PARENT

class UseComponentDeclaration{
  constructor(component, redefinitions=undefined, { strategy="merge", init=undefined, passed_props=undefined, inject=undefined }={}, extraChilds=[]){
    this.component = component // Todo: e se voglio ridefinire un componente già Use??
    this.init = init
    this.passed_props = passed_props
    this.redefinitions = redefinitions
    // assert strategy in "merge" | "override"
    this.strategy = strategy

    this.inject = inject

    this.extraChilds = Array.isArray(extraChilds) ? extraChilds : [extraChilds]

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
        const direct_lvl = ["id", "ctx_id", "ctx_ref_id", "constructor", "beforeInit", "onInit", "afterChildsInit", "afterInit", "onUpdate", "onDestroy", "oos"] // direct copy
        const first_lvl = ["signals", "dbus_signals", "data", "private:data", "props", "private:props", "let", '@input', "alias", "handle", "when", "directives"] // on first lvl direct
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
    const recursive_check_childs_injection = (resolved_component, lvl=0) =>{
      // _debug.log("Level: ", lvl, resolved_component)

      if ((typeof resolved_component === "function") || (typeof resolved_component === "string") || (resolved_component instanceof UseComponentDeclaration) ){
        // _debug.log("Level: ", lvl, "not a component")
        return resolved_component
      }
      else {
        let ctype = getComponentType(resolved_component)
        let oj_cdef = resolved_component[ctype]

        // check for zero-import-components
        if (ComponentsRegistry.has(ctype)){ 
          return resolved_component
        }
        
        // handle smart definition, like: {h3: "..."} or {h3: ["...", ...]}
        if ((typeof oj_cdef === "function") || (typeof oj_cdef === "string") || Array.isArray(oj_cdef)){ // shallow copy def
          // _debug.log("Level: ", lvl, "not a component def")
          
          // resolve array childs, if any
          if (Array.isArray(oj_cdef)){
            oj_cdef = oj_cdef.map(child=>recursive_check_childs_injection(child, lvl+1))
          }

          // insert extra childs on first lvl, if any!
          if (lvl === 0 && this.extraChilds.length > 0){
            // _debug.log("EXPANDING EXTRA CHILDS: ", this.component, cdef, this.extraChilds)
            if (Array.isArray(oj_cdef)){ // add to existing childs
              return {[ctype]: [...oj_cdef, ...this.extraChilds]}
            }
            else { // add to a new key
              return {[ctype]: [oj_cdef, ...this.extraChilds]}
            }
          }
          else {
            return {[ctype]: oj_cdef }
          }
        }

        // handle standard components
        let cdef = Object.assign({}, resolved_component[ctype]) // shallow copy def
        let childs_def_key = getUsedChildsDefTypology(cdef)
        
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
        
        // insert extra childs on first lvl, if any!
        if (lvl === 0 && this.extraChilds.length > 0){ // no childs defined, but we are in first lvl
          if (childs_def_key !== null){ // add to existing childs
            cdef[childs_def_key] = [...cdef[childs_def_key], ...this.extraChilds]
          }
          else { // add to a new key
            cdef[childs_def_typology[0]] = [...this.extraChilds]
          }
          // _debug.log("EXPANDING EXTRA CHILDS: ", this.component, cdef, this.extraChilds)
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
      cloneDefinitionWithoutMeta(this.component), redefinitions_no_meta, { strategy:this.strategy, init:this.init, passed_props:this.passed_props, inject:this.inject }, this.extraChilds
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
    // console.log("thiss", this)
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

const unifyChildsDef = (definition)=>{
  let { 'childs': childs, 'contains': childs_contains, 'text': childs_text, 'view': childs_view, ">>":childs_ff, "=>": childs_arrow, '_': childs_underscore, '': childs_empty } = definition
  // ['', "=>", "text", "_", ">>", "view", "contains", "childs"]
  let extracted_childs = [ 
    ...(childs_empty !== undefined ? (Array.isArray(childs_empty) ? childs_empty : [childs_empty]) : []), // todo, testare is array, altrimenti buggo le string etc
    ...(childs_arrow !== undefined ? (Array.isArray(childs_arrow) ? childs_arrow : [childs_arrow]) : []), 
    ...(childs_text !== undefined ? (Array.isArray(childs_text) ? childs_text : [childs_text]) : []), 
    ...(childs_underscore !== undefined ? (Array.isArray(childs_underscore) ? childs_underscore : [childs_underscore]) : []), 
    ...(childs_ff !== undefined ? (Array.isArray(childs_ff) ? childs_ff : [childs_ff]) : []), 
    ...(childs_view !== undefined ? (Array.isArray(childs_view) ? childs_view : [childs_view]) : []),
    ...(childs_contains !== undefined ? (Array.isArray(childs_contains) ? childs_contains : [childs_contains]) : []), 
    ...(childs !== undefined ? (Array.isArray(childs) ? childs : [childs]) : [])
  ];

  return extracted_childs.length > 0 ? extracted_childs : undefined
}

const childs_def_typology = ['', "=>", "text", "_", ">>", "view", "contains", "childs"] // reverse più probabilità..
const getUsedChildsDefTypology = (component_def => {
  for (let t of childs_def_typology) {
    if (t in component_def){
      return t
    }
  }
  return null
})

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
    // new: exclude  out of scope stuff "oos" from binding
    if (['oos', 'this', 'parent', 'scope', 'le', 'ctx', 'ref', 'meta', 'u'].includes(els[0])){ pass }
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

    // qui ci vuole una cosa molto semplice: metto una prop "_data" private vero container dei component, e un proxy che fa la get anche del "super" in ricorsione..su cui baso il proxy!

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
  ctx_id // private (or $ctx) id
  ctx_ref_id // id in the parent $ctx
  
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
  hooks_destructors = {} // destructor returned by onInit etc hook
  meta = {} // container of "local" meta variable (le-for)
  directives = {} // directives
  directives_hooks_destructors // [] directives destructors
  
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

  $oos // "out of scope" scope..container of anything dev want..untracked and not binded/bindable! accessible using $.oos


  htmlElementType
  isObjComponent
  html_pointer_element
  html_end_pointer_element // future use, per i componenti dinamici e liste..
  css_html_pointer_element
  s_css_html_pointer_element

  singlePropStyleRecomputeHooks = [] // handle ha_style.xxxx with also function a_style defined: when a_style is recomputed also ha_style.xxxx will be recomputed

  // step 1: build
  constructor(parent, definition, $le, $dbus){
    this.t_uid = ComponentTechnicalRUUIDGen.generate()

    this.isA$ctxComponent = ((definition instanceof UseComponentDeclaration) || !(parent instanceof Component))
    this.parent = parent
    this.isMyParentHtmlRoot = (parent instanceof HTMLElement) // && !((parent instanceof Component) || (parent instanceof UseComponentDeclaration)) // if false it is a parent HTML node

    this.oj_definition = definition

    this.htmlElementType = getComponentType(definition)
    this.isObjComponent = ["Model", "Controller", "Service", "service", "Component", "Connector", "Signals", "Style", "Css"].includes(this.htmlElementType)
    this.isPlaceholderPointerComponent = ["LazyPointer"].includes(this.htmlElementType)
    this.convertedDefinition = Component.parseComponentDefinition( (definition instanceof UseComponentDeclaration ? definition.computedTemplate : definition) [this.htmlElementType])
    this.meta_options = {
      isNewScope: this.convertedDefinition.meta?.newScope,
      noThisInScope: this.convertedDefinition.meta?.noThisInScope,
      noMetaInScope: this.convertedDefinition.meta?.noMetaInScope,
      hasViewChilds: this.convertedDefinition.meta?.hasViewChilds,
      metaPushbackAutomark: this.convertedDefinition.meta?.metaPushbackAutomark ?? CLE_FLAGS.DEFAULTS.META.PUSHBACK_AUTOMARK,
    } 

    this.$le = $le
    this.$dbus = $dbus
    this.$ctx = this.getMy$ctx()
    this.$meta = this.getMy$meta()


    this.defineAndRegisterId()

  }
  
  
  getMy$ctx(){ // as singleton/generator
    if(this.isA$ctxComponent){
      return this.$ctx ?? new ComponentsContainerProxy() // todo: i context devono vedere indietro..ovvero vedo anche i contesti dietro di me! devono essere inclusivi (a run time)
    }

    else{
      if (this.parent !== undefined && (this.parent instanceof Component)){
        return this.parent.getMy$ctx()
      }
      
      return undefined
    }
  }
  
  // utils to retrive my ctx cle-element (his this), usefull to setup deps etc
  getMy$ctxRoot(){
    if(this.isA$ctxComponent){
      return this
    }
    else{
      if (this.parent !== undefined && (this.parent instanceof Component)){
        return this.parent.getMy$ctxRoot()
      }
      return undefined
    }
  }
  // utils to retrive my parent-ctx cle-element (his this), usefull to setup deps etc
  getMy$ctxParentRoot(){
    if (this.parent !== undefined && (this.parent instanceof Component)){
      return this.getMy$ctxRoot().parent.getMy$ctxRoot()
    }
    return undefined
  }

  // todo: questa cosa potrebbe essere super buggata..perchè io in effetti faccio una copia delle var e non seguo più nulla..
  getMyFullMeta(){

    if(this.isMyParentHtmlRoot){
      return this.meta
    }

    else if (this.meta_options.isNewScope){
      _info.log("Component meta blocked scope:", this.meta, this.oj_definition, this)
      return this.meta
      // throw Error("Properties cannot be found in this meta..blocked scope?")
    }

    else{
      if (this.parent !== undefined && (this.parent instanceof Component)){
        return {...this.parent.getMyFullMeta(), ...this.meta}
      }
      
      return {}
    }

  }
  getMy$meta(){ // as singleton/generator
    if(this.isMyParentHtmlRoot){
      _info.log("Component meta:", this.meta, this.oj_definition, this)
      return ComponentProxy(this.meta)
    }

    else if (this.meta_options.isNewScope){
      _info.log("Component meta blocked scope:", this.meta, this.oj_definition, this)
      return ComponentProxy(this.meta)
      // throw Error("Properties cannot be found in this meta..blocked scope?")
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
    this.ctx_id = this.convertedDefinition.ctx_id
    this.ctx_ref_id = this.convertedDefinition.ctx_ref_id

    if (this.id !== undefined){
      // if (this.id in this.$le){ _warning.log("CLE - WARNING: Duplicated ID in LE, ", this.id) }
      // if (this.id in this.$ctx){ _warning.log("CLE - WARNING: Duplicated ID in CTX, ", this.id) }
      this.$le[this.id] = this
      this.$ctx[this.id] = this
    }
    if (this.ctx_id !== undefined){
      // if (this.ctx_id in this.$ctx){ _warning.log("CLE - WARNING: Duplicated ID in CTX, ", this.ctx_id) }
      this.$ctx[this.ctx_id] = this
    }

    // USE root in le e root in ctx per accedere alla root di tutto e alla root del context
    if(this.isMyParentHtmlRoot){
      this.$le["root"] = this
    }

    if(this.isA$ctxComponent){
      this.$ctx["root"] = this
    }

    // check if is a set name "in parent ctx" (only for ctx component not root of app)
    if(this.isA$ctxComponent && !this.isMyParentHtmlRoot && this.ctx_ref_id !== undefined){
      this.parent.$ctx[this.ctx_ref_id] = this
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
    else if (this.isPlaceholderPointerComponent){
      this.html_pointer_element = document.createComment("cleptr")

      if (this.isMyParentHtmlRoot){
        this.parent.appendChild(this.html_pointer_element)
      }
      else {
        this.parent.html_pointer_element.appendChild(this.html_pointer_element)
      }

      return;  // do not continue with attr setting

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
    this.properties.comp_ctx_id = this.ctx_id
    this.properties.comp_ctx_ref_id = this.ctx_ref_id
    this.properties.t_uid = this.t_uid
    // Object.defineProperty( // dynamic get childs $this
    //   this.properties, 'childs', {get: ()=>this.childs.map(c=>c instanceof Component || c instanceof IterableViewComponent? c.$this.this : undefined).filter(c=>c!==undefined)}
    // )
    this.properties.getOos = ()=>this.$oos
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
      get: (_, prop)=>{ return (action)=>{ action(this.$this.this[prop]);this.properties["_mark_"+prop+"_as_changed"]() }}, //better also if sacrify performance.. eg for Alias & co
      set: function() {}
    })
    this.properties.editArrRefVal = new Proxy({}, {
      get: (_, prop)=>(action)=>{ action(this.$this.this[prop]); this.$this.this[prop] = [...this.$this.this[prop]] },
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
    this.$this = ComponentProxyBase(/*new ComponentProxySentinel(*/{
      this: ComponentProxy(this.properties), 
      parent: this.$parent, 
      scope: this.$scope, 
      le: this.$le.proxy,
      ctx: this.$ctx.proxy, 
      dbus: this.$dbus.proxy, 
      meta: this.$meta, 
      ref: this.$ref, 
      oos: new Proxy({}, { get: (_, prop, __)=>{ return this.$oos[prop] }, set: (_target, prop, value) => {this.$oos[prop]=value; return true} }),
      u: this.getUtilsProxy()
    } /*)*/ ) //tmp, removed ComponentProxySentinel (useless)

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


      // block and await for property condition, then get value.. (instant get if true)
      // to be used to await for a prop! tester can be: function | array of values IN OR
      // onInit: async $=>{
      //   let ready = await $.u.propCondition($=>$.le.db, "readyProp", v=>v===true, 60*1000) [wait max 60sec]
      //   $.initData()
      // }
      /*await*/ propCondition: (scopeGetter, prop, tester=v=>(v !== null && v !== undefined), timeout=undefined, retry=5)=>{
        let sentinel = {}
        let timeout_handler = undefined
        let cancelTimeoutHandler = ()=>{ if (timeout !== undefined) { clearTimeout(timeout_handler); timeout_handler = undefined; } };
        return new Promise((resolve, reject)=>{
          // set timeout (if any)
          if (timeout) { timeout_handler = setTimeout(()=>{reject({error: "TIMEOUT"})}, timeout) }

          exponentialRetry(()=>{
            let scope = scopeGetter.bind(undefined, this.$this)()
            if (scope === undefined || scope === null){ throw Error("Cannot Find Scope") }
            else {
              let val = scope[prop]
              if ((isFunction(tester) && tester(val)) || (Array.isArray(tester) && tester.includes(val))){
                cancelTimeoutHandler()
                resolve(val)
              } else {
                let unsub = scope.subscribe(prop+"Changed", sentinel, (v)=>{
                  if ((isFunction(tester) && tester(v)) || (Array.isArray(tester) && tester.includes(v))){
                    // console.log("prop initialzed")
                    unsub()
                    cancelTimeoutHandler()
                    resolve(v)
                  }
                })
              }
            }
          }, pass, pass, pass, "Cannot connect to CLE Prop", retry, pass, (...args)=>{ cancelTimeoutHandler(); return reject(args) })
        })
      },

      /*await*/ signalFired: (scopeGetter, signal, condition=v=>true, timeout=undefined, retry=5)=>{
        return new Promise((resolve, reject)=>{
          exponentialRetry(()=>{
            let scope = scopeGetter.bind(undefined, this.$this)()
            if (scope === undefined || scope === null){ throw Error("Cannot Find Scope") }
            else { scope[signal].signalFired(condition, timeout).then((...res)=>resolve(...res)).catch(err=>reject(err)) }
          }, pass, pass, pass, "Cannot connect to CLE Signal", retry, pass, (...args)=>reject(args))
        })
      },

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
      // mode can be: "append" | "before" | "after"
      newConnectedSubRenderer: (html_mount_point, oj_definition, lazy=false, mode="append")=>{
        if (html_mount_point === undefined){
          html_mount_point = this.html_pointer_element
        }
        return SubRendererComponent.SubRendererComponentFactory(this, html_mount_point, oj_definition, lazy, mode)
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

    // setup directives space 
    if (this.convertedDefinition.directives !== undefined) {
      // convert   directives: { myDirective: {onInit: ...}}   =>   directives: { onInit: [...]}
      Object.entries(this.convertedDefinition.directives).forEach(([dir,dir_space])=>{
        Object.entries(dir_space).forEach(([key,val])=>{
          if (key in this.directives){
            this.directives[key].push(val)
          } else {
            this.directives[key] = [val]
          }
        })
      })
      // init hook destructrs 
      this.directives_hooks_destructors = []
    }

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

    if (this.convertedDefinition.oos !== undefined){
      // declare as a function to have a personal obj per-instance, otherwhise it will be shared between all instances!
      this.$oos = isFunction(this.convertedDefinition.oos) ? (this.convertedDefinition.oos.bind(this.$this, this.$this)()) : this.convertedDefinition.oos
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
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5)
                depsRemover.push((...args)=>{depRemover(...args); handler_remover()})
              })
    
              deps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5)
                depsRemover.push((...args)=>{depRemover(...args); handler_remover()})
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
          this.handlerRemover.push(remover)
        } 
        else if ( typeof v === 'function'){
          let remover = this.html_pointer_element.addEventListener(k, (...e)=>v.bind(undefined, this.$this, ...e)())
          this.handlerRemover.push(remover)
        }
      })
    }

    // handle INPUT DATA / PARAMS (aka variable defined with "parent" scope in mind. eg: A whan to pass to B the prop x, a call that $.scope.x, but for B is "$.(parent)scope.x". this is a syntactic sugar for automagically make it work)
    if (this.convertedDefinition.input_params !== undefined && !this.meta_options.isNewScope){
      Object.entries(this.convertedDefinition.input_params).forEach(([k,v])=>{

        // Create but do not init
        this.properties[k] = new Property(pass, pass, pass, pass, ()=>this.parent.$this, (thisProp, deps, externalDeps=[])=>{

          // deps connection logic

          let depsRemover = []

          deps.$this_deps?.forEach(d=>{
            let depRemover = this.parent.properties[d]?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() ) // qui il ? server affinche si ci registri solo alle props (e non alle func etc!). il ?.add... invece per le vere property e non alle fittizie!
            depRemover && depsRemover.push(depRemover)
          }) // supporting multiple deps, but only of first order..

          deps.$parent_deps?.forEach(d=>{
            let depRemover = this.parent.parent?.properties[d]?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() )
            depRemover && depsRemover.push(depRemover)
          })

          deps.$scope_deps?.forEach(d=>{
            let [propsOwner, isPropertiesProp] = this.parent.get$ScopedPropsOwner(d);
            let depRemover = (isPropertiesProp ? propsOwner.properties[d] : propsOwner.meta[d])?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() ); // qui il ? server affinche si ci registri solo alle props (e non alle func etc!)
            depRemover && depsRemover.push(depRemover)
          }) // supporting multiple deps, but only of first order..


          deps.$le_deps?.forEach(d=>{ // [le_id, property]
            let depRemover;
            exponentialRetry(()=>{
              depRemover = this.parent.$le[d[0]].properties[d[1]]?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() )
            }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5)
            depsRemover.push((...args)=>depRemover(...args))
          })

          deps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
            let depRemover;
            exponentialRetry(()=>{
              depRemover = this.parent.$ctx[d[0]].properties[d[1]]?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() )
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5)
            depsRemover.push((...args)=>depRemover(...args))
          })

          deps.$ref_deps?.forEach(d=>{ // [refName, property]
            // _debug.log("try match", d, this.getChildsRefOwner(d[0]));
            let depRemover;
            exponentialRetry(()=>{
              // _debug.log("try match", d, this.getChildsRefOwner(d[0]), this.getChildsRefOwner(d[0])?.childsRefPointers, this.getChildsRefOwner(d[0])?.childsRefPointers?.[d[0]]?.properties[d[1]]);
              const owner = this.parent.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
              if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
              depRemover = owner?.properties[d[1]]?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() )
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5)
            depsRemover.push(()=>depRemover())
          })

          externalDeps?.forEach(extDep=>{
            let depRemover = extDep?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() )
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
    // first of all: declare all "data" possible property changes handler (in this way ww are sure that exist in the future for deps analysis) - they also decalre a signal!
    if (this.convertedDefinition.data !== undefined){
      Object.entries(this.convertedDefinition.data).forEach(([k,v])=>{

        // Create but do not init
        this.properties[k] = new Property(pass, pass, pass, pass, ()=>this.$this, (thisProp, deps, externalDeps=[])=>{

          // deps connection logic

          let depsRemover = []

          deps.$this_deps?.forEach(d=>{
            let depRemover = this.properties[d]?.addOnChangedHandler?.(thisProp, ()=>thisProp.markAsChanged() ) // qui il ? server affinche si ci registri solo alle props (e non alle func etc!). il ?.add... invece per le vere property e non alle fittizie!
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
            let depRemover;
            exponentialRetry(()=>{
              depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5)
            depsRemover.push((...args)=>depRemover(...args))
          })

          deps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
            let depRemover;
            exponentialRetry(()=>{
              depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5)
            depsRemover.push((...args)=>depRemover(...args))
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
    

    // INPUT PARAMS / data, TODO: check deps on set, "cached get", support function etc
    if (this.convertedDefinition.input_params !== undefined && !this.meta_options.isNewScope){
      Object.entries(this.convertedDefinition.input_params).forEach(([k,v])=>{

        // finally init!
        this.properties[k].init(
          v,
          ()=>_debug.log(k, "getted!"), 
          (v, ojV, self)=>{ _debug.log(k, "setted!", this); 
            if (self.isCachable()){
              if (self.isCacheInvalid(v)){
                this.signals[k+"Changed"].emit(v, this.properties[k]._latestResolvedValue);
              }
            } 
            else {
              this.signals[k+"Changed"].emit(v, this.properties[k]._latestResolvedValue);
            }
          },
          //()=>{console.log("TODO: on destroy clear stuff and signal!!")}
        )
        _debug.log("Parser, data initialized: ", this, this.properties)
      })
    }
    // data, TODO: check deps on set, "cached get", support function etc
    if (this.convertedDefinition.data !== undefined){
      Object.entries(this.convertedDefinition.data).forEach(([k,v])=>{

        // finally init!
        this.properties[k].init(
          v,
          ()=>_debug.log(k, "getted!"), 
          (v, ojV, self)=>{ _debug.log(k, "setted!", this); 
            if (self.isCachable()){
              if (self.isCacheInvalid(v)){
                this.signals[k+"Changed"].emit(v, this.properties[k]._latestResolvedValue);
              }
            } 
            else {
              this.signals[k+"Changed"].emit(v, this.properties[k]._latestResolvedValue);
            }
          },
          //()=>{console.log("TODO: on destroy clear stuff and signal!!")}
        )
        _debug.log("Parser, data initialized: ", this, this.properties)
      })
    }

    // attributes, TODO: support function etc
    if (this.convertedDefinition.attrs !== undefined){
      _debug.log("Found attrs: ", this.convertedDefinition.attrs)

      // let has2WayBinding = Object.values(this.convertedDefinition.attrs).find(v=>v instanceof HAttrBinding) !== undefined
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
                // recompute all ha style (if any)
                this.singlePropStyleRecomputeHooks?.forEach(runner=>runner?.())
              }
              // let isUseExt = isUseExternalDefinition(v)
              if (isFunction(v)){// || isUseExt ){
                let staticDeps = analizeDepsStatically(v)//, isUseExt) // WARNING actally w're bypassing the "deps storage" machanism..this wil break deps update in future!!!
                _debug.log("Attr static deps analysis: ", staticDeps)

                // v = isUseExt ? v.getter : v

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
                  let depRemover;
                  exponentialRetry(()=>{
                    depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && setupStyle(v)})
                  this.attrHattrRemover.push((...args)=>depRemover(...args))
                })

                staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                  let depRemover;
                  exponentialRetry(()=>{
                    depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && setupStyle(v)})
                  this.attrHattrRemover.push((...args)=>depRemover(...args))
                })

                staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                  let depRemover;
                  exponentialRetry(()=>{
                    const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                    if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                    depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupStyle(v) )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && setupStyle(v)})
                  this.attrHattrRemover.push(()=>depRemover())
                })

                // staticDeps.$external_deps?.forEach(d=>{
                //   const deps = d?.addOnChangedHandler([this, "attr", k], ()=>setupStyle(v) )
                //   deps && this.attrHattrRemover.push(deps)
                //   console.log("attr remover must be completeed!!")
                // })

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
                    if (k === 'class' && Array.isArray(val)){
                      this.html_pointer_element.setAttribute(k, val.filter(vv=>(typeof vv) === 'string').join(" ").toString())
                    } else {
                      this.html_pointer_element.setAttribute(k, val.toString())
                    }
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
                  let depRemover;
                  exponentialRetry(()=>{
                    depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                  this.attrHattrRemover.push((...args)=>depRemover(...args))
                })

                staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                  let depRemover;
                  exponentialRetry(()=>{
                    depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                  this.attrHattrRemover.push((...args)=>depRemover(...args))
                })

                staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                  let depRemover;
                  exponentialRetry(()=>{
                    const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                    if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                    depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                  }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && setupValue()})
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
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
                _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
                _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && setupValue()})
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
                if (k === 'class' && Array.isArray(v)){
                  this.html_pointer_element.setAttribute(k, v.filter(vv=>(typeof vv) === 'string').join(" ").toString())
                } else {
                  this.html_pointer_element.setAttribute(k, v.toString())
                }
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
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push(()=>depRemover())
              })

              setupValue()

              if(k.split(".")[0] === 'style'){
                this.singlePropStyleRecomputeHooks?.push(()=>setupValue())
              }

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
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
                _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
                _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && setupValue()})
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
              const setupValue = ()=>{
                let [pointer, final_k] = recursiveAccessor(this.html_pointer_element, k.split("."))
                pointer[final_k] = v
              }
              
              setupValue()

              if(k.split(".")[0] === 'style'){
                this.singlePropStyleRecomputeHooks?.push(()=>setupValue())
              }

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
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
              })

              staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
                let depRemover;
                exponentialRetry(()=>{
                  depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
                this.attrHattrRemover.push((...args)=>depRemover(...args))
              })

              staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
                let depRemover;
                exponentialRetry(()=>{
                  const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                  if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                  depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
                }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && setupValue()})
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
              let depRemover;
              exponentialRetry(()=>{
                depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
              this.attrHattrRemover.push((...args)=>depRemover(...args))
              _2WayPropertyBindingToHandle[k] = ()=>this.$le[d[0]].properties[d[1]]
            })

            staticDeps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
              let depRemover;
              exponentialRetry(()=>{
                depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && setupValue()})
              this.attrHattrRemover.push((...args)=>depRemover(...args))
              _2WayPropertyBindingToHandle[k] = ()=>this.$ctx[d[0]].properties[d[1]]
            })

            staticDeps.$ref_deps?.forEach(d=>{ // [refName, property]
              let depRemover;
              exponentialRetry(()=>{
                const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                depRemover = owner.properties[d[1]].addOnChangedHandler([this, "attr", k],  ()=>setupValue() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && setupValue()})
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
              let depRemover;
              exponentialRetry(()=>{
                depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && renderize_css()})
              depsRemover.push((...args)=>depRemover(...args))
            })

            deps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
              let depRemover;
              exponentialRetry(()=>{
                depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && renderize_css()})
              depsRemover.push((...args)=>depRemover(...args))
            })

            deps.$ref_deps?.forEach(d=>{ // [refName, property]
              let depRemover;
              exponentialRetry(()=>{
                const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && renderize_css()})
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
    if (this.hooks.onInit !== undefined){ const destructor = this.hooks.onInit(); this.hooks_destructors.onInit =  typeof destructor === 'function' ? destructor : undefined }
    if (this.directives?.onInit !== undefined) { this.directives.onInit.map(hook=>hook.bind(undefined, this.$this)()).filter(v=>v !== undefined && typeof v === 'function').forEach(v=>this.directives_hooks_destructors.push(v)) }


    // create childs
    for (let _child of this.childs){
      _child.create()
    }

    // afterChildsInit (non lazy!)
    this.hooks.afterChildsInit !== undefined && this.hooks.afterChildsInit() // todo: hoosk destructor
    if(this.directives?.afterChildsInit !== undefined) { this.directives.afterChildsInit.map(hook=>hook.bind(undefined, this.$this)()).filter(v=>v !== undefined && typeof v === 'function').forEach(v=>this.directives_hooks_destructors.push(v)) }

    // trigger afterInit (lazy..)
    this.hooks.afterInit !== undefined && setTimeout(()=>this.hooks.afterInit(), 1)
    if(this.directives?.afterInit !== undefined) { this.directives.afterInit.map(hook=>setTimeout(()=>hook.bind(undefined, this.$this)(), 1)).filter(v=>v !== undefined && typeof v === 'function').forEach(v=>this.directives_hooks_destructors.push(v)) }


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
              let depRemover;
              exponentialRetry(()=>{
                depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && renderize_css()})
              depsRemover.push((...args)=>depRemover(...args))
            })

            deps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
              let depRemover;
              exponentialRetry(()=>{
                depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && renderize_css()})
              depsRemover.push((...args)=>depRemover(...args))
            })

            deps.$ref_deps?.forEach(d=>{ // [refName, property]
              let depRemover;
              exponentialRetry(()=>{
                const owner = this.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
                if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
                depRemover = owner.properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
              }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && renderize_css()})
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
    if (this.directives.onDestroy !== undefined) { this.directives.onDestroy.forEach(hook=>hook.bind(undefined, this.$this)()) }
    if (this.directives_hooks_destructors !== undefined && this.directives_hooks_destructors.length) { this.directives_hooks_destructors.forEach(hook=>hook.bind(undefined, this.$this)()); this.directives_hooks_destructors = undefined }
    if (this.hooks_destructors?.onInit !== undefined) { this.hooks_destructors.onInit?.bind?.(undefined, this.$this)(); this.hooks_destructors.onInit = undefined }
    this.hooks.onDestroy !== undefined && this.hooks.onDestroy()
    this.childs?.forEach(child=>child.destroy())
    this.destroyDynamicChilds(undefined, true, true)

    
    this.html_pointer_element?.remove()
    this.css_html_pointer_element?.remove()
    this.css_html_pointer_element=undefined
    this.s_css_html_pointer_element?.remove()
    this.s_css_html_pointer_element=undefined
    try { delete this.$ctx[this.id] } catch {}
    try { delete this.$ctx[this.ctx_id] } catch {}
    try { if(this.isMyParentHtmlRoot){ delete this.$le["root"] } } catch {}
    try { if(this.isA$ctxComponent){ delete this.$ctx["root"] } } catch {}
    try { if(this.isA$ctxComponent && !this.isMyParentHtmlRoot && this.ctx_ref_id !== undefined){ delete this.parent.$ctx[this.ctx_ref_id] } } catch {}
    delete this.$le[this.id]
    
    this.unregisterAsChildsRef()

    this.handlerRemover?.forEach(remover=>{
      try{remover()} catch{}
    })
    this.attrHattrRemover?.forEach(remover=>{
      try{remover()} catch{}
    })
    this.singlePropStyleRecomputeHooks = undefined
    Object.values(this.signals).forEach(s=>{
      try{s.destroy()} catch{}
    })
    this.signalsHandlerRemover?.forEach(remover=>{
      try{remover()} catch{}
    })
    Object.values(this.properties).forEach(p=>{
      try{p.destroy(true)} catch{}
    })

    this.$oos = undefined

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
      "name", "childsRef", "oos"
    ])
    addToAlreadyResolved(
      "constructor", 
      "beforeInit", "onInit", "afterInit", "afterChildsInit", "onUpdate", "onDestroy", 
      "signals", "dbus_signals", "on", "on_s", "on_a", 
      "alias", "handle", "when", "css", "s_css", 
      "states", "stateChangeStrategy", "onState",
      "name", "childsRef", "oos"
    )

    // renamed def
    unifiedDef.checked_deps = definition.deps
    addToAlreadyResolved('deps')
    
    unifiedDef.input_params = definition['@input'] // input params: vars passed from the parent, must be resolved with parent scope
    addToAlreadyResolved('@input')



    // maybe private def

    let { 
      id, ctx_id, ctx_ref_id,
      def, "private:def": _def, 
      attrs, "private:attrs":_attrs, 
      a, "private:a": _a, 
      hattrs, "private:hattrs":_hattrs, 
      ha, "private:ha": _ha, 
    } = definition
    addToAlreadyResolved('id', 'ctx_id', 'ctx_ref_id',
      'def', "private:def",
      'attrs', "private:attrs",
      'a', "private:a", 
      'hattrs', "private:hattrs",
      'ha', "private:ha"
    )

    unifiedDef.id = id || ComponentRUUIDGen.generate()
    unifiedDef.ctx_id = ctx_id || unifiedDef.id
    unifiedDef.ctx_ref_id = ctx_ref_id

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
      // read_only_props: data_read_only // todo: campo speciale in cui inserire gli evaluable / read only .. e in teoria se si prova a modificarle parte eccezione
    } = definition
    addToAlreadyResolved(
      'data', "private:data", 
      'props', "private:props", 
      "let", "private:let"
    )

    unifiedDef.data = data || props || data_let || {}
    unifiedDef._data = _data || _props || _data_let || {}


    let { directives } = definition
    addToAlreadyResolved('directives')
    unifiedDef.directives = directives


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
      on_le: {},
      on_ctx: {},
      on_ref: {},
      directives: {}
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
        else if (k.startsWith('ev_')){
          dash_shortucts_keys.handle[k.substring(3)] = val
          addToAlreadyResolved(k)
        }
        else if (k.startsWith('handle_')){
          dash_shortucts_keys.handle[k.substring(7)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('w_')){
          dash_shortucts_keys.when_event_listener[k.substring(2)] = val
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
        
        else if (k.startsWith('dbus_signal_')){
          dash_shortucts_keys.dbus_signals[k.substring(12)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('on_')){ 

          if (k.startsWith('on_this_')){
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
          else if (k.startsWith('on_le_')){
            let id_and_sign = k.substring(6)
            let [id, ...rest] = id_and_sign.split("_")
            let sign = rest.join("_")
            if (dash_shortucts_keys.on_le[id] !== undefined) {
              dash_shortucts_keys.on_le[id][sign] = val
            }
            else {
              dash_shortucts_keys.on_le[id] = { [sign]: val }
            }
            addToAlreadyResolved(k)
          }
          else if (k.startsWith('on_ctx_')){
            let ctx_id_and_sign = k.substring(7)
            let [ctx_id, ...rest] = ctx_id_and_sign.split("_")
            let sign = rest.join("_")
            if (dash_shortucts_keys.on_ctx[ctx_id] !== undefined) {
              dash_shortucts_keys.on_ctx[ctx_id][sign] = val
            }
            else {
              dash_shortucts_keys.on_ctx[ctx_id] = { [sign]: val }
            }
            addToAlreadyResolved(k)
          }
          else if (k.startsWith('on_ctx_')){
            let ref_id_and_sign = k.substring(7)
            let [ref_id, ...rest] = ref_id_and_sign.split("_")
            let sign = rest.join("_")
            if (dash_shortucts_keys.on_ref[ref_id] !== undefined) {
              dash_shortucts_keys.on_ref[ref_id][sign] = val
            }
            else {
              dash_shortucts_keys.on_ref[ref_id] = { [sign]: val }
            }
            addToAlreadyResolved(k)
          }
          else if (k.startsWith('on_s_')){ // ultra shortcuts! use scope (ideally for signals..)
            dash_shortucts_keys.on_scope[k.substring(5)] = val
            addToAlreadyResolved(k)
          }
          else { // ultra shortcuts! use scope
            dash_shortucts_keys.on_scope[k.substring(3)] = val
            addToAlreadyResolved(k)
          }
        }

        else if (k.startsWith('on') && k.endsWith("_event")){ // handle html events like  "onclick_event" 
          dash_shortucts_keys.handle[k.substring(0, k.length-6)] = val
          addToAlreadyResolved(k)
        }

        else if (k.startsWith('dir_')){ // handle directives
          dash_shortucts_keys.directives[k.substring(4)] = val
          addToAlreadyResolved(k)
        }
      }
      
      else if (['class', 'style'].includes(k)){ // Extreme shortcuts for style & class
        dash_shortucts_keys.attrs[k] = definition[k]
        addToAlreadyResolved(k)
      }

      else if (['onclick'].includes(k)){ // Extreme shortcuts for onclick
        dash_shortucts_keys.handle[k] = definition[k]
        addToAlreadyResolved(k)
      }

      // // ?? POTENTIAL BREAKING CHANGES "onclick" etc will now be recognized as html event "handle"
      // else if (k.startsWith('on') && k.length >= 3 && k[2] === k[2].toLowerCase() && k in window){ // handle html events like  "onclick" directly!
      //   dash_shortucts_keys.handle[k] = definition[k]
      //   addToAlreadyResolved(k)
      // }

    })


    // all done! now everithing NOT already_resolved is a prop!
    Object.keys(definition).forEach(k=>{
      if (!already_resolved.includes(k)){
        dash_shortucts_keys.data[k] = definition[k]
        _info.log('CLE-INFO: unrecognized ', k, " converted into props!")
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
    if (Object.keys(dash_shortucts_keys.on_le).length > 0){
      if (unifiedDef.on !== undefined){ 
        if (unifiedDef.on.le !== undefined){
          const final_on_le = {...unifiedDef.on.le}
          Object.entries(dash_shortucts_keys.on_le).forEach(([le_id, sign_handlers])=>{
            if (final_on_le[le_id] !== undefined){
              final_on_le[le_id] = {...final_on_le[le_id], ...sign_handlers}
            } 
            else {
              final_on_le[le_id] = {...sign_handlers}
            }
          })
          unifiedDef.on.le = final_on_le
        }
        else {
          unifiedDef.on.le = dash_shortucts_keys.on_le
        }
        
      }
      else { unifiedDef.on = { le: dash_shortucts_keys.on_le }}
    }
    if (Object.keys(dash_shortucts_keys.on_ctx).length > 0){
      if (unifiedDef.on !== undefined){ 
        if (unifiedDef.on.ctx !== undefined){
          const final_on_ctx = {...unifiedDef.on.ctx}
          Object.entries(dash_shortucts_keys.on_ctx).forEach(([ctx_id, sign_handlers])=>{
            if (final_on_ctx[ctx_id] !== undefined){
              final_on_ctx[ctx_id] = {...final_on_ctx[ctx_id], ...sign_handlers}
            } 
            else {
              final_on_ctx[ctx_id] = {...sign_handlers}
            }
          })
          unifiedDef.on.ctx = final_on_ctx
        }
        else {
          unifiedDef.on.ctx = dash_shortucts_keys.on_ctx
        }
        
      }
      else { unifiedDef.on = { ctx: dash_shortucts_keys.on_ctx }}
    }
    if (Object.keys(dash_shortucts_keys.on_ref).length > 0){
      if (unifiedDef.on !== undefined){ 
        if (unifiedDef.on.ref !== undefined){
          const final_on_ref = {...unifiedDef.on.ref}
          Object.entries(dash_shortucts_keys.on_ref).forEach(([ref_id, sign_handlers])=>{
            if (final_on_ref[ref_id] !== undefined){
              final_on_ref[ref_id] = {...final_on_ref[ref_id], ...sign_handlers}
            } 
            else {
              final_on_ref[ref_id] = {...sign_handlers}
            }
          })
          unifiedDef.on.ref = final_on_ref
        }
        else {
          unifiedDef.on.ref = dash_shortucts_keys.on_ref
        }
        
      }
      else { unifiedDef.on = { ref: dash_shortucts_keys.on_ref }}
    }
    if (Object.keys(dash_shortucts_keys.directives).length > 0){
      if (unifiedDef.directives !== undefined){ unifiedDef.directives = { ...unifiedDef.directives, ...dash_shortucts_keys.directives } }
      else { unifiedDef.directives = dash_shortucts_keys.directives }
    }

    // handle subcomponent transformation
    if (unifiedDef.beforeInit !== undefined) {
      let res_unifiedDef = unifiedDef.beforeInit(unifiedDef, unifiedDef.childs) // passare una funzione in grado di guardare nei child e queryare quelli che hanno una certa proprietà, in modo da ricreare l'effetto "ngTemplate xxxNamexxx"
      unifiedDef = res_unifiedDef !== undefined ? res_unifiedDef : unifiedDef
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
    
    if (ComponentsRegistry.has(componentType)){
      let F = ComponentsRegistry.get(componentType)
      return Component.componentFactory(parent, Array.isArray(componentDef) ? F(...componentDef) : F(componentDef), $le, $dbus)
    }

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

        staticDeps.$le_deps?.forEach(_d=>{ // [le_id, property]
          exponentialRetry(()=>{
            let _propName = _d[1]
            let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          exponentialRetry(()=>{
            let _propName = _d[1]
            let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
        })

        staticDeps.$ref_deps?.forEach(_d=>{ // [refName, property]
          exponentialRetry(()=>{
            let _refName = _d[0]
            let _propName = _d[1]
            const owner = pointedComponentEl.getChildsRefOwner(_refName).childsRefPointers[_refName]
            if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
            let _pointedProp = owner.properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
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

        staticDeps.$le_deps?.forEach(_d=>{ // [le_id, property]
          exponentialRetry(()=>{
            let _propName = _d[1]
            let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          exponentialRetry(()=>{
            let _propName = _d[1]
            let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
        })

        staticDeps.$ref_deps?.forEach(_d=>{ // [refName, property]
          exponentialRetry(()=>{
            let _refName = _d[0]
            let _propName = _d[1]
            const owner = pointedComponentEl.getChildsRefOwner(_refName).childsRefPointers[_refName]
            if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
            let _pointedProp = owner.properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
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

        staticDeps.$le_deps?.forEach(_d=>{ // [le_id, property]
          exponentialRetry(()=>{
            let _propName = _d[1]
            let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
        })

        staticDeps.$ctx_deps?.forEach(_d=>{
          exponentialRetry(()=>{
            let _propName = _d[1]
            let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
        })

        staticDeps.$ref_deps?.forEach(_d=>{ // [refName, property]
          exponentialRetry(()=>{
            let _refName = _d[0]
            let _propName = _d[1]
            const owner = pointedComponentEl.getChildsRefOwner(_refName).childsRefPointers[_refName]
            if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
            let _pointedProp = owner.properties[_propName]
            if ("addOnChangedHandler" in _pointedProp){
              this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
            }
            // todo: recoursive def deps!
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
        })
      }
    })

    this.staticAnDeps.$le_deps?.forEach(d=>{
      exponentialRetry(()=>{
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

          staticDeps.$le_deps?.forEach(_d=>{ // [le_id, property]
            exponentialRetry(()=>{
              let _propName = _d[1]
              let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
              if ("addOnChangedHandler" in _pointedProp){
                this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
              }
              // todo: recoursive def deps!
            }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
          })

          staticDeps.$ctx_deps?.forEach(_d=>{
            exponentialRetry(()=>{
              let _propName = _d[1]
              let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
              if ("addOnChangedHandler" in _pointedProp){
                this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
              }
              // todo: recoursive def deps!
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
          })

          staticDeps.$ref_deps?.forEach(_d=>{ // [refName, property]
            exponentialRetry(()=>{
              let _refName = _d[0]
              let _propName = _d[1]
              const owner = pointedComponentEl.getChildsRefOwner(_refName).childsRefPointers[_refName]
              if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
              let _pointedProp = owner.properties[_propName]
              if ("addOnChangedHandler" in _pointedProp){
                this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
              }
              // todo: recoursive def deps!
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
          })
        }
      }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
    })

    this.staticAnDeps.$ctx_deps?.forEach(d=>{
      exponentialRetry(()=>{
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

          staticDeps.$le_deps?.forEach(_d=>{ // [le_id, property]
            exponentialRetry(()=>{
              let _propName = _d[1]
              let _pointedProp = pointedComponentEl.$le[_d[0]].properties[_propName]
              if ("addOnChangedHandler" in _pointedProp){
                this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
              }
              // todo: recoursive def deps!
            }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
          })

          staticDeps.$ctx_deps?.forEach(_d=>{
            exponentialRetry(()=>{
              let _propName = _d[1]
              let _pointedProp = pointedComponentEl.$ctx[_d[0]].properties[_propName]
              if ("addOnChangedHandler" in _pointedProp){
                this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
              }
              // todo: recoursive def deps!
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
          })

          staticDeps.$ref_deps?.forEach(_d=>{ // [refName, property]
            exponentialRetry(()=>{
              let _refName = _d[0]
              let _propName = _d[1]
              const owner = pointedComponentEl.getChildsRefOwner(_refName).childsRefPointers[_refName]
              if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
              let _pointedProp = owner.properties[_propName]
              if ("addOnChangedHandler" in _pointedProp){
                this.depsRemover.push(_pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
              }
              // todo: recoursive def deps!
            }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
          })
        }
      }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
    })

    this.staticAnDeps.$ref_deps?.forEach(d=>{// [refName, property]
      exponentialRetry(()=>{
        let propName = d[1]
        const owner = this.parent.getChildsRefOwner(d[0]).childsRefPointers[d[0]]
        if (Array.isArray(owner)){ throw Error("Cannot Bind to multi-ref child") }
        let pointedProp = owner.properties[propName]
        if ("addOnChangedHandler" in pointedProp){
          this.depsRemover.push(pointedProp.addOnChangedHandler(this, ()=>this._renderizeText()))
        }
        else { _warning.log("CLE Warning - function in ref in text as deps not supported at this time")}
      }, pass, pass, pass, "Cannot connect to CLE Obj by Ref Name", 5, (firstTry, res)=>{!firstTry && this._renderizeText()})
      
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
  // mode can be: "append" | "before" | "after"
  setupMode(mode){
    this.insertion_mode = mode
  }

  // @override step 2: DO NOT CREATE HTML EL ON PARENT, use mount point instead!
  buildHtmlPointerElement(){
    this.html_pointer_element = document.createElement(this.htmlElementType)

    if (this.insertion_mode === "append"){
      this.html_mount_point.appendChild(this.html_pointer_element)
    } 
    else if (this.insertion_mode === "before"){
      this.html_mount_point.before(this.html_pointer_element)
    } 
    else if (this.insertion_mode === "after"){
      this.html_mount_point.after(this.html_pointer_element)
    } 
    else {
      throw Error("Unsupported Subrender insertion mode!")
    } 

    this.html_pointer_element.setAttribute(this.t_uid, "")
  }
  // mode can be: "append" | "before" | "after"
  static SubRendererComponentFactory($parent, html_mount_point, oj_definition, lazy=false, mode="append"){
    const maybeLazy = ()=>{
      const components_root = new SubRendererComponent($parent, oj_definition, $parent.$le, $parent.$dbus)
      components_root.setupMountPoint(html_mount_point)
      components_root.setupMode(mode)
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
    else if (this.isPlaceholderPointerComponent){
      this.html_pointer_element = document.createComment("cleptr")
      
      this.html_pointer_element_anchor.after(this.html_pointer_element)

      return; // do not continue with attr setting
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
        let depRemover;
        exponentialRetry(()=>{
          depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5)
        depsRemover.push((...args)=>depRemover(...args))
      })

      deps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
        let depRemover;
        exponentialRetry(()=>{
          depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
        }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5)
        depsRemover.push((...args)=>depRemover(...args))
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
          let signalName = dev_var_name+"Changed"
          this.meta[dev_var_name] = new Property(()=>this.meta_config.define_helper[define_var], none, (v, ojV, self)=>{  if (v !== ojV) { this.signals[signalName].emit(v, this.meta[dev_var_name]._latestResolvedValue); } }, none, ()=>this.$this, none, true)
          this.signals[signalName] = new Signal(signalName, "stream => (newValue: any, oldValue: any) - meta property change signal")
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

  updateDataRerencesAndMeta(newIterableIdx, newMetaConfig, childComparer, childSubpropComparer,  skip_identifier_value=true){
    this.iterableIndex = newIterableIdx
    this.meta_config = newMetaConfig
    Object.entries(this.meta).forEach(([k,v])=>{
      if ( !(skip_identifier_value && k === this.meta_config.iterablePropertyIdentifier)){
        (v instanceof Property) && v?.markAsChanged() // force update
      }
    })

    // todo: capire se ha senso, AS DOC: nei casi `full_optimized` è possibile anche definire un `subComparer`, in grado di valutare (durante una change dell'iterable) sottoproprietà al fine di scatenare un change signal.
    // subComparer: (newEl, oldEl) => newEl.val1 !== oldEl.val1
    // in realtà questa cosa non ha alcun senso.. perchè quando c'è una change dell'array poi scatta la change dei singoli item sopavvissuti all'evicting (i non nuovi e i non rimossi..) e dunque scatta la notifica intrinseca del change da definizione della property!

    // if (childSubpropComparer !== undefined){
    //   const [_newv, _oldv] = [this.meta[this.meta_config.iterablePropertyIdentifier].value, this.meta[this.meta_config.iterablePropertyIdentifier]._latestResolvedValue]
    //   if ( (childComparer && childComparer(_newv, _oldv)) || (childSubpropComparer && childSubpropComparer(_newv, _oldv)) ){
    //     this.signals[this.meta_config.iterablePropertyIdentifier+"Changed"].emit(_newv, _oldv); // NEW FOR REACT MASHUP: force to emit a xxxChanged also for meta vars..
    //   }
    // }

    this.hooks.onUpdate !== undefined && this.hooks.onUpdate()
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
      metaPushbackAutomark: this.meta_def?.metaPushbackAutomark ?? CLE_FLAGS.DEFAULTS.META.PUSHBACK_AUTOMARK,
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

  sortExistingChildsInDomAsChildsArrOrder(){

    const insertAfter = function (element, after) {
      after.parentNode.insertBefore(element, after.nextSibling);
    }

    const root = this.html_pointer_element_anchor;

    let latestReinserted = undefined

    this.childs.forEach((child, idx)=>{
      if (idx === 0){
        insertAfter(child.html_pointer_element, root)
      }
      else {
        insertAfter(child.html_pointer_element, latestReinserted)
      }
      latestReinserted = child.html_pointer_element
    })
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

  detectChangesAndRebuildChilds(newItems, oldItems){
    const childComparer = this.meta_def.idComparer !== undefined && isFunction(this.meta_def.idComparer) ? this.meta_def.idComparer : (_new, _old)=> _new !== _old;
    const childSubpropComparer = this.meta_def.subComparer !== undefined && isFunction(this.meta_def.subComparer) ? this.meta_def.subComparer : undefined
    const full_lookahead_check = this.meta_def.full_optimized ?? CLE_FLAGS.DEFAULTS.META.FULL_OPTIMIZED

    // NEW ALGO  WITH 100% COMPARISON & low performance impact
    // creo una copia shallow dell'array childs
    // creo un nuovo array vuoto che rappresenta i nuovi childs "finali"
    // creo un nuovo array vuoto che rappresenta i nuovi childs da creare
    // itero i new items
    // se trovo l'elemento tra i childs me lo porto nel nuovo array e lo rimuovo dalla shallow copy dei childs
    // se l'items NON lo trovo tra i childs allora è uno nuovo, lo creo e lo metto tra i childs
    // rimuovo e distruggo ciò che resta nella shallow copy dei childs
    // sort del doom
    // aggiorno i meta
    if (full_lookahead_check){
      let currentChilds = [...this.childs]
      let newChilds = []
      let toBuildAndInit = []

      const itemInOldChilds = (itemToCheck, newIdx, currentChilds)=>{
        for (let i = 0; i < currentChilds.length; i++) {
          if ( !childComparer(itemToCheck, currentChilds[i].meta_config.value)){
            return [true, i]
          }
        }
        return [false, undefined]
      }

      newItems.forEach((newItem, index)=>{
        const [inOldChilds, oldPosition] = itemInOldChilds(newItem, index, currentChilds) 
        // has only changed position
        if (inOldChilds){
          _debug.log("sorted!!", newItem, oldItems, "-->", index)
          newChilds.push(currentChilds.splice(oldPosition, 1)[0]) // move into new childs with the new position
        }
        // new item
        else {
              
          _debug.log("new!!", newItem, index)

          let newChild = new IterableComponent(
            this.parent, 
            this.real_iterable_definition, 
            this.$le, 
            this.$dbus, 
            this, 
            index, 
            {
              realPointedIterableProperty: this.real_pointed_iterable_property, 
              iterablePropertyIdentifier: this.iterablePropertyIdentifier, 
              value: newItems[index], 
              define: this.meta_def.define,
              define_helper: {
                index: index,
                first: index === 0,
                last: index === newItems.length-1,
                length: newItems.length,
                iterable: newItems
              }
            },
            this.meta_options,
            false
          )

          // If the item is new, create a new element in the DOM and append it to the list
          newChilds.push(newChild)
          toBuildAndInit.push(newChild)

        }
      })

      // destroy removed items
      currentChilds.forEach(c=>{
        _debug.log("destroied!!", c)
        c.destroy()
      })
      
      _debug.log("OLD", this.childs)

      // set the newChilds as the new "childs" array
      this.childs.splice(0, this.childs.length, ...newChilds)

      // create the new elements
      toBuildAndInit.forEach(newChild=>{
        newChild.buildSkeleton()
      })
      toBuildAndInit.forEach(newChild=>{
        newChild.create()
      })

      // sort DOM as the childs elements array
      this.sortExistingChildsInDomAsChildsArrOrder()

      _debug.log("NEW", this.childs)

      // update all childs meta (array, index, islast, etc)
      this.iterableProperty.value?.forEach((arrValue, idx, arr)=>{
        this.childs[idx].updateDataRerencesAndMeta( idx, {
          realPointedIterableProperty: this.real_pointed_iterable_property,
          iterablePropertyIdentifier: this.iterablePropertyIdentifier,
          value: arrValue,
          define: this.meta_def.define,
          define_helper: {
            index: idx,
            first: idx === 0,
            last: idx === arr.length-1,
            length: arr.length,
            iterable: arr
          }
        }, childComparer, childSubpropComparer, true)
      })
    }
    // OLD ALGO
    else {

      // keep track of wich items in the list have changed
      const changedItems = {}
      const currentChilds = this.childs

      // Compare each item in the current state with the corresponding item in the DOM
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];

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
          {realPointedIterableProperty: this.real_pointed_iterable_property, iterablePropertyIdentifier: this.iterablePropertyIdentifier, value: newItems[index], define: this.meta_def.define, define_helper: {index: index, first: index === 0, last: index === newItems.length-1, length: newItems.length, iterable: newItems}}, 
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
      // _debug.log("new, old", newItems, oldItems)
      if (newItems.length < oldItems.length) {
        // If there are more items in the DOM than in the current state, remove the excess items from the DOM
        for (let i = newItems.length; i < oldItems.length; i++) {
          currentChilds[i].destroy()
          currentChilds.splice(i,1)
        }
      }

      iterableComponentsToInit.forEach(i=>i.create())

      // _debug.log(this.childs)

      // update all childs meta (array, index, islast, etc)
      this.iterableProperty.value?.forEach((arrValue, idx, arr)=>{
        this.childs[idx].updateDataRerencesAndMeta(idx, {realPointedIterableProperty: this.real_pointed_iterable_property, iterablePropertyIdentifier: this.iterablePropertyIdentifier, value: arrValue, define: this.meta_def.define, define_helper: {index: idx, first: idx === 0, last: idx === arr.length-1, length: arr.length, iterable: arr}}, childComparer, childSubpropComparer, true)
      })
    
    }
  }

  //@override, per utilizzare nella Factory this.parent come parent e non this. inoltre qui in realtà parlo dei children come entità replicate, e non i child del template..devo passare una versione del template senza meta alla component factory! altrimenti errore..
  // in realtà dovrebbe essere un "build child skeleton and create child"
  buildChildsSkeleton(rebuild_for_changes=false, latestResolvedValue=undefined){
    if (rebuild_for_changes && (this.meta_def.optimized || (this.meta_def.full_optimized ?? CLE_FLAGS.DEFAULTS.META.FULL_OPTIMIZED))){
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
          let depRemover;
          exponentialRetry(()=>{
            depRemover = this.$le[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          }, pass, pass, pass, "Cannot connect to CLE Obj by Id", 5)
          depsRemover.push((...args)=>depRemover(...args))
          this.real_pointed_iterable_property.markAsChanged = ()=>{this.$le[d[0]].properties[d[1]]?.markAsChanged()}
        })

        deps.$ctx_deps?.forEach(d=>{ // [ctx_id, property]
          let depRemover;
          exponentialRetry(()=>{
            depRemover = this.$ctx[d[0]].properties[d[1]].addOnChangedHandler(thisProp, ()=>thisProp.markAsChanged() )
          }, pass, pass, pass, "Cannot connect to CLE Obj by Ctx Id", 5)
          depsRemover.push((...args)=>depRemover(...args))
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

// export
/** Lazy Component - To force component resolution & creation at run-time, using $ context and variables */
const LazyComponentCreation = (compFunction, params, extradef={}, rerenderingDeps=undefined, detectRerenderingRequired=(a,b)=>a!==b) => {

  if (rerenderingDeps === undefined){

    return { LazyPointer: {
      
      ...extradef,

      renderizedComponent: undefined,

      afterInit: async $ => {
        let resolvedComp = compFunction

        if (typeof compFunction === 'function'){
          resolvedComp = await compFunction($, params)
        } 

        // _debug.log($.this.el, resolvedComp)

        $.renderizedComponent = $.u.newConnectedSubRenderer($.this.el, resolvedComp, false, "after")
      }
    }}

  }
  else {

    return { LazyPointer: {
      ...extradef,

      renderizedComponent: undefined,
      inRendering: false,
      
      rerenderingDeps: rerenderingDeps,

      on_this_rerenderingDepsChanged: ($, n, o) => {
        if (detectRerenderingRequired(n,o)) {
          if ($.renderizedComponent !== undefined && !$.inRendering){
            $.renderizedComponent.destroy();
            $.renderize()
          }
        }
      },

      // todo: move destroy inside this function (where a rerendering detected), then pass the latest renderized component ( as pure el def {div:{...}} ) to the function, and let that function return array [component, rerenderingRequired], to let function handle rerendering request. then if true destroy and renderize
      //       in this mode we can reimplement eg. react diffing mode, and reduce rerendering. 
      def_renderize: async $=>{
        _debug.log("renderizing..",)
        $.inRendering = true

        let resolvedComp = compFunction

        if (typeof compFunction === 'function'){
          resolvedComp = await compFunction($, params)
        } 

        // _debug.log($.this.el, resolvedComp)

        $.renderizedComponent = $.u.newConnectedSubRenderer($.this.el, resolvedComp, false, "after")
        _debug.log("renderized", $.renderizedComponent)
        $.inRendering = false
      },

      afterInit: async $ => {
        await $.renderize()
      }
    }}
  }
}


// export
/** Shadow Root Enabled Components */
const ShadowRootComponentCreator = (component, extradef={}, useUse=true, useUseExtraDef=[], tag="div", open=false)=>{
  return { [tag]: {
    ...extradef,

    renderizedComponent: undefined,
    shadowRoot: undefined,

    afterInit: async $ => {
      $.shadowRoot = $.this.el.attachShadow({mode:  open ? 'open' : 'closed'});

      $.renderizedComponent = $.u.newConnectedSubRenderer($.shadowRoot, useUse ? Use(component, ...useUseExtraDef) : component)
    },
    onDestroy: $ => {
      $.renderizedComponent.destroy()
    }
  }}
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
  get: (_target, prop, receiver)=>{ return (args_dict, ...childs)=>( args_dict===undefined && childs.length === 0 ? {[prop]: {}} : ((typeof args_dict) === "string" || (typeof args_dict) ==="function" ? {[prop]: (childs.length === 0 ? args_dict : [args_dict, ...childs])} : {[prop]:{...args_dict, ...(childs.length ? {'':childs} : {}) }}) ) },
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
function findMixedStringAndEvaluableMatches(str) {
  // const regex = /{{\s*([^{}]+)\s*}}/g;
  const regex = /{{(.*?)}}/g;
  const matchToResolve = [...str.matchAll(regex)].sort((a,b)=>a.index-b.index)
  const matches = [];

  let lastIndex = 0;
  for (const match of str.matchAll(regex)){
    const index = match.index;
    const matchedText = match[0];
    const matchedString = match[1];
    const matchObj = { index, text: matchedString, match: true };

    // se esiste una stringa prima del match la separo e la inserisco
    if (lastIndex < index) {
      const text = str.slice(lastIndex, index);
      matches.push({ index: lastIndex, text, match: false });
    }

    // inserisco il match reale
    matches.push(matchObj);
    
    lastIndex = index + matchedText.length;
  }

  // controllo eventuali stringhe finali
  if (lastIndex < str.length) {
    const text = str.slice(lastIndex);
    matches.push({ index: lastIndex, text, match: false });
  }

  return matches;
}
const htmlConverterHookRemap = {
  beforeinit: 'beforeInit',
  oninit: 'onInit',
  afterchildsinit: 'afterChildsInit',
  afterinit: 'afterInit',
  ondestroy: 'onDestroy',
  onupdate: 'onUpdate',
  constructor: 'constructor',
}
const resolveAndConvertHtmlElement = (element, tagReplacers, extraDefs, jsValContext )=>{
  // console.log("parsing: ", element)
  if (element.nodeType === 8){ // is a comment, skip
    return undefined
  }

  if (element.nodeName === "#text"){
    let text = element.textContent
    
    if (stringWithOnlySpaces(text)){
      return undefined
    }

    if (text.includes("{{") && text.includes("}}")){ //fix mixed text and smart func!

      // _debug.log(text, findMixedStringAndEvaluableMatches(text))

      let converted = findMixedStringAndEvaluableMatches(text).map(res=>{
        if (res.match){
          return smartFunc(res.text, true)
        }
        else {
          return res.text
        }
      })

      // _debug.log(text, converted.map(t=>t.toString()), findMixedStringAndEvaluableMatches(text))
      return converted
    } 
    else {
      return text
    }
  }
  else {
    let tag = element.tagName.toLowerCase()

    if (tag === "js-val"){
      // it's implicit a function with this args.
      return smartFuncWithCustomArgs("Cle", "params", "state", "DepsInj", "u") (Array.from(element.childNodes)[0].textContent, true)(undefined, Cle, jsValContext.params, jsValContext.state, jsValContext.DepsInj, jsValContext.u)
    }
    
    const input_params = {} // todo: input params in html
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
    const identifiers = {} // id, ctx_id, ctx_ref_id, name
    let raw_defs = {}
    let use_options = {}

    let extra_def_id = undefined

    for (let attr of element.attributes || []){
      
      // extra/external def
      if (attr.name === "extra-defs"){
        extra_def_id = attr.value
      }
      else if (attr.name === "[use-options]"){
        use_options = smartFunc(attr.value, true)()
        _debug.log("USE OPTIONS: ", use_options)
      }
      else if (attr.name === "[raw-defs]"){
        raw_defs = smartFunc(attr.value, true)()
        _debug.log("RAW DEFS: ", raw_defs)
      }
      else if (attr.name.startsWith("[raw-def-")){
        let k = dashCaseToCamelCase(attr.name.substring(9, attr.name.length-1))
        raw_defs = {...raw_defs, [k]: smartFunc(attr.value, true)()}
        _debug.log("RAW DEF BY KEY:", k, raw_defs)
      }
      // meta
      else if (attr.name.startsWith("#")){
        if (attr.name === "#id"){
          identifiers.id = attr.value
        }
        else if (attr.name === "#ctx_id" || attr.name === "#ctx-id"){
          identifiers.ctx_id = attr.value
        }
        else if (attr.name === "#ctx_ref_id" || attr.name === "#ctx-ref-id"){
          identifiers.ctx_ref_id = attr.value
        }
        else if (attr.name === "#name"){
          identifiers.name = attr.value
        }
        else {
          console.log("UNSUPPORTED AT THIS TIME: ", attr)
        }
      }
      // meta
      else if (attr.name.startsWith("meta-") || (attr.name.startsWith("[meta-") && attr.name.endsWith("]"))){
        let name = attr.name.startsWith("[") ? attr.name.substring(6, attr.name.length-1) : attr.name.substring(5)
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
        else if (name === "full_optimized" || name === "full-optimized"){
          meta.full_optimized = attr.value==='true'
        }
        else if (name === "comparer"){
          meta.comparer = smartFunc(attr.value, true)
        }
        else if (name === "idcomparer" || name === "id-comparer"){
          meta.idComparer = smartFunc(attr.value, true)
        }
        else if (name.startsWith("define-")){
          name = dashCaseToCamelCase(name.substring(7))
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
      // hooks with square brakest for better syntax
      else if (attr.name.startsWith("[hook-") && attr.name.endsWith("]")){
        // todo, risolvere problema per cui gli attr arrivano lowercase
        let name = htmlConverterHookRemap[attr.name.substring(6, attr.name.length-1)]
        hooks[name] = smartFunc(attr.value, true)
      }
      // standard signal definition
      else if (attr.name.startsWith("signal-")){
        let name = dashCaseToCamelCase(attr.name.substring(7))
        signals["signal_"+name] = attr.value || "stream => void"
      }
      // signals handlers 
      else if (attr.name.startsWith("(on-") && attr.name.endsWith("-changed)")){
        let name = dashCaseToCamelCase(attr.name.substring(4, attr.name.length-9)) // for property changes..always dash-case
        let value = smartFuncWithCustomArgs("newValue", "oldValue")(attr.value, true)
        // console.log(attr, name, value, "on_scope_"+name+"Changed")
        on_handlers["on_"+name+"Changed"] = value
      }
      // dbus handlers
      else if (attr.name.startsWith("(on-dbus-")){
        let name = dashCaseToCamelCase(attr.name.substring(9, attr.name.length-1))
        let value = smartFuncWithCustomArgs("$val", "$val1", "$val2", "$val3", "$val4", "$val5", "$val6", "$val7", "$val8", "$val9")(attr.value, true)
        // console.log(attr, name, value)
        on_handlers["on_dbus_"+name] = value
      }
      // properties change handlers 
      else if (attr.name.startsWith("(on-")){
        let name = dashCaseToCamelCase(attr.name.substring(4, attr.name.length-1))
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
      else if (attr.name.startsWith("let-raw") || attr.name.startsWith("set-raw-")){
        let name = dashCaseToCamelCase(attr.name.substring(8))
        properties[name] = attr.value
      }
      // evaluable properties use "-" to convert in camel case
      else if (attr.name.startsWith("[let-raw") || attr.name.startsWith("[set-raw-")){
        let name = dashCaseToCamelCase(attr.name.substring(9, attr.name.length-1))
        properties[name] = smartFunc(attr.value, true)
      }
      // standard properties
      else if (attr.name.startsWith("let-") || attr.name.startsWith("set-")){
        let name = dashCaseToCamelCase(attr.name.substring(4))
        properties["let_"+name] = attr.value
      }
      // evaluable properties use "-" to convert in camel case
      else if (attr.name.startsWith("[let-") || attr.name.startsWith("[set-")){
        // todo, risolvere problema per cui gli attr arrivano lowercase
        let name = dashCaseToCamelCase(attr.name.substring(5, attr.name.length-1))
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
        let name = dashCaseToCamelCase(attr.name.substring(3))
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
      ...identifiers,
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

      ...raw_defs,
      ...(extra_def_id !== undefined && extra_def_id in extraDefs ? extraDefs[extra_def_id] : {})
    }
    
    const children = Array.from(element.childNodes).flatMap(c=>resolveAndConvertHtmlElement(c, tagReplacers, extraDefs, jsValContext)).filter(c=>c !== undefined)

    if (tag.startsWith("use-")){
      if (tag.substring(4).toLowerCase() in tagReplacers){
        return Use(tagReplacers[tag.substring(4).toLowerCase()], {...parsedDef}, {...use_options}, children)
      }
      else if (ComponentsRegistry.has(tag)){ 
        return ComponentsRegistry.get(tag)({...parsedDef}, {...use_options}, ...children)
      }
    }
    else if (tag.startsWith("extended-")){
      if (tag.substring(9).toLowerCase() in tagReplacers){
        return Extended(tagReplacers[tag.substring(9).toLowerCase()], {...parsedDef}, {...use_options}, children)
      }
      else if (ComponentsRegistry.has(tag)){ 
        return ComponentsRegistry.get(tag)({...parsedDef}, {...use_options}, ...children)
      }
    }
    // if (tag.startsWith("extended-direct") && tag.substring(15).toLowerCase() in tagReplacers){
    //   let el = tagReplacers[tag.substring(15).toLowerCase()]
    //   let componentType = getComponentType(el)
    //   let ext = Extended(el, {...parsedDef}, {...use_options}, children)
    //   ext[componentType].meta = el.meta
    // } // todo: fix use and extended..that skip meta definition!
    else if (tag.startsWith("component-") && ComponentsRegistry.has(tag)){
        return ComponentsRegistry.get(tag)({...parsedDef}, ...children)
    }

    return { [tag]: {...parsedDef, "=>": children}}
  }
}
// export - convert and generate cle components from html string and a definition and component tag-replacer. extraDefs to add xtra definition vai obj, using a template id in template and as key in extraDefs
const fromHtml = (text, definition={}, tagReplacers={}, extraDefs={}, jsValContext={params: {}, state: {}, DepsInj:{}, u: {}})=>{
  const dp = new DOMParser()

  let elements = dp.parseFromString(text, 'text/html').body
  // console.log(elements)

  let root = {}

  if (elements.childNodes.length === 0){
    throw Error("No html found")
  }
  else{
    tagReplacers = Object.fromEntries(Object.entries(tagReplacers).map(([k,v])=>([k.toLowerCase(), v]))) // lowercase all the tag names
    let children = Array.from(elements.childNodes).flatMap(c=>resolveAndConvertHtmlElement(c, tagReplacers, extraDefs, jsValContext)).filter(c=>c !== undefined) 
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

/* 
Svelte Style Components:

In script we are inside a function block with signature 
(Cle [cle module], params: {...}, state: {...}, style: String) => { 
  ... 
}
------- V1 -------

implicit return if omitted (lambda)
<script ComponentName>

  const otherComponent = await importRemoteComponent("./otherComponent.html")

  return ({ 
    definition: {
      sayHi = "Hello world!",
      onInit: $ => console.log($.sayHi)
    }
  }) || [{...definition}, {..'fromHtml' options}]
</script>

// as frmoHtml
<view ComponentName>
  <div>
    {{@sayHi}}
  </div>
</view>

<style ComponentName>
 div{ color: red }
</style>

------- V2 -------

<MyButton  Any Other Strings >

  <script>({
    let: {
      label: "Label"
    },

    style: "font-weight: 800",
    css: [style.setup()] // manual css style apply
  })</script>

  <_> or <view> or <template>
    <button class="colored">{{@label}}</button>
  </_>

  <style>
    .colored{
      color: blueviolet;
    }
  </style>

</MyButton>

*/

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction
const AsyncFunction = async function () {}.constructor;


const getHtmlComponentDefVersion = (text, component) => {
  if (component !== undefined && component !== ""){
    if (text.toUpperCase().includes("</"+component.toUpperCase()+">")){
      return 2
    }
    return 1
  }
  return 1
}

const resolveHtmlComponentDefV1Extractor = (text, component, viewTag='view')=>{

  const viewRegexPattern = "\\s*<"+viewTag+(component !== "" ? " "+component : '')+">([\\s\\S]*?)<\\/"+viewTag+">";
  const styleRegexPattern = "\\s*<style"+(component !== "" ? " "+component : '')+">([\\s\\S]*?)<\\/style>";
  const defRegexPattern = "\\s*<script"+(component !== "" ? " "+component : '')+">([\\s\\S]*?)<\\/script>";
  
  const viewRegex = new RegExp(viewRegexPattern, "gi")
  const styleRegex = new RegExp(styleRegexPattern, "gi")
  const defRegex = new RegExp(defRegexPattern, "gi")
  
  // original: 
  // const defRegex = /\s*<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  // const viewRegex = /\s*<view\b[^>]*>([\s\S]*?)<\/view>/gi;
  // _debug.log(defRegex, viewRegex)

  let viewContent = viewRegex.exec(text)?.[1]
  let styleContent = styleRegex.exec(text)?.[1]
  let defContent = defRegex.exec(text)?.[1]

  return {viewContent, styleContent, defContent}
}

const resolveHtmlComponentDefV2Extractor = (text, component)=>{
  
  const componentDefRegexPattern = "\\s*<"+component+""+"\\b[^>]*>([\\s\\S]*?)<\\/"+component+">";
  const componentDefRegex = new RegExp(componentDefRegexPattern, "gi")
  let componentDefContent = componentDefRegex.exec(text)?.[1]

  // todo: <MyComponent [options]="...">
  // const optionsContent = new RegExp("\\s*<"+component+""+"\\[options\\]=\"([\\s\\S]*?)\">", "gi").exec(text)?.[1]

  return {...resolveHtmlComponentDefV1Extractor(componentDefContent, '', componentDefContent.includes("<_>") ? '_' : ( componentDefContent.includes("<template>") ? 'template' : 'view'))}
}


const resolveHtmlComponentDef = async (text, {component="", params={}, state={}, DepsInj={}, externalDef=undefined}={})=>{

  // "utils" namespace in side .html components 
  const u = {
    /** import component defined in the same file by name */
    localComponent: (component, {params={}, state={}, DepsInj={}, externalDef=undefined}={})=>{ return resolveHtmlComponentDef(text, {component, params, state, DepsInj, externalDef})},
    localComponents: async (components)=>{ 
      let res = {}
      for (let [cname, args] of Object.entries(components)){
        res[cname] = await resolveHtmlComponentDef(text, {component: cname, ...(args ?? {})})
      }
      return res;
    }
  }
  
  const version = getHtmlComponentDefVersion(text, component)

  let {viewContent, styleContent, defContent} = version === 1 ? resolveHtmlComponentDefV1Extractor(text, component) : resolveHtmlComponentDefV2Extractor(text, component)
  
  let pureDefinition = {}
  // let definitionOptions = {}
  let definitionOptions = version === 1 ? { } : { autostyle: CLE_FLAGS.REMOTE_HTML_V2_AUTOSTYLE } // todo, autostyle for v2 components
  
  // _debug.log(defContent, viewContent, pureDefinition)
  
  if (defContent || externalDef){
    if (defContent && !defContent.includes("return")){
      defContent = "return ( " + defContent + " )"
    }
    const func = externalDef ? externalDef : new AsyncFunction("Cle", 'params', 'state', 'style', 'DepsInj', 'u', defContent);
    
    if (styleContent !== undefined){
      let oj_styleContent = styleContent
      styleContent = Object.assign(oj_styleContent, {setup: (valuesObj={})=>{
        let resolvedStyleContent = oj_styleContent
        Object.entries(valuesObj).forEach(([toReplace, val])=>{
          resolvedStyleContent = resolvedStyleContent.replaceAll(toReplace, val)
        })
        return resolvedStyleContent
      }})
    }

    let defs = await func(Cle, params, state, styleContent, DepsInj, u);

    if (defs !== undefined){
      if (Array.isArray(defs)){
        pureDefinition = defs[0]
        if (defs.length >= 2){
          definitionOptions = {...definitionOptions,  ...defs[1]}
        }
      }
      else {
        pureDefinition = defs
      }
    }
  }

  if (!viewContent){
    throw Error("No View Found")
  }

  if (styleContent !== undefined && definitionOptions.autostyle === true && pureDefinition.css === undefined){
    if (styleContent.setup !== undefined){
      pureDefinition.css = [ $ => styleContent.setup('cssVars' in $['this'] ? $.this.cssVars : {}) ]
    }
    else {
      pureDefinition.css = [styleContent]
    }
  }
  
  // _debug.log(defContent, viewContent, pureDefinition)

  return fromHtml(viewContent, pureDefinition, definitionOptions.deps, definitionOptions.extraDefs, {params, state, DepsInj, u})
}

const cachedRemoteHtmlComponents = new Map()

// export
const remoteHtmlComponent = async (fileName, {component="", params={}, state={}, DepsInj={}, autoExtension=true, cache=true, externalDef=undefined}={}) => { 
  if (autoExtension){
    fileName += fileName.endsWith(".html") ? '' : ".html"
  }
  
  try{
    let txt;

    if (cache && cachedRemoteHtmlComponents.has(fileName)){
      txt = cachedRemoteHtmlComponents.get(fileName)
    }
    else {
      let res = await fetch(fileName);
      if (!res.ok){
        console.log(res)
        throw new Error("REMOTE HTML REF ERROR")
      }
      txt = await res.text()

      if (cache){
        cachedRemoteHtmlComponents.set(fileName, txt)
      }
    }
    return resolveHtmlComponentDef(txt, {component, params, state, DepsInj, externalDef})
  }
  catch (e){
    throw new Error("REMOTE HTML REF ERROR: " + e)
  }
}

// export 
const remoteHtmlComponents = async (fileName, ...components)=>{
  let result = {}
  for (let component of components){
    let name = typeof component === 'string' ? {component} : component
    result[name] = await remoteHtmlComponent(fileName)
  }
  return result
}

// export
const fromHtmlComponentDef = async (txt, {component="", params={}, state={}, DepsInj={}, def=undefined}={}) => await resolveHtmlComponentDef(txt, {component, params, state, DepsInj, externalDef: def})

/** 
 * @param {string} remoteHtmlPath
 * @param {{
 *  component: undefined | string, 
 *  def: undefined | (Cle, params, state, style, DepsInj)=>Promise<[any, any] | [any]>,
 *  defArgMapper: (params: any, state: any, DepsInj: any)=>({params: any, state: any, DepsInj: any})
 * }} param - 
 * - def must be async, example: async (Cle, params, state, style, DepsInj)=>{return [{}, {}]}
 * - Use defArgMapper to handle external args and remap it. eg to add some deps injection or state handling..
 */
const defineHtmlComponent = (remoteHtmlPath, {component=undefined, isRemote=true, autoExtension=true, cache=true, def=undefined, defArgMapper= async (params={}, state={}, DepsInj={})=>({params, state, DepsInj})}) => {
  return async (params={}, state={}, DepsInj={})=> {
    let resolvedParams = await defArgMapper(params, state, DepsInj)
    return isRemote ? 
      remoteHtmlComponent(remoteHtmlPath, {component, params: resolvedParams.params ?? params, state: resolvedParams.state ?? state, DepsInj: resolvedParams.DepsInj ?? DepsInj, autoExtension, cache, externalDef: def}) : 
      resolveHtmlComponentDef(remoteHtmlPath, {component, params: resolvedParams.params ?? params, state: resolvedParams.state ?? state, DepsInj: resolvedParams.DepsInj ?? DepsInj, externalDef: def});
  }
}

const defineHtmlComponents = (remoteHtmlPath, ...components) => {
  return Object.fromEntries(components.map(c=>[c.component, defineHtmlComponent(remoteHtmlPath, c)]))
}


//// utils per imports in remoteComponents
// export 
const importAll = async (deps={}) => {
  let deps_with_pre_post_processing = Object.entries(deps).map(([name, dep])=>({name: name, depImporterPromise: dep instanceof Promise ? dep : dep[0], postProcessing: dep instanceof Promise ? ((v)=>v) : dep[1]  }));
  // console.log(deps_with_pre_post_processing)
  let imported = await Promise.all(deps_with_pre_post_processing.map(d=>d.depImporterPromise));
  return Object.fromEntries(imported.map((dep, i)=>[deps_with_pre_post_processing[i].name, deps_with_pre_post_processing[i].postProcessing(dep) ]));
}


const globalImportAll = async (deps={}) => {
  let deps_with_pre_post_processing = Object.entries(deps).map(([name, dep])=>({name: name, depImporterPromise: dep instanceof Promise ? dep : dep[0], postProcessing: dep instanceof Promise ? ((v)=>v) : dep[1]  }));
  // console.log(deps_with_pre_post_processing)
  let imported = await Promise.all(deps_with_pre_post_processing.map(d=>d.depImporterPromise));
  let res = Object.fromEntries(imported.map((dep, i)=>[deps_with_pre_post_processing[i].name, deps_with_pre_post_processing[i].postProcessing(dep) ]));
  if (window.globalCleImports === undefined){
    return window.globalCleImports = res
  }
  else {
    return window.globalCleImports = {...window.globalCleImports, ...res}
  }
}
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// export
/**
 * Cle Dependency Injection via tags
 * 
 * Define and use components by tag name without importing (Dependency Injection)
 * - to use a defined component in registry simply define it in the tree using the name with a prefix:
 *    - 'component-' | 'component_'  ->   pure component
 *    - 'use-' | 'use_'  ->   Use component
 *    - 'extended-' | 'extended_'   ->   Extended component
 * 
 * example: 
 * 
 * ComponentRegistry.define({ Rectangle: {
 *  ...def...
 * }})
 * 
 * usage:
 * 
 * { div: { childs: [
 * 
 *    { 'use-Rectangle': {...Use overrides...} } // overrides only
 * 
 *    { 'use-Rectangle': [{...Use overrides...}, ...UseArgs] } // full Use args
 * 
 *  ]
 * }}
 * 
 */
const ComponentsRegistry = new (class _ComponentsRegistry {
  constructor(){
    this.components = {}
  }

  /**
   * 
   * @param {any} definition 
   * @param {'div' | string | null} baseHtmlElement - define the base html element. use null to set as the component name
   */
  define(definition, baseHtmlElement=CLE_FLAGS.COMPONENT_REGISTRY_BASE_HTML_EL, forceOverwrite=false){

    let name = getComponentType(definition)
    let def = definition[name]

    let template = {[baseHtmlElement ?? name]: def}

    let lower_name = name.toLowerCase()

    if (!forceOverwrite && this.components['component_'+lower_name] !== undefined){
      throw Error("Components Registry - Redefiniton Error")
    }

    this.components['component_'+lower_name] = this.components['component-'+lower_name] = (overrides={}, ...extrachilds)=>{
      let declared_def = def

      if (typeof declared_def === 'function'){
        
        declared_def = declared_def(overrides)

        if (overrides?.extra_use_args !== undefined ){
          overrides = overrides?.extra_use_args
        }
        else {
          overrides = {}
        }
      }

      if (overrides !== undefined && typeof declared_def === "object") {
        
        let oj_def_extrachilds = {}
        let ovverides_def_extrachilds = {}

        let oj_childs_def_type = getUsedChildsDefTypology(declared_def)
        if (oj_childs_def_type !== null){
          oj_def_extrachilds =  {[oj_childs_def_type]: [...declared_def[oj_childs_def_type], ...extrachilds]}
        }

        let overrides_childs_def_type = getUsedChildsDefTypology(overrides)
        if (overrides_childs_def_type !== null){
          ovverides_def_extrachilds =  {[overrides_childs_def_type]: [...overrides[overrides_childs_def_type], ...extrachilds]}
        }

        return {[baseHtmlElement ?? name]: {...declared_def, ...oj_def_extrachilds, ...overrides, ...ovverides_def_extrachilds}} 
      } else {
        return {[baseHtmlElement ?? name]: declared_def}
      }
    }; // full overried!
    this.components['use_'+lower_name] = this.components['use-'+lower_name] = (overrides, args, ...extrachilds)=>{
      let declared_def = def
      let declared_template = template

      if (typeof declared_def === 'function'){
        
        declared_def = declared_def(overrides)
        declared_template = {[baseHtmlElement ?? name]: declared_def}

        if (overrides?.extra_use_args !== undefined ){
          overrides = overrides?.extra_use_args
        }
        else {
          overrides = {}
        }
      }

      return Use(declared_template, overrides, args, extrachilds)
    };
    this.components['extended_'+lower_name] = this.components['extended-'+lower_name] = (overrides, args, ...extrachilds)=>{
      let declared_def = def
      let declared_template = template

      if (typeof declared_def === 'function'){
        
        declared_def = declared_def(overrides)
        declared_template = {[baseHtmlElement ?? name]: declared_def}

        if (overrides?.extra_use_args !== undefined ){
          overrides = overrides?.extra_use_args
        }
        else {
          overrides = {}
        }
      }

      return Extended(declared_template, overrides, args, extrachilds)
    };

  }

  /**
   * @param {string} fullname - complete name (with prefix)
   */
  has(fullname){
    return fullname.toLowerCase() in this.components
  }

  /**
   * 
   * @param {string} fullname - complete name (with prefix)
   * @returns { (()=>any) | (overrides: any, args: any, ...extrachilds: any[])=>(Use() | Extended()) } } 
   */
  get(fullname){
    return this.components[fullname.toLowerCase()]
  }

  /**
   * 
   * @param {string} name - registered name (without prefix)
   */
  remove(name){
    
    let lower_name = name.toLowerCase()

    delete this.components['component_'+lower_name]
    delete this.components['component-'+lower_name]
    delete this.components['use_'+lower_name]
    delete this.components['use-'+lower_name]
    delete this.components['extended_'+lower_name]
    delete this.components['extended-'+lower_name]

  }

  reset(){
    this.components = {}
  }

})();

// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// Exports - remember to export also in index.js

const Cle = { CLE_FLAGS, pass, none, smart, f: smartFunc, fArgs: smartFuncWithCustomArgs, asFunc, Use, Extended, Placeholder, Bind, Alias, SmartAlias, PropertyBinding, DefineSubprops, ExternalProp, useExternal, BindToProp: BindToPropInConstructor, Switch, Case, LazyComponent: LazyComponentCreation, UseShadow: ShadowRootComponentCreator, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, cle, str, str_, input, output, ExtendSCSS, clsIf, html: fromHtml, remoteHtmlComponent, remoteHtmlComponents, fromHtmlComponentDef, defineHtmlComponent, defineHtmlComponents, importAll, globalImportAll, ComponentsRegistry }

export { CLE_FLAGS, pass, none, smart, smartFunc as f, smartFuncWithCustomArgs as fArgs, asFunc, Use, Extended, Placeholder, Bind, Alias, SmartAlias, PropertyBinding, DefineSubprops, ExternalProp, useExternal, BindToPropInConstructor as BindToProp, Switch, Case, LazyComponentCreation as LazyComponent, ShadowRootComponentCreator as UseShadow, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, cle, str, str_, input, output, ExtendSCSS, clsIf, fromHtml as html, remoteHtmlComponent, remoteHtmlComponents, fromHtmlComponentDef, defineHtmlComponent, defineHtmlComponents, importAll, globalImportAll, ComponentsRegistry }

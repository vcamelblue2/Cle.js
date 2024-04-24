/**
 * 
 * @param {string} name declared variable name (must be the same of the assignment)
 * @param {string | Promise} fetchFuncOrUrl 
 * @param {((response)=>any)} transformer 
 * @param {number} _async 
 * @param {string} UUID 
 * @returns {(($) => any)}
 * 
 * Usage:
 * let: {
 *    serverTime: useRemoteData('serverTime', "/services/com_company_parametric/api/time", response => new Date(response))
 * }
 */
export const useRemoteData = (name, fetchFuncOrUrl, transformer=undefined, _async=1, UUID=undefined)=>{ 
  const props = {loading: false, value: undefined, error: undefined, reload: ()=>{}}

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
    else { // setup!
      let obj = {}

      const fire_change_detection = ()=>{
        if(_async>0){
          setTimeout(()=>$['this']['_mark_'+name+'_as_changed'](), _async)
        }
        else {
          $['this']['_mark_'+name+'_as_changed']()
        }
      }

      const fetch_remote_Data = () => {
        setTimeout( async () => {
          obj.loading = true  // autofire!
          try {
            if (typeof fetchFuncOrUrl === 'string'){
              const res = await fetch(fetchFuncOrUrl);
              const content = JSON.parse(await res.text())
              obj._value = transformer ? transformer(content) : content
              obj._loading = false
            }
            else {
              const content = await fetchFuncOrUrl()
              obj._value = transformer ? transformer(content) : content
              obj._loading = false
            }
          }
          catch(e){
            obj._error = e
            obj._loading = false
          }
          finally{
            fire_change_detection()
          }
        }, _async);
      }
      
      Object.keys(props).forEach(k=>{

        obj['_'+k]=props[k]

        Object.defineProperty(obj, k, {

          get(){
            return obj['_'+k]
          },
          set (v) {
            obj['_'+k]=v
            fire_change_detection()
          }
        })

      })

      Storage[UUID+name] = obj
      
      // setup reload
      obj._reload = fetch_remote_Data

      // exec fetch!
      fetch_remote_Data()
      
      return obj
    }
  }

  return $=>F($,name,props,UUID)
}
/**
 * 
 * @param {string} name declared variable name
 * @param {string | Promise} fetchFuncOrUrl 
 * @param {((response)=>any)} transformer 
 * @param {number} autoReloadEvery 
 * @param {number} _async 
 * @param {string} UUID 
 * @returns {any}
 * 
 * Usage:
 * { div: {
 *    ...useAutoRefreshRemoteData('serverTime', "/services/com_company_parametric/api/time", response => new Date(response), 10000)
 * }}
 */
export const useAutoRefreshRemoteData = (name, fetchFuncOrUrl, transformer=undefined, autoReloadEvery=5000, _async=1, UUID=undefined)=>{ 
  const p = useRemoteData(name, fetchFuncOrUrl, transformer, _async, UUID)

  return { 
    [name]: p,

    ['dir_useRemoteDataAutoReload'+name]: {
      onInit: $=>{
        const int = setInterval(()=>{$.this[name]?.reload()}, autoReloadEvery)
        return ()=>clearInterval(int)
      }
    }
  }
}
/**
 * 
 * @param {string} name declared variable name
 * @param {string | Promise} fetchFuncOrUrl 
 * @param {((response)=>any)} transformer 
 * @param {(($) => any)} autoReloadOnProps 
 * @param {number} _async 
 * @param {string} UUID 
 * @returns {any}
 * 
 */
export const useRemoteDataOnPropsChange = (name, fetchFuncOrUrl, transformer=undefined, autoReloadOnProps=$=>{}, _async=1, UUID=undefined)=>{ 
  const p = useRemoteData(name, fetchFuncOrUrl, transformer, _async, UUID)

  return { 
    [name]: p,

    ['let___useRemoteDataAutoReload__followed_prop__'+name]: autoReloadOnProps,
    ['on_this___useRemoteDataAutoReload__followed_prop__'+name+'Changed']: $ => $.this[name]?.reload()
  }
}

/**
 * 
 * @param {string} name declared variable name
 * @param {(($) => any)} evaluable 
 * @param {number} interval 
 * @returns {any}
 */
export const useInterval = (name, evaluable, interval=1000)=>({
  ['let_'+name]: undefined,

  ['dir_useInterval'+name]: {
    onInit: $=>{
      const int = setInterval(()=>{$.this[name] = evaluable.bind($)}, interval)
      return ()=>clearInterval(int)
    }
  }
})

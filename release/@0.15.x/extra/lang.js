import { f, fArgs,  asFunc } from "../lib/caged-le.js"
const __noset__ = function(){};
  
// SCOPE
export const get = new Proxy({}, {
  get: (_, tag) => f("$."+tag, true),
  set: __noset__
})
export const fun = get
export const set = new Proxy({}, {
  get: (_, tag) => asFunc(fArgs("v")("($."+tag+" = v)", true)),
  set: __noset__
})

const _scope_mapping_ = {
  get: get,
  set: set
}
export const scope = new Proxy({}, {
  get: (_, kind)=>_scope_mapping_[kind],
  set: __noset__
})

// THIS
const _this_mapping_ = {
  get: new Proxy({}, {
    get: (_, tag) => f("$.this."+tag, true),
    set: __noset__
  }),
  set: new Proxy({}, {
    get: (_, tag) => asFunc(fArgs("v")("($.this."+tag+" = v)", true)),
    set: __noset__
  })
}
export const this_ = new Proxy({}, {
  get: (_, kind)=>_this_mapping_[kind],
  set: __noset__
})

// META
const _meta_mapping_ = {
  get: new Proxy({}, {
    get: (_, tag) => f("$.meta."+tag, true),
    set: __noset__
  }),
  set: new Proxy({}, {
    get: (_, tag) => asFunc(fArgs("v")("($.meta."+tag+" = v)", true)),
    set: __noset__
  })
}
export const meta = new Proxy({}, {
  get: (_, kind)=>_meta_mapping_[kind],
  set: __noset__
})

// PARENT
const _parent_mapping_ = {
  get: new Proxy({}, {
    get: (_, tag) => f("$.parent."+tag, true),
    set: __noset__
  }),
  set: new Proxy({}, {
    get: (_, tag) => asFunc(fArgs("v")("($.parent."+tag+" = v)", true)),
    set: __noset__
  })
}
export const parent = new Proxy({}, {
  get: (_, kind)=>_parent_mapping_[kind],
  set: __noset__
})

// LE
const _le_by_id_ = new Proxy({}, {
  get: (_, uid)=>{
    return {
      get: new Proxy({}, {
        get: (_, tag) => f("$.le."+uid+'.'+tag, true),
        set: __noset__
      }),
      set: new Proxy({}, {
        get: (_, tag) => asFunc(fArgs("v")("($.le."+uid+'.'+tag+" = v)", true)),
        set: __noset__
      })
    }[uid]
  },
  set: __noset__
})
export const le = new Proxy({}, {
  get: (_, kind)=>_le_by_id_[kind],
  set: __noset__
})

// CTX
const _ctx_by_id_ = new Proxy({}, {
  get: (_, uid)=>{
    return {
      get: new Proxy({}, {
        get: (_, tag) => f("$.ctx."+uid+'.'+tag, true),
        set: __noset__
      }),
      set: new Proxy({}, {
        get: (_, tag) => asFunc(fArgs("v")("($.ctx."+uid+'.'+tag+" = v)", true)),
        set: __noset__
      })
    }[uid]
  },
  set: __noset__
})
export const ctx = new Proxy({}, {
  get: (_, kind)=>_ctx_by_id_[kind],
  set: __noset__
})

// REF
const _ref_by_id_ = new Proxy({}, {
  get: (_, uid)=>{
    return {
      get: new Proxy({}, {
        get: (_, tag) => f("$.ref."+uid+'.'+tag, true),
        set: __noset__
      }),
      set: new Proxy({}, {
        get: (_, tag) => asFunc(fArgs("v")("($.ref."+uid+'.'+tag+" = v)", true)),
        set: __noset__
      })
    }[uid]
  },
  set: __noset__
})
export const ref = new Proxy({}, {
  get: (_, kind)=>_ref_by_id_[kind],
  set: __noset__
})

// equals to $
let _self_mapping_ = {
  'get': get,
  'set': set,
  'fun': fun,
  'scope': scope,
  'this': this_,
  'meta': meta,
  'parent': parent,
  'le': le,
  'ctx': ctx,
  'ref': ref,
}
export const self = new Proxy({}, {
  get: (_, kind)=>_self_mapping_[kind],
  set: __noset__
})

export const T = self
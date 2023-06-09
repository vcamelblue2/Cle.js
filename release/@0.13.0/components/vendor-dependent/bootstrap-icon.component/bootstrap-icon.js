import {pass, none, smart, f, fArgs, Use, cle, Extended, Placeholder, Bind, Alias, SmartAlias, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp, LE_BackendApiMock, str, input, ExtendSCSS, clsIf} from "../../../lib/caged-le.js"

export const config = {
    version: "1.3.0",
    cdn: function (){return "https://cdn.jsdelivr.net/npm/bootstrap-icons@"+this.version+"/font/bootstrap-icons.css"},
    loadedEl: undefined
}

export const BootstrapIcon = { i: {
    ...input("icon", ""),
    ...input("autoLoadCDN", true),
    ...input("autoUnloadCDN", false),
    
    onInit: async $ => {
        $.this.autoLoadCDN && await $.this.loadCDN()
    },

    onDestroy: async $ => {
        $.this.autoUnloadCDN && await $.this.unloadCDN()  
    },

    def_loadCDN: async ()=>{
        config.loadedEl = await LE_LoadCss(config.cdn())
    },
    def_unloadCDN: async ()=>{
        config.loadedEl?.LE_removeStyle()
        config.loadedEl = undefined
    },

    a_class: f`@icon`,
}}

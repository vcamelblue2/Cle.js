export const StandardComponent = { div: {
    text: "Hi From Standard Component Imported in Remote Component"
}}

export const StandardComponentWithGlobalDI = { div: {
    text: [
        "Hi From Standard Component Imported in Remote Component That Use Global DI Component",
        
        {br: {}},

        // Zero import required / IoC
        // { 'component-I_Rectangle': {} }, // simple usage only
        // { 'use-I_Rectangle':  { "ha_style.color": "red" }}, // extension with use
        { 'use-I_Rectangle': [{ "ha_style.color": "red" }, undefined, {b: ", Hello!"}] } // extension with use and args, plus extra childs!
    ]
}}
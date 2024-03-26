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
        { 'use-I_Rectangle': [{ "ha_style.color": "red" }, undefined, {b: ", Hello!"}] }, // extension with use and args, plus extra childs!
        {br: {}},
        { 'use-I_RectangleAsFunc': [{ "ha_style.color": "red", extra_use_args: {'ha_style.fontWeight': 600}}, undefined, {b: ", Hello!"}] } // extension of function like with use (in extra_use_args) and args, plus extra childs!
    ]
}}  
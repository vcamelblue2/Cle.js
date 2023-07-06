export const StandardComponent = { div: {
    text: "Hi From Standard Component Imported in Remote Component"
}}

export const StandardComponentWithGlobalDI = { div: {
    text: [
        "Hi From Standard Component Imported in Remote Component That Use Global DI Component",
        
        {br: {}},
        
        { 'use-I_Rectangle': {} } // Zero import required / IoC
    ]
}}
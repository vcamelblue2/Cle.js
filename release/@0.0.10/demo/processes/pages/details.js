import {Router} from "../router/routing.js"
import {processModelApi} from "../model/api.js"

import { MainLayout } from "../layouts/base.js"

export const DetailsPage = async (state={})=>{ return {
  div: {

    props: {
      selected_project: state.selected_project,
      selected_instance_id: state.selected_instance_id
    },

    onInit: $=>{
      if ($.this.selected_project === undefined){
        console.log("nothing to do: going back..")
        setTimeout(()=>{Router.navigate("home")}, 1000)
      }
    },

    attrs: { style: "width: 100%; height: 100%; padding: 0px; margin: 0px;" },

    css: [
      `
      * { box-sizing: border-box !important;}

      body { padding: 0px; margin: 0px; }
      `
    ],

    "=>": MainLayout({ 

      NavbarContents: [
        { div: { text: "Home > Process Details", 'ha.style.fontSize': "2.5rem" }}
      ],

      SidebarComponents: [

        { div: { 'a.style': {fontWeight: "600", fontSize: "2.5rem", paddingBottom: "0px", marginTop: '25px', marginBottom: '25px'}, text: "Projects"}},

      ], 

      MainContentComponents: [
        
        // if any selected
        { div: { meta: { if: $=>$.scope.selected_project!==undefined},
      
          props: {
            project: $=>$.scope.selected_project, //{id: "p0", name: "proj1"},
            // selected_instance_id: $=>$.parent.selected_instance_id, // "i0"
            
            instance: undefined
          },
          
          onInit: async $=>{
            await $.this.api.getInstance()
          },
          
          def: {
            api: {
              getInstance: async $=>{
                $.scope.instance = await processModelApi.getInstance({project_id: $.scope.project.id, instance_id: $.scope.selected_instance_id})
              },
              setProcessPointer: async ($, new_process_pointer)=>{
                await processModelApi.setProcessPointer({project_id: $.scope.project.id, instance_id: $.scope.selected_instance_id, new_process_pointer: new_process_pointer});
                await $.this.api.getInstance()
              }
            }
          },
          
          a: {style: {width: "100%", padding: "15px"}},

          "=>": [

            { div: { meta: {if: $=>$.scope.instance !== undefined},

              
              "=>": [
                {h3: {text: $=> $.scope.instance.name, a:{style:{margin: "0px"}}}}, 
                // {br:{}}, 
                {h5: {text: $=> $.scope.project.name, a:{style:{margin: "0px", marginTop: "5px"}}}}, 
              ]
            }},

            { div: { meta: { forEach: "process", of: $=>$.scope.instance?.process || [], define: { index:"process_idx" } },
              
              a: {style: {marginTop: "25px"}},

              "=>":[
                { div: { 
          
                  a: {style: $=>({
                    width: "60px", height: "60px", display: "inline-block", 
                    borderRadius: "10px", marginTop: "10px",
                    color: "white",
                    backgroundColor: $.meta.process_idx <= $.scope.instance.process_pointer ? "#27ae60" : "#c0392b"
                  })},
                  
                  handle: { onclick: $=>{ 
                    let pointer = $.scope.instance.process_pointer
                    if (pointer === $.meta.process_idx){
                      pointer = $.meta.process_idx-1
                    }
                    else {
                      pointer = $.meta.process_idx
                    }
                    $.scope.api.setProcessPointer(pointer)
                  }},
                  
                  text: { div: { a:{style:"width: 100%; height: 100%; display:flex; justify-content: center; align-items: center"}, text: $ => $.meta.process}},
                  
                }},

                { input: {a:{style:"margin-left: 15px; border-top: none; border-left:none; border-right:none; width: 200px; background: transparent", value: "an example of some note!"}}}
              ]
            }},
          ]
          
        }},

        // else
        { div: { meta: { if: $=>$.scope.selected_project===undefined},
          text: "nothing selected.."
        }} 

      ]
    })
  }
}}
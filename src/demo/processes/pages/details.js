import {Router} from "../router/routing.js"
import {processModelApi} from "../model/api.js"

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

    "=>": [
      
      // if any selected
      { div: { meta: { if: $=>$.scope.selected_project!==undefined},
    
        props: {
          project: $=>$.parent.selected_project, //{id: "p0", name: "proj1"},
          selected_instance_id: $=>$.parent.selected_instance_id, // "i0"
          
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
        
        a: {style: {width: "100%", marginTop: "20px", paddingBottom: "25px"}},

        "=>": [

          { div: { meta: {if: $=>$.scope.instance !== undefined},

            a: {style: {marginBottom: "25px"}},
            
            "=>": [
              {h3: {text: $=>"Project: " + $.scope.project.name, a:{style:{margin: "5px"}}}}, 
              // {br:{}}, 
              {h5: {text: $=>"Pocess: " + $.scope.instance.name, a:{style:{margin: "5px"}}}}, 
            ]
          }},

          { div: { meta: { forEach: "process", of: $=>$.scope.instance?.process || [], define: { index:"process_idx" } },
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

              { input: {a:{style:"margin-left: 15px; border-top: none; border-left:none; border-right:none; width: 200px", value: "an example of some note!"}}}
            ]
          }},
        ]
        
      }},

      // else
      { div: { meta: { if: $=>$.scope.selected_project===undefined},
        text: "nothing selected.."
      }}

    ]
  }
}}
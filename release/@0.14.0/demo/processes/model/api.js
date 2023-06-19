import {LE_BackendApiMock} from "../../../lib/caged-le.js"

class ProcessModelApi extends LE_BackendApiMock{
    constructor(apiSpeed=50){
      super(apiSpeed)
      this.projects =  [
        { 
          id: "p0",
          name: "Proj1", 
          templates: [ {id: "t0", process: ["a", "b", "c", "d", "e", "f"], typology: "sequential"} ],
          instances: [ {id: "i0", name: "Spain", template_id: "t0", process_pointer: -1} ]
        },
        { 
            id: "p1",
            name: "Proj2", 
            templates: [ {id: "t0", process: ["a", "b", "c"], typology: "sequential"} ],
            instances: [ {id: "i0", name: "Italy", template_id: "t0", process_pointer: -1} ]
          }
      ]
    }
    
    getProjects(){
      let projects = this.projects.map(p=>({id: p.id, name: p.name, instances: p.instances.map(i=>{
        let num_process = p.templates.find(t=>t.id===i.template_id).process.length
        return {id: i.id, name: i.name, done: i.process_pointer+1, todo: num_process}
      })}))
      return this.response(projects)
    }
    
    getInstance(args){
      let { project_id, instance_id } = this.request(args)
      
      let proj = this.projects.find(p=>p.id === project_id)
      let instance = {...proj.instances.find(i=>i.id === instance_id)}
      let template = proj.templates.find(t=>t.id === instance.template_id)
      instance = {...instance, process: template.process, typology: template.typology }
      
      return this.response(instance)
    }
    
    setProcessPointer(args){
      let { project_id, instance_id, new_process_pointer } = this.request(args)
      
      let proj = this.projects.find(p=>p.id === project_id)
      let instance = proj.instances.find(i=>i.id === instance_id)
      instance.process_pointer = new_process_pointer
      
      return this.response({result: true})
    }
  }
  
  export const processModelApi = new ProcessModelApi()
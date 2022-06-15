import {LE_BackendApiMock} from "../../../lib/caged-le.js"

class GanttModelApi extends LE_BackendApiMock{
    constructor(apiSpeed=20){
      super(apiSpeed)
      try {
        this.__loadFromDisk()
      }
      catch {
        this.task_id_gen = 4
        this.projects =  [
          { 
            id: "p0",
            name: "Proj 1",
            startDate: "2022-06-01",
            activities: [
              { id: "task1", name: "Task 1", color: "green", start: 0, len: 30, subtasks: [{idx: 20, name: "M", description:""}]},
              { id: "task2", name: "Task 2", color: "green", start: 15, len: 30, subtasks: []},
              { id: "task3", name: "Task 3", color: "green", start: 30, len: 45, subtasks: []}
            ]
          }
        ]
        this.__storeToDisk()
      }
    }
    __loadFromDisk(){
      let saved = JSON.parse(localStorage.getItem("com.cle-demo.gantt::model"))
      console.log(saved)
      if (saved !== null && saved !== undefined){
        this.task_id_gen = saved.task_id_gen
        this.projects = saved.projects
      }
      else {
        throw Error()
      }
    }
    __storeToDisk(){
      localStorage.setItem("com.cle-demo.gantt::model", JSON.stringify({task_id_gen: this.task_id_gen, projects: this.projects}))
    }

    getProjects(){
      return this.response(this.projects.map(p=>({id: p.id, name: p.name})))
    }
    getProject(id='p0'){
      return this.response(this.projects.find(p=>p.id===id))
    }
    editActivity(project_id, activity, edits){
      let activity_ptr = this.projects.find(p=>p.id===project_id).activities.find(a=>a.id===activity.id)
      activity_ptr.name=edits.name
      activity_ptr.color=edits.color
      activity_ptr.start=edits.start
      activity_ptr.len=edits.len

      this.__storeToDisk()
      return this.response(activity_ptr)
    }
    addActivity(project_id, activity){
      let proj_ptr = this.projects.find(p=>p.id===project_id)
      proj_ptr.activities.push({...activity, id: "task"+(this.task_id_gen++), subtasks:[]})

      this.__storeToDisk()
      return this.response({})
    }
    deleteActivity(project_id, activity_id){
      let proj_ptr = this.projects.find(p=>p.id===project_id)
      proj_ptr.activities = proj_ptr.activities.filter(a=>a.id !== activity_id)
      
      this.__storeToDisk()
      return this.response({})
    }
    moveActivityUp(project_id, activity_idx){
      let proj_ptr = this.projects.find(p=>p.id===project_id)
      if (activity_idx === 0){
        throw Error("cannot move up")
      }
      
      [ proj_ptr.activities[activity_idx-1], proj_ptr.activities[activity_idx] ] = [ proj_ptr.activities[activity_idx], proj_ptr.activities[activity_idx-1] ]      

      this.__storeToDisk()
      return this.response({new_idx: activity_idx-1})
    }
    moveActivityDown(project_id, activity_idx){
      let proj_ptr = this.projects.find(p=>p.id===project_id)
      if (activity_idx === proj_ptr.activities.length-1){
        throw Error("cannot move down")
      }

      [ proj_ptr.activities[activity_idx+1], proj_ptr.activities[activity_idx] ] = [ proj_ptr.activities[activity_idx], proj_ptr.activities[activity_idx+1] ]
      
      this.__storeToDisk()
      return this.response({new_idx: activity_idx+1})
    }
    moveActivityLeft(project_id, activity){
      let activity_ptr = this.projects.find(p=>p.id===project_id).activities.find(a=>a.id===activity.id)
      if (activity_ptr.start === 0){
        throw Error("cannot move left")
      }
      activity_ptr.start--
      
      this.__storeToDisk()
      return this.response({new_start: activity_ptr.start})
    }
    moveActivityRight(project_id, activity){
      let activity_ptr = this.projects.find(p=>p.id===project_id).activities.find(a=>a.id===activity.id)
      activity_ptr.start++

      this.__storeToDisk()
      return this.response({new_start: activity_ptr.start})
    }
    incrementActivityLen(project_id, activity){
      let activity_ptr = this.projects.find(p=>p.id===project_id).activities.find(a=>a.id===activity.id)
      activity_ptr.len++

      this.__storeToDisk()
      return this.response({new_len: activity_ptr.len})
    }
    decrementActivityLen(project_id, activity){
      let activity_ptr = this.projects.find(p=>p.id===project_id).activities.find(a=>a.id===activity.id)
      if (activity_ptr.len === 0){
        throw Error("cannot move left")
      }
      activity_ptr.len--

      this.__storeToDisk()
      return this.response({new_len: activity_ptr.len})
    }
    editSubTasks(project_id, activity, subTasks){
      let activity_ptr = this.projects.find(p=>p.id===project_id).activities.find(a=>a.id===activity.id)
      activity_ptr.subtasks = subTasks

      this.__storeToDisk()
      return this.response({})
    }
    editSubTask(project_id, activity, subTask, edits){
      let subtask_ptr = this.projects.find(p=>p.id===project_id).activities.find(a=>a.id===activity.id).subtasks.find(s=>s.idx===subTask.idx)
      subtask_ptr.idx = edits.idx
      subtask_ptr.name = edits.name
      subtask_ptr.description = edits.description
      this.__storeToDisk()
      return this.response({})
    }
    
  }
  
  export const ganttModelApi = new GanttModelApi()
import { range } from "./utils.js";

const subsubsubchild1 = { type: "Text", definition: "Hello", childs: [] };
const subsubchild1 = { type: "Model", definition: '{\n  id: "toolbarModel",\n  props: {\n    todolist: []\n  }\n}\n', childs: [] };
const subsubchild2 = { type: "p", definition: '{\n  id: "detail"\n}\n', childs: [subsubsubchild1] };
const subchild1 = { type: "div", definition: '{\n  id: "toolbar"\n}\n', childs: [subsubchild1, subsubchild2] };
const subchild2 = { type: "input", definition: '{\n  id: "todoInput"\n}\n', childs: [] };
const subchild3 = { type: "span", definition: '{\n  id: "latestTodo"\n}\n', childs: [] };
const initialAppDef = { type: "div", definition: '{\n  id: "app",\n  props: {\n    myVar: 123\n  }\n}\n', childs: [subchild1, subchild2, subchild3] };

const accessToChildByPointer = (appDefinition, pointer) => {
  let pointedDefinition = appDefinition;

  for (let pointer_part of pointer) {
    pointedDefinition = pointedDefinition.childs[pointer_part];
  }

  return pointedDefinition;

};

export const Model = {
  Model: {
    id: "model",

    props: {
      globalDef: 'console.log("init preview..")',
      appDef: initialAppDef,
      actualPointer: [],

      visibleRoot: $ => accessToChildByPointer($.this.appDef, $.this.actualPointer),
      nextPointers: $ => range(0, $.this.visibleRoot.childs.length),
      canGoNext: $ => $.this.nextPointers.length > 0,
      canGoBack: $ => $.this.actualPointer.length > 0
    },

    def: {
      childHasSubchilds: ($, idx) => {
        return $.this.visibleRoot.childs[idx].childs.length > 0;
      },

      goNext: ($, idx) => {
        // console.log("can go next?", $.this.canGoNext, $.this.nextPointers)
        if ($.this.visibleRoot.childs[idx].childs.length > 0) {
          $.this.actualPointer = [...$.this.actualPointer, idx];
        }
      },

      goBack: $ => {
        if ($.this.canGoBack) {
          $.this.actualPointer.pop();
          $.this.actualPointer = [...$.this.actualPointer];
        }
      },

      getParentTypology: $ => {
          if ($.this.canGoBack){
            return accessToChildByPointer($.this.appDef, $.this.actualPointer.slice(0, $.this.actualPointer.length-2)).type
          }
          return ""
      },

      editTree: {
          addNewChild: $=>{
            $.this.visibleRoot.childs = [...$.this.visibleRoot.childs, {type: "div", definition:'{\n  \n}', childs:[]}]
            $.this._mark_appDef_as_changed()
            $.this._mark_actualPointer_as_changed()
          },
          dropRoot: $=>{
              if($.this.canGoBack){
                let previus_pointer = $.this.actualPointer.slice(0, $.this.actualPointer.length-2)
                let previusRoot = accessToChildByPointer($.this.appDef, previus_pointer)
                let previusRootIdx = $.this.actualPointer[$.this.actualPointer.length-1]
                previusRoot.childs = previusRoot.childs.filter((c, c_idx)=>c_idx !== previusRootIdx)
                $.this.actualPointer = previus_pointer
                $.this._mark_appDef_as_changed()
              }
          },
          addNewChildToChild: ($, child_idx)=>{
            let child = $.this.visibleRoot.childs[child_idx]

            child.childs = [...child.childs, {type: "div", definition:'{\n  \n}', childs:[]}]
            $.this.visibleRoot.childs = [...$.this.visibleRoot.childs]
            $.this._mark_appDef_as_changed()
            $.this._mark_actualPointer_as_changed()
          },
          dropChild: ($, idx)=>{
            $.this.visibleRoot.childs = $.this.visibleRoot.childs.filter((c, c_idx)=>c_idx !== idx)
            $.this._mark_appDef_as_changed()
            $.this._mark_actualPointer_as_changed()
          },
          moveChildLeft: ($, idx)=>{
            let child = $.this.visibleRoot.childs[idx]
            $.this.visibleRoot.childs = $.this.visibleRoot.childs.filter(c=>c!==child)
            $.this.visibleRoot.childs.splice(idx-1, 0, child)
            $.this._mark_appDef_as_changed()
            $.this._mark_actualPointer_as_changed()
          },
          moveChildRight: ($, idx)=>{
            let child = $.this.visibleRoot.childs[idx]
            $.this.visibleRoot.childs = $.this.visibleRoot.childs.filter(c=>c!==child)
            $.this.visibleRoot.childs.splice(idx+1, 0, child)
            $.this._mark_appDef_as_changed()
            $.this._mark_actualPointer_as_changed()
          },
          editRootType: ($, type)=>{
            $.this.visibleRoot.type = type
          },
          editChildType: ($, type, idx)=>{
            $.this.visibleRoot.childs[idx].type = type
          },
          editRootDefinition: ($, def)=>{
            $.this.visibleRoot.definition = def
          },
          editChildDefinition: ($, def, idx)=>{
            $.this.visibleRoot.childs[idx].definition = def
          }
      },

      tmpBiutifyEl: ($, component, isRoot = true) => {
        if (component !== undefined && typeof component.definition !== "string")
        //   return ($.this.actualPointer.length + (isRoot ? 0 : 1)) + ") " + component.type.toUpperCase() + "\n\n" + JSON.stringify(component.definition, undefined, 2).replaceAll(",", "\n") + "\n\nn.childs: " + component.childs.length; //.replaceAll("{", "{\n").replaceAll("}", "\n}")
          return JSON.stringify(component.definition, undefined, 2)
        if (typeof component.definition === "string")
            return "$="+ component.definition
        else
          return "";
      },
      removeBiutityFromDef: ($, def)=>{
          return def.slice(2)
      },

      recomposeComponent: ($, component, lvl=0)=>{
        let convertedDefinitionWithChilds = component.definition

        if (component.type === "text"){
            return component.definition
        }
        else if (component.childs.length > 0){
            let lastDefinitionParenthesis = component.definition.lastIndexOf("}")
            convertedDefinitionWithChilds = component.definition.substr(0, lastDefinitionParenthesis) +`  "=>": [${component.childs.map(c=>$.this.recomposeComponent(c)).join(",\n\n  ")}\n]\n`+ component.definition.substr(lastDefinitionParenthesis, component.definition.length)
        }
        return `{ ${component.type}: \n${convertedDefinitionWithChilds}}`
      },
      recompose: $=>{
          return $.this.recomposeComponent($.this.appDef)
      },

      storage: {
        saveDef: $=>{
          console.log("saving..")
          localStorage.setItem("cle-demo.cle-creator.global-def", JSON.stringify($.this.globalDef))
          localStorage.setItem("cle-demo.cle-creator.app-def", JSON.stringify($.this.appDef))
        },
        loadDef: $=>{
            console.log("loading..")
            $.this.actualPointer = []
            $.this.globalDef = JSON.parse(localStorage.getItem("cle-demo.cle-creator.global-def"))  || " "
            $.this.appDef = JSON.parse(localStorage.getItem("cle-demo.cle-creator.app-def"))
        }
      }
    }

}};

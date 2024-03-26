import { ComponentsRegistry, str } from "../../../lib/caged-le.js";

ComponentsRegistry.define({ I_Rectangle: {

  '=>': "i'm a Rectangle", 

  style: { 
    display: str.flex, alignItems: str.center, justifyContent: str.center, textAlign: str.center,
    color: str.black, 
    cursor: str.pointer,
    backgroundColor: '#ccc',
    width: '200px',
    height: '200px',
  }

}})


// define as function, for easy configuration / override from external (react style). Use is still possible
ComponentsRegistry.define({ I_RectangleAsFunc: (props={})=>{

  console.log("i'm a function that return def. i've received this props: ", props)

  return {

    '=>': "i'm a Rectangle (as Func)", 

    style: { 
      display: str.flex, alignItems: str.center, justifyContent: str.center, textAlign: str.center,
      color: str.black, 
      cursor: str.pointer,
      backgroundColor: '#ccc',
      width: '200px',
      height: '200px',
    },

    ...props,

  }
}})
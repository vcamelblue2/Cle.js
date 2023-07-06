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
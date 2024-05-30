import * as ReactDOM from "react-dom";
import * as React from "react";
import * as cle_lib from "../../../../../lib/caged-le.js"

// Import cle-react mashup utils
import { ReactInCle } from '../../../../../mashup/react/lib/react-in-cle.js';
import { CleInReact } from '../../../../../mashup/react/lib/cle-in-react.js';

// console.log(React, ReactDOM, cle_lib)
ReactInCle.manualSetup(React, ReactDOM, cle_lib)
CleInReact.manualSetup(React, cle_lib)

console.log("cle - react mashup init!")

export {}
import { defineHtmlComponent } from "cle.js/lib/caged-le"

// import html from "bundle-text:./clock.component.ui.html"
// export const Clock = defineHtmlComponent(html, { isRemote: false })

// you can also NOT bundle inline the .html but retrive as static resource linked with "isRemote": false
import html from "./clock.component.ui.html"
export const Clock = defineHtmlComponent(html, { isRemote: true })

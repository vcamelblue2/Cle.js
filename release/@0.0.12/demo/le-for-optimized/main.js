import { RenderApp, remoteHtmlComponent} from "../../lib/caged-le.js"

RenderApp(document.body, await remoteHtmlComponent("./components/app") )

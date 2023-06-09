import {smart, Extended} from "../../../lib/caged-le.js"
import { NavSidebarLayout } from "../../../layouts/layouts.js"

export const Navbar = (navbarContents={ div: { text: "Nav", 'ha.style.fontSize': "3rem" }})=>({ div: {

    'a.style': {
        backgroundColor: "white", //"#2d3436",
        // color: "#dddddd",
        color: "rgb(97, 97, 97)",
        height: "60px",
        padding: "10px 2rem",

    },

    text: navbarContents
}})

export const Sidebar = (sidebarContents)=>({ div: {

    'a.style': {
        backgroundColor: "white",
        // color: "#dddddd",
        color: "rgb(97, 97, 97)",
        minHeight: "100%",
        borderRight: "0.25px solid #aaaaaa",
        padding: "10px 2rem"
    },
    
    "=>": [
        { div: { 'a.style': {fontWeight: "600", fontSize: "3rem", border: "0.25px solid #dddddd", paddingBottom: "0px"}, text: "Processes"}},
        
        ...sidebarContents,
    ]
}})

export const MainContent = (Components)=>({ div: {
    'a.style': {
        minHeight: "calc(100vh - 60px)",
        backgroundColor: '#dfe6e9',
        padding: "10px"
    },

    "=>": Components
}})


export const MainLayout = ({NavbarContents, SidebarComponents, MainContentComponents}={})=>Extended(NavSidebarLayout({
    navbar: Navbar(NavbarContents),
    sidebar: Sidebar(SidebarComponents),
    main_content: MainContent(MainContentComponents)
}))

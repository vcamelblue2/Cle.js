import {pass, none, smart, Use, Extended, Placeholder, Bind} from "../lib/caged-le.js"

export const NavSidebarLayout = ({navbar, sidebar, main_content, testing=false}={})=>{ return { div: {
    id: "grid_layout",
    attrs: { class: "grid-layout"},
    
    css: [`
        .grid-layout {
            display: grid;
            grid-template-areas:
                'menu header header header header header'
                'menu main main main main main';

            grid-template-columns: calc(100% / 6) auto auto auto auto auto;
            grid-template-rows: 60px auto;

            ${testing ? 'gap: 10px; padding: 10px; background-color: #2196F3;' : ''}
        }

        .navbar {
            grid-area: header;
        }

        .sidebar {
            grid-area: menu;
        }

        .main-content {
            grid-area: main;
        }

    `,

    testing ? `
    .grid-layout-item {
        background-color: rgba(255, 255, 255, 0.8);
        text-align: center;
        padding: 20px 0;
        font-size: 30px;
    }` : ''
    ],

    "=>": [
        // navbar
        { div: {
            id: "navbar",
            attrs: { class: "navbar grid-layout-item"},
            "=>": [
                // Placeholder("navbar", {default_component: "Navbar"})
                navbar || "Navbar"
            ]
        }},

        // siderbar
        { div: {
            id: "sidebar",
            attrs: { class: "sidebar grid-layout-item"},
            "=>": [
                // Placeholder("sidebar", {default_component: "Sidebar"})
                sidebar || "Sidebar"
            ]
        }},
        
        // main content
        { div: {
            id: "main_content",
            attrs: { class: "main-content grid-layout-item"},
            "=>": [
                // Placeholder("main_content", {default_component: "Main Content"})
                main_content || {div: {
                    a: {style: "height: 500px"},
                    text: "Main Content"
                  }}
            ]
        }}
    ]
}}}
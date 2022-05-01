import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp} from "../../../lib/caged-le.js"
import { UseAnchors } from "./anchors.js";

export const RootView = { div: {

  id: "rootView",

  props: {
    ...UseAnchors(),
    width: $ => $.parent.Width,
    height: $ => $.parent.Height / 2,
    rootRef: undefined
  },

  attrs: { style: $ => ({ ...$.this.Anchors }) },

  "=>": [

    Use({ div: {

        props: {
        ...UseAnchors(),
        width: $ => 2*$.parent.Width / 3,
        height: $ => $.parent.Height / 1.2,
        top: $ => $.parent.VerticalCenter - $.this.height / 2,
        left: $ => $.parent.HorizontalCenter - $.this.width / 2,
        },

        attrs: { style: $ => ({ ...$.this.Anchors, border: "2px solid black", color: "white", overflowY: "auto" }) },


        onInit: $ => {
          $.parent.rootRef = $.this;
        },

        "=>": [

          // TOOLBAR
          { div: {
            ctx_id: "toolbar",

            props: {
              ...UseAnchors(),
              width: $ => $.parent.Width,
              height: $ => 1 * $.parent.Height / 10,
            },

            attrs: {
              style: $ => $.this.Anchors,
              disabled: $ => $.le.model.visibleRoot.childs[$.meta.idx]?.childs.length > 0 ? undefined : true
            },

            "=>": [

              { button: {
                
                ctx_id: "drop_button",

                props: {
                  ...UseAnchors(),
                  width: $ => $.parent.Width/3,
                  height: $ => $.parent.Height,
                },

                attrs: {
                  style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                  disabled: $ => $.le.model.canGoBack ? undefined : true
                },

                handle: {
                  onclick: $ => {
                    $.le.model.editTree.dropRoot();
                  }
                },

                text: "Drop"

              }},

              { button: {
                
                ctx_id: "go_back_button",

                props: {
                  ...UseAnchors(),
                  width: $ => $.parent.Width/3,
                  height: $ => $.parent.Height,
                  left: $=>$.ctx.drop_button.Right
                },

                attrs: {
                  style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                  disabled: $ => $.le.model.canGoBack ? undefined : true
                },

                handle: {
                  onclick: $ => {
                    $.le.model.goBack();
                  }
                },

                text: $ => { 
                  let type = $.le.model.getParentTypology()
                  return "Parent" + (type.length > 0 ? ": ("+type+")" : "")
                }

              }},

              { button: {
                
                ctx_id: "add_child_button",

                props: {
                  ...UseAnchors(),
                  width: $ => $.parent.Width/3,
                  height: $ => $.parent.Height,
                  left: $=>$.ctx.go_back_button.Right
                },

                attrs: {
                  style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                },

                handle: {
                  onclick: $ => {
                    $.le.model.editTree.addNewChild();
                  }
                },

                text: "New Child"

              }},
            ]
          }},

          // TYPE
          { input: {

            ctx_id: "type_input",

            props: {
              ...UseAnchors(),
              width: $ => $.parent.Width,
              height: $ => 1 * $.parent.Height / 10,
              top: $ => $.ctx.toolbar.Bottom
            },

            attrs: { 
              style: $ => ({ ...$.this.Anchors, overflowY: "auto", fontWeight: "900", color: "red" }),

              value: $ => $.le.model.visibleRoot.type
            },

            handle: { 
              oninput: $=>{
                $.le.model.editTree.editRootType($.this.el.value)
              }
            }

          }},

          // ACE EDITOR
          { div: {

            ctx_id: "def_editor",

            props: {
              ...UseAnchors(),
              width: $ => $.parent.Width,
              height: $ => 8 * $.parent.Height / 10,
              top: $ => $.ctx.type_input.Bottom,

              editor: undefined,
            },

            attrs: { style: $ => ({ ...$.this.Anchors, overflowY: "auto", fontSize: "11px" }) },

            def: {
              setupEditorValue: $ => {
                $.this.editor.setValue($.le.model.tmpBiutifyEl($.le.model.visibleRoot, true));
                setTimeout(() => $.this.editor.clearSelection(), 1);
              },
              syncBackEditedValue: $=>{
                $.le.model.editTree.editRootDefinition($.le.model.removeBiutityFromDef($.this.editor.getValue()))
              }
            },

            on: { le: { model: {
              visibleRootChanged: $ => {
                $.this.setupEditorValue();
              }
            }}},

            onInit: $ => {
              let editor = ace.edit($.this.el);
              $.this.editor = editor;

              editor.setTheme("ace/theme/monokai");
              editor.session.setMode("ace/mode/javascript");
              editor.setOption("tabSize", 2)
              editor.commands.addCommand({
                name: 'Saving',
                bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
                exec: function(editor) {
                  $.le.model.storage.saveDef()
                },
                readOnly: true, // false if this command should not apply in readOnly mode
                // multiSelectAction: "forEach", optional way to control behavior with multiple cursors
                // scrollIntoView: "cursor", control how cursor is scolled into view after the command
              });

              $.this.setupEditorValue();

              editor.on('change', function() {
                $.this.syncBackEditedValue()
              });
            },

            onDestroy: $ => {
              try{$.this.editor?.destroy();}catch{}
            },
          }}
        ]
    }})

  ]

}};
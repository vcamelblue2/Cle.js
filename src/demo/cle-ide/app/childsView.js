import {pass, none, smart, Use, Extended, Placeholder, Bind, RenderApp, toInlineStyle, LE_LoadScript, LE_LoadCss, LE_InitWebApp} from "../../../lib/caged-le.js"
import { UseAnchors } from "./anchors.js";



export const ChildsView = {
  div: {
    id: "childsView",

    props: {
      ...UseAnchors(),
      height: $ => $.parent.Height / 2,
      width: $ => $.parent.Width,
      top: $ => $.le.rootView.Bottom,

      childsSpacing: 20,
      childsWidth: $ => (($.this.width - 10) / $.le.model.visibleRoot.childs.length) - $.this.childsSpacing,
    },

    attrs: { style: $ => ({ ...$.this.Anchors }) },

    "=>": [

      Use({ div: { meta: { forEach: "child", of: $ => $.le.model.visibleRoot.childs, define: { index: "idx", last: "isLast" } },

          props: {
            ...UseAnchors(),
            width: $ => $.parent.childsWidth,
            height: $ => $.parent.Height / 1.4,
            top: $ => $.parent.VerticalCenter - $.this.height / 2,
            left: $ => ($.this.width + $.parent.childsSpacing) * $.meta.idx + ($.parent.childsSpacing / 2), //$.meta.idx <= 0 ? 15 : (15 + $.this.width) * ($.meta.idx) + 15
          },

          attrs: { style: $ => ({ ...$.this.Anchors, border: "2px solid black", boxSizing: "unset !important" }) },

          "=>": [

            // TYPE
            { input: {

              ctx_id: "type_input",

              props: {
                ...UseAnchors(),
                width: $ => $.parent.Width,
                height: $ => 1 * $.parent.Height / 10,

              },

              attrs: { 
                style: $ => ({ ...$.this.Anchors, overflowY: "auto", fontWeight: "900", color: "red"  }),

                value: $ => $.meta.child.type
              },

              handle: { 
                oninput: $=>{
                  $.le.model.editTree.editChildType($.this.el.value, $.meta.idx)
                }
              }

            }},

            // ACE EDITOR
            { div: {

              ctx_id: "def_editor",

              props: {
                ...UseAnchors(),
                width: $ => $.parent.Width,
                height: $ => 7.5 * $.parent.Height / 10,
                top: $=>$.ctx.type_input.Bottom,

                editor: undefined,
              },

              attrs: { style: $ => ({ ...$.this.Anchors, overflowY: "auto", fontSize: "11px" }) },

              def: {
                setupEditorValue: $ => {
                  $.this.editor.setValue($.le.model.tmpBiutifyEl($.le.model.visibleRoot.childs[$.meta.idx], false));
                  setTimeout(() => $.this.editor.clearSelection(), 1);
                },
                syncBackEditedValue: $=>{
                  $.le.model.editTree.editChildDefinition($.le.model.removeBiutityFromDef($.this.editor.getValue()), $.meta.idx)
                }
              },

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
            }},
            
            // TOOLBAR
            { div: {
              ctx_id: "toolbar",

              props: {
                ...UseAnchors(),
                width: $ => $.parent.Width,
                height: $ => 1.5 * $.parent.Height / 10,
                top: $ => $.ctx.def_editor.Bottom,
              },

              attrs: {
                style: $ => $.this.Anchors,
                disabled: $ => $.le.model.visibleRoot.childs[$.meta.idx]?.childs.length > 0 ? undefined : true
              },

              "=>": [

                { button: {
                  
                  ctx_id: "move_left_button",
  
                  props: {
                    ...UseAnchors(),
                    width: $ => $.parent.Width/5,
                    height: $ => $.parent.Height,
                  },
  
                  attrs: {
                    style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                  },
  
                  handle: {
                    onclick: $ => {
                      $.le.model.editTree.moveChildLeft($.meta.idx);
                    }
                  },
  
                  text: "<<"
  
                }},

                { button: {
                  
                  ctx_id: "drop_child_button",
  
                  props: {
                    ...UseAnchors(),
                    width: $ => $.parent.Width/5,
                    height: $ => $.parent.Height,
                    left: $=>$.ctx.move_left_button.Right
                  },
  
                  attrs: {
                    style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                  },
  
                  handle: {
                    onclick: $ => {
                      $.le.model.editTree.dropChild($.meta.idx);
                    }
                  },
  
                  text: "Drop Child"
  
                }},

                { button: {

                  ctx_id: "go_next_button",

                  props: {
                    ...UseAnchors(),
                    width: $ => $.parent.Width/5,
                    height: $ => $.parent.Height,
                    left: $=>$.ctx.drop_child_button.Right
                  },

                  attrs: {
                    style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                    disabled: $ => $.le.model.visibleRoot.childs[$.meta.idx]?.childs.length > 0 ? undefined : true
                  },

                  handle: {
                    onclick: $ => {
                      $.le.model.goNext($.meta.idx);
                    }
                  },

                  text: $=> "Childs: (" + $.meta.child.childs.length + ")",
                }},

                { button: {
                  
                  ctx_id: "add_child_button",
  
                  props: {
                    ...UseAnchors(),
                    width: $ => $.parent.Width/5,
                    height: $ => $.parent.Height,
                    left: $=>$.ctx.go_next_button.Right
                  },
  
                  attrs: {
                    style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                  },
  
                  handle: {
                    onclick: $ => {
                      $.le.model.editTree.addNewChildToChild($.meta.idx);
                    }
                  },
  
                  text: "New Child"
  
                }},

                { button: {
                  
                  ctx_id: "move_right_button",
  
                  props: {
                    ...UseAnchors(),
                    width: $ => $.parent.Width/5,
                    height: $ => $.parent.Height,
                    left: $=>$.ctx.add_child_button.Right
                  },
  
                  attrs: {
                    style: $ => ({ ...$.this.Anchors, backgroundColor: "white" }),
                  },
  
                  handle: {
                    onclick: $ => {
                      $.le.model.editTree.moveChildRight($.meta.idx);
                    }
                  },
  
                  text: ">>"
  
                }},
              ]

            }},

          ]
      }})

    ]
}};

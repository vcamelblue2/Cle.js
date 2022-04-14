export const AceEditor = { div: {

  props: {
    //public
    initialCode: "", // pointer initial value e trigger dei changes!

    // private!
    _real_code: undefined, // real value of the editor, 
    _editor: undefined,
  },

  signals: {
    saveRequest: "stream => (str)",
    codeChanged: "stream => (str)"
  },

  // user should declare:

  // props:{ initialCode: "..."},
  // on_s: {
  //   this: {
  //     codeChanged: $=>{},
  //     saveRequest: $=>{}
  //   }
  // },


  on: {
    this: {
      initialCodeChanged: $=>{ // external code changed
        if($.this.initialCode !== $.this._real_code){
          $.this.reconcileEditorCode()
          $.this.setupEditorCode()
        }
      },
      _real_codeChanged: ($, new_val, old_val)=>{ // code edited ( must be sync back..)
        if(old_val !== undefined){
          $.this.codeChanged.emit($.this._real_code)
        }
      }
    },
  },

  def: {
    reconcileEditorCode: $=>{
      $.this._real_code = $.this.initialCode
    },
    setupEditorCode: $=>{
      $.this._editor.setValue($.this._real_code)
      setTimeout(() => $.this._editor.clearSelection(), 1);
    },
  },

  attrs: { style: {width: "100%", height: "100%", overflowY: "auto", fontSize: "11px" } },

  onInit: $ => {
    let editor = ace.edit($.this.el);
    $.this._editor = editor;

    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");
    editor.setOption("tabSize", 2)

    editor.commands.addCommand({
      name: 'Saving',
      bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
      exec: function(editor) { $.this.saveRequest.emit($.this._editor.getValue()) },
      readOnly: true, // false if this command should not apply in readOnly mode
      // multiSelectAction: "forEach", optional way to control behavior with multiple cursors
      // scrollIntoView: "cursor", control how cursor is scolled into view after the command
    });

    // init!
    $.this.reconcileEditorCode()
    $.this.setupEditorCode()

    editor.on('change', ()=>{ $.this._real_code = $.this._editor.getValue() })

  },

  onDestroy: $ => {
    $.this._editor?.destroy();
  }

}}
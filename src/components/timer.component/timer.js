export const Timer = { Model: {

    interval: 1000,
    running: false,
    repeat: true,
    trigerOnStart: false,

    last_execution: undefined,
    num_execution: 0,

    signals: {
      trigger: "stream => void",
    },

    oos: $ => ({ private: undefined }),

    def:{

      _private: { setupPrivateModel($, pr){ $.oos.private = pr } },
      
      start($){
        $.oos.private.start()
      },

      stop($){
        $.oos.private.start()
      }
    },

    '': { Model: { // name: "private"

      setIntervalOrTimeout: $ => $.repeat ? (...args)=>setInterval(...args) : (...args)=>setTimeout(...args),
      clearIntervalOrTimeout: $ => $.repeat ? (...args)=>clearInterval(...args) : (...args)=>clearTimeout(...args),
      
      onInit: $ => { 
        $._private.setupPrivateModel($.this);
        
        $.running && $.start();
      },

      on_runningChanged: ($, running, oldRunning) => {
        if (running !== oldRunning){
          running ? $.start() : $.stop()
        }
      },
      on_repeatChanged: ($, repeat) => { $.stop(); $.start(); },

      oos: $=>({ // declare as a function to have a personal obj per-instance, otherwhise it will be shared between all instances!
        interval_handler: undefined
      }),

      def: {

        triggerSignal($){
          $.last_execution = new Date()
          $.num_execution = $.num_execution +1
          $.trigger.emitLazy(0)
          
          if (!$.repeat) { $.stop() }
        },

        start($){
          $.num_execution = 0

          $.clearIntervalOrTimeout($.oos.interval_handler)

          $.trigerOnStart && $.triggerSignal();

          $.oos.interval_handler = $.setIntervalOrTimeout($.triggerSignal, $.interval);
        },

        stop($){
          $.clearIntervalOrTimeout($.oos.interval_handler)
          $.oos.interval_handler = undefined
        }
      }

    }},

}}


// usage:
// Use(Timer, {
//   id: "appTimerMin", 
//
//   interval: 60*1000, 
//   running: true, 
//   trigerOnStart: true
// })

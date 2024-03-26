import { cle, svg, f, RenderApp, Use, input, Bind, Alias } from "../../lib/caged-le.js"
import { Button, Div } from "../../extra/smart-alias.js"
import { SelectButtons } from "../../components/select-buttons.component/select-buttons.js"
import { get, set } from "../../extra/lang.js"

import * as Panzoom from 'https://unpkg.com/@panzoom/panzoom/dist/panzoom.min.js'

import { original_data } from "./mock_data.js"

const DEBUG_ENABLED = false
const APP = {
  console: {
    log: DEBUG_ENABLED ? console.log : ()=>{}
  }
}


const ORIGINAL_CANDLE_WIDTH = 10

const usePanZoom = ({panzoom_enabled = true})=>({
  panzoom: undefined,
  _panzoom_enabled: panzoom_enabled,
  // onclick: ($, ...args) => {$.panzoom.zoomIn(...args)},
  handle_onwheel: ($, ...args) => {
    $._panzoom_enabled && $.panzoom.zoomWithWheel(...args)
  },
  handle_onpointerdown: ($, ...args) => {
    $._panzoom_enabled && $.panzoom.handleDown(...args)
  },
  handle_onpointermove: ($, ...args) => {
    $._panzoom_enabled && $.panzoom.handleMove(...args)
  },
  handle_onpointerup: ($, ...args) => {
    $._panzoom_enabled && $.panzoom.handleUp(...args)
  },

  def_setupPanZoom($){
    $.panzoom = window.Panzoom($.el, {
      maxScale: 20,
      noBind: true
    })
    // $.panzoom.pan(10, 10)
    // $.panzoom.zoom(0.5, { animate: true })
    console.log($.panzoom)
  },

  dir_panzoom: {

    onInit($){
      $.setupPanZoom($)
    },

  }
})


const Toolbal = ({mode}) => {
  return Div({
    style: 'display: flex; position: fixed; z-index: 999; background: white;'
  },

    Div({ style: 'display: flex; flex-direction: column'}, 
      Div({}, 'Mode: '),
      Use(SelectButtons, { 
        ...input("values", [
          {code: 'draw', desc: "Draw"},
          {code: 'pan', desc: "Pan"}
        ]),
        ...input('selected', mode)
      }),
    ),
    
    Button({}, 'Reset'),   
    
  )
}


RenderApp(document.body, cle.div({ 
  original_data: original_data,

  FIT_CONTENT_WIDTH: false,
  MODE: 'pan',//|| 'draw',

  extra_points_enabled: $=>$.MODE==='draw',
  panzoom_enabled: $=>$.MODE==='pan',
  
},
  
  Toolbal({mode: Bind('$.MODE')}),

  Div({
    ...usePanZoom({panzoom_enabled: get.panzoom_enabled}),

    extra_points: [],
    // handle_onclick: ($, e) => console.log("CLICK", e)

    handle_onclick: ($, e) => {
      console.log("CLICK", e, $.extra_points)
      if ($.extra_points_enabled){

        console.log("CLICK", e, $.extra_points)
        // const last_point = $.extra_points[$.extra_points.length-1] ?? {}
        // if ($.extra_points.length === 0){
        //   $.extra_points = [{x1: e.clientX, y1: e.clientY, x1: e.clientX, y1: e.clientY}]
        // }
        console.log("PAN", $.panzoom.getScale(),$.panzoom.getPan(), )
        $.extra_points = [...$.extra_points, {x: (e.offsetX-(0)), y: (e.offsetY-(0))}]
      }
    },
    
  }, 

    svg.component({

      attrs: {
        width: $ => $.u_width,
        height: $ => $.u_height
      },

      style: {border: '1px solid black'},

      
      u_width: 6000, //window.screen.availWidth-20,
      u_height: 1000, //window.screen.availHeight - 140,

      showGraph: false,
      
      lineTimeFrame: 5, // min
      candleTimeFrame: 12*5, // 5min * 12 = 1h - "x times" linetimeframes

      candles: [],
      render_candles: [],
      
      bbox: {
        x1:0, x2:0, y1:0, y2:0, w: 0, h: 0, getTranslated00Point: (x,y)=>({x,y})
      },

      render_w: $ => $.FIT_CONTENT_WIDTH ? $.u_width : ($.bbox.w*$.u_height) / ($.bbox.h || 1),   //// fit content || //// proportional (b.width : b.height = x : u.height)
      render_h: $ => $.FIT_CONTENT_WIDTH ? ($.bbox.h*$.u_width) / ($.bbox.w || 1) : $.u_height,  //// proportional (b.width : b.height = u.width : x) || /// fit content
      original_aspect_ratio: $ => $.bbox.w/($.bbox.h || 1),
      ui_aspect_ratio: $ => $.u_width/$.u_height,
      y_scale_factor: $ => 1 / ($.bbox.h / ($.render_h || 1)),
      x_scale_factor: $ => 1 / ($.bbox.w / ($.render_w || 1)),



      def_getBBox: ($, candles) => {
        const values = [...candles.map(s=>s.high), ...candles.map(s=>s.low)]
        const indexes = [...candles.map(s=>s.key_from), ...candles.map(s=>s.key_to)]
        const y1 = Math.min(...values)
        const x1 = Math.min(...indexes)
        const y2 = Math.max(...values)
        const x2 = Math.max(...indexes)

        return {x1, x2, y1, y2, w: x2-x1, h: y2-y1, getTranslated00Point: (x,y)=>({x: x-x1, y: y-y1})}
      },

      def_getCandles: $ => {

        let converted =  $.original_data.split("\n").map((row, i)=>{
          const [time, open, high, low, close, volume] = row.split(",")
          return {index: i, index_from: (i*ORIGINAL_CANDLE_WIDTH), index_to: (i*ORIGINAL_CANDLE_WIDTH)+(1*ORIGINAL_CANDLE_WIDTH), time: +time, open: +open, high:+high, low:+low, close:+close, volume:+volume}
        })

        // let lastGroup = undefined
        let grouped = []
        for (let i = 0; i < converted.length-1; i += $.candleTimeFrame){
          let subcandles=converted.filter((x, idx)=>idx >= i && idx < i+$.candleTimeFrame)

          const minVal = Math.min(...subcandles.map(s=>s.high), ...subcandles.map(s=>s.low))
          const maxVal = Math.max(...subcandles.map(s=>s.high), ...subcandles.map(s=>s.low))
          const open = subcandles[0]?.open
          const close = subcandles[subcandles.length-1]?.close
          
          // console.log("CYCLE:", i, converted.length, i%$.candleTimeFrame === 0, converted.length / $.candleTimeFrame,  converted, subcandles)

          grouped.push({ 
            key: converted[i].time, 
            key_from: (i*ORIGINAL_CANDLE_WIDTH), 
            key_to: (i*ORIGINAL_CANDLE_WIDTH)+($.candleTimeFrame*ORIGINAL_CANDLE_WIDTH), 
            width: ORIGINAL_CANDLE_WIDTH,
            get height(){ return this.draw_end_point-this.draw_start_point},
            low: minVal,
            high: maxVal,
            open: open,
            close: close,
            is_green: close >= open,
            draw_start_point: minVal,
            draw_end_point: maxVal,
            draw_inner_start_point: close >= open ? open : close,
            draw_inner_end_point: close >= open ? close : open,
            subcandles: subcandles.map(sc=>({...sc, 
              line_draw_start_point: sc.close >= sc.open ? sc.low : sc.high,
              line_draw_end_point: sc.close >= sc.open ? sc.high : sc.low,
              draw_start_point: sc.low,
              draw_end_point: sc.high,
              draw_inner_start_point: sc.close >= sc.open ? sc.open : sc.close,
              draw_inner_end_point: sc.close >= sc.open ? sc.close : sc.open,
              is_green: sc.close >= sc.open,
            }))
          })
          
          // if (lastGroup === undefined){
          // }
        }
        
        return grouped
      },

      def_transpileX($, x){
        return (x - $.bbox.x1) * $.x_scale_factor
      },
      def_transpileY($, y){
        return $.render_h - ((y - $.bbox.y1) * $.y_scale_factor)
      },

      def_getRenderCandles($){
        return $.candles.map((c, )=>{

          // { 
          //   key: converted[i].time, 
          //   key_from: i, 
          //   key_to: i+$.candleTimeFrame, 
          //   width: 1,
          //   min: minVal,
          //   max: maxVal,
          //   open: open,
          //   close: close,
          //   draw_start_point: close >= open ? minVal : maxVal,
          //   draw_end_point: close >= open ? maxVal : minVal,
          //   is_green
          //   subcandles: {index: i, time: +time, open: +open, high:+high, low:+low, close:+close, volume:+volume, is_green, draw_start_point, draw_end_point}[]
          // }
          /**
           *  
              u.Y = render_h - ((g.Y-b.Y1) * y_scale_factor)
              u.X = ((g.X-b.X1) * x_scale_factor)
              u.H = (g.H * y_scale_factor)
              u.W = (g.W * x_scale_factor)
          */

          const transformed = {
            kind: "rect",

            full: {
              x1: $.transpileX(c.key_from),
              x2: $.transpileX(c.key_to),
              y1: $.transpileY(c.draw_start_point),
              y2: $.transpileY(c.draw_end_point),
              get w(){return Math.abs(this.x2 - this.x1)},
              get h(){return Math.abs(this.y2 - this.y1)},
            },
            box: {
              x1: $.transpileX(c.key_from),
              x2: $.transpileX(c.key_to),
              y1: $.transpileY(c.draw_inner_start_point),
              y2: $.transpileY(c.draw_inner_end_point),
              get w(){return Math.abs(this.x2 - this.x1)},
              get h(){return Math.abs(this.y2 - this.y1)},
            },
            top_shadow: {
              x1: $.transpileX(((c.key_to - c.key_from)/2)+c.key_from),
              x2: $.transpileX(((c.key_to - c.key_from)/2)+c.key_from),
              y1: $.transpileY(c.draw_inner_end_point),
              y2: $.transpileY(c.draw_end_point),
            },
            bottom_shadow: {
              x1: $.transpileX(((c.key_to - c.key_from)/2)+c.key_from),
              x2: $.transpileX(((c.key_to - c.key_from)/2)+c.key_from),
              y1: $.transpileY(c.draw_inner_start_point),
              y2: $.transpileY(c.draw_start_point),
            },

            color: c.is_green ? 'green' : 'red',
            fill_color: c.is_green ? '#00800033' : '#ff000033',

            subcandles: c.subcandles.map(sc=>{
              return {
                kind: "line",

                line: {
                  x1: $.transpileX(sc.index_from),
                  x2: $.transpileX(sc.index_to),
                  y1: $.transpileY(sc.line_draw_start_point),
                  y2: $.transpileY(sc.line_draw_end_point),
                },

                full: {
                  x1: $.transpileX(sc.index_from),
                  x2: $.transpileX(sc.index_to),
                  y1: $.transpileY(sc.draw_start_point),
                  y2: $.transpileY(sc.draw_end_point),
                  get w(){return Math.abs(this.x2 - this.x1)},
                  get h(){return Math.abs(this.y2 - this.y1)},
                },
                box: {
                  x1: $.transpileX(sc.index_from),
                  x2: $.transpileX(sc.index_to),
                  y1: $.transpileY(sc.draw_inner_start_point),
                  y2: $.transpileY(sc.draw_inner_end_point),
                  get w(){return Math.abs(this.x2 - this.x1)},
                  get h(){return Math.abs(this.y2 - this.y1)},
                },
                top_shadow: {
                  x1: $.transpileX(((sc.index_to - sc.index_from)/2)+sc.index_from),
                  x2: $.transpileX(((sc.index_to - sc.index_from)/2)+sc.index_from),
                  y1: $.transpileY(sc.draw_inner_end_point),
                  y2: $.transpileY(sc.draw_end_point),
                },
                bottom_shadow: {
                  x1: $.transpileX(((sc.index_to - sc.index_from)/2)+sc.index_from),
                  x2: $.transpileX(((sc.index_to - sc.index_from)/2)+sc.index_from),
                  y1: $.transpileY(sc.draw_inner_start_point),
                  y2: $.transpileY(sc.draw_start_point),
                },

                color: sc.is_green ? '#02304755' : '#ffb70355',
                fill_color: sc.is_green ? '#02304733' : '#ffb70333',
              }
            })
          }

          APP.console.log("TRANSPILE:", c, transformed)
          return transformed
        })
      },

      def_initialize($){
        $.showGraph = false
        $.candles = $.getCandles()
        $.bbox = $.getBBox($.candles)
        APP.console.log("RENDER PROP",
          "$.candles", $.candles,
          "$.bbox", $.bbox,
          "$.render_w", $.render_w,
          "$.render_h", $.render_h,
          "$.original_aspect_ratio", $.original_aspect_ratio,
          "$.ui_aspect_ratio", $.ui_aspect_ratio,
          "$.y_scale_factor", $.y_scale_factor,
          "$.x_scale_factor", $.x_scale_factor,
        )
        $.render_candles = $.getRenderCandles()
        $.showGraph = true
      },

      onInit: $ => $.initialize()
      
    },
      
      svg.g({ meta: {if: f`@showGraph`}},

        svg.g({ meta: {forEach: 'candle', of: f`@render_candles`, define: {index: 'index'}}, attrs: {
          stroke: "green", 
          strokeWidth: 10, 
          fill: "transparent"
        }},

          svg.rect({ attrs: {
            stroke: '#00000011', 
            x: f`@candle.full.x1`,
            y: f`@candle.full.y2`,
            width: f`@candle.full.w`,
            height: f`@candle.full.h`,
          }}),


          svg.rect({ attrs: {
            stroke: f`@candle.color`, 
            fill: f`@candle.fill_color`,
            x: f`@candle.box.x1`,
            y: f`@candle.box.y2`,
            width: f`@candle.box.w`,
            height: f`@candle.box.h`,
          }}),
          svg.line({ attrs: {
            stroke: f`@candle.color`, 
            x1: f`@candle.top_shadow.x1`,
            x2: f`@candle.top_shadow.x2`,
            y1: f`@candle.top_shadow.y1`,
            y2: f`@candle.top_shadow.y2`,
          }}),
          svg.line({ attrs: {
            stroke: f`@candle.color`, 
            x1: f`@candle.bottom_shadow.x1`,
            x2: f`@candle.bottom_shadow.x2`,
            y1: f`@candle.bottom_shadow.y1`,
            y2: f`@candle.bottom_shadow.y2`,
          }}),


          // svg.line({ meta: {forEach: 'subcandle', of: f`@candle.subcandles`}, attrs: {
          //   stroke: f`@subcandle.color`, 
          //   x1: f`@subcandle.x1`,
          //   x2: f`@subcandle.x2`,
          //   y1: f`@subcandle.y1`,
          //   y2: f`@subcandle.y2`,
          // }}),

          svg.g({ meta: {forEach: 'subcandle', of: f`@candle.subcandles`}},
          
            svg.rect({ attrs: {
              stroke: f`@subcandle.color`,
              fill: f`@subcandle.fill_color`, 
              x: f`@subcandle.box.x1`,
              y: f`@subcandle.box.y2`,
              width: f`@subcandle.box.w`,
              height: f`@subcandle.box.h`,
            }}),
            svg.line({ attrs: {
              stroke: f`@subcandle.color`, 
              x1: f`@subcandle.top_shadow.x1`,
              x2: f`@subcandle.top_shadow.x2`,
              y1: f`@subcandle.top_shadow.y1`,
              y2: f`@subcandle.top_shadow.y2`,
            }}),
            svg.line({ attrs: {
              stroke: f`@subcandle.color`, 
              x1: f`@subcandle.bottom_shadow.x1`,
              x2: f`@subcandle.bottom_shadow.x2`,
              y1: f`@subcandle.bottom_shadow.y1`,
              y2: f`@subcandle.bottom_shadow.y2`,
            }}),

          ),
        ),


        svg.g({ meta: {forEach: 'line', of: f`@extra_points`, define: {index: 'idx'}, full_optimized:true}},
            
          svg.line({ meta: {if: $ => ($.idx)>0 }, attrs: {
            stroke: '#0000ff',
            x1: f`@line.x`,
            x2: f`@extra_points[@idx-1]?.x`,
            y1: f`@line.y`,
            y2: f`@extra_points[@idx-1]?.y`,
          }}),
        )

      )
    )
  )

))
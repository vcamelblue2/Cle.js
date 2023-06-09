import { LE_LoadScript, LE_InitWebApp, RenderApp} from "../../lib/caged-le.js"

LE_InitWebApp(async ()=>{

  const SERVER_SCRAPE_TIME = 250 //500

  const DEFAULT_REFRESH_RATE = [250, 500, 1000][0]
  const DEFAULT_INITIAL_BALANCE = 2000

  const COMMISSIONS_ENABLED = false

  const GRAPH_BIG_MIN = 60
  const GRAPH_SMALL_MIN = 10


  await Promise.all([
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js"),
    LE_LoadScript("https://cdn.jsdelivr.net/npm/chart.js"),
    LE_LoadScript("https://www.chartjs.org/samples/2.9.4/utils.js"),
    LE_LoadScript("https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/1.2.2/chartjs-plugin-annotation.min.js"),
  ])


  const app_root = RenderApp(document.body, {
    div: {
      id: "appRoot",

      data: {
        fullInitialStockData: [],

        stockData: {price: 0, date: 0, volume: 0, bid:0, ask:0 },
        oldStockData: {price: 0, date: 0, volume: 0, bid:0, ask:0 },

        maxPercObserved: 0,
        minPercObserved: 0,
        avgPercObserved: 0,
        totalPercObserved: 0,

        slidingWindowMaxPercObserved: 0,
        slidingWindowMinPercObserved: 0,
        slidingWindowAvgPercObserved: 0,
        slidingWindowTotalPercObserved: 0,

        refreshRateMs: DEFAULT_REFRESH_RATE,

        running: false,
      },

      "=>": [

        { Controller: {
          id:"controller",

          def: {
            loadStockData: async $ => {
              try {
                let res = await axios.get('http://localhost:4512/api/stock-data')

                $.parent.oldStockData = $.parent.stockData
                $.parent.stockData = { price: res.data.price, date: res.data.date, volume: res.data.volume, bid: res.data.bid, ask: res.data.ask  } 
                // console.log(res)
              } catch (e) { console.log(e)}
            },

            loadFullStockData: async $ => {
              try {
                let res = await axios.get('http://localhost:4512/api/full-stock-data')

                $.parent.fullInitialStockData = res.data

                console.log("full", res)
              } catch (e) { console.log(e)}
            },

            getStockPriceChanges: $ => {
              let actual = $.le.appRoot.stockData
              let old = $.le.appRoot.oldStockData

              let diff = actual.price - old.price
              let neg_diff = old.price - actual.price
              let abs_diff = Math.abs(diff)

              let is_neg = diff < 0

              let perc = is_neg ? (neg_diff / actual.price) * 100 : (diff / actual.price) * 100

              return {diff: diff, perc: perc}
            }

          },

        }},

        { Model: {
          id: "wallet",

          data: {
            balance: DEFAULT_INITIAL_BALANCE,
            open_order: undefined,

            unreal_balance: $ => {
              if($.this.open_order === undefined) {
                return "No Open Orders"
              }
              else {
                if ($.this.open_order.type === "long"){
                  let new_balance = ($.this.open_order.qty * (1-$.this.sell_commission)) * $.le.appRoot.stockData.bid // venderò a bid
                  let profit = new_balance - $.this.open_order.invested
                  let perc = (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1  : (new_balance / $.this.open_order.invested)-1 ) * 100
                  return profit.toFixed(2) + "€ | " + perc.toFixed(5) + "% | " + new_balance.toFixed(4) + "€"
                }
                else if ($.this.open_order.type === "short"){
                  let new_balance =  $.this.open_order.invested + (($.this.open_order.qty * $.this.open_order.open_price ) -  (($.this.open_order.qty * (1-$.this.buy_commission)) * $.le.appRoot.stockData.ask)) // comprerò ad ask
                  let profit = new_balance - $.this.open_order.invested
                  let perc = (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1  : (new_balance / $.this.open_order.invested)-1 ) * 100
                  return profit.toFixed(2) + "€ | " + perc.toFixed(5) + "% | " + new_balance.toFixed(4) + "€"
                }
              }
              return ""
            },

            history: [],

            buy_commission: COMMISSIONS_ENABLED ? 0.075/100 : 0,
            sell_commission: COMMISSIONS_ENABLED ? 0.075/100 : 0,

            leverage: 1 // todo, leverage

          },
          
          on: {
            this: {
              balanceChanged: $ => {
                localStorage.setItem("demo-le-stock:balance", JSON.stringify({balance: $.this.balance}))
              }
            }
          },

          onInit: $ => {
            let retrivedBalance = localStorage.getItem("demo-le-stock:balance")
            if (retrivedBalance !== undefined && retrivedBalance !== null){
              let balance = JSON.parse(retrivedBalance).balance 
              if(balance > 0){
                $.this.balance = balance
              }
            }
          },

          def: {
            can_open_position: $ => {
              return $.this.open_order === undefined
            },
            go_long: $ => {
              if ($.this.balance > 0 && $.this.can_open_position()){ //compro ad ask
                $.this.open_order = {qty: ($.this.balance * (1-$.this.buy_commission)) / $.le.appRoot.stockData.ask, invested: $.this.balance, open_commission: $.this.balance * $.this.buy_commission,  open_price: $.le.appRoot.stockData.bid, open_time: new Date(), type: "long"}
                $.this.balance = 0
              }
            },
            go_short: $ => {
              if ($.this.balance > 0 && $.this.can_open_position()){ // vendo a bid
                $.this.open_order = {qty: ($.this.balance * (1-$.this.sell_commission))/ $.le.appRoot.stockData.bid, invested: $.this.balance, open_commission: $.this.balance * $.this.sell_commission, open_price: $.le.appRoot.stockData.ask, open_time: new Date(), type: "short"}
                $.this.balance = 0
              }
            },
            close: $ => {
              if ($.this.open_order !== undefined){
                if ($.this.open_order.type === "long"){
                  let sell_price = $.le.appRoot.stockData.bid
                  let new_balance = ($.this.open_order.qty * (1-$.this.sell_commission)) * sell_price
                  let order = {...$.this.open_order,  close_commission: new_balance * $.this.sell_commission, final_balance: new_balance, close_price: sell_price, close_time: new Date(), difference: new_balance - $.this.open_order.invested, difference_perc: (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1 : (new_balance / $.this.open_order.invested)-1 )*100}
                  $.this.balance = new_balance
                  $.this.open_order = undefined
                  $.this.history = [order, ...$.this.history]
                }
                else if ($.this.open_order.type === "short"){
                  let buy_price = $.le.appRoot.stockData.ask
                  let new_balance = $.this.open_order.invested + (($.this.open_order.qty * $.this.open_order.open_price ) -  (($.this.open_order.qty * (1-$.this.buy_commission)) * buy_price))
                  let order = {...$.this.open_order,  close_commission: new_balance * $.this.buy_commission, final_balance: new_balance, close_price: buy_price, close_time: new Date(), difference: new_balance - $.this.open_order.invested, difference_perc: (new_balance >= $.this.open_order.invested ? (new_balance / $.this.open_order.invested)-1 : (new_balance / $.this.open_order.invested)-1 )*100}
                  $.this.balance = new_balance
                  $.this.open_order = undefined
                  $.this.history = [order, ...$.this.history]
                }
              }
            },
            resetBalance: $ => {
              if( !$.this.can_open_position){
                $.this.close()
              }
              $.this.balance = DEFAULT_INITIAL_BALANCE
            }
          }
        }},

        { div: { meta: { if: $=>$.le.appRoot.running },

          id: "order_controls",

          attrs: { style: $=>({position:"fixed", width:"400px", height:"300px", right:"0px", bottom:"0px", border: "1px solid black", backgroundColor:"white", zIndex:"1000", overflowY:"auto"}) },

          "=>":[
            { button: {
              text: "Buy",
              hattrs: {style: "width: 50%; color: green"},
              handle: {  onclick: $ => $.le.wallet.go_long()  }
            }},

            { button: {
              text: "Sell",
              hattrs: {style: "width: 50%; color: red"},
              handle: {  onclick: $ => $.le.wallet.go_short()  }
            }},
            
            {br:{}},

            { button: {
              text: "Close Position",
              hattrs: {style: "width: 100%"},
              handle: {  onclick: $ => $.le.wallet.close()  }
            }},

            {br:{}},

            { div: {
              text: [ "Balance: ", $ => $.le.wallet.balance, "€" ]
            }},

            { div: {
              text: [ "Unreal Balance: ", $ => $.le.wallet.unreal_balance ]
            }},

            { div: {
              text: [ "Price: ", $ => $.le.appRoot.stockData.price, " -  Ask: ", $ => $.le.appRoot.stockData.ask, " - Bid: ", $ => $.le.appRoot.stockData.bid]
            }},

            { div: {
              text: [ "Spread: ", $ => $.le.appRoot.stockData ? ((($.le.appRoot.stockData.ask / $.le.appRoot.stockData.bid)-1) * 100).toFixed(4) : " - ", "%"]
            }},

            { div: {
              text: [ "Open Price: ", $ => $.le.wallet.open_order? $.le.wallet.open_order.open_price : "-"]
            }},

            "Position: ",
            { div: {
              text: $ => JSON.stringify( $.le.wallet.open_order )
            }},

            "Histroy: ",
            { div: {
              text: $ => JSON.stringify( $.le.wallet.history )
            }},

            { button: {
              text: "Reset",
              hattrs: {style: "width: 100%"},
              handle: {  onclick: $ => $.le.wallet.resetBalance()  }
            }},
          ]

        }},

        { button: {
          text: "run",

          data: {
            intervall: undefined
          },
          
          handle: { 
            onclick: async $ => {
              if ($.this.intervall === undefined) {
                console.log("running full call..")
                await $.le.controller.loadFullStockData()
                console.log("runnong intervall call")
                $.le.controller.loadStockData()
                $.this.intervall = setInterval(()=>$.le.controller.loadStockData(), $.parent.refreshRateMs)
                setTimeout(() => {$.parent.running = true}, $.parent.refreshRateMs * 2);
              } else {
                clearInterval( $.this.intervall )
                $.this.intervall = undefined
              }
            } 
          }
        }},

        { div: {
          text: [
            $ => "Refrsh Rate (sec): " + $.parent.refreshRateMs/DEFAULT_REFRESH_RATE,
            {br:{}},

            $ => "Price: " + $.parent.stockData?.price.toFixed(2), " - ",
            $ => " Volumes: " + $.parent.stockData?.volume.toFixed(5), " - ",
            { span: { 
              def: { getFormattedStockPriceChanges: $ =>{
                let {diff, perc} = $.le.controller.getStockPriceChanges()
                return "Diff: " + diff.toFixed(4) + "; Perc: " + perc.toFixed(4) +"%"
              }},
              text: $ => $.le.appRoot.stockData === undefined ? "" : $.this.getFormattedStockPriceChanges()  // l'autoupdate qui funziona solo perchè al momento sto puntanto alle vere deps!
            }},

            {hr: {}},
            {br: {}},
            $ => "avg obs: " + $.parent.avgPercObserved.toFixed(5)+"%", " - ",
            $ => "avg obs: " + $.parent.avgPercObserved.toFixed(5)+"%", " - ",
            // $ => "min obs: " + $.parent.minPercObserved.toFixed(5)+"%", " - ",
            $ => "max obs: " + $.parent.maxPercObserved.toFixed(5)+"%", " - ",
            $ => "total obs: " + $.parent.totalPercObserved.toFixed(5)+"%",

            {br: {}},
            $ => "avg obs (sl wiw): " + $.parent.slidingWindowAvgPercObserved.toFixed(5)+"%", " - ",
            // $ => "min obs (sl wiw): " + $.parent.slidingWindowMinPercObserved.toFixed(5)+"%", " - ",
            $ => "max obs (sl wiw): " + $.parent.slidingWindowMaxPercObserved.toFixed(5)+"%", " - ",
            $ => "sum obs (sl wiw): " + $.parent.slidingWindowTotalPercObserved.toFixed(5)+"%", 


            {hr: {}},
            {br: {}},
            $ => "avg obs (5x leverage): " + ($.parent.avgPercObserved*5).toFixed(5)+"%", " - ",
            // $ => "min obs (5x leverage): " + ($.parent.minPercObserved*5).toFixed(5)+"%", " - ",
            $ => "max obs (5x leverage): " + ($.parent.maxPercObserved*5).toFixed(5)+"%", " - ",
            $ => "total obs (5x leverage): " + ($.parent.totalPercObserved*5).toFixed(5)+"%",

            {br: {}},
            $ => "avg obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowAvgPercObserved*5).toFixed(5)+"%", " - ",
            // $ => "min obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowMinPercObserved*5).toFixed(5)+"%", " - ",
            $ => "max obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowMaxPercObserved*5).toFixed(5)+"%", " - ",
            $ => "total obs (sl wiw - 5x leverage): " + ($.parent.slidingWindowTotalPercObserved*5).toFixed(5)+"%",
            
          ]
        }},

        
        { canvas: { 
          id: "chartjs",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_BIG_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_BIG_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          def: {
            computeAvgPercObserved: ($, limitToSlidingWindow=false) => {
              // console.log("datasetsss", $.this.chart.data.datasets[0].data)

              let data = $.this.chart.data.datasets[0].data
              if (limitToSlidingWindow){
                data = data.length > $.this.slidingWindowsPoints ? data.slice((data.length-$.this.slidingWindowsPoints), data.length) : data
              }
              let count = data.length

              let sum = 0
              let min = Number.MAX_SAFE_INTEGER
              let max = Number.MIN_SAFE_INTEGER
              for (let i=0; i<count-1; i++){
                let _old = data[i]
                let _new = data[i+1]

                let abs_diff = Math.abs(_new - _old)

                let perc = (abs_diff / _new) * 100
                // console.log()
                perc < min && min > 0 && (min = perc)
                perc > max && (max = perc)
                sum = sum + perc
              }
              return {total: sum, avg: sum/count, min: min, max: max}

              //   let perc = (abs_diff / _new) * 100

              //   sum += abs_diff
              // }
              // return ((sum/count) / _new) * 100

            }
          },
          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.price);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.price);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                let observedPerc = $.this.computeAvgPercObserved()

                $.le.appRoot.totalPercObserved = observedPerc.total
                $.le.appRoot.avgPercObserved = observedPerc.avg
                $.le.appRoot.minPercObserved = observedPerc.min
                $.le.appRoot.maxPercObserved = observedPerc.max

                let slidingWindowObservedPerc = $.this.computeAvgPercObserved(true)

                $.le.appRoot.slidingWindowTotalPercObserved = slidingWindowObservedPerc.total
                $.le.appRoot.slidingWindowAvgPercObserved = slidingWindowObservedPerc.avg
                $.le.appRoot.slidingWindowMinPercObserved = slidingWindowObservedPerc.min
                $.le.appRoot.slidingWindowMaxPercObserved = slidingWindowObservedPerc.max

                // console.log("avg", $.le.appRoot.avgPercObserved)
                
                $.this.chart.config.options.plugins.annotation = {
                  annotations: {
                    bid: {
                      type: 'line',
                      yMin: newData.bid,
                      yMax: newData.bid,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    },
                    ask:{
                      type: 'line',
                      yMin: newData.ask,
                      yMax: newData.ask,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    }
                  }
                }
                
                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSContainer",  width: "1024", height: "600" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.price)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                  responsive: false, //true,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  // animation: { // new animation!
                  //     duration: 800,
                  //     easing: 'linear',
                  //     // from: 1,
                  //     // to: 0,
                  //     loop: false
                  // },

                  stacked: false,
                  plugins: {
                    title: {
                    display: true,
                    text:  GRAPH_BIG_MIN + ' Min Chart'
                    },

                    tooltip: {
                      callbacks: {
                        footer: (tooltipItems) => {
                        
                          let long = (100 - ((tooltipItems[0].parsed.y / $.le.appRoot.stockData.price) * 100))
                          let short = ((100 - (($.le.appRoot.stockData.price / tooltipItems[0].parsed.y ) * 100)))

                          return  '[from here]\n' + 'Long: ' + long.toFixed(3) + "%" + "\nShort: " + short.toFixed(3) + "%\n" +        '\n' + 'Long (5x): ' + (long*5).toFixed(3) + "%" + "\nShort(x5): " + (short*5).toFixed(3) + "%\n"
                        }
                      }
                    },

                    annotation: {
                      annotations: {
                        // bid: {
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // },
                        // ask:{
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // }
                      }
                    }

                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      ticks: {
                        color: 'rgb(255, 99, 132)',
                      },
                      
                          
                      title: {
                        color: 'rgb(255, 99, 132)',
                        display: true,
                        text: 'Dataset 1'
                      }
                    }
                  }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSContainer').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},


        { canvas: { 
          id: "chartjsVolumes",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_BIG_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_BIG_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.volume);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.volume);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSVolumesContainer",  width: "1024", height: "350" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.volume)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                responsive: false, //true,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                // animation: { // new animation!
                //     duration: 800,
                //     easing: 'linear',
                //     // from: 1,
                //     // to: 0,
                //     loop: false
                // },
                stacked: false,
                plugins: {
                  title: {
                  display: true,
                  text: 'Volumes'
                  }
                },
                scales: {
                  y: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  ticks: {
                    color: 'rgb(255, 99, 132)',
                  },
                  x: {
                    display: false
                  },
                  
                      
                  title: {
                    color: 'rgb(255, 99, 132)',
                    display: true,
                    text: 'Dataset 2'
                  }
                  }
                }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSVolumesContainer').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},



        
        { canvas: { 
          id: "chartjs5Min",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_SMALL_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_SMALL_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          def: {
            computeAvgPercObserved: ($, limitToSlidingWindow=false) => {
              // console.log("datasetsss", $.this.chart.data.datasets[0].data)

              let data = $.this.chart.data.datasets[0].data
              if (limitToSlidingWindow){
                data = data.length > $.this.slidingWindowsPoints ? data.slice((data.length-$.this.slidingWindowsPoints), data.length) : data
              }
              let count = data.length

              let sum = 0
              let min = Number.MAX_SAFE_INTEGER
              let max = Number.MIN_SAFE_INTEGER
              for (let i=0; i<count-1; i++){
                let _old = data[i]
                let _new = data[i+1]

                let abs_diff = Math.abs(_new - _old)

                let perc = (abs_diff / _new) * 100
                // console.log()
                perc < min && min > 0 && (min = perc)
                perc > max && (max = perc)
                sum = sum + perc
              }
              return {total: sum, avg: sum/count, min: min, max: max}

              //   let perc = (abs_diff / _new) * 100

              //   sum += abs_diff
              // }
              // return ((sum/count) / _new) * 100

            }
          },
          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.price);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.price);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                $.this.chart.config.options.plugins.annotation = {
                  annotations: {
                    bid: {
                      type: 'line',
                      yMin: newData.bid,
                      yMax: newData.bid,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    },
                    ask:{
                      type: 'line',
                      yMin: newData.ask,
                      yMax: newData.ask,
                      borderColor: 'rgb(255, 99, 132)',
                      borderWidth: 2 
                    }
                  }
                }

                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSContainer5min",  width: "1024", height: "600" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.price)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                  responsive: false, //true,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  // animation: { // new animation!
                  //     duration: 800,
                  //     easing: 'linear',
                  //     // from: 1,
                  //     // to: 0,
                  //     loop: false
                  // },

                  stacked: false,
                  plugins: {
                    title: {
                    display: true,
                    text: GRAPH_SMALL_MIN + 'Min Chart'
                    },

                    tooltip: {
                      callbacks: {
                        footer: (tooltipItems) => {
                        
                          let long = (100 - ((tooltipItems[0].parsed.y / $.le.appRoot.stockData.price) * 100))
                          let short = ((100 - (($.le.appRoot.stockData.price / tooltipItems[0].parsed.y ) * 100)))

                          return  '[from here]\n' + 'Long: ' + long.toFixed(3) + "%" + "\nShort: " + short.toFixed(3) + "%\n" +        '\n' + 'Long (5x): ' + (long*5).toFixed(3) + "%" + "\nShort(x5): " + (short*5).toFixed(3) + "%\n"
                        }
                      }
                    },

                    annotation: {
                      annotations: {
                        // bid: {
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // },
                        // ask:{
                        //   type: 'line',
                        //   yMin: 0,
                        //   yMax: 0,
                        //   borderColor: 'rgb(255, 99, 132)',
                        //   borderWidth: 2 
                        // }
                      }
                    }
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      ticks: {
                        color: 'rgb(255, 99, 132)',
                      },
                      
                          
                      title: {
                        color: 'rgb(255, 99, 132)',
                        display: true,
                        text: 'Dataset 1'
                      }
                    }
                  }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSContainer5min').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},


        { canvas: { 
          id: "chartjsVolumes5min",


          data: {
            chart: undefined,

            numPoints: DEFAULT_REFRESH_RATE === 1000 ? 60*GRAPH_SMALL_MIN : (1000/DEFAULT_REFRESH_RATE)*60*GRAPH_SMALL_MIN, // minuti
            slidingWindowsPoints: DEFAULT_REFRESH_RATE === 1000 ? 60 : (1000/DEFAULT_REFRESH_RATE)*60 // sec [if refresh rate is 1 sec]
          },

          
          on: { le: { appRoot: {

            fullInitialStockDataChanged: ($, newFullData, oldFullData) => {
              // console.log("full chaaart", newFullData, $.this.chart)
              if ($.this.chart !== undefined){
                
                let i = 0;
                let skip_num = ($.le.appRoot.refreshRateMs / SERVER_SCRAPE_TIME)
                newFullData.forEach(newData=>{
                  if (i++%skip_num === 0){ // get only half data, because of 0.5 sec scraping and 1 sec retriving here
                    $.this.chart.data.labels.push(newData.date);
                    $.this.chart.data.datasets.forEach((dataset) => {
                      dataset.data.push(newData.volume);
                    });
                    
                    // remove last..to keep num items in sync	
                    if ($.this.chart.data.labels.length > $.this.numPoints ){
                      $.this.chart.data.labels.shift();
                      $.this.chart.data.datasets.forEach((dataset) => {
                        dataset.data.shift();
                      });
                    }
                  }

                })
                
                $.this.chart.update('none'); // with none no animation is done
              }

            },

            stockDataChanged: ($, newData, oldData) => {
              // console.log("chaaart", $.this.chart)
              if ($.this.chart !== undefined){
                        
                $.this.chart.data.labels.push(newData.date);
                $.this.chart.data.datasets.forEach((dataset) => {
                  dataset.data.push(newData.volume);
                });
                
                // remove last..to keep num items in sync	
                if ($.this.chart.data.labels.length > $.this.numPoints ){
                  $.this.chart.data.labels.shift();
                  $.this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.shift();
                  });
                }
                
                $.this.chart.update('none'); // with none no animation is done
                // $.this.chart.update(); // with none no animation is done
              }

            }

          }}},


          attrs: { id: "chartJSVolumesContainer5min",  width: "1024", height: "350" }, 

          afterInit: $ => {

            if ($.this.chart === undefined ){
              let full_data = [] //[{date: 0, price: 0}]
              
              const getLabels = (_data)=>_data.map(d=>d.date)
              const getValues = (_data)=>_data.map(d=>d.volume)
              
              
              const data = {
                labels: getLabels(full_data),
                datasets: [
                {
                  label: 'Dataset 1',
                  data: getValues(full_data),
                  borderColor: 'rgb(255, 99, 132)',
                  //backgroundColor: Utils.transparentize(chartColors.red, 0.5),
                  //backgroundColor: '#ff000099', //'rgb(255, 99, 132, 0.5)',
                  yAxisID: 'y',
                  pointRadius:0,
                  borderWidth: 1,
                },
                ]
              };
          
              const config = {
                type: 'line',
                data: data,
                options: {
                responsive: false, //true,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                // animation: { // new animation!
                //     duration: 800,
                //     easing: 'linear',
                //     // from: 1,
                //     // to: 0,
                //     loop: false
                // },
                stacked: false,
                plugins: {
                  title: {
                  display: true,
                  text: 'Volumes'
                  }
                },
                scales: {
                  y: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  ticks: {
                    color: 'rgb(255, 99, 132)',
                  },
                  x: {
                    display: false
                  },
                  
                      
                  title: {
                    color: 'rgb(255, 99, 132)',
                    display: true,
                    text: 'Dataset 2'
                  }
                  }
                }
                },
              };
          
              // let chartCtx = $.this.el.getContext('2d');

              let chartCtx = document.getElementById('chartJSVolumesContainer5min').getContext('2d');

              $.this.chart = new Chart(chartCtx, config);
            }
          }

        }},

      ],

    }
  })
})
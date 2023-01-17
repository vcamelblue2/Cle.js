
import {RenderApp, cle, html, f, fArgs, pass, LE_LoadCss, Bind, Alias, Switch, Case } from "../../../../../lib/caged-le.js"

// Import cle-react mashup utils
import { UseReact, useCleProps, onCleSignal  } from '../../../lib/react-in-cle.js';
import { UseCle, UseSubCle } from '../../../lib/cle-in-react.js';

// PrimeReact
import "primereact/resources/themes/lara-light-indigo/theme.css";  //theme
import "primereact/resources/primereact.min.css";                  //core css
import "primeicons/primeicons.css";                                //icons

import { TabView, TabPanel } from 'primereact/tabview';

const CleLikesService = { Service: {
  id: "likeService",

  let: {
    likes: {
      post_id_0: 10
    },
    numEdits: 0
  },

  on: { 
    this: {
      likesChanged: $=>{
        $.this.numEdits += 1
      }
    }
  },

  def: {
    getLikeFor($, postIdNum){
      return $.this.likes['post_id_'+postIdNum]
    },

    addLikeTo($, postIdNum){
      $.this.likes['post_id_'+postIdNum] += 1
      $.this._mark_likes_as_changed()
    },

    resetData($){
      $.this.numEdits = -1
      $.this.likes = {
        post_id_0: 10
      }
    }
  },

}}

export function App() { return <UseCle def={
  cle.root({
      let: {
        posts: [{
          id: 0, user: "Vins", content: "Woww what a beautifull framework!"
        }]
      },
    },
    
    CleLikesService,

    cle.div({meta: { forEach: "post", of: f`@posts`},
      style: "width: 200px; height: 200px; border: 1px solid black"
    },
      cle.h4({}, f`@post.user`),
      cle.div({}, f`@post.content`),
      cle.br(),
      cle.div({}, $=>"likes: "+$.le.likeService.getLikeFor($.post.id)),
      cle.button({ handle_onclick: $=>{$.le.likeService.addLikeTo($.post.id)}}, f`'Add Like'`)
    ),

    UseReact(({$})=>{
      useCleProps($, "$.le.likeService.numEdits")
      return <button onClick={$.le.likeService.resetData}>Reset Data (#Edits: {$.le.likeService.numEdits})</button>
    }),

    
    UseReact(({$})=>{
      useCleProps($, "$.le.likeService.numEdits")

      // with UseCle you cannot follow a parent cle from a nested react..the renderer is different!
      return <>
        <UseCle def={ cle.div({}, 
        
          UseReact(({$$})=>{
            useCleProps($, "$.le.likeService.numEdits")
            return <button onClick={$.le.likeService.resetData}>Reset Data (#Edits: {$.le.likeService.numEdits}) (shoud be always 0..)</button>
          })
        )}/>
        
        {/* Solution: with UseSubCle now you can follow a parent cle from a nested react..the cle renderer is reused! */}
        <UseSubCle $={$} def={ cle.div({}, 
          
          UseReact(({$})=>{
            useCleProps($, "$.le.likeService.numEdits")
            return <button onClick={$.le.likeService.resetData}>Reset Data (#Edits: {$.le.likeService.numEdits})</button>
          })
        )}/>

        <button onClick={$.le.likeService.resetData}>Reset Data (#Edits: {$.le.likeService.numEdits})</button>
      </>
    }),


    cle.Controller({ meta: {hasViewChilds: true},
      id: "tabs",
      let_activeIndex: 0,

      let_switchCount: 0,
      on_this_activeIndexChanged: $=>{
        $.switchCount += 1
        setTimeout(() => { $.dbus.switchCountIncreesed.emit($.switchCount) }, 100);
      },
      dbus_signals: {
        switchCountIncreesed: "stream => void"
      }
    },
      
      UseReact(({$})=>{ useCleProps($, "activeIndex", "switchCount", "$.le.likeService.numEdits")
        
        onCleSignal($, "le.tabs.switchCountChanged", (switchCount=>{
          console.log("I'm react! switch count changed!! new: ", switchCount, "(from le)")
        }))
        onCleSignal($, "dbus.switchCountIncreesed", (switchCount=>{
          console.log("I'm react! switch count increesed!! new: ", switchCount, "(from dbus)")
        }))

        return <>
          <TabView activeIndex={$.activeIndex} onTabChange={(e) => { $.activeIndex = e.index}}>
              <TabPanel header="Header I">
                <UseSubCle $={$} def={ cle.div({}, 
                  
                  UseReact(({$})=>{ useCleProps($, "$.le.tabs.activeIndex", "$.le.likeService.numEdits")
                    return <span>The Active Index Is: {$.activeIndex}. Num Edits: {$.le.likeService.numEdits}</span>
                  })

                )}/>
              </TabPanel>
              <TabPanel header="Header II">
                <UseSubCle $={$} def={ cle.div({}, 
                  
                  UseReact(({$})=>{ useCleProps($, "$.le.tabs.activeIndex", "$.le.likeService.numEdits")
                    return <span>The Active Index Is: {$.activeIndex}. Num Edits: {$.le.likeService.numEdits}</span>
                  })

                )}/>
              </TabPanel>
              <TabPanel header="Header III">
                <UseSubCle $={$} def={ cle.div({}, 
                  cle.span({}, "The Active Index Is: ", f`@activeIndex`, ". Num Edits: ", $=>$.le.likeService.numEdits)
                )}/>
              </TabPanel>
          </TabView>

          <UseSubCle $={$} def={ cle.div({ class: "p-component"}, 
            "Switch Count: ", f`@switchCount`
          )}/>
        </>
      })
    ),

    cle.button({handle_onclick: $=>$.le.tabs.activeIndex = 2}, "Go To 3 Tab")


  )}/>
}
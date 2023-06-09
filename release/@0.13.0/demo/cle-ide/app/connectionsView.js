import { UseAnchors } from "./anchors.js";

export const ConnectionsView = {
  canvas: {
    id: "connection_sourface",

    props: {
      ...UseAnchors(),
      width: $ => $.parent.Width,
      height: $ => $.parent.Height
    },

    attrs: { 
      width: $ => $.this.Width, 
      height: $ => $.this.Height, 
      style: $ => ({ ...$.this.Anchors, /*border: "5px solid orange",*/ "cursor": "not-allowed", "pointer-events": "none" }) 
    },

    def: {
      getRootEl: $ => $.le.rootView.rootRef.el,
      getChildsEl: $ => Array.from($.le.childsView.el.children),

      connectRootToChilds: ($) => {
        let ctx_el = $.this.el;
        let ctx = ctx_el.getContext("2d");

        ctx.clearRect(0, 0, ctx_el.width, ctx_el.height);
        ctx.beginPath();

        let root = $.this.getRootEl();
        let childs = $.this.getChildsEl();

        let rootBB = root.getBoundingClientRect();
        let childsBB = childs.map(c => c.getBoundingClientRect());

        // console.log(rootBB, childsBB)
        let root_anchor_point = { x: rootBB.left + (rootBB.width / 2), y: rootBB.bottom };
        let childs_anchor_point = childsBB.map(childBB => {
          return { x: childBB.left + (childBB.width / 2), y: childBB.top };
        });

        let root_top_anchor_point = { x: rootBB.left + (rootBB.width / 2), y: rootBB.top };
        let childs_top_anchor_point = childsBB.map(childBB => {
          return { x: childBB.left + (childBB.width / 2), y: childBB.bottom };
        });

        let pre_post_line_height = 50;


        // draw connections
        ctx.setLineDash([]); // this reset to non dash
        childs_anchor_point.forEach(child_anchor_point => {
          ctx.moveTo(root_anchor_point.x, root_anchor_point.y);
          ctx.lineTo(child_anchor_point.x, child_anchor_point.y);
          ctx.stroke();
        });

        // draw pre-post lines
        if ($.le.model.canGoBack) {
          ctx.setLineDash([5, 15]); // set to dash
          ctx.moveTo(root_top_anchor_point.x, root_top_anchor_point.y - 3);
          ctx.lineTo(root_top_anchor_point.x, root_top_anchor_point.y - 3 - pre_post_line_height);
          ctx.stroke();
        }

        childs_top_anchor_point.forEach((child_top_anchor_point, child_idx) => {
          if ($.le.model.childHasSubchilds(child_idx)) {
            ctx.setLineDash([5, 15]);
            ctx.moveTo(child_top_anchor_point.x, child_top_anchor_point.y + 3);
            ctx.lineTo(child_top_anchor_point.x, child_top_anchor_point.y + 3 + pre_post_line_height);
            ctx.stroke();
          }
        });
      }
    },

    on: {
      le: {
        model: {
          visibleRootChanged: $ => {
            setTimeout(() => {
              $.this.connectRootToChilds();
            }, 10);
          }
        },
        app: {
          WidthChanged: $ => {
            setTimeout(() => {
              $.this.connectRootToChilds();
            }, 10);
          }
        }
      }
    },

    afterInit: $ => {
      $.this.connectRootToChilds();
    }
  }
};

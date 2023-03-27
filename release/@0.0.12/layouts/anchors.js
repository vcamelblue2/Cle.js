// Anchors system definition

const notnulls = (...args) => args.reduce((a, b) => a && (b !== undefined), true);

const firstDefined = (...args) => args.find(x => x !== undefined);

export const AnchorsSystmeRootStyle = { position: "relative", width: "100%", height: "100%", padding: "0px", margin: "0px" };

const AnchorsSystmeDefaultStyle = $ => $.this.Anchors;

export const AnchorsSystemInit = $ => {
  // resetRootWindowSize
  window.onresize = () => {
    $.this.width = window.innerWidth;
    $.this.height = window.innerHeight;
  };
  document.body.style.padding = "0px";
  document.body.style.margin = "0px";
};

export const UseAnchors = (positioning = "absolute") => {
  return {
    // props to define
    width: undefined, height: undefined, left: 0, top: 0, right: undefined, bottom: undefined,

    // solito problema di castare nei childs e rimappare..
    // props to use in other component
    Width: $ => $.this.width || (notnulls($.this.left, $.this.right) && $.this.right - $.this.left) || 0,
    Height: $ => $.this.height || (notnulls($.this.top, $.this.bottom) && $.this.bottom - $.this.top) || 0,
    Left: $ => $.this.left || (notnulls($.this.width, $.this.right) && $.this.right - $.this.width) || 0,
    Top: $ => $.this.top || (notnulls($.this.height, $.this.bottom) && $.this.bottom - $.this.height) || 0,
    Right: $ => $.this.right || (notnulls($.this.width, $.this.left) && $.this.left + $.this.width) || undefined,
    Bottom: $ => $.this.bottom || (notnulls($.this.height, $.this.top) && $.this.top + $.this.height) || undefined,
    HorizontalCenter: $ => $.this.Width / 2,
    VerticalCenter: $ => $.this.Height / 2,

    // as child
    Height_: $ => $.this.Height,
    Width_: $ => $.this.Width,
    Left_: $ => 0,
    Top_: $ => 0,
    Right_: $ => $.this.Width,
    Bottom_: $ => $.this.Height,
    HorizontalCenter_: $ => $.this.Width / 2,
    VerticalCenter_: $ => $.this.Height / 2,

    // f to recall in style
    Anchors: $ => ({
      position: positioning,
      width: $.this.Width + "px",
      height: $.this.Height + "px",
      top: $.this.Top + "px",
      left: $.this.Left + "px",
    })
  };
};

export const DEVICE = {
  MOBILE_M: 600,
  MOBILE_L: 768,
  TABLET_M: 992,
  DESKTOP_M: 1200,
  DESKTOP_L: 1201,
}

export const UseAnchorsRoot = {
  ...UseAnchors(),
  width: window.innerWidth,
  height: window.innerHeight,

  isInLandscape: $ => $.this.width > $.this.height,
  deviceType: $ => {
    let w = $.this.width
    if (w < DEVICE.MOBILE_M) {
      return DEVICE.MOBILE_M
    }
    else if (w >= DEVICE.MOBILE_M && w < DEVICE.MOBILE_L) {
      return DEVICE.MOBILE_L
    }
    else if (w >= DEVICE.MOBILE_L && w < DEVICE.TABLET_M) {
      return DEVICE.TABLET_M
    }
    else if (w >= DEVICE.TABLET_M && w < DEVICE.DESKTOP_M) {
      return DEVICE.DESKTOP_M
    }
    else if (w >= DEVICE.DESKTOP_M) {
      return DEVICE.DESKTOP_L
    }
  }
}
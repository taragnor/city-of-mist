import { HTMLTools } from "./HTMLTools.js";
export class ContextMenu {

  static openMenus : ContextMenu[] = [];
  cssClasses: string[] = ["context-menu"];
  options : ContextMenuOptions[] = [];
  element: JQuery;
  openingEvent: JQuery.Event;

  constructor (cssClass: string, options : ContextMenuOptions[] = []) {
    this.cssClasses.push(cssClass);
    this.element = $(this.html());
    this.setOptions(options);
  }

  public attachToContainer(container: JQuery) {
    container.append(this.element);
    this.activateListeners();
  }

  private setOptions (options: ContextMenuOptions[]) {
    this.options = options;
    const menu = this.element;
    menu.empty();
    for (const item of this.optionsHTML()) {
      menu.append($(item));
    }
  }

  static closeAll() {
    const list = ContextMenu.openMenus.slice();
    list.forEach( x=> x.hide());
  }

  protected html(): string {
    return `
<div id="contextMenu" class="${this.cssClasses.join(" ")}">
    ${this.optionsHTML().join("")}
</div>`;
  }

  private optionsHTML() : string[] {
    const menuItems = this.options
      .map ( (item, index) => item.visible === undefined || item.visible ?
        `<div class="menu-item" data-index="${index}">${item.label}</div> ` : '')
    .filter( str => str.length > 0)
    ;
    return menuItems;
  }

  public show(ev: JQuery.Event & {clientX: number, clientY:number}, options: ContextMenuOptions[]): void {
    this.setOptions(options);
    this.openingEvent = ev;
    ev.stopPropagation();
    ev.preventDefault();
    let y = ev.clientY;
    let x = ev.clientX;
    if (y == undefined) {throw new Error("Y should never be undefined here");}
    const menu= this.element;
    menu.show();
    if (!ContextMenu.openMenus.includes(this)) {
      ContextMenu.openMenus.push(this);
    }
    const menuWidth = menu.outerWidth() ?? 0;
    const menuHeight = menu.outerHeight() ?? 0;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    if (x + menuWidth > winWidth) {
      x = winWidth - menuWidth - 4;
    }
    if (y + menuHeight > winHeight) {
      y = winHeight - menuHeight - 4;
    }
    menu.css({
      left: x,
      top: y
    });
  }

  public hide() {
    ContextMenu.openMenus = ContextMenu.openMenus
      .filter( menu => menu != this);
    this.element.hide();
  }

  private activateListeners() {
    this.element.on("click", ".menu-item", (ev) => {
      const index = Number(HTMLTools.getClosestData(ev,"index"));
      const option = this.options.at(index);
      this.hide();
      if (!option) {
        throw new Error(`No context menu option at index ${index}`);
      }
      option.action(this.openingEvent ?? ev);
    });
  }
}

export type ContextMenuOptions<Ret = unknown> = {
  label: string;
  visible ?: boolean;
  action: (ev: JQuery.Event) => Ret;
};

Hooks.on("ready", () => {
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") { ContextMenu.closeAll(); }
  });
  $(document).on("click", function () {
    ContextMenu.closeAll();
  });
});

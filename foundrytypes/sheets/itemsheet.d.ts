namespace Foundry{
  class ItemSheet<T extends Item> extends DocumentSheet<T> {
    item: T;
  }
}

/**  @deprecated use foundry.appv1.sheets.ItemSheet*/
const ItemSheet = Foundry.ItemSheet;

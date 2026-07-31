export class DocumentTools {

  static async arrayAdd<T extends FoundryDocument>(doc: T, path: string, newData: Record<string, unknown> = {}) {
    const data = (foundry.utils.getProperty(doc, path) as unknown[] ?? []).slice();
    data.push(newData);
    const ret = await doc.update( {[path]: data});
    if (!ret) {
      console.warn(`Array add to ${path} on ${doc.name} seems to have failed`);
    }
    return ret;
  }

  static async arrayDelete<T extends FoundryDocument>(doc: T, path: string, index: number) {
    const data = (foundry.utils.getProperty(doc, path) as unknown[] ?? []).slice();
    if (typeof index != "number" || index < 0 || index >= data.length || Number.isNaN(index)) {
      throw new Error(`Invalid index: ${index}`);
    }
    data.splice(index, 1);
    const ret =await doc.update( {[path]: data});
    if (!ret) {
      console.warn(`Array delete to ${path} on ${doc.name} seems to have failed`);
    }
    return ret;
  }

}

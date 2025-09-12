/** @deprecated in V12: use foundry.utils.mergeObject instead */
declare function mergeObject<A extends object,B extends object>( a: A, b: B) : B&A;


declare function renderTemplate(templatePath: string, templateData: Record<string|number, any>): Promise<string>;

declare function deepClone<T>(cloneSource: T) : T;

type DeepRequired<T> = T extends Function
  ? T // functions are left as-is
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;


/** @deprecated in V12: use foundry.utils.mergeObject instead */
declare function mergeObject<A extends object,B extends object>( a: A, b: B) : B&A;


/** @deprecated deprecated in Foundry v13+, use foundry.applications.handlebars.renderTemplate instead */
declare function renderTemplate(templatePath: string, templateData: Record<string|number, any>): Promise<string>;

declare function deepClone<T>(cloneSource: T) : T;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type DeepRequired<T> = T extends Function
  ? T // functions are left as-is
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;

type PartialKeys<T, K extends PropertyKey> =
  T extends unknown
    ? Omit<T, Extract<K, keyof T>> &
      Partial<Pick<T, Extract<K, keyof T>>>
    : never;

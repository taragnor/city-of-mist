/** @deprecated in V12: use foundry.utils.mergeObject instead */
declare function mergeObject<A extends Object,B extends Object>( a: A, b: B) : B&A;


declare function renderTemplate(templatePath: string, templateData: Record<string|number, any>): Promise<string>;

declare function deepClone<T>(cloneSource: T) : T;

type Subtype<T extends (Actor<any, any> | Item<any>), X extends T["system"]["type"]> = T & {system: {get type() : Readonly<X>}};

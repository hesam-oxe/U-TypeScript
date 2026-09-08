// @filename: intersectionWithConflictingPrivateProperties.ts

// An intersection of types that declare same-named private properties originating from
// different classes is reduced to `never`. Indexed accesses for such a property must
// report an error instead of silently resolving to `never` (see #62294).

class A {
    private a = { foo: 1 };
}

class B {
    private a = { bar: "bar" };
}

// Direct non-generic intersection
type T1 = (A & B)["a"]; // Error
type T2 = (A & B)["missing"]; // Ok, indexing `never` is permissive

// Generic intersection
type T3<T extends A, U extends B> = (T & U)["a"]; // Error

// Type parameter constrained by an intersection
type T4<T extends A & B> = T["a"]; // Error
type T5<T extends A & B> = T["a"]["b"]["c"]["d"]; // Error

// Accessed through an alias
type AB = A & B;
type T6 = AB["a"]; // Error

// Nested in a conditional type
type T7<T extends A, U extends B> = T extends never ? never : (T & U)["a"]; // Error

// Element access in expression position
function f1<T extends A, U extends B>(x: T & U) {
    const v1 = x["a"]; // Error
    x["a"] = { foo: 1 }; // Error
    const { a } = x; // Error
}

// Class expressions declare private members too
const CE = class {
    private a = 1;
};
type T8 = (InstanceType<typeof CE> & B)["a"]; // Error

// Single-class private member access on a type parameter still reports TS4105
type T9<T extends A> = T["a"]; // Error

// Accesses to non-conflicting properties are unaffected
class C {
    private a = 1;
    public c = "c";
}

class D {
    private a = 2;
    public d = "d";
}

type T10 = (C & D)["c"]; // Ok
type T11<T extends C, U extends D> = (T & U)["d"]; // Ok
type T12<T extends C & D> = T["c"]; // Ok

function f2<T extends C, U extends D>(x: T & U) {
    const v2 = x["c"]; // Ok
    const v3 = x["d"]; // Ok
    const { c } = x; // Ok
}

// Generic index types are unaffected
type T13<T extends A, U extends B> = (T & U)[keyof (T & U)]; // Ok

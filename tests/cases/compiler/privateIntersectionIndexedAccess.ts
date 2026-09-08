// @target: es2020
// Indexed access with the name of a property that is private in more than one constituent
// of an intersection should report a private access error, mirroring the error reported
// for the equivalent dot access.

class A {
    private x = 1;
    public y = 1;
}

class B {
    private x = 1;
}

declare const ab: A & B;
const dotAccess = ab.x;
const bracketAccess = ab["x"];
const unrelatedKey = ab["y"];

function f<T extends A, U extends B>(tu: T & U) {
    const genericDot = tu.x;
    const genericBracket = tu["x"];
    const genericUnrelated = tu["y"];
}

type I = A & B;
type IndexedPrivate = I["x"];
type IndexedPublic = I["y"];

// The error is reported regardless of enclosing class, since the intersection itself
// is uninhabitable (dot access reports an equivalent error).
class C {
    private x = 1;
    m(ca: C & B) {
        return ca["x"];
    }
}

// A property that is private in one constituent and public in another still conflicts.
class D {
    private x = 1;
}
class E {
    x = 2;
}
declare const de: D & E;
const mixedBracket = de["x"];
const mixedDot = de.x;

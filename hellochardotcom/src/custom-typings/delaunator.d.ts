declare module 'delaunator' {
    export default class Delaunator {
        /**
         * A flat Int32Array array of triangle vertex indices (each group of three numbers forms a triangle). All triangles are directed counterclockwise.
         */
        triangles: Int32Array;

        /**
         * A flat Int32Array array of triangle half-edge indices that allows you to traverse the triangulation.
         * i-th half-edge in the array corresponds to vertex triangles[i] the half-edge is coming from.
         * halfedges[i] is the index of a twin half-edge in an adjacent triangle (or -1 for outer half-edges on the convex hull).
         *
         * The flat array-based data structures might be counterintuitive, but they're one of the key reasons this library is fast.
         */
        halfedges: Int32Array;

        /**
         * Constructs a delaunay triangulation object given an array of points ([x, y] by default). Duplicate points are skipped.
         */
        constructor(points: [number, number][]);
        static from<T>(points: T[], getX: GetPoint<T>, getY: GetPoint<T>): Delaunator;
    }
    type GetPoint<T> = (point: T) => number;
}

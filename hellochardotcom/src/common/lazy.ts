export default function lazy<T>(fn: () => T): () => T {
    let cache: T;
    return () => {
        if (cache === undefined) {
            cache = fn();
        }
        return cache;
    };
}

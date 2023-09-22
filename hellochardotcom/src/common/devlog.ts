export default function devlog(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "development") {
        console.log(message, ...optionalParams);
    }
}

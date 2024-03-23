export function debugLog(input: any) {
  if (process.env.NODE_ENV === "development") console.log(input);
}

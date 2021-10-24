export function isLink(text: string) {
  return Boolean(text?.match(/^http[s]?:\/\/\S+$/))
}

import { bondTable } from "./connectionLength";
export function nodeToElement(name: string, nothetero: boolean) {
  let elem = name.replace(/ /g, "");
  if (
    elem.length > 0 &&
    elem[0] === "H" &&
    elem !== "Hg" &&
    elem !== "He" &&
    elem !== "Hf" &&
    elem !== "Hs" &&
    elem !== "Ho"
  ) {
    elem = "H"; 
  }
  if (elem.length > 1) {
    elem = elem[0].toUpperCase() + elem.substring(1).toLowerCase();
    if (bondTable[elem] === undefined) {
      elem = elem[0];
    } else if (nothetero) {
      if (elem === "Ca") {
        elem = "C";
      } else if (elem === "Cd") {
        elem = "C";
      }
    }
  }
  return elem;
}

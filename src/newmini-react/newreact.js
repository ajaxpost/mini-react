function creatElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((item) => {
        return typeof item === "object" ? item : creatTextElement(item);
      }),
    },
  };
}

function creatTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

console.log(
  creatElement("div", { calssName: "123" }, creatElement("h1", null, "标题12"))
);
export { creatElement };

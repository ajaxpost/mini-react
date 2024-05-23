/**
 * Fiber 思想
 */

let nextUnitorWork = null; // 下一个工作单元
let wipRoot = null; // 当前工作的根节点
let currentRoot = null; // 上一次渲染的 fiber 树
let deletions = null; // 要删除的节点

function createDom(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);
  return dom;
}

function updateDom(dom, prevProps, nextProps) {
  const isProtype = (key) => key !== 'children';
  const isEvent = (key) => key.startsWith('on');
  // 添加属性
  Object.keys(nextProps)
    .filter(isProtype)
    .forEach((key) => {
      dom[key] = nextProps[key];
    });
  // 添加事假监听器
  Object.keys(nextProps)
    .filter(isProtype)
    .filter(isEvent)
    .forEach((key) => {
      const eventType = key.substring(2).toLocaleLowerCase();
      dom.addEventListener(eventType, nextProps[key]);
    });
}

function commitRoot() {
  commitWork(wipRoot.child);
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;
  const domParent = fiber.parent.dom;

  domParent.appendChild(fiber.dom);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/*
    判断下一个工作单元是否存在
    如果存在并且当前帧还有剩余时间
    就继续执行下一个工作单元,就这样重复执行这些单元,来生成fiber树
*/
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitorWork && !shouldYield) {
    // 执行当前工作单元,为次返回下一个工作单元
    nextUnitorWork = performUnitOfWork(nextUnitorWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitorWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber.props.children;
  // 然后需要对当前树结构生成对应的fiber结构
  reconcileChildren(fiber, elements);
  if (fiber.child) {
    return fiber.child;
  }
  // 需要将所有的兄弟节点都要生成dom
  // 也就是如果当前的fiber没有子级了,就返回当前fiber的兄弟元素
  // 如果不存在兄弟元素,就返回父级的兄弟元素,在不存在的话,就返回父父级的兄弟元素
  let newFiber = fiber;
  while (newFiber) {
    if (newFiber.sibling) {
      return newFiber.sibling;
    }
    newFiber = newFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0; // 索引
  let prevSibling = null; // 上一个兄弟fiber
  while (index < elements.length) {
    const element = elements[index];
    const newFiber = {
      type: element.type,
      props: element.props,
      dom: null,
      parent: wipFiber,
    };
    // fiber结构,子级不是一个数组来存储,子级就有一个,其他子级都是第一个子级的兄弟fiber
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

function createRoot(element, container) {
  // 初始化根节点 #root
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
  nextUnitorWork = wipRoot;
}

export { createRoot };

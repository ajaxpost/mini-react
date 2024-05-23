/**
 * Fiber 思想
 */

let nextUnitorWork = null; // 下一个工作单元
let wipRoot = null; // 当前工作的根节点
let currentRoot = null; // 上一次渲染的 fiber 树
let deletions = null; // 要删除的节点

function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}
const isProtype = (key) => key !== "children";
const isEvent = (key) => key.startsWith("on");
const isNew = (prevProps, nextProps) => (key) =>
  prevProps[key] !== nextProps[key];
function updateDom(dom, prevProps, nextProps) {
  // 添加属性
  Object.keys(nextProps)
    .filter(isProtype)
    .filter(isNew(prevProps, nextProps))
    .forEach((key) => {
      dom[key] = nextProps[key];
    });
  // 添加事假监听器
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((key) => {
      const eventType = key.substring(2).toLocaleLowerCase();
      dom.addEventListener(eventType, nextProps[key]);
    });
  // 移除属性
  Object.keys(prevProps)
    .filter(isProtype)
    .filter((key) => !(key in nextProps))
    .forEach((key) => {
      dom[key] = "";
    });
  // 移除事件监听器
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(key))
    .forEach((key) => {
      const eventType = key.substring(2).toLocaleLowerCase();
      dom.removeEventListener(eventType, prevProps[key]);
    });
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;

  /**
   * 这里主要为解决函数组件和类组件的存在
   * 这俩组件会导致 dom 为 null
   * 因为这俩组件的fiber只是个占位符
   * 所以只需要将组件child的dom放到父父fiber的dom上即可
   */
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }

  const domParent = domParentFiber.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    // domParent.removeChild(fiber.dom);
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
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
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    // 函数组件执行逻辑
    updateFunctionComponent(fiber);
  } else {
    // 普通jsx执行逻辑
    updateHostComponent(fiber);
  }

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

let wipFiber = null; // 当前正在进行的fiber => useState
let hookIndex = null; // 当前useState的索引

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const element = fiber.type(fiber.props);
  reconcileChildren(fiber, [element]);
}

function _useState(initValue) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initValue,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    // 执行setState后,将他存到队列中(这里使用的是一个数组)
    // 然后重新渲染
    // 渲染时,进入 useState 方法,然后执行上一次存储的setState
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitorWork = wipRoot;
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber.props.children;
  // 然后需要对当前树结构生成对应的fiber结构
  reconcileChildren(fiber, elements);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0; // 索引
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null; // 上一个兄弟fiber
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    // const newFiber = {
    //   type: element.type,
    //   props: element.props,
    //   dom: null,
    //   parent: wipFiber,
    // };
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
    alternate: currentRoot,
  };
  nextUnitorWork = wipRoot;
  deletions = [];
}

export { createRoot, _useState };

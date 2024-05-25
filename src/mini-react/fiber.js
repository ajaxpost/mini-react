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
const isProtype = (key) => key !== 'children';
const isEvent = (key) => key.startsWith('on');
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
      dom[key] = '';
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
  // 这里就是为什么useEffect更新状态后,会先执行销毁后那个回调了,并且里面打印的state都是上一次的数据
  // 主要是因为在函数组件中,每次都要给hooks这个数组情况 wipFiber.hooks = []
  // 然后在重新push新的hook,每次重新渲染后这个数组及其里面的对象的内存地址就发生了变化
  // 在然后就是useEffect第一次的时候已经把第一次的hook对象传递过来了
  // 并且将 destory 函数存储起来,当第二次在提交到屏幕的时候,才会执行第一次的destory
  // 可能你还有有疑问?
  // 为什么将第一次的destory存储起来,在第二次提交的时候执行会取的旧值呢?难道不一直应该是新的数据吗?
  // 因为 destory 是在一个函数中返回的一个函数,你将他存起来,在第二次访问的时候他的作用域其实还是上一次的,也是用到了闭包的特性
  pendingEffects.forEach((effect) => {
    const destory = effect.fn();
    if (destory) {
      destoryEffects[effect.key] = destory;
    }
  });
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
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
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
let pendingEffects = []; // 存储effect
let destoryEffects = {}; // 销毁effect

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  pendingEffects = [];
  const element = fiber.type(fiber.props);
  reconcileChildren(fiber, [element]);
  wipFiber.hooks
    .filter((o) => o.tag === 'EFFECT')
    .forEach((hook, key) => {
      const oldHook =
        wipFiber.alternate &&
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks.filter((o) => o.tag === 'EFFECT')[key];
      if (hook.dept?.length === 0 && !oldHook) {
        // 执行挂载后
        pendingEffects.push({
          fn: hook.fn,
          key,
        });
      } else if (
        /**
         * 1. 如果没有穿第二个参数
         * 2. 第二次渲染后的dept不等于第一次的dept
         * 3. 依赖数组value发送变化
         */
        !hook.dept ||
        hook?.dept?.length !== oldHook?.dept?.length ||
        hook.dept.filter(
          (_, index) => hook.dept?.[index] !== oldHook.dept?.[index]
        ).length
      ) {
        pendingEffects.push({
          fn: hook.fn,
          key,
        });
        destoryEffects[key]?.();
      }
    });
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
    if (action instanceof Function) {
      hook.state = action(hook.state);
    } else {
      hook.state = action;
    }
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

function _useEffect(fn, dept) {
  /**
   * 参考 useState 的设计实现
   */
  const hook = {
    tag: 'EFFECT',
    fn,
    dept,
  };

  wipFiber.hooks.push(hook);
  hookIndex++;
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
  /*
   重新渲染后==>
    第一次是 #root > div,返回 alternate:div
    第二次是 div > app ....
  */
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
        effectTag: 'UPDATE',
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION';
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

export { createRoot, _useState, _useEffect };

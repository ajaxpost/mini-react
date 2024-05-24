import { _useState, _useEffect } from './fiber';
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children
        .flat() // 修复扁平化问题
        .map((child) =>
          typeof child === 'object' ? child : createTextElement(child)
        ),
    },
  };
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function useState(initValue) {
  return _useState(initValue);
}

function useEffect(fn, dept) {
  _useEffect(fn, dept);
}

const Didact = {
  createElement,
  useState,
  useEffect,
};

export default Didact;

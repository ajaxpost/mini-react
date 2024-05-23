import { createRoot } from './fiber';

function render(element, container) {
  createRoot(element, container);
}

const DidactDom = {
  render,
};

export default DidactDom;

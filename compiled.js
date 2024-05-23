"use strict";

var _didact = _interopRequireDefault(require("./mini-react/didact"));
var _didactDom = _interopRequireDefault(require("./mini-react/didact-dom"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// const element = Didact.createElement(
//   'div',
//   null,
//   Didact.createElement('h1', null, '标题1'),
//   Didact.createElement('p', null, Didact.createElement('a', null, 'a标签')),
//   Didact.createElement(
//     'b',
//     null,
//     Didact.createElement('span', null, Didact.createElement('a', null, '1010'))
//   ),
//   Didact.createElement('input', {
//     onInput: () => {
//       console.log(123);
//     },
//   })
// );

/** @jsx Didact.createElement **/
const element = _didact.default.createElement("div", null, "12313");
const root = document.getElementById('root');
_didactDom.default.render(element, root);

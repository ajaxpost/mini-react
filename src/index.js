import Didact from './mini-react/didact';
import DidactDom from './mini-react/didact-dom';

// const element = (
//   <div>
//     <h1>标题1</h1>
//     <p>
//       <a href="/">a标签</a>
//     </p>
//     <b>
//       <span>
//         <a href="/">1010</a>
//       </span>
//     </b>
//     <input
//       onInput={() => {
//         console.log(123);
//       }}
//     />
//   </div>
// );

const App = (props) => {
  return <div>App {props.name}</div>;
};

const element = <App name="zhangsan" />;

const root = document.getElementById('root');
DidactDom.render(element, root);

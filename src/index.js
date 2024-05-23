// import Didact from "./mini-react/didact";
// import DidactDom from "./mini-react/didact-dom";

// const App = (props) => {
//   const [count, setCount] = Didact.useState(1);
//   const [num, setNum] = Didact.useState(1);

//   return (
//     <div
//       className="app"
//       onClick={() => {
//         setCount((c) => c + 1);
//         setNum((c) => c + 2);
//       }}
//     >
//       App {props.name}
//       <p>{count}</p>
//       <p>num: {num}</p>
//     </div>
//   );
// };

// const element = <App name="zhangsan" />;

// const root = document.getElementById("root");
// DidactDom.render(element, root);
import { creatElement } from "./newmini-react/newreact";
import reactDom from "./newmini-react/domrender";

const element = creatElement(
  "div",
  { calssName: "123" },
  creatElement("h1", null, "标题12"),
  creatElement("h2", null, "标题12")
);

reactDom.render(element, document.getElementById("root"));

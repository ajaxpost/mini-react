import Didact from './mini-react/didact';
import DidactDom from './mini-react/didact-dom';

const todo = [
  {
    title: '标题1',
  },
  {
    title: '标题2',
  },
];

const App = (props) => {
  const [count, setCount] = Didact.useState(1);
  const [num, setNum] = Didact.useState(1);

  Didact.useEffect(() => {
    console.log('effect 执行了');
    return () => {
      console.log(count, '销毁');
    };
  }, [count]);
  console.log('hello');
  return (
    <div
      className="app"
      onClick={() => {
        setCount((c) => c + 1);
        setNum(3);
      }}
    >
      App {props.name}
      <p>{count}</p>
      <p>num: {num}</p>
      {todo.map((item) => {
        return <span key={item.title}>{item.title}</span>;
      })}
    </div>
  );
};

const element = <App name="zhangsan" />;

const root = document.getElementById('root');
DidactDom.render(element, root);
// import { creatElement } from "./newmini-react/newreact";
// import reactDom from "./newmini-react/domrender";

// const element = creatElement(
//   "div",
//   { calssName: "123" },
//   creatElement("h1", null, "标题12"),
//   creatElement("h2", null, "标题12")
// );

// reactDom.render(element, document.getElementById("root"));

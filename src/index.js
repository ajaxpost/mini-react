import Didact from "./mini-react/didact";
import DidactDom from "./mini-react/didact-dom";

const App = (props) => {
  const [count, setCount] = Didact.useState(1);

  return (
    <div
      className="app"
      onClick={() => {
        setCount((c) => c + 1);
      }}
    >
      App {props.name}
      <p>{count}</p>
    </div>
  );
};

const element = <App name="zhangsan" />;

const root = document.getElementById("root");
DidactDom.render(element, root);

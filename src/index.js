import Didact from './mini-react/didact';
import DidactDom from './mini-react/didact-dom';

/** @jsx Didact.createElement **/
const element = (
  <div>
    <h1>标题1</h1>
    <p>
      <a href="/">a标签</a>
    </p>
    <b>
      <span>
        <a href="/">1010</a>
      </span>
    </b>
    <input
      onInput={() => {
        console.log(123);
      }}
    />
  </div>
);

const root = document.getElementById('root');
DidactDom.render(element, root);

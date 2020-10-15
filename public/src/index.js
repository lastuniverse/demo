import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import WS from './js/class.websocket.js';

var ws = new WS('wss://work.lastuniverse.ru/cluster',5000);

// ========================================

class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.messages = [];
    this.state = {
      display: "none"
    };

    ws.send("worker.getfullinfo");

    ws.on("message",(message)=>{
      this.messages.push(message);

      setTimeout(()=>{
        this.messages.shift();
      },5000);

      this.show(message);

      clearTimeout(this.timer);
      this.timer = setTimeout(()=>{
        this.hide();
      },3000);
    })
  }
        
  renderMessage(messages,i){
    return <p key={i}>{messages}</p>;
  }

  renderMessages(){
    this.messages.join("")
    return this.messages.map((message,i)=>this.renderMessage(message,i));
  }

  show(message){
    this.setState({
      display: "flex"
    });
  }
  hide(){
    this.setState({
      display: "none"
    });
  }
  render() {
    return (
      <div className="modal" style={{display: this.state.display}}>
        {this.renderMessages()}
        <button  className="modal-button" onClick={() => this.hide()}>✖</button>
      </div>
    )
  }
}

// ----------------------------------------
class Worker extends React.Component {
  constructor(props) {
    super(props);
    // console.log(props)
    // this.state(props.worker);
  }

  kill(pid){
    ws.send("worker.kill",this.props.worker.pid);
  }

  renderButton(){
    if( !this.props.worker.alive ){ 
      return <div className="worker-button">мертв</div>  
    }
    return <button className="worker-button" onClick={() => this.kill()}>убить</button>
  }
  render() {
    return (
      <div className="worker">
        <div className="worker-info">status: <b>{this.props.worker.status}</b></div>
        <div className="worker-info">pid: <b>{this.props.worker.pid}</b></div>
        <div className="worker-info"><b>{this.props.worker.generated}</b> / <b>{this.props.worker.processed}</b></div>
        {this.renderButton()}
      </div>
    );
  }
}

// ----------------------------------------
class ClusterControls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

  fork(){
    ws.send("worker.fork",true);
  }

  killall(){
    ws.send("worker.killall",true);
  }

  render() {
    return (
      <div className="cluster-controls">
        <button className="control-button" onClick={() => this.fork()}>новый воркер</button>
        <button className="control-button" onClick={() => this.killall()}>убить все воркеры</button>
      </div>
    );
  }
}


// ----------------------------------------
class Cluster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      workers: {},
      info: {
        generated: 0,
        processed: 0,
      }
    };

    ws.on("worker.list", (workers)=>{
      this.setState({workers: workers});
    });
    ws.on("cluster.info", (info)=>{
      this.setState({info: info});
    });
    ws.on("connection", (info)=>{
      ws.send("worker.getlist",true);  
    });

    
  }

  renderWorker(worker){
    return <Worker key={worker.pid} worker={worker} />;
  }

  renderWorkerList(){
    return Object.values(this.state.workers).map(worker=>this.renderWorker(worker));
  }

  render() {
    return (
      <div className="cluster">
        <div className="cluster-info">{this.state.info.generated} / {this.state.info.processed}</div>
        <div className="workers-list">
          {this.renderWorkerList()}
        </div>
        <ClusterControls />
      </div>
    );
  }
}

// ----------------------------------------
class Main extends React.Component {
  render() {
    return (
      <div className="main">
        <div className="block-left">
          <Cluster />
        </div>
        <div className="block-right">
        </div>
        <div>
          <Modal />
        </div>
      </div>
    );
  }
}
// ========================================

ReactDOM.render(
  <Main />,document.getElementById('root')
);


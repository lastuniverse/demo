import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.size = 30;
    this.state = {
      history: [{
        squares: Array(this.size*this.size).fill(null)
      }],
      stepNumber: 0,
      xIsNext: true
    };
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const squares = current.squares.slice();
    if (calculateWinner(squares, this.size) || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? 'X' : 'O';
    this.setState({
      history: history.concat([{
        squares: squares
      }]),
      xIsNext: !this.state.xIsNext,
      stepNumber: history.length
    });
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      xIsNext: (step % 2) === 0,
    });
  }

  

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const winner = calculateWinner(current.squares,this.size);

    const len = Array(this.size).fill(true);

    const square = (y) => {
      return len.map((v,x) => {
        const i = y*this.size+x;
        const color = current.squares[i]=='X'?'blue':'red';

        const className = `square ${color}`;
        return (
          <button className={className} key={i} value={current[i]} onClick={() => this.handleClick(i)} >
            {current.squares[i]}
          </button>  
        );
      });

    };

    const line = (y) =>{
      
      return (
        <div className="board-row">
          {square(y)}
        </div>
      );
    };


    const board = () => {
      return len.map((v,y) => {
        const key = 'l'+y;
        return (
          <div key={key}>
            {line(y)}
          </div>
        );
      });
    };




    const moves = history.map((step, move) => {
      const desc = move ?
        'Go to move #' + move :
        'Go to game start';
      return (
        <li key={move}>
          <button onClick={() => this.jumpTo(move)}>{desc}</button>
        </li>
      );
    });


    let status;
    if (winner) {
      status = 'Winner: ' + winner;
    } else {
      status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
    }
          // <Board
          //   squares={current.squares}
          //   onClick={(i) => this.handleClick(i)}
          // />

    return (
      <div className="game">
        <div className="game-board">
          {board()}
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

function calculateWinner(squares, size) {
  function findline(x,y,dx,dy) {
    let s = squares[y*size+x];
    for(let i=1; i < 5; i++){
      x+=dx;
      y+=dy;
      if(x >= size || y>=size) return null;
      if(x < 0 || y<0) return null;
      if(s != squares[y*size+x]) return null;
    }
    return s;
  }
  for(let x=0; x < size; x++){
    for(let y=0; y < size; y++){
      let s = squares[y*size+x];
      if(findline(x,y,0,1)) return s;
      if(findline(x,y,1,0)) return s;
      if(findline(x,y,1,1)) return s;
      if(findline(x,y,1,-1)) return s;
    }
  }
  return null;
}

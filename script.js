
const FACE_COLORS = ['w', 'r', 'b', 'o', 'g', 'y'];
const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];

class Cube {
  constructor(state) {
    this.state = state ? [...state] : Array(6).fill().map((_, i) => Array(9).fill(FACE_COLORS[i]));
    this.moves = [];
  }

  clone() {
    return new Cube(this.state.map(face => [...face]));
  }

  rotate(face, n = 1) {
    for (let i = 0; i < n; i++) this._rotateFace(face);
    this.moves.push(FACE_NAMES[face] + (n === 2 ? "2" : n === 3 ? "'" : ''));
  }

  _rotateFace(face) {
    const f = this.state[face];
    this.state[face] = [f[6], f[3], f[0], f[7], f[4], f[1], f[8], f[5], f[2]];
    const adjacent = [
      [[5,[2,1,0]],[1,[2,1,0]],[2,[2,1,0]],[4,[2,1,0]]],
      [[0,[2,5,8]],[5,[0,3,6]],[3,[2,5,8]],[2,[2,5,8]]],
      [[0,[6,7,8]],[1,[0,3,6]],[3,[2,1,0]],[4,[8,5,2]]],
      [[2,[6,7,8]],[1,[6,7,8]],[5,[6,7,8]],[4,[6,7,8]]],
      [[0,[0,3,6]],[2,[0,3,6]],[3,[0,3,6]],[5,[8,5,2]]],
      [[0,[0,1,2]],[4,[0,3,6]],[3,[6,7,8]],[1,[8,5,2]]],
    ];
    const temp = adjacent[face].map(([f, idxs]) => idxs.map(i => this.state[f][i]));
    for (let i = 0; i < 4; i++) {
      const [f, idxs] = adjacent[face][i];
      const from = temp[(i + 3) % 4];
      idxs.forEach((idx, j) => this.state[f][idx] = from[j]);
    }
  }

  scramble(moves = 20) {
    for (let i = 0; i < moves; i++) {
      const face = Math.floor(Math.random() * 6);
      const turns = Math.floor(Math.random() * 3) + 1;
      this.rotate(face, turns);
    }
  }

  getSolutionMoves() {
    return this.moves.map(move => {
      const face = FACE_NAMES.indexOf(move[0]);
      let turns = 1;
      if (move[1] === '2') turns = 2;
      else if (move[1] === "'") turns = 3;
      return { face, turns: (4 - turns) % 4 || 4 };
    }).reverse();
  }

  solveStepByStep() {
    let steps = [{ state: this.clone().state.map(f => [...f]), move: 'Start' }];
    let temp = this.clone();
    this.getSolutionMoves().forEach(({ face, turns }) => {
      temp.rotate(face, turns);
      steps.push({ state: temp.state.map(f => [...f]), move: FACE_NAMES[face] + (turns === 2 ? '2' : turns === 3 ? "'" : '') });
    });
    return steps;
  }

  toColorString() {
    return this.state.flat().join('');
  }
}

let cube = new Cube();
let solutionSteps = [];
let currentStep = 0;
let autoplay = false;
let autoplayInterval = null;

function getCubeSvg(colorString) {
  const facelets = [];
  for (let i = 0; i < 6; i++) facelets.push(colorString.slice(i * 9, (i + 1) * 9).split(''));
  const colorMap = { w: '#fff', y: '#ff0', r: '#f00', o: '#fa0', g: '#0c0', b: '#00f' };
  const size = 40;
  const gap = 2;
  const facePos = { U: [size * 3, 0], L: [0, size * 3], F: [size * 3, size * 3], R: [size * 6, size * 3], B: [size * 9, size * 3], D: [size * 3, size * 6] };
  const faces = ['U','L','F','R','B','D'];
  let svg = `<svg width="${size * 12}" height="${size * 9}">`;
  faces.forEach((face, fIdx) => {
    const [x0, y0] = facePos[face];
    for (let i = 0; i < 9; i++) {
      const x = x0 + (i % 3) * size;
      const y = y0 + Math.floor(i / 3) * size;
      svg += `<rect x="${x}" y="${y}" width="${size-gap}" height="${size-gap}" fill="${colorMap[facelets[fIdx][i]]}" stroke="#333" rx="5"/>`;
    }
  });
  return svg + '</svg>';
}

function render() {
  document.getElementById('cube-svg').innerHTML = getCubeSvg(solutionSteps[currentStep]?.state.flat().join('') || cube.toColorString());
  document.getElementById('move-display').textContent = solutionSteps[currentStep]?.move || 'Ready';
  document.getElementById('step-display').textContent = solutionSteps.length > 0 ? `Step ${currentStep+1} of ${solutionSteps.length}` : '';
  const progress = document.getElementById('progress');
  progress.style.width = solutionSteps.length > 0 ? `${(currentStep+1)/solutionSteps.length*100}%` : '0%';

  const navControls = document.getElementById('nav-controls');
  navControls.style.display = solutionSteps.length > 0 ? 'flex' : 'none';

  const moveList = document.getElementById('move-list');
  if (solutionSteps.length > 0) {
    moveList.innerHTML = solutionSteps.map((step, i) =>
      `<div class="move-step${i === currentStep ? ' active' : ''}">Move ${i}: ${step.move}</div>`
    ).join('');
  } else {
    moveList.innerHTML = '';
  }
}

function cycleScramble() {
  cube = new Cube();
  cube.scramble();
  solutionSteps = [];
  currentStep = 0;
  render();
}

function startSolve() {
  solutionSteps = cube.solveStepByStep();
  currentStep = 0;
  render();
}

function nextStep() {
  if (currentStep < solutionSteps.length - 1) {
    currentStep++;
    render();
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    render();
  }
}

function resetCube() {
  cube = new Cube();
  solutionSteps = [];
  currentStep = 0;
  render();
}

function toggleAutoPlay() {
  if (autoplay) {
    clearInterval(autoplayInterval);
    autoplay = false;
    document.getElementById('auto-play').textContent = 'Auto Play';
  } else {
    autoplay = true;
    document.getElementById('auto-play').textContent = 'Stop';
    autoplayInterval = setInterval(() => {
      if (currentStep < solutionSteps.length - 1) nextStep();
      else toggleAutoPlay();
    }, parseInt(document.getElementById('speed').value) || 1000);
  }
}

function manualMove(move) {
  const face = FACE_NAMES.indexOf(move[0]);
  let turns = 1;
  if (move[1] === "'") turns = 3;
  else if (move[1] === '2') turns = 2;
  cube.rotate(face, turns);
  render();
}

document.addEventListener('keydown', function(e) {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  const key = e.key.toUpperCase();
  let move = null;

  if ("FRULBD".includes(key)) {
    move = key;
    if (e.shiftKey) move += "'";
  } else if (["F", "R", "U", "L", "B", "D"].includes(key[0]) && e.key.length === 2 && e.key[1] === "'") {
    move = key;
  } else if (e.key === "'") {

  }

  if (move) {
    manualMove(move);
    e.preventDefault();
  }
});

render();

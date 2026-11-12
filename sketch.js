let cols = 10;
let rows = 10;
let w = 40;
let totalMines = 15;

let grid;
let gameOver = false;
let gameClear = false;
let firstClick = true; // 初手判定フラグ
let startTime = 0;
let elapsedTime = 0;

function setup() {
let canvas = createCanvas(cols * w, rows * w + 50);

canvas.elt.addEventListener('contextmenu', e => e.preventDefault());
canvas.elt.addEventListener('click', handleLeftClick);
canvas.elt.addEventListener('contextmenu', handleRightClick);

initGame();
}

function initGame() {
gameOver = false;
gameClear = false;
firstClick = true; // リセット時も初手フラグをON
elapsedTime = 0;

grid = make2DArray(cols, rows);
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
grid[i][j] = new Cell(i, j, w);
}
}
// ※この時点ではまだ地雷は配置していません（初手クリック時に安全に配置するため）
}

// 最初にクリックされた場所とその周囲を除いて地雷を配置する関数
function generateMines(firstI, firstJ) {
let options = [];
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
// 最初にクリックした場所と、その周囲8マスを除外する
let isAroundFirst = (abs(i - firstI) <= 1 && abs(j - firstJ) <= 1);
if (!isAroundFirst) {
options.push([i, j]);
}
}
}

// 万が一マスの総数が少なすぎる場合の保険
if (options.length < totalMines) {
options = [];
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
if (i !== firstI || j !== firstJ) options.push([i, j]);
}
}
}

// 地雷をランダムに配置
for (let n = 0; n < totalMines; n++) {
if (options.length === 0) break;
let index = floor(random(options.length));
let choice = options[index];
options.splice(index, 1);
grid[choice[0]][choice[1]].mine = true;
}

// 周囲の地雷数をカウント
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
grid[i][j].countMines();
}
}

startTime = millis();
}

function draw() {
background(240);

// 上部UI（ヘッダー）
fill(50);
noStroke();
rect(0, 0, width, 50);

let flaggedCount = 0;
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
if (grid[i][j].flagged) flaggedCount++;
}
}
let remainingMines = totalMines - flaggedCount;

if (!firstClick && !gameOver && !gameClear) {
elapsedTime = floor((millis() - startTime) / 1000);
}

fill(255);
textSize(16);
textAlign(LEFT, CENTER);
text(`💣 残り: ${remainingMines}`, 20, 25);

textAlign(RIGHT, CENTER);
text(`⏱️ タイム: ${elapsedTime}秒`, width - 20, 25);

// 盤面の描画
push();
translate(0, 50);
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
grid[i][j].show();
}
}
pop();

if (gameOver || gameClear) {
fill(0, 0, 0, 160);
rect(0, 50, width, height - 50);

textAlign(CENTER, CENTER);
textSize(26);
fill(255);
if (gameOver) {
text("GAME OVER", width / 2, 50 + (height - 50) / 2 - 15);
} else {
text("GAME CLEAR!", width / 2, 50 + (height - 50) / 2 - 15);
}
textSize(13);
text("クリックでリスタート", width / 2, 50 + (height - 50) / 2 + 15);
}
}

function handleLeftClick(e) {
let rect = e.target.getBoundingClientRect();
let clickX = e.clientX - rect.left;
let clickY = e.clientY - rect.top - 50;

if (gameOver || gameClear) {
initGame();
return;
}

if (clickY < 0) return;

let i = floor(clickX / w);
let j = floor(clickY / w);

if (i >= 0 && i < cols && j >= 0 && j < rows) {
// 【初手安全保障】もし最初のクリックなら、ここを避けて地雷を生成する
if (firstClick) {
generateMines(i, j);
firstClick = false;
}

let cell = grid[i][j];
if (!cell.flagged && !cell.revealed) {
cell.reveal();
if (cell.mine) {
triggerGameOver();
} else {
checkWin();
}
}
}
}

function handleRightClick(e) {
e.preventDefault();

let rect = e.target.getBoundingClientRect();
let clickX = e.clientX - rect.left;
let clickY = e.clientY - rect.top - 50;

if (gameOver || gameClear) return;
if (clickY < 0) return;

let i = floor(clickX / w);
let j = floor(clickY / w);

if (i >= 0 && i < cols && j >= 0 && j < rows) {
let cell = grid[i][j];
cell.toggleFlag();
}
}

function triggerGameOver() {
gameOver = true;
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
if (grid[i][j].mine) {
grid[i][j].revealed = true;
}
}
}
}

function checkWin() {
let unrevealedCount = 0;
for (let i = 0; i < cols; i++) {
for (let j = 0; j < rows; j++) {
if (!grid[i][j].revealed) {
unrevealedCount++;
}
}
}
if (unrevealedCount === totalMines) {
gameClear = true;
}
}

function make2DArray(cols, rows) {
let arr = new Array(cols);
for (let i = 0; i < arr.length; i++) {
arr[i] = new Array(rows);
}
return arr;
}

class Cell {
constructor(i, j, w) {
this.i = i;
this.j = j;
this.x = i * w;
this.y = j * w;
this.w = w;
this.neighborCount = 0;
this.mine = false;
this.revealed = false;
this.flagged = false;
}

show() {
stroke(120);

if (this.revealed) {
if (this.mine) {
fill(220, 60, 60);
rect(this.x, this.y, this.w, this.w);
fill(0);
ellipse(this.x + this.w * 0.5, this.y + this.w * 0.5, this.w * 0.4);
} else {
fill(230);
rect(this.x, this.y, this.w, this.w);
if (this.neighborCount > 0) {
textAlign(CENTER, CENTER);
textSize(18);
fill(this.getNumberColor());
text(this.neighborCount, this.x + this.w * 0.5, this.y + this.w * 0.5);
}
}
} else {
fill(180);
rect(this.x, this.y, this.w, this.w);

if (this.flagged) {
fill(230, 50, 50);
noStroke();
triangle(
this.x + this.w * 0.3, this.y + this.w * 0.2,
this.x + this.w * 0.8, this.y + this.w * 0.35,
this.x + this.w * 0.3, this.y + this.w * 0.5
);
stroke(0);
strokeWeight(2);
line(this.x + this.w * 0.3, this.y + this.w * 0.2, this.x + this.w * 0.3, this.y + this.w * 0.8);
strokeWeight(1);
}
}
}

getNumberColor() {
const colors = [
color(0),
color(0, 0, 255),
color(0, 120, 0),
color(220, 0, 0),
color(0, 0, 140),
color(140, 0, 0),
color(0, 140, 140),
color(0),
color(100)
];
return colors[this.neighborCount] || color(0);
}

countMines() {
if (this.mine) {
this.neighborCount = -1;
return;
}
let total = 0;
for (let xoff = -1; xoff <= 1; xoff++) {
for (let yoff = -1; yoff <= 1; yoff++) {
let i = this.i + xoff;
let j = this.j + yoff;
if (i >= 0 && i < cols && j >= 0 && j < rows) {
if (grid[i][j].mine) {
total++;
}
}
}
}
this.neighborCount = total;
}

reveal() {
this.revealed = true;
if (this.neighborCount === 0) {
this.floodFill();
}
}

toggleFlag() {
if (!this.revealed) {
this.flagged = !this.flagged;
}
}

floodFill() {
for (let xoff = -1; xoff <= 1; xoff++) {
for (let yoff = -1; yoff <= 1; yoff++) {
let i = this.i + xoff;
let j = this.j + yoff;
if (i >= 0 && i < cols && j >= 0 && j < rows) {
let neighbor = grid[i][j];
if (!neighbor.mine && !neighbor.revealed && !neighbor.flagged) {
neighbor.reveal();
}
}
}
}
}
}
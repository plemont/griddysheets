/**
 * @fileoverview Represents the grid of queries running in the browser.
 */
const DEFAULT_COLORS = ['#4285F4', '#0F9D58', '#F4B400', '#DB4437'];

/**
 * Represents the grid of queries running in the browser.
 */
/* eslint no-unused-vars: 0 */
class QueryGrid {
  /**
   * @constructor
   * @param {number} numRows The number of rows in the grid.
   * @param {number} numCols The number of columns in the grid.opt_colors
   * @param {number} typingSpeed Base milliseconds between keystrokes.
   * @param {?QueryProvider=} opt_queryProvider Provider of search queries.
   * @param {?Array.<string>=} opt_colors Optional list of HTML colours.
   */
  /* eslint camelcase: 0 */
  constructor(numRows, numCols, typingSpeed, opt_queryProvider, opt_colors) {
    this.typingSpeed_ = typingSpeed;
    this.queryProvider_ = opt_queryProvider;
    this.colors_ = opt_colors || DEFAULT_COLORS;
    this.running_ = false;
    this.setSize(numRows, numCols);
    this.startAll();
  }

  /**
   * Sets the size of the grid.
   * @param {number} numRows The number of rows in the grid.
   * @param {number} numCols The number of columns in the grid.
   */
  setSize(numRows, numCols) {
    this.numRows_ = numRows;
    this.numCols_ = numCols;
    let gridContainer = document.getElementById('grid-container');
    let clientWidth = gridContainer.clientWidth;
    let clientHeight = gridContainer.clientHeight;
    document.documentElement.style.setProperty('--grid-cell-font-size',
      Math.floor(20 / Math.max(this.numRows_, this.numCols_)) + 'vmin');
    document.documentElement.style.setProperty('--grid-cell-width',
      (clientWidth / this.numCols_).toFixed(2) + 'px');
    document.documentElement.style.setProperty('--grid-cell-height',
      (clientHeight / this.numRows_).toFixed(2) + 'px');

    this.createGridArray_();
    this.createGridElement_();
  }

  /**
   * Resizes the grid, pausing the display if necessary.
   * @param {number} numRows The number of rows in the grid.
   * @param {number} numCols The number of columns in the grid.
   */
  resize(numRows, numCols) {
    let pauseResume = false;
    if (this.running_) {
      this.stopAll_();
      pauseResume = true;
    }
    this.setSize(numRows, numCols);
    if (pauseResume) {
      this.startAll();
    }
  }

  setTypingSpeed(typingSpeed) {
    this.typingSpeed_ = typingSpeed;
  }

  getTypingSpeed() {
    return this.typingSpeed_;
  }

  setQueryProvider(queryProvider) {
    this.queryProvider_ = queryProvider;
  }

  getQueryProvider() {
    return this.queryProvider_;
  }

  getNextQuery() {
    return this.queryProvider_.next();
  }

  /**
   * Creates a JS array of QueryGridCell objects to represent the grid.
   */
  createGridArray_() {
    this.cells_ = [];
    for (let i = 0; i < this.numRows_; i++) {
      let row = [];
      for (let j = 0; j < this.numCols_; j++) {
        row.push(new QueryGridCell(i, j, this));
      }
      this.cells_.push(row);
    }
  }

  /**
   * Creates or recreates the element on the page for the grid.
   */
  createGridElement_() {
    let gridDiv = document.getElementById('grid-container');
    while (gridDiv.firstChild) {
      gridDiv.removeChild(gridDiv.firstChild);
    }

    for (let i = 0; i < this.numRows_; i++) {
      for (let j = 0; j < this.numCols_; j++) {
        let cellElement = this.cells_[i][j].getElement();
        gridDiv.appendChild(cellElement);
      }
    }
  }

  startAll() {
    if (!this.running_) {
      if (this.queryProvider_) {
        for (let i = 0; i < this.numRows_; i++) {
          for (let j = 0; j < this.numCols_; j++) {
            this.cells_[i][j].start();
          }
        }
        this.running_ = true;
      }
    }
  }

  stopAll_() {
    if (this.running_) {
      for (let i = 0; i < this.numRows_; i++) {
        for (let j = 0; j < this.numCols_; j++) {
          this.cells_[i][j].stop();
        }
      }
      this.running_ = false;
    }
  }

  /**
   * replaces the element at a given position in the grid with a new one.
   * @param {number} rowIndex The row index.
   * @param {number} colIndex The column index.
   */
  createNewCell(rowIndex, colIndex) {
    let oldElement = this.cells_[rowIndex][colIndex].getElement();
    this.cells_[rowIndex][colIndex] = new QueryGridCell(rowIndex,
      colIndex, this, this.queryProvider_);
    let gridDiv = document.getElementById('grid-container');
    let newElement = this.cells_[rowIndex][colIndex].getElement();
    gridDiv.replaceChild(newElement, oldElement);
    this.cells_[rowIndex][colIndex].start();
  }

  getNextColor() {
    let index = Math.floor(Math.random() * this.colors_.length);
    return this.colors_[index];
  }
}

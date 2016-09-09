/* eslint no-unused-vars: 0 */
class QueryGridCell {
  constructor(rowIndex, colIndex, grid) {
    this.rowIndex_ = rowIndex;
    this.colIndex_ = colIndex;
    this.queryCursor_ = 0;
    this.grid_ = grid;
    this.backgroundColor_ = grid.getNextColor();

    this.running_ = false;
    this.createElement_();
  }

  start() {
    if (!this.running_) {
      this.running_ = true;
      this.query_ = this.grid_.getNextQuery();
      this.transition().then(() => {
        this.cellElement_.style.boxShadow = this.createBoxShadowTransition();
        this.typeCharacter();
      });
    }
  }

  createBoxShadowTransition() {
    let i = Math.floor(Math.random() * 4);
    let boxShadow;
    if (i === 1) {
      boxShadow = 'inset 0 ' + this.cellElement_.clientHeight + 'px ' +
        this.grid_.getNextColor();
    } else if (i === 2) {
      boxShadow = 'inset 0 -' + this.cellElement_.clientHeight + 'px ' +
        this.grid_.getNextColor();
    } else if (i === 3) {
      boxShadow = 'inset ' + this.cellElement_.clientWidth + 'px 0 0 0 ' +
        this.grid_.getNextColor();
    } else {
      boxShadow = 'inset -' + this.cellElement_.clientWidth + 'px 0 0 0 ' +
        this.grid_.getNextColor();
    }
    return boxShadow;
  }

  stop() {
    this.running_ = false;
  }

  transition() {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, 10);
    });
  }

  typeCharacter() {
    if (this.running_) {
      this.queryCursor_++;
      this.textElement_.innerHTML = this.query_.substring(0, this.queryCursor_);
      if (this.queryCursor_ > this.query_.length) {
        this.stop();
        this.grid_.createNewCell(this.rowIndex_, this.colIndex_);
      } else {
        this.typeDelay().then(this.typeCharacter.bind(this));
      }
    }
  }

  typeDelay() {
    let typingSpeed = this.grid_.getTypingSpeed();
    let delay = 100 * (Math.random() * typingSpeed + typingSpeed);
    return new Promise((resolve, reject) => {
      setTimeout(resolve, delay);
    });
  }

  getBackgroundColor() {
    return this.backgroundColor_;
  }

  getElement() {
    return this.cellElement_;
  }

  createElement_() {
    let cellElement = document.createElement('div');
    cellElement.classList.add('grid-cell');
    cellElement.style.backgroundColor = this.getBackgroundColor();
    cellElement.id = 'grid-cell-' + this.rowIndex_ + '-' + this.colIndex_;

    let textContainer = document.createElement('div');
    textContainer.classList.add('grid-cell-text');

    let textElement = document.createElement('span');
    textContainer.appendChild(textElement);
    let flashElement = document.createElement('span');
    flashElement.classList.add('flash-cursor');
    flashElement.innerHTML = '|';
    textContainer.appendChild(flashElement);

    cellElement.appendChild(textContainer);
    this.textElement_ = textElement;
    this.cellElement_ = cellElement;
  }
}

/* eslint no-unused-vars: 0 */
class QueryGridCell {
  constructor(rowIndex, colIndex, grid, opt_lastColor) {
    this.rowIndex_ = rowIndex;
    this.colIndex_ = colIndex;
    this.queryCursor_ = 0;
    this.grid_ = grid;
    this.lastColor_ = opt_lastColor || grid.getNextColor();
    this.backgroundColor_ = grid.getNextColor();

    this.running_ = false;
    this.direction_ = Math.floor(Math.random() * 4);
    this.createElement_();
  }

  start() {
    if (!this.running_) {
      this.running_ = true;
      this.query_ = this.grid_.getNextQuery();
      this.transition().then(() => {
        this.cellElement_.style.backgroundPosition = this.createTransition();
        this.typeCharacter();
      });
    }
  }

  createTransition() {
    if (this.direction_ === 0) {
      return '100% 0%';
    } else if (this.direction_ === 1) {
      return '-100% 0%';
    } else if (this.direction_ === 2) {
      return '0% -100%';
    } else if (this.direction_ === 3) {
      return '0% 100%';
    }
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

    if (this.direction_ === 0) {
      cellElement.style.backgroundSize = '200% 100%';
      cellElement.style.backgroundImage = 'linear-gradient(to left, ' +
          this.getBackgroundColor() + ' 50%, ' + this.lastColor_ + ' 50%)';
    } else if (this.direction_ === 1) {
      cellElement.style.backgroundSize = '200% 100%';
      cellElement.style.backgroundImage = 'linear-gradient(to right, ' +
          this.lastColor_ + ' 50%, ' + this.getBackgroundColor() + ' 50%)';
    } else if (this.direction_ === 2) {
      cellElement.style.backgroundSize = '100% 200%';
      cellElement.style.backgroundImage = 'linear-gradient(to bottom, ' +
          this.lastColor_ + ' 50%, ' + this.getBackgroundColor() + ' 50%)';
    } else if (this.direction_ === 3) {
      cellElement.style.backgroundSize = '100% 200%';
      cellElement.style.backgroundImage = 'linear-gradient(to top, ' +
          this.getBackgroundColor() + ' 50%, ' + this.lastColor_ + ' 50%)';
    }
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

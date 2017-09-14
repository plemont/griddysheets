class OfflineQueryProvider {
  constructor() {
    this.queryList_ = [
      'There is no internet connection',
      'Try checking the network connection',
      'Try reconnecting to Wi-Fi',
      ':-( :-('
    ];
    this.index_ = 0;
  }

  /**
   * Retrieves the next query.
   * @return {string} The next query.
   */
  next() {
    let query = this.queryList_[this.index_];
    this.index_ = (this.index_ + 1) % this.queryList_.length;
    return query;
  }
}

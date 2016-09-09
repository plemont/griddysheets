/**
 * A class to provide queries one-by-one, for use in the displayed grid.
 */
 /* eslint no-unused-vars: 0 */
class QueryProvider {
  constructor(queryList) {
    this.queryList_ = queryList;
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

  /**
   * Creates a QueryProvider from a Spreadsheet returned from the Sheets API.
   * @param {!Object} spreadsheet The object returned from the Sheets API.
   * @return {!QueryProvider} The QueryProvider.
   */
  static createFromSpreadsheet(spreadsheet) {
    let sheets = spreadsheet.result.sheets;
    let querySet = new Set();

    for (let sheet of sheets) {
      if (sheet.data) {
        let values = sheet.data[0].rowData;

        for (let row of values) {
          if (row.values) {
            querySet.add(row.values[0].formattedValue);
          }
        }
      }
    }
    return new QueryProvider(Array.from(querySet));
  }
}

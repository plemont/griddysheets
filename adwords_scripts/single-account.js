/**
 * @fileoverview Script to write recent search queries to a spreadsheet.
 * Limits to the top 100 search queries for today.
 */
 var SPREADSHEET_ID = 'ENTER_SPREADSHEET_ID_HERE';

function main() {
  var queries = fetchQueries();
  writeToSheet(queries);
}

function writeToSheet(queries) {
  var customerId = AdWordsApp.currentAccount().getCustomerId();
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(customerId);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(customerId);
  }
  sheet.clear();
  sheet.getRange(1, 1, queries.length, 1).setValues(queries);
}

function fetchQueries() {
  var queries = [];
  var report = AdWordsApp.report('SELECT Query, Impressions FROM ' +
      'SEARCH_QUERY_PERFORMANCE_REPORT WHERE Impressions > 1 DURING TODAY');
  var rows = report.rows();
  while (rows.hasNext()) {
    var row = rows.next();
    queries.push({query: row.Query, impressions: +row.Impressions});
  }
  queries.sort(function(a, b) {
    if (a.impressions < b.impressions) {
      return 1;
    } else if (a.impressions > b.impressions) {
      return -1;
    }
    return 0;
  });
  return queries.slice(0, 100).map(function(x) {
    return [x.query];
  });
}

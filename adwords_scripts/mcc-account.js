/**
 * @fileoverview Script to write recent search queries to a spreadsheet.
 * Limits to the top 100 search queries for today - MCC version.
 */
var SPREADSHEET_ID = 'ENTER_SPREADSHEET_ID_HERE';

function main() {
  MccApp.accounts().withLimit(50).executeInParallel('processAccount',
    'processAccountCallback');
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

function processAccount() {
  var queries = [];
  var report = AdWordsApp.report('SELECT Query, Impressions FROM ' +
      'SEARCH_QUERY_PERFORMANCE_REPORT WHERE Impressions > 1');
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
  return JSON.stringify(queries.slice(0, 100));
}

function processAccountCallback(results) {
  var allResultsMap = {};
  var allResultsList = [];
  for (var i = 0; i < results.length; i++) {
    var result = JSON.parse(results[i].getReturnValue());
    for (var j = 0; j < result.length; j++) {
      var entry = result[j];
      if (allResultsMap[entry.query]) {
        allResultsMap[entry.query] += entry.impressions;
      } else {
        allResultsMap[entry.query] = entry.impressions;
      }
    }
  }
  var allKeys = Object.keys(allResultsMap);
  for (var k = 0; k < allKeys.length; k++) {
    var key = allKeys[k];
    allResultsList.push({query: key, impressions: allResultsMap[key]});
  }
  allResultsList.sort(function(a, b) {
    if (a.impressions < b.impressions) {
      return 1;
    } else if (a.impressions > b.impressions) {
      return -1;
    }
    return 0;
  });
  var selectedResultsList = allResultsList.slice(0, 100).map(function(x) {
    return [x.query];
  });
  writeToSheet(selectedResultsList);
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

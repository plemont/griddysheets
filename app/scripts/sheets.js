
// OAuth2 settings
const API_KEY = 'INSERT_API_KEY';
const CLIENT_ID = 'INSERT_CLIENT_ID';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

// Milliseconds between reloading the spreadsheet.
const SPREADSHEET_REFRESH_MS = 5 * 60 * 1000;

// Milliseconds to show the settings buttons for, before hiding again.
const SETTINGS_DISPLAY_TIMEOUT_MS = 2500;

// Milliseconds to show snackbars for.
const SNACKBAR_ERR_TIMEOUT_MS = 15000;
const SNACKBAR_TIMEOUT_MS = 3000;

// Default configuration for GriddySheets, which is saved to LocalStorage.
const DEFAULT_CONFIG = {
  numRows: 4,
  numCols: 3,
  typingSpeed: 9,
  documentId: '1CtTT6P2bSh5eJO_fDxOceiDQ65Mhc2-JSt7ktXM2U6I'
};

let auth2;
let queryGrid;
let config;
let queryProvider;
let latestMoveId = 0;
let settingsContainer;
let authorizeButton;
let signoutButton;
let fullscreenButton;
let dialogButton;
let currentTimerPromiseCancel;

/**
 * An object used to provide the means to cancel Promises (or at least stop them
 * resolving). Used for cancelling the timers that periodically check
 * spreadsheets.
 * @class
 */
class TimerPromiseCancel {
  constructor() {
    this.cancelled_ = false;
  }

  cancel() {
    this.cancelled_ = true;
  }

  isCancelled() {
    return this.cancelled_;
  }
}

/**
 * Creates a new Promise that resolves after the SPREADSHEET_REFRESH_MS time
 * period has elapsed, as long as the resolving has not been cancelled.
 * @param {!TimerPromiseCancel} timerPromiseCancel An object that can be set to
 *     stop the Promise from ever resolving.
 * @return {!Promise} The created Promise.
 */
function timerPromise(timerPromiseCancel) {
  return new Promise((resolve, reject) => {
    /**
     * Resolves only if the Promise has not been cancelled.
     */
    function checkCancelledThenResolve() {
      if (!timerPromiseCancel.isCancelled()) {
        resolve();
      }
    }
    setTimeout(checkCancelledThenResolve, SPREADSHEET_REFRESH_MS);
  });
}

/**
 * Writes each property of the default configuration settings to LocalStorage.
 */
function createDefaultConfig() {
  let keys = Object.keys(DEFAULT_CONFIG);
  for (let key of keys) {
    localStorage.setItem(key, DEFAULT_CONFIG[key]);
  }
}

/**
 * Loads the configuration from LocalStorage into the global config variable.
 * If no config is found in LocalStorage, it is created.
 */
function loadConfig() {
  let numRows = localStorage.getItem('numRows');
  if (!numRows) {
    createDefaultConfig();
  }
  numRows = localStorage.getItem('numRows');
  let numCols = localStorage.getItem('numCols');
  let typingSpeed = localStorage.getItem('typingSpeed');
  let documentId = localStorage.getItem('documentId');

  config = {
    numRows: numRows,
    numCols: numCols,
    typingSpeed: typingSpeed,
    documentId: documentId
  };
}

/**
 * Waits for Material Design Lite slider components to be fully initialised
 * before resolving, which allows post-initialisation actions, such as setting
 * the slider position value to work.
 * @param {string} sliderId The ID of the HTML slider element.
 * @return {!Promise} The created Promise.
 */
function waitForSlider(sliderId) {
  return new Promise((resolve, reject) => {
    /**
     * Resolves Promise if slider is initialised, otherwise sets a timer to
     * check again.
     */
    function checkForSlider() {
      let slider = document.getElementById(sliderId);
      if (slider && slider.MaterialSlider) {
        resolve(slider);
      } else {
        setTimeout(checkForSlider, 50);
      }
    }
    checkForSlider();
  });
}

/**
 * Creates the object that represents the grid of queries displayed in the
 * window.
 */
function createGrid() {
  loadConfig();
  queryGrid = queryGrid || new QueryGrid(config.numRows, config.numCols,
    config.typingSpeed);
}

/**
 * Resizes the grid of queries based on the settings in the global config.
 */
function resizeGrid() {
  loadConfig();
  queryGrid.resize(config.numRows, config.numCols);
}

/**
 * Hides the settings and sign-in/out buttons.
 */
function hideSettings() {
  settingsContainer.classList.add('hidden');
}

/**
 * Shows the settings and sign-in/out buttons.
 */
function showSettings() {
  settingsContainer.classList.remove('hidden');
}

/**
 * Creates a Promise which attempts to resolve after SETTINGS_DISPLAY_TIMEOUT_MS
 * milliseconds. It only resolves if no other similar Promises have been created
 * since. This is used to create a Promise which only resolves if the mouse move
 * that created the Promise is the most recent one.
 * @return {!Promise} The created Promise.
 */
function displayPromise() {
  latestMoveId++;
  let moveId = latestMoveId;
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      if (latestMoveId === moveId) {
        resolve();
      }
    }, SETTINGS_DISPLAY_TIMEOUT_MS);
  });
}

/**
 * Toggles between fullscreen and not.
 */
function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen ||
      docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen ||
      docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen ||
      doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  } else {
    cancelFullScreen.call(doc);
  }
}

/**
 * Resets the fullscreen icon when exiting fullscreen.
 */
function fullscreenExitHandler(event) {
  var textElement = document.getElementById('fullscreen-button-text-element');
  var doc = window.document;
  if (!doc.fullscreenElement && !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    textElement.innerHTML = 'fullscreen';
  } else {
    textElement.innerHTML = 'fullscreen_exit';
  }
}

/**
 * Adds event handler.
 */
function addWindowEventListeners() {
  window.addEventListener('resize', () => {
    resizeGrid();
  });

  window.addEventListener('mousemove', () => {
    showSettings();
    displayPromise().then(hideSettings);
  });

  authorizeButton.addEventListener('click', handleAuthClick);
  signoutButton.addEventListener('click', handleSignoutClick);
  fullscreenButton.addEventListener('click', toggleFullScreen);
  window.addEventListener('webkitfullscreenchange', fullscreenExitHandler,
    false);
}

/**
 * Adds event handlers to handle changes to the slider values.
 */
function addSliderEventListeners() {
  waitForSlider('rowsSlider').then(slider => {
    slider.addEventListener('change', event => {
      localStorage.setItem('numRows', event.target.value);
      resizeGrid();
    });
  });

  waitForSlider('colsSlider').then(slider => {
    slider.addEventListener('change', event => {
      localStorage.setItem('numCols', event.target.value);
      resizeGrid();
    });
  });

  waitForSlider('typingSpeed').then(slider => {
    slider.addEventListener('change', event => {
      localStorage.setItem('typingSpeed', event.target.value);
      queryGrid.setTypingSpeed(event.target.value);
      loadConfig();
    });
  });
}

/**
 * Adds a handler to handle changes to the textbox for the Spreadsheet ID.
 */
function addSpreadsheetTextboxEventListener() {
  let spreadsheetTextField = document.getElementById('spreadsheet-text-field');
  spreadsheetTextField.value = config.documentId;
  spreadsheetTextField.addEventListener('change', event => {
    if (event.target.value) {
      localStorage.setItem('documentId', event.target.value);
      loadConfig();
      loadSheets();
    }
  });
}

function addNetworkChangeListeners() {
  function updateOnlineStatus(status) {
    if (queryGrid) {
      queryGrid.setOnlineStatus(status);
    }
  }

  window.addEventListener('online', () => updateOnlineStatus(true));
  window.addEventListener('offline', () => updateOnlineStatus(false));
}

/**
 * Initialises the settings dialog.
 */
function initDialog() {
  let dialog = document.querySelector('#dialog');
  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }

  dialogButton.addEventListener('click', () => {
    let rowsSliderPromise = waitForSlider('rowsSlider');
    let colsSliderPromise = waitForSlider('colsSlider');
    let typingSpeedPromise = waitForSlider('typingSpeed');
    Promise.all([rowsSliderPromise, colsSliderPromise, typingSpeedPromise])
        .then(values => {
          values[0].MaterialSlider.change(config.numRows);
          values[1].MaterialSlider.change(config.numCols);
          values[2].MaterialSlider.change(config.typingSpeed);
          dialog.showModal();
        });
  });
  dialog.querySelector('button:not([disabled])')
      .addEventListener('click', function() {
        dialog.close();
      });
}

/**
 * Initialise the Google Auth library and launch the loading of the spreadsheet.
 */
function initAuth() {
  gapi.client.setApiKey(API_KEY);
  gapi.auth2.init({
    /* eslint camelcase: 0*/
    client_id: CLIENT_ID,
    scope: SCOPES
  }).then(function() {
    auth2 = gapi.auth2.getAuthInstance();
    auth2.isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(auth2.isSignedIn.get());
  });
}

/**
 * Changes the button displayed depending on whether signed-in or out.
 * @param {boolean} isSignedIn Whether the user is signed in or not.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.classList.add('hidden');
    signoutButton.classList.remove('hidden');
    loadSheets();
  } else {
    authorizeButton.classList.remove('hidden');
    signoutButton.classList.add('hidden');
  }
}

/**
 * Signs the user in.
 */
function handleAuthClick() {
  auth2.signIn();
}

/**
 * Signs the user out.
 */
function handleSignoutClick() {
  auth2.signOut();
}

/**
 * Attempts to fetch the spreadsheet data and then update the grid object with
 * the retrieved data. Also, sets up a retrieval in the future, and cancels any
 * existing future retrievals to ensure only one is queued up.
 */
function fetchSheets() {
  if (navigator.onLine) {
    showSnackbar('Loading spreadsheet data...');
    gapi.client.sheets.spreadsheets.get({
      spreadsheetId: config.documentId,
      includeGridData: true
    }).then(updateSheetData, handleFetchError);
  } else {
    showSnackbar('Oops! It appears we\'re offline...', SNACKBAR_ERR_TIMEOUT_MS);
  }

  if (currentTimerPromiseCancel) {
    currentTimerPromiseCancel.cancel();
  }

  currentTimerPromiseCancel = new TimerPromiseCancel();
  timerPromise(currentTimerPromiseCancel).then(fetchSheets);
}

/**
 * Creates a data provider from the Spreadsheet fetch response and pass it to
 * the grid object, so that it can be used as a source of queries.
 * @param {!Object} response The response object from the Sheets API.
 */
function updateSheetData(response) {
  queryProvider = QueryProvider.createFromSpreadsheet(response);
  queryGrid.setQueryProvider(queryProvider);
  queryGrid.startAll();
}

/**
 * Shows an error snackbar for failed spreadsheet fetches.
 * @param {!Object} err The error response from the Sheets API.
 */
function handleFetchError(err) {
  showSnackbar(err.result.error.message, SNACKBAR_ERR_TIMEOUT_MS);
}

/**
 * Displays the snackbar component.
 * @param {string} message The text to display.
 * @param {number=} opt_timeout Milliseconds to show for, as optional override.
 * eslint camelcase: 0
 */
function showSnackbar(message, opt_timeout) {
  var notification = document.querySelector('.mdl-js-snackbar');
  var data = {
    message: message,
    timeout: opt_timeout || SNACKBAR_TIMEOUT_MS,
    actionHandler: function() { },
    actionText: 'OK'
  };
  notification.MaterialSnackbar.showSnackbar(data);
}

/**
 * Loads Sheets into the client library then starts the spreadsheet fetch.
 */
function loadSheets() {
  gapi.client.load('sheets', 'v4').then(fetchSheets);
}

/**
 * Initialises the entire page and starts everything running.
 */
function initialise() {
  loadConfig();
  createGrid();

  settingsContainer = document.getElementById('settings-container');
  authorizeButton = document.getElementById('authorize-button');
  signoutButton = document.getElementById('signout-button');
  fullscreenButton = document.getElementById('fullscreen-button');
  dialogButton = document.getElementById('settings-button');

  addWindowEventListeners();
  addNetworkChangeListeners();
  addSliderEventListeners();
  addSpreadsheetTextboxEventListener();

  initDialog();

  if (typeof gapi === 'undefined') {
    showSnackbar('Unable to load Google JS library (is internet connected?)',
      SNACKBAR_ERR_TIMEOUT_MS);
  } else {
    gapi.load('client:auth2', initAuth);
  }
}

initialise();

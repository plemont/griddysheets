# README

Setting up griddysheets on your own hosting environment requires the following
steps:

# Configuring project for use with the Sheets API

1.  [Create a new project](https://console.developers.google.com) on the
    Developers Console.
2.  [Enable](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview)
    the Sheets API.
3.  [Create new credentials](https://console.developers.google.com/apis/credentials/oauthclient)
    *   Choose **Web application** for the *application type*.
    *   Be sure to enter the URL you are using for hosting in *Authorized JavaScript origins*.
4.  [Additionally, create an API Key](https://console.developers.google.com/apis/credentials/key)
5.  Replace the `CLIENT_ID` and `API_KEY` variables with those from steps 3 and
    4 in your copy of [sheets.js](https://github.com/plemont/griddysheets/blob/master/app/scripts/sheets.js).

# Building the project

1.  Build the project using `gulp serve:dist`. This will place the files for
    deployment in the `dist` directory, which can then be uploaded to your
    hosting site.

# Notes on account use

It is recommended that if this project is to be used on a display, which may be
left unattended, **do not use your primary accounts(s)**. Instead, create a
Google account specifically for this purpose, and grant read-only permission
on the spreadsheet to this account. This will limit any potential access to only
this spreadsheet.

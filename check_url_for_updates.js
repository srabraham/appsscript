/**
 * This Apps Script demonstrates polling a URL to check for updates.
 *
 * The intention is to poll a URL on a schedule (using an Apps Script
 * time-based trigger), save what is found at that URL to Google Drive,
 * and compare that result to the last run of the script. If a diff is
 * found, then an email is sent to the user to notify them.
 *
 * This is currently set up to expect a JSON response from the target
 * URL. Indeed, it's set up for my old use case, finding out if
 * particular USCIS processing times had been updated. You will need
 * to tailor the fetch URL, JSON parsing, JSON stringifying, and JSON
 * filtering to make this work for your desired URL target.
 */

// Some Drive folder that you own.
var folderId = '1-DREurrRRD-340oAxOyQZCO2';
// Whom to notify when an update is found.
var destinationEmail = 'email@example.com';
// An arbitrary prefix for all Drive files created by this script.
var filePrefix = 'UscisProcessingTime';

function fetchDenverI485ProcessingTimes() {
  var latestFileName = filePrefix + '.latest.txt';
  var newFileName = filePrefix + Utilities.formatDate(new Date(), "GMT", "yyyyMMdd'T'HHmmssZ") + '.txt';
  
  // Fetch the data from USCIS.
  var response = UrlFetchApp.fetch("https://egov.uscis.gov/processing-times/api/processingtime/I-485/DEN");
  var data = JSON.parse(response.getContentText());
  var newData =
      JSON.stringify(data, null, 2)
          // Remove these unnecessary pain-in-the-ass fields, since they change every day.
          .replace(/\"service_request_date.*/g, '');
  Logger.log('New data: %s', newData);

  // Read the current .latest file.
  var previousData;
  var latestFiles = DriveApp.getFolderById(folderId).getFilesByName(latestFileName);
  Logger.log('Latest files: %s', latestFiles);
  if (!latestFiles.hasNext()) {
    previousData = 'No latest file';
    Logger.log('No latest file found.');
  } else {
    previousData = latestFiles.next().getAs('text/plain').getDataAsString();
    Logger.log('Current latest file reads: %s', previousData);
  }
  
  // Do nothing if the data are unchanged.
  // If the data are changed, send an email and update the .latest file.
  if (previousData === newData) {
    Logger.log('Same data as before :(');
  } else {
    Logger.log('Updates detected! Sending email.');
    GmailApp.sendEmail(
      destination_email,
      'Updated USCIS processing times!',
          'New value:'
          + '\n' + newData
          + '\nOld value:'
          + '\n' + previousData);
    deleteFilesByName(folderId, latestFileName);
    createFileInFolder(folderId, latestFileName, newData);
  }
  
  // Always create a new timestamped file.
  createFileInFolder(folderId, newFileName, newData);
}

function createFileInFolder(folderId, fileName, contents) {
  var newFile = DriveApp.createFile(fileName, contents);
  DriveApp.getFolderById(folderId).addFile(newFile);
  DriveApp.getRootFolder().removeFile(newFile);
}

function deleteFilesByName(folderId, name) {
  var files = DriveApp.getFolderById(folderId).getFilesByName(name);
  while (files.hasNext()) {
    files.next().setTrashed(true);
  }
}


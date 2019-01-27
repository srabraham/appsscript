/**
 * This Apps Script finds all Google Docs in a specified Google Drive folder, then merges
 * all of those Docs into a single new Google Doc.
 *
 * The folder ID must be supplied below before executing this script.
 */

// Find the folder ID in the URL when viewing the folder through drive.google.com.
var folderId = '1cUjKU-jP9PnkCUmxhAwpRyF7Zv4RRs';

function mergeGoogleDocs() {
  var folder = DriveApp.getFolderById(folderId);
  var fileIterator = folder.getFilesByType('application/vnd.google-apps.document');  
  var mergedFilePrefix = 'mergedDoc-';
  var mergedDoc = DocumentApp.create(mergedFilePrefix + folder.getName() + '-' + new Date().getTime());
  var mergedDocFile = DriveApp.getFileById(mergedDoc.getId());
  DriveApp.getFolderById(folderId).addFile(mergedDocFile);
  DriveApp.getRootFolder().removeFile(mergedDocFile);
  
  // This is the merged doc's body. We'll be putting all of the other docs' contents into this one.
  var mergedDocBody = mergedDoc.getActiveSection();
  while (fileIterator.hasNext()) {
    var nextFile = fileIterator.next();
    // Ignore any files starting with the mergedFilePrefix,
    // e.g. files created in previous executions over this folder.
    if (nextFile.getName().indexOf(mergedFilePrefix) > -1){ 
      continue;
    }
    var otherBody = DocumentApp.openById(nextFile.getId()).getBody();
    for( var j = 0; j < otherBody.getNumChildren(); j++ ) {
      var element = otherBody.getChild(j).copy();
      var type = element.getType();
      if( type == DocumentApp.ElementType.PARAGRAPH )
        mergedDocBody.appendParagraph(element);
      else if( type == DocumentApp.ElementType.TABLE )
        mergedDocBody.appendTable(element);
      else if( type == DocumentApp.ElementType.LIST_ITEM )
        mergedDocBody.appendListItem(element);
      else
        throw new Error("Unknown element type: " + type);
    }
    // Put a page break after each document that's merged in.
    if (fileIterator.hasNext()) {
      mergedDocBody.appendPageBreak();
    }
  }
}

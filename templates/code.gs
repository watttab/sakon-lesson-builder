/**
 * GAS Online Lesson Backend (code.gs)
 * คัดลอกโค้ดนี้ไปวางใน Extensions -> Apps Script ของ Google Sheets ที่ต้องการใช้งาน
 */

function doGet(e) {
  // ให้สิทธิ์แสดงผลหน้าเว็บ HTML
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบบทเรียนออนไลน์ ม.ปลาย')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * สะพานเชื่อมการทำงานเมื่อเรียกจากหน้าบ้านผ่าน google.script.run (ไม่มีปัญหาเรื่อง CORS)
 */
function apiRequest(requestData) {
  try {
    var action = requestData.action;
    var result = {};

    if (action === 'ping') {
      result = { status: 'success', message: 'Pong! เชื่อมต่อ Apps Script สำเร็จ' };
    }
    else if (action === 'login') {
      result = handleLogin(requestData);
    }
    else if (action === 'getCourseData') {
      result = handleGetCourseData();
    }
    else if (action === 'submitScore') {
      result = handleSubmitScore(requestData);
    }
    else if (action === 'generateCertificate') {
      result = handleGenerateCertificate(requestData);
    }
    else if (action === 'getStudentScores') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var scores = getSheetDataAsJson(ss, "StudentScores");
      result = scores; // ส่งกลับอาร์เรย์โดยตรง
    }
    else {
      result = { status: 'error', message: 'ไม่พบ Action ที่กำหนด' };
    }
    return result;

  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}

/**
 * รองรับการยิง API เข้ามาผ่านทาง HTTP POST (ใช้สำหรับแพลตฟอร์มกลางในการเจเนอเรตข้อมูลลงชีต)
 */
function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var result = {};

    // ถ้าเป็นเขียนข้อมูลลงชีตจากแพลตฟอร์มกลาง
    if (action === 'setupDatabase') {
      result = handleSetupDatabase(requestData);
    } 
    // หรือส่งเข้าฟังก์ชันหลัก (apiRequest)
    else {
      result = apiRequest(requestData);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------------
// LOGIC HANDLERS
// -------------------------------------------------------------

// เขียนข้อมูลบทเรียนและข้อสอบที่มาจาก Gemini Flash
function handleSetupDatabase(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. เขียนบทเรียน (Lessons)
  var sheetLessons = getOrCreateSheet(ss, "Lessons");
  sheetLessons.clear();
  sheetLessons.appendRow(["Chapter", "Title", "Content", "YoutubeKeyword"]);
  if (data.lessons && data.lessons.length > 0) {
    data.lessons.forEach(function(item) {
      sheetLessons.appendRow([item.chapter, item.title, item.content, item.youtubeKeyword]);
    });
  }

  // 2. เขียนข้อสอบ (Quizzes)
  var sheetQuizzes = getOrCreateSheet(ss, "Quizzes");
  sheetQuizzes.clear();
  sheetQuizzes.appendRow(["Question", "ChoiceA", "ChoiceB", "ChoiceC", "ChoiceD", "Answer"]);
  if (data.quizzes && data.quizzes.length > 0) {
    data.quizzes.forEach(function(item) {
      sheetQuizzes.appendRow([item.question, item.choiceA, item.choiceB, item.choiceC, item.choiceD, item.answer]);
    });
  }

  // สร้างตารางอื่นๆ ที่จำเป็นต่อการทำงาน
  getOrCreateSheet(ss, "Users");
  var sheetScores = getOrCreateSheet(ss, "StudentScores");
  if (sheetScores.getLastRow() === 0) {
    sheetScores.appendRow(["Name", "StudentId", "Type", "Score", "Total", "Percentage", "Result", "Date"]);
  }
  var sheetConfig = getOrCreateSheet(ss, "Config");
  var courseNameVal = data.courseName || "หลักสูตรระบบบทเรียนออนไลน์";
  if (sheetConfig.getLastRow() === 0) {
    sheetConfig.appendRow(["Key", "Value"]);
    sheetConfig.appendRow(["TEMPLATE_SLIDE_ID", "1sxqxaVlZq7cXEJNhQwcZtC9pyUR_m5SddLyctOt2r7o"]);
    sheetConfig.appendRow(["PASSING_PERCENTAGE", "70"]);
    sheetConfig.appendRow(["COURSE_NAME", courseNameVal]);
  } else {
    var configData = sheetConfig.getDataRange().getValues();
    var foundCourseName = false;
    for (var i = 1; i < configData.length; i++) {
      if (configData[i][0] === "COURSE_NAME") {
        sheetConfig.getRange(i + 1, 2).setValue(courseNameVal);
        foundCourseName = true;
        break;
      }
    }
    if (!foundCourseName) {
      sheetConfig.appendRow(["COURSE_NAME", courseNameVal]);
    }
  }

  return { status: 'success', message: 'เขียนข้อมูลโครงสร้างบทเรียนสำเร็จแล้ว!' };
}

// ล็อกอินนักเรียน (และสมัครให้อัตโนมัติถ้ายังไม่มี)
function handleLogin(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, "Users");
  var rows = sheet.getDataRange().getValues();
  
  // เพิ่ม Header ถ้าเป็นชีตใหม่
  if (rows.length === 1 && rows[0][0] === "") {
    sheet.getRange(1, 1, 1, 3).setValues([["Name", "StudentID", "LastLogin"]]);
    rows = sheet.getDataRange().getValues();
  }
  
  // เช็กว่ามีชื่อและเลขที่นี้ในระบบหรือยัง
  for (var i = 1; i < rows.length; i++) {
    // rows[i][0] = ชื่อ, rows[i][1] = เลขที่
    if (rows[i][0] === data.name && rows[i][1] == data.studentId) {
      // อัปเดตเวลาเข้าใช้งานล่าสุด
      sheet.getRange(i + 1, 3).setValue(new Date());
      return { status: 'success', name: rows[i][0], studentId: rows[i][1] };
    }
  }

  // ถ้ายังไม่มี ให้บันทึกสมาชิกใหม่ (ชื่อ, เลขที่, วันที่เข้าใช้งาน)
  sheet.appendRow([data.name, data.studentId, new Date()]);
  return { status: 'success', name: data.name, studentId: data.studentId };
}

// ดึงบทเรียนและข้อสอบ
function handleGetCourseData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var lessons = getSheetDataAsJson(ss, "Lessons");
  var quizzes = getSheetDataAsJson(ss, "Quizzes");
  
  return { 
    status: 'success', 
    lessons: lessons, 
    quizzes: quizzes 
  };
}

// บันทึกคะแนน
function handleSubmitScore(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, "StudentScores");
  
  // ดึงค่าเปอร์เซ็นต์เกณฑ์การผ่านจาก Config
  var passPercent = 70;
  var configData = getSheetDataAsJson(ss, "Config");
  configData.forEach(function(item) {
    if (item.Key === 'PASSING_PERCENTAGE') {
      passPercent = Number(item.Value);
    }
  });

  var percent = (data.score / data.total) * 100;
  var isPassed = percent >= passPercent ? "ผ่าน" : "ไม่ผ่าน";

  // บันทึกประวัติ (ชื่อ, เลขที่, ประเภทสอบ, คะแนน, คะแนนเต็ม, คิดเป็นร้อยละ, ผลการประเมิน, วันที่ส่ง)
  sheet.appendRow([
    data.name, 
    data.studentId, 
    data.type, // 'PreTest' หรือ 'PostTest'
    data.score, 
    data.total, 
    percent.toFixed(2), 
    isPassed, 
    new Date()
  ]);

  return { 
    status: 'success', 
    score: data.score, 
    total: data.total, 
    percentage: percent.toFixed(2), 
    statusText: isPassed 
  };
}

// สร้างเกียรติบัตร PDF
function handleGenerateCertificate(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configData = getSheetDataAsJson(ss, "Config");
  var slideTemplateId = "";
  var courseName = "หลักสูตรระบบบทเรียนออนไลน์";
  
  configData.forEach(function(item) {
    if (item.Key === 'TEMPLATE_SLIDE_ID') {
      slideTemplateId = item.Value;
    }
    if (item.Key === 'COURSE_NAME') {
      courseName = item.Value;
    }
  });

  if (!slideTemplateId || slideTemplateId.indexOf("ใส่_ID") > -1) {
    return { status: 'error', message: 'กรุณาอัปเดต TEMPLATE_SLIDE_ID ในชีต Config ของท่านก่อนสร้าง PDF' };
  }

  try {
    var templateFile = DriveApp.getFileById(slideTemplateId);
    var targetFolder = DriveApp.getRootFolder();
    
    // คัดลอกเทมเพลตสไลด์
    var copyFile = templateFile.makeCopy("เกียรติบัตร_" + data.name, targetFolder);
    var copyId = copyFile.getId();
    
    // เปิด Presentation เพื่อสลับตัวแปร
    var presentation = SlidesApp.openById(copyId);
    var dateString = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");

    presentation.replaceAllText("{{name}}", data.name);
    presentation.replaceAllText("{{score}}", data.score.toString());
    presentation.replaceAllText("{{total}}", data.total.toString());
    presentation.replaceAllText("{{date}}", dateString);
    presentation.replaceAllText("{{course}}", courseName);
    
    presentation.saveAndClose();
    
    // แปลงไฟล์เป็น PDF
    var pdfBlob = copyFile.getAs(MimeType.PDF);
    var pdfFile = targetFolder.createFile(pdfBlob);
    
    // ตั้งสิทธิ์เข้าถึงให้ทุกคนดาวน์โหลดได้
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // ลบสไลด์ชั่วคราวทิ้ง
    copyFile.setTrashed(true);
    
    return { 
      status: 'success', 
      pdfUrl: pdfFile.getUrl()
    };
  } catch (err) {
    return { status: 'error', message: 'ล้มเหลว: ' + err.toString() };
  }
}

// -------------------------------------------------------------
// UTILITIES HELPERS
// -------------------------------------------------------------

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getSheetDataAsJson(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return [];

  var headers = values[0];
  var jsonArray = [];

  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = values[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
      }
      obj[headers[j]] = val;
    }
    jsonArray.push(obj);
  }
  return jsonArray;
}

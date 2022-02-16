let lk_generateReportsPath = "/payments/reports/custom/submit/generateReports"

// let payload = {
//     "reportType": "Transaction",
//     "timeRangeType": "Custom",
//     "startDate": {"date": 1, "month": 4, "year": 2020},
//     "endDate": {"date": 1, "month": 4, "year": 2020}
// }

function lk_RequestObject(start, end) {
    return obj = {
        "reportType": "Transaction",
        "timeRangeType": "Custom",
        "startDate": lk_getDateObj(start),
        "endDate": lk_getDateObj(end),
    }
}

function lk_generateReports(start, end) {
    lk_baseAjaxCaller(lk_generateReportsPath, lk_RequestObject(start, end))
}

function lk_baseAjaxCaller(url, requestObject) {
    $.ajax({
        type: "POST",
        contentType: "application/json",
        url: url,
        data: JSON.stringify(requestObject),
    }).done(function (resp) {
        console.log(resp)
        if (resp.status === "SUCCESS") {

        } else {
        }

    }).fail(function () {

    })
}

function lk_getDateObj(date) {
    date = new Date(date);
    var dateObj = {};
    dateObj['date'] = date.getMonth() + 1;
    dateObj['month'] = date.getDate();
    dateObj['year'] = date.getFullYear();
    return dateObj
}

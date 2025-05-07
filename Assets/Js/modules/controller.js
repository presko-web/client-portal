var windowTypePrice = 0,
splitTypePrice = 0,
discount = 0;
var unavailableDates = [];
const  getToken = async () => {
    let clientId = atob(sessionStorage.getItem("clientId"));
    let clientSecret = atob(sessionStorage.getItem("clientSecret"));
    let refresh = atob(sessionStorage.getItem("refreshToken"));
    
    // create a logic to check if a token is expired or not using time comparison
    if(sessionStorage.getItem("tkn") !== null){
        var tokenExp = sessionStorage.getItem("tknGenerated");
        let currentTime = Date.now();
        if(parseInt(tokenExp) > currentTime){
            // console.log("Token is not expired, do nothing and return");
            return
        }
    }
    // if the token is expired, get a new one
    // using the refresh token
    // using the client id and client secret to get a new token
    // console.log("Token expired, Generating a new one");
    var settings = {
        "url": "https://presko-dev-ed.develop.my.salesforce.com/services/oauth2/token?grant_type=refresh_token&client_id="+clientId+"&client_secret="+clientSecret+"&refresh_token="+refresh,
        "method": "POST",
        "timeout": 0
      };
      
      await $.ajax(settings).done(function (response) {
        let currentTime = Date.now() + 20 * 60 * 1000;
        sessionStorage.setItem("tkn", response.access_token);
        sessionStorage.setItem("tknGenerated", currentTime);
      }).catch(function (err){
        console.log(err.responseJSON);
      });
}

const getData = async () => {
    const data = await new Promise((resolve, reject) => {
        let token = sessionStorage.getItem("tkn");
        var reqJson = {
            "url": "https://presko-dev-ed.develop.my.salesforce.com/services/apexrest/RetrieveSetupDetails",
            "method": "GET",
            "timeout": 0,
            "headers": {
              "Authorization": "Bearer " + token
            }
        }
        $.ajax(reqJson).done(function (res) {
            var resJsn = JSON.parse(res);
            unavailableDates = resJsn.blockedDates;
            var dateTotday = new Date().toISOString().substring(0,10);
            if(!unavailableDates.includes(dateTotday)){
                unavailableDates.push(dateTotday);
            }
            windowTypePrice = resJsn.invoice.window_type;
            splitTypePrice = resJsn.invoice.split_type;
            discount = resJsn.invoice.discount;
            resolve({resJsn, unavailableDates});
        }).catch(function (err){
            console.log(err.responseJSON);
            reject(err.responseJSON);
        });
    });
    return data;
}

const getClientData = async (jsonData, forceInit) => {

    const data = await new Promise((resolve, reject) => {
        
        if(sessionStorage.getItem("clientData") !== null && sessionStorage.getItem("clientData") !== undefined && sessionStorage.getItem("recordId") == jsonData.client_id && !forceInit){
            console.log("Client data already exists in session storage, using it instead of making a new request.");
            var res = JSON.parse(sessionStorage.getItem("clientData"));
            var resString = JSON.stringify(res);
            var resJsn = JSON.parse(resString);
            resolve(resJsn);
        }else{
            // console.log("Client data does not exist in session storage, making a new request.");
            let token = sessionStorage.getItem("tkn");
            var reqJson = {
                "url": "https://presko-dev-ed.develop.my.salesforce.com/services/apexrest/GetCustomerDetails",
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                "data": JSON.stringify(jsonData)
            }
            $.ajax(reqJson).then(function (res) {
                if(res.success){
                    var resString = JSON.stringify(res);
                    sessionStorage.setItem("clientData", resString);
                    sessionStorage.setItem("recordId", res.client.id);
                    resolve(res);
                }else{
                    Toastify({
                        text: res.errorMessage,
                        duration: 3000,
                        close: true,
                        gravity: "top", // `top` or `bottom`
                        position: "center", // `left`, `center` or `right`
                        stopOnFocus: true, // Prevents dismissing of toast on hover
                        style: {
                          background: "linear-gradient(to right,rgb(176, 0, 0),rgb(201, 61, 61))",
                        }
                      }).showToast();
                      setTimeout(() => {
                        window.location.href = "https://presko-web.github.io/pricing-calculator/";
                      }, 1000);
                }
            }).catch(function (err){
                console.log(err.responseJSON);
                reject(err.responseJSON);
            });
        }
    });
    return data;

}

const refer = (data) => {

    
    var settings = {
        "url": "https://presko-dev-ed.develop.my.salesforce.com/services/apexrest/CreateAppointment",
        "method": "POST",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + sessionStorage.getItem('tkn')
        },
        "data": JSON.stringify(data),
    };
    // check or Generate new token
    getToken();

    $.ajax(settings).done(function (response) {
        var message = "";
        var color = "";
        if(response.success){
            message = "Customer has been submitted!";
            color = "rgb(35, 176, 0),rgb(61, 201, 80)";

            setTimeout(() => {
                window.location.href = "index.html?customerId=" + data.customer.agent_id;
                $('.cover-loader').css({"display": "none"});
            }, 2000);

        }else{
            message = response.errorMessage;
            color = "rgb(176, 0, 0),rgb(201, 61, 61)";
        }
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              background: "linear-gradient(to right, " + color +")",
            }
        }).showToast();

    }).catch((err) => {
        Toastify({
            text: "unexpedted error, check the log or contact the Admin!",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right,rgb(176, 0, 0),rgb(201, 61, 61))",
            }
        }).showToast();
        $('.cover-loader').css({"display": "none"});
        console.log("error: ", err);
    });
}

const getCreds = async () => {
    await fetch('Assets/Notes/spec.json').then((response) => response.json()).then((json) => {
        sessionStorage.setItem("clientId", json.clientId);
        sessionStorage.setItem("clientSecret", json.clientSecret);
        sessionStorage.setItem("refreshToken", json.refreshToken);
    }); 
}

const calculation = (redeem, numberOfWindowTypeCalculated, numberOfSplitTypeCalculated, uShapedTypeCalculated)  => {
    var subTotal = 0;
    var total = 0;
    var redeemDiscount = 0;
    subTotal = numberOfWindowTypeCalculated + numberOfSplitTypeCalculated + uShapedTypeCalculated;
    if (redeem == "Yes") {
        if (numberOfWindowTypeCalculated > 0) {
            total = subTotal - windowTypePrice;
            redeemDiscount = windowTypePrice;
        }else if (numberOfSplitTypeCalculated > 0 || uShapedTypeCalculated > 0) {
            total = subTotal - splitTypePrice;
            redeemDiscount = splitTypePrice;
        }
    }else{
        total = subTotal - (subTotal * (discount/100));
    }
    return {subTotal, total, redeemDiscount};
}

const generateTotalTable = (redeem, calc) => {
    var discountMessage = '';
    var totalDiscount = 0;
    if(redeem == "Yes"){
        discountMessage = "Redeemed Discount:";
        totalDiscount = calc.redeemDiscount;
    }else{
        discountMessage = "Discount (" + discount + "%):";
        totalDiscount = calc.subTotal * (discount/100);
    }
    $("#total-table").html(`
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Sub total:</td>
                                        <td>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calc.subTotal)}</td>
                                    </tr>
                                    <tr>
                                        <td>${discountMessage}</td>
                                        <td>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalDiscount)}</td>
                                    </tr>
                                    <tr>
                                        <td>Total:</td>
                                        <td>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calc.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        `);

    $('#mobile-responsive-total').html(`
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>Sub total:</td>
                                                <td>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calc.subTotal)}</td>
                                            </tr>
                                            <tr>
                                                <td>${discountMessage}</td>
                                                <td>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalDiscount)}</td>
                                            </tr>
                                            <tr>
                                                <td>Total:</td>
                                                <td>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calc.total)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                `)
}

const removeTable = (windowType, splitType, uShapedType) => {

    if(windowType > 0 || splitType > 0 || uShapedType > 0){
        $("#table-data").css({"display": "block"});
        $('button[name=proceed]').removeAttr('disabled');
    }else{
        $("#table-data").css({"display": "none"});
        $("#customer-data").css({"display": "none"});
        $('button[name=proceed]').attr('disabled', true);
        $("button[name=proceed]").css({"display": "block"});
        $("button[name=book]").css({"display": "none"});
    }

}

const generateBreakdownTable = (arrTableData) => {

    $('#inner-mobile-calc .custom-accordion').remove();
    for (let index = 0; index < arrTableData.length; index++) {
        const element = arrTableData[index];
        
        $('#table-data table.tbl > tbody').append(
            $('<tr/>').append($('<td/>').text(element.description), 
                             $('<td/>').text(element.qty),
                             $('<td/>').text(new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(element.unitPrice)).css({"text-align":"right"}),
                             $('<td/>').text(new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(element.lineTotal)).css({"text-align":"right"}))
        )
        
        $('#inner-mobile-calc').append(`<div class="custom-accordion">
                                            <div >
                                                <div class="custom-accordion-header">
                                                    <p>${element.description}</p>
                                                </div>
                                                <div class="">
                                                    <table>
                                                        <tr>
                                                            <td>Qty</td>
                                                            <td><b>${element.qty}</b></td>
                                                        </tr>
                                                        <tr>
                                                            <td>Unit Price</td>
                                                            <td><b>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(element.unitPrice)}</b></td>
                                                        </tr>
                                                        <tr>
                                                            <td>Line Total</td>
                                                            <td><b>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(element.lineTotal)}</b></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>`);

    }


}

const generateTableIntitator = (redeem, splitType, windowType, uShapedType) => {
    let arrTableData = [];
    if(splitType > 0){
        arrTableData.push(
            {
                description: "Split Type Aircon Service",
                qty: splitType,
                unitPrice: splitTypePrice,
                lineTotal: splitTypePrice * splitType
            }
        );
    }
    if(windowType > 0){
        arrTableData.push(
            {
                description: "Window Type Aircon Service",
                qty: windowType,
                unitPrice: windowTypePrice,
                lineTotal: windowTypePrice * windowType
            }
        );
    }
    if(uShapedType > 0){
        arrTableData.push(
            {
                description: "U-Shaped Type Aircon Service",
                qty: uShapedType,
                unitPrice: splitTypePrice,
                lineTotal: splitTypePrice * uShapedType
            }
        );
    }


    // Clean the Table
    $('#table-data table.tbl > tbody > tr').remove();
    removeTable(windowType, splitType, uShapedType);

    // Generate new
    generateBreakdownTable(arrTableData);
    var calc = calculation(redeem, (windowType * windowTypePrice), (splitType * splitTypePrice), (uShapedType * splitTypePrice));
    generateTotalTable(redeem, calc);

    return calc.total;

}

const bookAservice = async (data) => {

    var settings = {
        "url": "https://presko-dev-ed.develop.my.salesforce.com/services/apexrest/BookingService",
        "method": "POST",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + sessionStorage.getItem('tkn')
        },
        "data": JSON.stringify(data)
    };
    // check or Generate new token
    getToken();

    await $.ajax(settings).done(function (response) {
        var message = "";
        var color = "";
        if(response.success){
            message = "Service has been Booked!";
            color = "rgb(35, 176, 0),rgb(61, 201, 80)";

            setTimeout(() => {
                window.location.href = "index.html?customerId=" + data.appointment.client_id;
                $('.cover-loader').css({"display": "none"});
            }, 2000);

        }else{
            message = response.errorMessage;
            color = "rgb(176, 0, 0),rgb(201, 61, 61)";
        }
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              background: "linear-gradient(to right, " + color +")",
            }
          }).showToast();
    }).catch((err) => {
        Toastify({
            text: "unexpedted error, check the log or contact the Admin!",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: "linear-gradient(to right,rgb(176, 0, 0),rgb(201, 61, 61))",
            }
        }).showToast();
        $('.cover-loader').css({"display": "none"});
        console.log("error: ", err);
    });
}
export default { getToken, getData, refer, getCreds, calculation, generateTotalTable, removeTable, generateBreakdownTable, getClientData, generateTableIntitator, bookAservice }
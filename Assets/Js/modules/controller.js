
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
    console.log("Token expired, Generating a new one");
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
            var unavailableDates = resJsn.blockedDates;
            var dateTotday = new Date().toISOString().substring(0,10);
            if(!unavailableDates.includes(dateTotday)){
                unavailableDates.push(dateTotday);
            }
            resolve({resJsn, unavailableDates});
        }).catch(function (err){
            console.log(err.responseJSON);
            reject(err.responseJSON);
        });
    });
    return data;
}


const getClientData = async (jsonData) => {
    console.log('jsonData: ', jsonData);
    
    const data = await new Promise((resolve, reject) => {
        let token = sessionStorage.getItem("tkn");
        var reqJson = {
            "url": "https://presko-dev-ed.develop.my.salesforce.com/services/apexrest/GetCustomerDetails",
            "method": "POST",
            "timeout": 0,
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            "data": JSON.stringify(jsonData),
        }
        $.ajax(reqJson).done(function (res) {
            console.log("res: ", res);

            resolve(res);
        }).catch(function (err){
            console.log(err.responseJSON);
            reject(err.responseJSON);
        });
    });
    return data;
}


const createRecord = (data) => {

    $('.cover-loader').css({"display": "block"});
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


    $.ajax(settings).done(function (response) {
        if(!response.success){
            $('.cover-loader').css({"display": "none"});
            var errorMsg = 'Unexpected Error';
            if (response.errorMessage.includes('DUPLICATES_DETECTED')) {
                errorMsg = response.errorMessage.split('first error:')[1].split('DUPLICATES_DETECTED, Alert:')[1]
            }
            Toastify({
                text: errorMsg,
                duration: 3000,
                close: true,
                gravity: "top", // `top` or `bottom`
                position: "center", // `left`, `center` or `right`
                stopOnFocus: true, // Prevents dismissing of toast on hover
                style: {
                  background: "linear-gradient(to right,rgb(176, 0, 0),rgb(201, 61, 61))",
                }
              }).showToast();
        }else{
            window.location.href = 'https://presko-dev-ed.develop.my.site.com/clientportal/s/?customerId=' + response.account_id;
        }
    }).catch((err) => {
        if(err.responseText.includes('Session expired or invalid') && errorCount <= 3){
            errorCount ++;
            getToken();
            setTimeout(() => {
                createRecord(data);
            }, 2000);
        }

        if(errorCount >= 3) {
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
        };
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

const calculation = (numberOfWindowTypeCalculated, numberOfSplitTypeCalculated, uShapedTypeCalculated, discount)  => {
    var subTotal = 0;
    var total = 0;
    subTotal = numberOfWindowTypeCalculated + numberOfSplitTypeCalculated + uShapedTypeCalculated;
    total = subTotal - (subTotal * (discount/100));
    return {subTotal, total}
}

const generateTotalTable = (calc, discount) => {

    var discountMessage = "Discount (" + discount + "%):";
    var totalDiscount = calc.subTotal * (discount/100);
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

export default { getToken, getData, createRecord, getCreds, calculation, generateTotalTable, removeTable, generateBreakdownTable, getClientData }
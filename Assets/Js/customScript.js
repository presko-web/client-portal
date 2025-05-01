var splitType = 0;
var windowType = 0;
var uShapedType = 0;

var windowTypePrice = 0;
var splitTypePrice = 0;
var discount = 0;
var errorCount = 0;
var total = 0;
var minDate = new Date().toISOString().substring(0,10);
var unavailableDates = [];

async function init(){
    
    // initial Creds
    var creds;
    await fetch('Assets/Notes/spec.json').then((response) => response.json()).then((json) => {
        creds = json;
        sessionStorage.setItem("clientId", json.clientId);
        sessionStorage.setItem("clientSecret", json.clientSecret);
        sessionStorage.setItem("refreshToken", json.refreshToken);
    }); 
    await getToken();
    await getData();

    // select options
    for (let index = 1; index <= 20; index++) {
        $('.number-Of').append(`<option value="${index}">${index}</option>`);
    }
    
    // required fields
    $('[required="true"]').each(function(){
        const para = document.createElement("span");
        para.style.color = "red";
        const node = document.createTextNode(" *");
        para.appendChild(node);
        $(this)[0].previousElementSibling.appendChild(para);
    })

    // assign minimum date
    $('#datepicker').attr('min', minDate);

}

async function getToken(){


    let clientId = atob(sessionStorage.getItem("clientId"));
    let clientSecret = atob(sessionStorage.getItem("clientSecret"));
    let refresh = atob(sessionStorage.getItem("refreshToken"));
    
    var settings = {
        "url": "https://presko-dev-ed.develop.my.salesforce.com/services/oauth2/token?grant_type=refresh_token&client_id="+clientId+"&client_secret="+clientSecret+"&refresh_token="+refresh,
        "method": "POST",
        "timeout": 0
      };
      await $.ajax(settings).done(function (response) {
        sessionStorage.setItem("tkn", response.access_token);
      }).catch(function (err){
        console.log(err.responseJSON);
      });
}
async function getData(){

    var reqJson = {
        "url": "https://presko-dev-ed.develop.my.salesforce.com/services/apexrest/RetrieveSetupDetails",
        "method": "GET",
        "timeout": 0,
        "headers": {
          "Authorization": "Bearer " + sessionStorage.getItem('tkn')
        }
    }
    await $.ajax(reqJson).done(function (res) {
        var resJsn = JSON.parse(res);
        console.log(resJsn);
        
        windowTypePrice = resJsn.invoice.window_type;
        splitTypePrice = resJsn.invoice.split_type;
        discount = resJsn.invoice.discount;
        
        unavailableDates = resJsn.blockedDates;
        var dateTotday = new Date().toISOString().substring(0,10);
        if(!unavailableDates.includes(dateTotday)){
            unavailableDates.push(dateTotday);
        }
        
        $('.number-Of').removeAttr('disabled');
        // enable datepicker
        $( "#datepicker" ).datepicker({
            dateFormat: 'yy-mm-dd',
            minDate: new Date(minDate),
            beforeShowDay: (date) => {
                var string = jQuery.datepicker.formatDate('yy-mm-dd', date);
                return [ unavailableDates.indexOf(string) == -1 ]
            }
        });
        $( "#datepicker" ).removeAttr('disabled');

    });

}

function calculation(numberOfWindowTypeCalculated, numberOfSplitTypeCalculated, uShapedTypeCalculated){

    var subTotal = 0;
    var total = 0;
    subTotal = numberOfWindowTypeCalculated + numberOfSplitTypeCalculated + uShapedTypeCalculated;
    total = subTotal - (subTotal * (discount/100));
    return {subTotal, total}

}

function removeTable(windowType, splitType, uShapedType) {
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

function generateBreakdownTable(arrTableData){
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

function generateTotalTable(calc){

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

async function createRecord(data){

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
    
    await $.ajax(settings).done(function (response) {
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



$(function() {

    $('.number-Of').on('change', function(){
        var arrTableData = [];
        if($(this).attr('name') == 'noOfSplitType'){
            splitType = $(this).val();
        }else if($(this).attr('name') == 'noOfWindowType'){
            windowType = $(this).val();
        }else{
            uShapedType = $(this).val();
        }

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
        var calc = calculation((windowType * windowTypePrice), (splitType * splitTypePrice), (uShapedType * splitTypePrice));
        total = calc.total;
        generateTotalTable(calc);

    });

    $("button[name=clear]").on("click", function(){
        $('.number-Of').val(0);
        splitType = 0;
        windowType = 0;
        uShapedType = 0;
        $('#cleaning-date').val("");
        removeTable(0, 0, 0);
    });

    $("button[name=proceed]").on("click", function(){
        if(windowType > 0 || splitType > 0 || uShapedType > 0){
            $("#customer-data").css({"display": "block"});
            $(this).css({"display": "none"});
            $("button[name=book]").css({"display": "block"});
        }
    });

    $("#frm").on("submit", function(e){
        e.preventDefault();
        var customerFields = [
                            "firstName",
                            "lastName",
                            "mobile",
                            "street",
                            "barangay",
                            "city",
                            "landmark"
                        ];

        var appointmentFields = [
                            "cleaningDate",
                            "noOfSplitType",
                            "noOfWindowType",
                            "noOfUShapedType"
                        ];

        var jsonReq = {"customer": {}, "appointment": {
            "totalAmount": total,
            "redeem": "No"
        }};
        $.each($(this).serializeArray(), function(i, field) {
            if(customerFields.includes(field.name)){
                jsonReq['customer'][field.name] = field.value;
            } else if(appointmentFields.includes(field.name)){
                jsonReq['appointment'][field.name] = field.value;
            }
        });

        // double checking for Cleaning date
        let hasErrorDate = false;
        let errMsg = "";
        if(unavailableDates.includes(jsonReq.appointment.cleaningDate)){
            hasErrorDate = true;
            errMsg = "The selected date is not available!";
        }
        
        let pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
        let result = pattern.test(jsonReq.appointment.cleaningDate);

        if(!result){
            hasErrorDate = true;
            errMsg = "Date format is Invalid";
        }

        if(hasErrorDate){

            Toastify({
                text: errMsg,
                duration: 3000,
                close: true,
                gravity: "top", // `top` or `bottom`
                position: "center", // `left`, `center` or `right`
                stopOnFocus: true, // Prevents dismissing of toast on hover
                style: {
                  background: "linear-gradient(to right,rgb(176, 0, 0),rgb(201, 61, 61))",
                }
              }).showToast();
              $('#datepicker').focus();
              return;
        }

        Swal.fire({
            title: "",
            showDenyButton: true,
            confirmButtonText: "Yes",
            confirmButtonColor: '#557275',
            icon: "question",
            text: "Are you sure you want to proceed with this booking?",
            denyButtonText: `Cancel`
          }).then((result) => {
            if (result.isConfirmed) {
                createRecord(jsonReq);
            }
        });
        
    });

    // Custom Validity
    $('input').on('change', function(){
        $(this).get(0).setCustomValidity('');
        $(this).get(0).style.borderColor = 'rgb(147, 147, 147)';
    });

    $('textarea').on('change', function(){
        $(this).get(0).setCustomValidity('');
        $(this).get(0).style.borderColor = 'rgb(147, 147, 147)';
    });

    $('input').on('invalid', function(){

        $(this).get(0).style.borderColor = 'red';
        let validityMessage = 'Complete this field';
        if($(this).get(0).name == 'cleaningDate'){
            if ($(this).get(0).value != '') {
                var date = new Date(minDate);
                const options = { month: "long" };
                validityMessage = 'The next available date is ' + new Intl.DateTimeFormat("en-US", options).format(date) + ' ' + date.getDate();
            }
        }
        if($(this).get(0).name == 'mobile'){
            if ($(this).get(0).value != '') {
                validityMessage = "Phone number must start with '09' and contain exactly 11 digits.";
            }
        }
        $(this).get(0).setCustomValidity(validityMessage);

    })


    $('textarea').on('invalid', function(){
        $(this).get(0).style.borderColor = 'red';
        let validityMessage = 'Complete this field';
        $(this).get(0).setCustomValidity(validityMessage);
    });

    // initialization
    init();
})
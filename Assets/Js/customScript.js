import controller from './modules/controller.js';

var windowTypePrice = 0;
var splitTypePrice = 0;
var discount = 0;
var minDate = new Date().toISOString().substring(0,10);
var unavailableDates = [];

var splitType = 0;
var windowType = 0;
var uShapedType = 0;
var errorCount = 0;
var total = 0;

// Goods
async function init(){
    
    await controller.getCreds();
    await controller.getToken();
    await initiateOrgData();
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

async function initiateOrgData(){
    await controller.getData().then((res) => {
        windowTypePrice = res.resJsn.invoice.window_type;
        splitTypePrice = res.resJsn.invoice.split_type;
        discount = res.resJsn.invoice.discount;
        unavailableDates = res.unavailableDates;
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

    }).catch((err) => {
        console.log('err: ', err);
    })
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
        controller.removeTable(windowType, splitType, uShapedType);

        // Generate new
        controller.generateBreakdownTable(arrTableData);
        var calc = controller.calculation((windowType * windowTypePrice), (splitType * splitTypePrice), (uShapedType * splitTypePrice), discount);
        total = calc.total;
        controller.generateTotalTable(calc, discount);

    });

    $("button[name=clear]").on("click", function(){
        $('.number-Of').val(0);
        splitType = 0;
        windowType = 0;
        uShapedType = 0;
        $('#cleaning-date').val("");
        controller.removeTable(0, 0, 0);
    });

    // to do
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

    // Custom Validity
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
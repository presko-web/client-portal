import controller from './modules/controller.js';
var windowTypePrice = 0;
var splitTypePrice = 0;
var discount = 0;
var minDate = new Date().toISOString().substring(0,10);
var unavailableDates = [];
var bookingDetails = {};
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('customerId');


async function init(){
    var reinit; // = (urlParams.get('redeem') != null && urlParams.get('redeem') != "" && urlParams.get('redeem') !== undefined && urlParams.get('redeem') == 'Yes') ? true : false;
    reinit = true;
    // check if id is not null
    if(id == null || id == "" || id === undefined){
        // redirect to Pricing page
        window.location.href = "https://presko-web.github.io/pricing-calculator/index.html";
    }else{
        $('.header-nav li a').each(function(){
            // append id to the href
            var href = $(this).attr('href');
            if(href != undefined && href != null && href != ""){
                $(this).attr('href', href + "?customerId=" + id);
            }
        });
    }

    await controller.getCreds();
    await controller.getToken();
    await initiateOrgData();
    await controller.getClientData({"client_id": id}, reinit).then((res) => {
        if(res != null && res != undefined && res != "" && res.success === true){
            // check if we are in the index.html page
            if(window.location.href.indexOf("book-a-cleaning.html") > -1){
                $('.value-address').text(res.client.street + ", " + res.client.barangay + ", " + res.client.city + ", " + res.client.landmark);
                $('.value-name').text(res.client.name);
                $('.value-points').text(res.client.loyalty.points);
                if (res.client.loyalty.points < 5) {
                    $('#redeemPoints').attr('disabled', 'disabled').val('No');
                    if(urlParams.get('redeem') == 'Yes'){
                        alert("You do not have enough points to redeem a cleaning. You need at least 5 points to redeem a cleaning.");
                        window.location.href = "index.html?customerId=" + id;
                    }
                }
            }else if(window.location.href.indexOf("refer-a-friend.html") > -1){
                $('.value-name').text(res.client.name);
            }else{
                $('.address').text(res.client.street + ", " + res.client.barangay + ", " + res.client.city + ", " + res.client.landmark);
                $('.phoneNumber').text(res.client.mobile);
                $('.customer-name').text(res.client.name);
                // check if last cleaning date is not null
                if(res.client.loyalty.last_cleaning_date != null && res.client.loyalty.last_cleaning_date != "" && res.client.loyalty.last_cleaning_date !== undefined){
                    $('.last-cleaning-date label').text(new Date(res.client.loyalty.last_cleaning_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
                    
                    ['next_cleaning_3mos', 'next_cleaning_4mos', 'next_cleaning_6mos'].forEach((item) => {
                        // check if item exist as key in res.client.loyalty and is not null
                        if(res.client.loyalty[item] != null && res.client.loyalty[item] != "" && res.client.loyalty[item] !== undefined){
                            const nextCleaning = res.client.loyalty[item];
                            var cleaningRecurrence = item.split("_")[2].split("mos")[0];
                            $('.transactions table tbody').append(
                                `<tr style="height: 23px; line-height: 23px;">
                                    <td>${new Date(nextCleaning).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                    <td>${cleaningRecurrence} Months</td>
                                    <td><a class="book-btn" style="text-decoration: none" href="book-a-cleaning.html?customerId=${id}&nextCleaningDate=${nextCleaning}">BOOK</a></td>
                                </tr>`
                            )
                        }
                        
                    })
                }else{
                    $('.transactions').css({'display':'none'});
                    $('li#book-a-cleaning').css({'display':'none'});
                }
    
                $('.points-number').text(res.client.loyalty.points);
                // check if res.client.loyalty.points_expiry is not null
                if(res.client.loyalty.points_expiry != null && res.client.loyalty.points_expiry != "" && res.client.loyalty.points_expiry !== undefined){
                    const pointsExpiry = new Date(res.client.loyalty.points_expiry).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                    $('.expiry').text(pointsExpiry);
                }
                if(res.client.loyalty.points >= 5){
                    $('#redeem-btn').removeClass('btn-disabled').addClass('book-btn').attr('href', `book-a-cleaning.html?customerId=${id}&redeem=Yes`);
                }
                
                // check if res.client.appointments is not null
                if(res.client.appointments != null && res.client.appointments != "" && res.client.appointments !== undefined && res.client.appointments.length > 0){
                    $('.appointments table tbody').empty();
                    const appointments = res.client.appointments;
                    appointments.forEach((item) => {
                        const cleaningDate = new Date(item.cleaningDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                        var notes = '';
                        // check if status contains "Cancelled"
                        if(item.status == "Confirmed"){
                            notes = bookingDetails['confirmed_notes']
                        }
                        if(item.status == "Completed"){
                            notes = bookingDetails['completed_notes']
                        }
                        if(item.status == "Pending"){
                            notes = bookingDetails['pending_notes']
                        }
                        $('.appointments table tbody').append(
                            `<tr>
                                <td>${cleaningDate}</td>
                                <td>${item.noOfWindowType}</td>
                                <td>${item.noOfSplitType}</td>
                                <td>${item.noOfUShapedType}</td>
                                <td>${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.totalAmount)}</td>
                                <td>${item.status}</td>
                                <td style="max-width: 300px; text-wrap: auto">${notes}</td>
                            </tr>`
                        )
                    });
                }
            }

        }
    }).catch((err) => {
        console.log('err: ', err);
    });

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
    
}

async function initiateOrgData(){
    await controller.getData().then((res) => {
        windowTypePrice = res.resJsn.invoice.window_type;
        splitTypePrice = res.resJsn.invoice.split_type;
        discount = res.resJsn.invoice.discount;
        unavailableDates = res.unavailableDates;
        bookingDetails = res.resJsn.booking;

        const urlParams = new URLSearchParams(window.location.search);
        const nextCleaningDate = (urlParams.get('nextCleaningDate') != null && urlParams.get('nextCleaningDate') != "" && urlParams.get('nextCleaningDate') !== undefined) ? urlParams.get('nextCleaningDate') : null;
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
        $( "#datepicker" ).removeAttr('disabled').val(nextCleaningDate);

    }).catch((err) => {
        console.log('err: ', err);
    })
}



$(function() {

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

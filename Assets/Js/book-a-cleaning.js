// Book a cleaning page script
import controller from './modules/controller.js';
var splitType = 0;
var windowType = 0;
var uShapedType = 0;
var total = 0;
var cleaningDate = null;
let redeem;

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('customerId');

async function pageInit() {

    redeem = (urlParams.get('redeem') != null && urlParams.get('redeem') != "" && urlParams.get('redeem') !== undefined) ? urlParams.get('redeem') : "No";
    if (redeem) {
        $('#redeemPoints').val(redeem);
    }
}
$(function() {

    // to do
    $("#frm").on("submit", async function(e){
        e.preventDefault();

        var appointmentFields = [
                            "cleaningDate",
                            "noOfSplitType",
                            "noOfWindowType",
                            "noOfUShapedType",
                            "redeem"
                        ];

        var jsonReq = {
            "appointment": {
                    "client_id": id,
                    "totalAmount": total
                }
            };
        $.each($(this).serializeArray(), function(i, field) {
            if(appointmentFields.includes(field.name)){
                jsonReq['appointment'][field.name] = field.value;
            }
        });
        
        var unavailableDatesNew = [];
        await controller.getData().then((res) => {
            unavailableDatesNew = res.unavailableDates;
        }).catch((err)=>{
            console.error('error', err);
        });

        // double checking for Cleaning date
        let hasErrorDate = false;
        let errMsg = "";
        let dateNow = new Date();
        let dateSelected = new Date(jsonReq.appointment.cleaningDate);
        let pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
        let result = pattern.test(jsonReq.appointment.cleaningDate);
        if(unavailableDatesNew.includes(jsonReq.appointment.cleaningDate) || dateSelected < dateNow){
            hasErrorDate = true;
            errMsg = "The selected date is not available!";
        }

        if(!result){
            hasErrorDate = true;
            errMsg = "Date format is Invalid, it should be 'yyyy-mm-dd'";
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
                $('.cover-loader').css({"display": "block"});
                controller.bookAservice(jsonReq);
            }else{
                $('.cover-loader').css({"display": "none"});
            }
        });
        
    });


    $('.number-Of').on('change', function(){
        if($(this).attr('name') == 'noOfSplitType'){
            splitType = $(this).val();
        }else if($(this).attr('name') == 'noOfWindowType'){
            windowType = $(this).val();
        }else{
            uShapedType = $(this).val();
        }
        console.log(splitType, windowType, uShapedType);
        
        total = controller.generateTableIntitator(redeem, splitType, windowType, uShapedType);
    });


    $("button[name=clear]").on("click", function(){
        $('.number-Of').val(0);
        splitType = 0;
        windowType = 0;
        uShapedType = 0;
        redeem = 'No';
        cleaningDate = null;
        total = 0;
        $('#datepicker').val(null);
        $("#redeemPoints").val('No');
        controller.removeTable(0, 0, 0);
        

    });

    $("select[name=redeem]").on("change", function(){
        redeem = $(this).val();
        total = controller.generateTableIntitator(redeem, splitType, windowType, uShapedType);
    });

    
    pageInit();
});
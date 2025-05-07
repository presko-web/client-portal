import controller from './modules/controller.js';
var splitType = 0;
var windowType = 0;
var uShapedType = 0;
var cleaningDate = null;
var total = 0;
var firstName = null;
var lastName = null;
var mobile = null;
var street = null;
var barangay = null;
var city = null;
var landmark = null;
$(function(){

    $('.number-Of').on('change', function(){
        if($(this).attr('name') == 'noOfSplitType'){
            splitType = $(this).val();
        }else if($(this).attr('name') == 'noOfWindowType'){
            windowType = $(this).val();
        }else{
            uShapedType = $(this).val();
        }
        console.log(splitType, windowType, uShapedType);
        total = controller.generateTableIntitator('No', splitType, windowType, uShapedType);
    });
    
    $("button[name=clear]").on("click", function(){
        firstName = null;
        lastName = null;
        mobile = null;
        street = null;
        barangay = null;
        city = null;
        landmark = null;
        splitType = 0;
        windowType = 0;
        uShapedType = 0;
        cleaningDate = null;
        total = 0;
        $("input").val(null)
        $("textarea").val(null)
        $("input[name=city]").val('Malolos')
        $('.number-Of').val(0);
        $('#datepicker').val(null);
        $("#redeemPoints").val('No');
        controller.removeTable(0, 0, 0);
    });

    $("#frm").on("submit", async function(e){
        e.preventDefault();
        let hasErrorDate = false;
        let errorTotal = false;
        let errMsg = "";
        if(total <= 0){
            errorTotal = true;
            errMsg = "Please select atleast one aircon type";
        }
        var customerFields = [
                        "firstName",
                        "lastName",
                        "mobile",
                        "street",
                        "barangay",
                        "city",
                        "landmark"];

        var appointmentFields = [
                        'cleaningDate',
                        'noOfSplitType',
                        'noOfWindowType',
                        'noOfUShapedType'];
        var json = {
            "customer": {
                "agent_id": sessionStorage.getItem("recordId")
            },
            "appointment": {
                "totalAmount": total,
                "redeem": "No"
            }
        }
        
        $.each($(this).serializeArray(), function(i, field) {
            if(appointmentFields.includes(field.name)){
                json['appointment'][field.name] = field.value;
            }else if(customerFields.includes(field.name)){
                json['customer'][field.name] = field.value;
            }
        });
        
        
        var unavailableDatesNew = [];
        await controller.getData().then((res) => {
            unavailableDatesNew = res.unavailableDates;
        }).catch((err)=>{
            console.error('error', err);
        });
        
        // double checking for Cleaning date
        
        let dateNow = new Date();
        let dateSelected = new Date(json.appointment.cleaningDate);
        let pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
        let result = pattern.test(json.appointment.cleaningDate);
        if(unavailableDatesNew.includes(json.appointment.cleaningDate) || dateSelected < dateNow){
            hasErrorDate = true;
            errMsg = "The selected date is not available!";
        }
        if(!result){
            hasErrorDate = true;
            errMsg = "Date format is Invalid, it should be 'yyyy-mm-dd'";
        }

        if(hasErrorDate || errorTotal){
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
            if(hasErrorDate){
                $('#datepicker').focus();
            }else if(errorTotal){
                $('#split-type').focus();
            }
            return;
        }

        console.log(json);

        Swal.fire({
            title: "",
            showDenyButton: true,
            confirmButtonText: "Yes",
            confirmButtonColor: '#557275',
            icon: "question",
            text: "Are you sure you want to proceed?",
            denyButtonText: `Cancel`
            }).then((result) => {
            if (result.isConfirmed) {
                $('.cover-loader').css({"display": "block"});
                controller.refer(json);
            }else{
                $('.cover-loader').css({"display": "none"});
            }
        });
        
    });

})
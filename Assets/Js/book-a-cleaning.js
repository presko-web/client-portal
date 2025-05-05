// Book a cleaning page script
function pageInit() {
    // get the nextCleaningDate value from the url
    const urlParams = new URLSearchParams(window.location.search);
    const redeem = urlParams.get('redeem');
    // check if the nextCleaningDate value is not null or undefined
    console.log(redeem);
    
    if (redeem) {
        $('#redeemPoints').val(redeem);
    }
}
$(function() {

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
    pageInit();
});
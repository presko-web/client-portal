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
                        "fullName",
                        "mobile",
                        "street",
                        "barangay",
                        "city",
                        "landmark"];

        var json = {
            
            "id": sessionStorage.getItem("recordId")
            
        }
        
        $.each($(this).serializeArray(), function(i, field) {
            if(customerFields.includes(field.name)){
                json[field.name] = field.value;
            }
        });
        

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
                controller.updateClientDetails(json);
            }else{
                $('.cover-loader').css({"display": "none"});
            }
        });
        
    });

})
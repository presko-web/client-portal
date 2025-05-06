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


})
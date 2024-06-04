class PageFormsReport extends PageFormsBase{
    constructor(){
        super();


    }

    Init(){
        super.Init();
        INITFILTER();
    }

    InitEvent(){
        super.InitEvent();
        if(typeof(EVENTBEFORESHOWFORM) == "function")
            EVENTBEFORESHOWFORM = (formId) => { this.OnBeforeShowForm(formId); }
    }

    InitListForms(){
        var role = paramUser["role"],
            grId = paramUser["gr_id"];

        if (role == "1")
            $("div[formId]", ".list-forms").not("[formId='2016']").parent().remove();
        else
            $("div[formId='2016']", ".list-forms").parent().remove();

        if (role == "5") {
            $("div[formId='2011'], div[formId='2012'], div[formId='1011']", ".list-forms").parent().remove();

            $("li[formId='10121'], li[formId='10122'], li[formId='10123'], li[formId='10124']", ".list-forms").remove();
            $("li[formId='20136'], li[formId='20131'], li[formId='20134'], li[formId='20135']", ".list-forms").remove();
            $("li[formId='20146'], li[formId='20137'], li[formId='20138']", ".list-forms").remove();
        } 
        // Преподаватель уровня Ш
        else if ("4" == role && "10" == grId) {
            $(`div[formId='2015'], div[formId='2014'], div[formId='2013'], div[formId='2012'], div[formId='2011']`, ".list-forms").parent().remove();

            $("li[formId='20121']", ".list-forms").remove();
            $("li[formId='20131'], li[formId='20132'], li[formId='20133'], li[formId='20134']", ".list-forms").remove();
            $("li[formId='20143'], li[formId='20144'], li[formId='20145'], li[formId='20146'], li[formId='20147']", ".list-forms").remove();
        }            
    }

    ShowForm(element, formId){
        $("#dialogFilter").empty();
        SHOWFORM(element, formId);        
        INITFILTER();
    }

    OpenFilter(){        
        this.GetDialogFilter().dialog({
            autoOpen: true,        
            modal: true,
            draggable: false,
            resizable: false,
            dialogClass: "no-close",
            title: "Фильтр",
            classes: {
                "ui-dialog": "phone-fullscreen phone-scroll-invisible aos-dialog-style"
            },
            buttons: [{
                    id: 'editSave',
                    type: 'button',              
                    text: "Применить",
                    click: function () {
                        APPLYFILTER();
                        $(this).dialog("close");
                    }
                },
                {
                    id: 'editCansel',
                    type: 'button',
                    text: "Закрыть",
                    click: function () {                        
                        $(this).dialog("close");
                    }
                }
            ],
            open: () => {
                
            },
            close: function(){    
                $('#filterbox').find(".selectoids>div").empty();
                if($('#filterTree').fancytree("getActiveNode"))
                    $('#filterTree').fancytree("getActiveNode").setActive(false);
                $(this).dialog("destroy");
            }
        });

        initDialogFullScreen();
    }

    GetDialogFilter(){
        return $("#dialogFilter");
    }
}
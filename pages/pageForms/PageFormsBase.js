class PageFormsBase{
    constructor(){
        this.m_FormProcessor = new AosFormProcessor();
    }

    Init(){
        this.InitListForms();

        if(this.IsEdit())
            this.GetOpenEditEl().show();
        else
            this.GetOpenEditEl().remove();

        this.m_FormProcessor.Init();
        this.InitEvent();
    }

    InitListForms(){

    }

    IsEdit(){
        return false;
    }

    InitEvent(){
        this.m_FormProcessor.EventBeforeShowForm = () => { this.OnBeforeShowForm(this.m_FormProcessor.m_filter.m_formId); };

        this.GetVisibleListFormsEl().on("click", (event) => { this.OnClickVisibleListForms(event); });
        this.GetListFormsEl().find(".item").on("click", (event) => { this.OnClickListItem(event); })
        this.GetOpenFilterEl().on("click", (event) => {  this.OpenFilter(event); });
        this.GetExport().on("click", (event) => { this.ExportExcel(); });
        this.GetPrint().on("click", (event) => { this.Print(); });

        if(this.IsEdit())
            this.GetOpenEditEl().on("click", (event) => { this.OpenDialogEditManual(event); });
        //this.m_FormProcessor.ShowForm(400002);
    }

    OnBeforeShowForm(formId){
        var formItemEl = this.GetListFormsEl().find(`li[formId='${ formId }']`);

        if(!formItemEl.hasClass("selected")){
            this.GetListFormsEl().find(".selected").removeClass("selected");

            if(!formItemEl.closest(".item-group").hasClass("opened")){
                this.CloseListItemGroup(this.GetListFormsEl().find(".opened").closest(".item-group"));
                this.OpenListItemGroup(formItemEl.closest(".item-group"));
            }

            formItemEl.addClass("selected");
        }
    }
    
    OnClickVisibleListForms(event){
        var el = $(event.currentTarget);
        if(el.hasClass("opened")){
            this.GetListFormsEl().addClass("phone-closed");
            el.removeClass("opened");
            el.addClass("rotate-180");
        }
        else{
            this.GetListFormsEl().removeClass("phone-closed");
            el.addClass("opened");
            el.removeClass("rotate-180");
        }  
    }

    OnClickListItem(event){
        var el = $(event.currentTarget);
        
        if(!el.parent().hasClass("item-group")){
            this.ShowForm(el, el.attr("formId"));
            this.GetListFormsEl().find(".selected").removeClass("selected");
            el.addClass("selected");

            this.GetOpenFilterEl().removeAttr("disabled");
            this.GetExportEl().removeAttr("disabled");
            this.GetPrintEl().removeAttr("disabled");            
        }
        else{
            if(el.hasClass("opened")){
                this.CloseListItemGroup(el.closest(".item-group"));
            }
            else{
                this.CloseListItemGroup(this.GetListFormsEl().find(".opened").closest(".item-group"));
                this.OpenListItemGroup(el.closest(".item-group"));
            }            
        }
    }

    CloseListItemGroup(el){
        el.find("ul").hide();
        el.find(".opened > img").removeClass("rotate-180");
        el.find(".opened").removeClass("opened");
    }

    OpenListItemGroup(el){
        el.find("ul").show();
        el.find(":first > img").addClass("rotate-180");
        el.find(":first").addClass("opened");
    }

    OpenDialogEditManual(){

    }

    OpenFilter(){
        if(this.m_FormProcessor.m_filter && this.m_FormProcessor.m_filter.m_formId)
            this.m_FormProcessor.m_filter.ShowFilter();
    }

    ShowForm(element, formId){
        this.m_FormProcessor.ShowForm(formId);
    }

    ExportExcel(){
        console.log("export to excel");
        tableToExcel();
    }

    Print(){
        console.log("print");
        StandartClickPrint();
    }

    GetOpenFilterEl(){
        return this.GetEl().find("#openFilter");
    }

    GetExportEl(){
        return this.GetEl().find("#export");
    }

    GetPrintEl(){
        return this.GetEl().find("#print");
    }

    GetOpenEditEl(){
        return $("#openEdit");
    }

    GetExport(){
        return $("#export");
    }

    GetPrint(){
        return $("#print");
    }

    GetListFormsEl(){
        return $(".list-forms");
    }

    GetVisibleListFormsEl(){
        return $("#visibleListForms");
    }

    GetEl(){
        return $(".aos-page");
    }

    GetFormEl(){
        return $("#additionalDiv");        
    }
}

class FormBaseDialogEditManual{
    constructor(data){        
        this.m_DialogData = data;

        this.m_Data = Array();
        this.m_SelectedItem = null;
        this.m_AmountTryClose = 0;
    }

    Open(){
        this.GetEl().dialog({ ...this.GetDataDefault(), ...this.m_DialogData });

        initDialogFullScreen();
    }

    GetDataDefault(){
        return {
            autoOpen: true,        
            modal: true,
            draggable: false,
            resizable: false,
            width: 600,
            height: 600,
            dialogClass: "no-close",
            title: "Ручной ввод данных",
            classes: {
                "ui-dialog": "phone-fullscreen phone-scroll-invisible aos-dialog-style"
            },
            buttons: [{
                    id: 'save',
                    type: 'button',
                    text: "Сохранить",
                    click: () => {
                        this.SaveDataEdit();
                    }
                },{
                    id: 'cansel',
                    type: 'button',
                    text: "Закрыть",
                    click: () => {
                        if(this.OnBeforeClose())
                            this.GetEl().dialog("close");
                    }
                }
            ],
            open: () => {
                this.Init();
            },
            close: () => {    
                this.Close();
                this.GetEl().dialog("destroy");
            }
        };
    }

    OnBeforeClose(){        
        if(this.GetDataEdit().length > 0){
            this.m_AmountTryClose += 1;
            if(this.m_AmountTryClose % 2 != 0){
                this.ShowMsgInfo("Есть не сохранённые изменения, для того чтобы закрыть окно ещё раз нажмите «Закрыть");
                return false;
            }
        }

        return true;
    }

    SaveDataEdit(){
        this.m_AmountTryClose = 0;
    }

    Init(){

    }

    InitEdit(){
        this.GetEditSave().off("click");
        this.GetEditSave().on("click", (event) => {             
            if(!$(event.currentTarget).attr("disabled"))
                this.SaveData(this.GetEditData());
        });
    }

    GetEditData(){
        return this.m_TableRowSelected;
    }

    SaveData(data){
        
    }

    InitTable(){

    }

    Close(){

    }

    ClearTable(){
        this.GetTableBodyEl().empty();
        this.m_Data = Array();
    }

    AddTableInfoRow(msg){        
        this.GetTableBodyEl().append(`
            <tr info>
                <td colspan="${ this.GetTableTheadEl().find("th").length }">${ msg }</td>
            <tr>
        `);
    }

    AddTableRow(data){

    }

    OnClickRow(event, data){
        var el = $(event.currentTarget);
        if(!el.hasClass("selected")){
            this.GetTableBodyEl().find(".selected").removeClass("selected");
            this.OnSelectRow(el, data);
        }
        else
            this.OnUnselectRow(el, data);
    }

    OnSelectRow(el, data){
        el.addClass("selected");
        this.m_TableRowSelected = data;

        this.UpdateEdit();
    }

    OnUnselectRow(el, data){
        el.removeClass("selected");
        this.m_TableRowSelected = null;

        this.UpdateEdit();
    }

    UpdateEdit(){

    }

    ShowMsgInfo(msg, autoClose = true){
        var el = this.GetMsgInfoEl();

        el.find(".content").text(msg);
        el.show();

        if(autoClose)
            el.animate({
                opacity: 1
            }, 5000, () => {
                this.HideMsgInfo();
            });

        el.find(".close").off("click");
        el.find(".close").on("click", () => { this.HideMsgInfo(); });
    }

    HideMsgInfo(){
        this.GetMsgInfoEl().find(".content").empty();
        this.GetMsgInfoEl().hide();
    }

    ShowContainerLoad(containerEl){
        if(containerEl.find(".container-load").length == 0)
            containerEl.append(`
                <div class="container-load">
                    <div class="tmb-list-load">
                </div>
            `);
    }

    HideContainerLoad(containerEl){
        containerEl.find(".info").remove();
    }

    GetEl(){
        return $("#dialogEditManual");
    }

    GetEditEl(){
        return $("#dialogEditManual").find(".edit");
    }

    GetEditSave(){
        return this.GetEditEl().find("#save");
    }

    GetTableBodyEl(){
        return $("#dialogEditManual").find(".table tbody");
    }

    GetTableTheadEl(){
        return $("#dialogEditManual").find(".table thead");
    }

    GetMsgInfoEl(){
        return this.GetEl().find("#msgInfo");
    }
}
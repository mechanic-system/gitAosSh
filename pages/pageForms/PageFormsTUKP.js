class PageFormsTUKP extends PageFormsBase{
    constructor(){
        super();
        this.m_DialogEditManual = new FormTUKPDialogEditManual();
    }

    IsEdit(){
        return (paramUser["role"] == "6" && paramUser["gr_id"] =="10") ? true : false;
    }

    InitListForms(){
        var role = paramUser["role"];

        if (role == "5") {
            this.GetListFormsEl().find("li[formId='400013']").closest(".item-group").remove();
            this.GetListFormsEl().find("li[formId='400014']").closest(".item-group").remove();
        }            
    }

    OpenDialogEditManual(){
        this.m_DialogEditManual.Open();
    } 
}

class FormTUKPDialogEditManual extends FormBaseDialogEditManual{
    constructor(){
        super({
            "title": "Ручной ввод данных",
            "width": 1200,
            "height": 800
        });        
    }

    Init(){
        this.InitSelectmenuYear();
        this.InitData();
        this.InitInput();
        this.OnUnselectPred();
    }

    InitSelectmenuYear(){
        var nowYear = new Date().getFullYear();
        this.GetYearEl().empty();

        for(var i = -2; i <= 0; i++){
            this.GetYearEl().append(`
                <option ${ (i == 0) ? "selected" : "" } value="${ nowYear + i }">${ nowYear + i }</option>"
            `);
        }
        
        this.GetYearEl().selectmenu({
            "open": () => this.OnOpenSelectmenu(),
            "close": () => this.OnCloseSelectmenu(),
            "change": () => this.OnChangeSelectmenu()
        });
    }

    OnOpenSelectmenu(){
        if(this.IsDataEdit())
            this.ShowMsgInfo(`В случае смены года, все изменения будут утрачены`, false);
    }

    OnCloseSelectmenu(){
        this.HideMsgInfo();
    }

    OnChangeSelectmenu(){
        if(this.m_SelectedItem != null)
            this.OnUnselectPred();
        this.InitData();
    }

    InitData(){
        var year = this.GetSelectedYear();
        if(!year)
            return;

        this.GetPredsEl().empty();        
        this.ShowContainerLoad(this.GetPredsEl());
        
        $.ajax({
            type: "POST", 
            url:  '/?method=getPredsPerformance',
            data: { "year": year }
        })
        .always((data, e, l) => {
            this.HideContainerLoad(this.GetPredsEl());

            if(data && Array.isArray(data["data"])){
                this.m_Data = data["data"];
                this.UpdateContent();
            }                
        });
    }

    InitInput(){
        this.GetEditEl().find("input").on("input", (event) => { this.OnInput($(event.currentTarget)); });
    }

    OnInput(el){
        var value = el.val();
        if(this.Validate(value)){
            this.HideMsgInfo();
            this.SetDataEdit(el.attr("param"), value);
        }
        else{
            var valueEdit = this.GetDataEditParam(el.attr("param")),
                charError = value.replace(/[0-9]*/g, "");

            el.val(valueEdit);

            this.ShowMsgInfo(`Недопоустимый символы: "${ charError }". Можно вводить только цифры.`);
        }
    }

    Validate(value){
        var pattern = new RegExp(/^[0-9]*$/);
        return pattern.test(value);
    }

    SetDataEdit(key, value){
        super.SaveDataEdit();
        
        //Элемент ранее не редактировался
        if(!this.m_SelectedItem["edit"])
            this.m_SelectedItem["edit"] = new Object();            

        if((this.m_SelectedItem[key] || "") == value)
            delete this.m_SelectedItem["edit"][key];
        else
            this.m_SelectedItem["edit"][key] = value;

        if(Object.keys(this.m_SelectedItem["edit"]).length == 0){
            delete this.m_SelectedItem["edit"];
            this.GetPredsEl().find(".selected > img").addClass("hidden");
        }
        else
            this.GetPredsEl().find(".selected > img").removeClass("hidden");
    }

    GetDataEditParam(param){
        if(!this.m_SelectedItem["edit"])
            return null;
        
        return this.m_SelectedItem["edit"][param];
    }

    UpdateContent(){
        this.GetPredsEl().empty();

        if(Array.isArray(this.m_Data)){
            if(this.m_Data.length == 0)
                this.ShowListItemInfo("Нет данных");
            else
                this.m_Data.forEach(item => {
                    this.AddPredEl(item);
                });
        }
    }

    AddPredEl(data){
        var el = $(`
            <div class="item-group border-bottom">
                <ul>
                    <li class="item" value="${ data["pred_id"] }"><span>${ data["pred_name"] }</span><img  class="hidden" src="logo/dot.png"/></li>
                </ul>
            </div>
        `);

        el.find(".item").on("click", (event) => { this.OnClickPredEl($(event.currentTarget), data); });

        this.GetPredsEl().append(el);
    }

    ShowListItemInfo(text){
        var el = $(`
            <div class="item-group border-bottom info">
                <ul>
                    <li class="item no-hover"><span>${ text }</span></li>
                </ul>
            </div>
        `);

        this.GetPredsEl().append(el);        
    }

    HideListItemInfo(){
        this.GetPredsEl().find(".info").remove();
    }

    OnClickPredEl(el, data){
        if(el.hasClass("selected"))
            return;

        if(this.m_SelectedItem != null){
            this.GetPredsEl().find(".selected").removeClass("selected");
            this.OnUnselectPred();
        }
        
        el.addClass("selected");
        this.OnSelectPred(data);
    }

    OnSelectPred(data){
        this.m_SelectedItem = data;

        this.GetSelectedPredEl().html(data["pred_name"]);
        
        this.GetEditEl().find("input").removeAttr("disabled");

        $.map(this.GetEditEl().find("input"), item =>{
            var param = $(item).attr("param");
            if(data["edit"] !== undefined && data["edit"][param] !== undefined)
                $(item).val(data["edit"][param] || "");
            else
                $(item).val(data[param] || "");
        });
    }

    OnUnselectPred(){
        this.m_SelectedItem = null;

        this.GetSelectedPredEl().html(`<span style="color: red">Необходимо выбрать дистанцию</span>`);

        this.GetEditEl().find("input").val("");
        this.GetEditEl().find("input").attr("disabled", "disabled");
    }

    IsDataEdit(){
        return this.GetDataEdit().length > 0;
    }

    GetDataEdit(){
        var arr = Array();

        this.m_Data.forEach(item => {
            if(item["edit"] != undefined){
                var dt = {
                    "pred_id": item["pred_id"],
                    "year": this.GetSelectedYear()
                };
                Object.assign(dt, item["edit"]);
                arr.push(dt);                
            }
        });

        return arr;
    }

    SaveDataEdit(){
        var dataEdit = this.GetDataEdit();
        if(dataEdit.length == 0){
            this.ShowMsgInfo("Изменений нет");
            return;
        }

        showPreloader("Сохранение...");

        $.ajax({
            type: "POST", 
            url:  '/?method=savePredsPerformance',
            data: { "data_edit": dataEdit }
        })
        .always((data, e, l) => {
            hidePreloader();

            if(data && data["result"] == "ok"){
                this.ApplayDataEdit();
                this.ShowMsgInfo("Сохранено!");
            }                
            else
                this.ShowMsgInfo(data["error"] || "Ошибка сохранения!");
        });
    }

    ApplayDataEdit(){
        this.m_Data.map(item =>{
            if(item["edit"] !== undefined){
                Object.keys(item["edit"]).forEach(key => {
                    item[key] = item["edit"][key];
                });
            }            
        });
        this.ClearDataEdit();
    }

    ClearDataEdit(){
        this.GetPredsEl().find(".item > img").addClass("hidden");

        this.m_Data.map(item =>{
            delete item["edit"];
        });
    }

    GetSelectedYear(){
        return getSelectmenuVal(this.GetYearEl());
    }
    
    Close(){
        this.GetYearEl().selectmenu("destroy");
    }

    GetFaultEl(){
        return this.GetEl().find("#fault");
    }

    GetFaultDelayEl(){
        return this.GetEl().find("#faultDelay");
    }

    GetViolationEl(){
        return this.GetEl().find("#violation");
    }

    GetViolationDelayEl(){
        return this.GetEl().find("#violationDelay");
    }

    GetYearEl(){
        return this.GetEl().find("#year");
    }

    GetSelectedPredEl(){
        return this.GetEl().find("#selectedPred");
    }
    
    GetPredsEl(){
        return this.GetEl().find("#preds");
    }

    GetEditEl(){
        return this.GetEl().find(".edit");
    }
}
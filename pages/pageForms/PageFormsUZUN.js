class PageFormsUZUN extends PageFormsBase{
    constructor(){
        super();
        this.m_DialogEditManual = new FormUZUNDialogEditManual();
    }

    IsEdit(){
        return (paramUser["role"] == "6" && (paramUser["gr_id"] =="10" || paramUser["gr_id"] =="7")) ? true : false;
    }

    OpenDialogEditManual(){
        this.m_DialogEditManual.Open();
    }    
}

class FormUZUNDialogEditManual extends FormBaseDialogEditManual{
    constructor(){
        super({
            "title": "Ручной ввод данных",
            "width": 1200,
            "height": 800
        });
    }

    Init(){
        this.InitTree();
    }

    InitTree(){
        this.GetTreeEl().fancytree({
            checkbox: 'radio',
            selectMode: 1,            
            clickFolderMode: 4,
            icon: false,
            focusOnSelect: true,
            autoScroll: true,
            nodata: "Нет данных",
            source: {
                type: "POST",
                url: "/?method=getUZUNTreeUser"
            },
            select: (event, data) => {
                if(data["node"]["selected"] === true){
                    this.m_SelectedItem = data["node"]["data"];
                    this.InitTable();
                }
                else{
                    this.m_SelectedItem = null;
                    this.ClearTable();
                }
            }
        });
    }

    InitTable(data){
        this.ClearTable();        
        this.AddTableInfoRow("Загрузка...");

        $.ajax({
                type: "POST",
                url:  "/?method=getUZUNThemeEvaluation",
                data: this.m_SelectedItem
            })
        .always((data, e, l) => {
            this.ClearTable();

            if(data && data["data"]){
                if(data["data"].length > 0)
                    data["data"].forEach(item => {
                        this.AddTableRow(item);
                    });
                else
                    this.AddTableInfoRow("Нет данных");
            }
        });
    }

    AddTableRow(data){
        this.m_Data.push(data);

        var rowEl = $(`<tr class="select-row"></tr>`);
            
        //Наименование полей
        $.map(this.GetTableTheadEl().find("th"), (el) => {
            var name = $(el).attr("value"),
                value = (data[name] !== undefined && data[name] !== null) ? data[name] : "";

            if(name == "evaluation"){
                rowEl.append(`<td style="display: flex;"><input value="${ value }" class="ui-widget ui-state-default ui-corner-all" type="text"></td>`);
                rowEl.find("input").on("input", (event)=> { this.OnThemeInput($(event.currentTarget), data); });
            }
            else
                rowEl.append(`<td>${ value }</td>`);
        });

        this.GetTableBodyEl().append(rowEl);
    }

    OnThemeInput(el, data){
        var value = el.val(),
            bValidateNumber = this.ValidateNumber(value),
            bValidateValue = this.ValidateValue(value);

        if(!value || bValidateNumber && bValidateValue){
            this.HideMsgInfo();
            this.SetDataEdit(data, value);
        }
        else{
            if(!bValidateNumber)
                this.ShowMsgInfo(`Недопоустимый символы: "${ value.replace(/[0-9]*/g, "") }". Можно вводить только цифры.`);
            else
                this.ShowMsgInfo(`Оценка не должна быть больше 100`);

            el.val(this.GetDataEditParam(data));
        }
    }

    Validate(value){
        return this.ValidateNumber(value) && this.ValidateValue(value);
    }

    ValidateNumber(value){
        var pattern = new RegExp(/^[0-9]*$/);
        return pattern.test(value);
    }

    ValidateValue(value){
        return Number.parseInt(value) <= 100;
    }
    
    SetDataEdit(data, value){
        super.SaveDataEdit();
        //Элемент ранее не редактировался
        if(!data["edit"])
            data["edit"] = new Object();

        if((data["evaluation"] || "") == value)
            delete data["edit"];
        else
            data["edit"]["evaluation"] = value;
    }

    GetDataEditParam(data){
        if(!data["edit"])
            return null;
        
        return data["edit"]["evaluation"];
    }

    Close(){
        this.ClearTable();
        this.GetTreeEl().fancytree("destroy");        
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
            url:  '/?method=saveUZUNThemeEvaluation',
            data: { "data_edit": dataEdit }
        })
        .always((data, e, l) => {
            hidePreloader();

            if(data && data["result"] == "ok"){
                this.ApplayDataEdit();
                this.ShowMsgInfo("Сохранено!");
            }
            else
                this.ShowMsgInfo(data["error"] || "Ошибка сохранения");
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
        this.GetTableBodyEl().find(".td > img").addClass("hidden");

        this.m_Data.map(item =>{
            delete item["edit"];
        });
    }

    GetDataEdit(){
        var arr = Array();

        this.m_Data.forEach(item => {
            if(item["edit"] != undefined){
                var dt = {
                    "plan_year_id": item["plan_year_id"],
                    "plan_user_id": item["plan_user_id"]
                };
                Object.assign(dt, item["edit"]);
                arr.push(dt);                
            }
        });

        return arr;
    }

    GetTreeEl(){
        return this.GetEl().find(".tree-users");
    }

    GetEditFioEl(){
        return this.GetEditEl().find("#fio");
    }

    GetEditThemeNameEl(){
        return this.GetEditEl().find("#themeName");
    }

    GetEditDateCompleteEl(){
        return this.GetEditEl().find("#dateComplete");
    }

    GetEditEvaluationEl(){
        return this.GetEditEl().find("#evaluation");
    }
}
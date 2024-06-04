class PageSelfTraining{
    constructor(){
        this.m_Data = new Object();        
        this.m_DataFilter = new Array();
        this.m_Navigation = new Array();
        this.m_SelectedItem = null;
        this.m_WindowWebClient = null;
        this.m_bWebClientStarting = false;
        this.m_AjaxMaterials = null;
        this.m_TimerSearch = null;
    }

    Init(){
        this.m_Data = {
            "children": new Array(),
            "page": 0,
            "loaded": "true"
        };
        this.m_Navigation.push(this.m_Data);

        this.InitEvent();
        this.LoadMaterials(this.m_Data);
    }

    InitEvent(){
        // this.GetHeaderCaptionTextEl().on("click", (event) => {
        //     if(this.m_Navigation.length > 0){
        //         this.m_Navigation = new Array();
        //         this.GetContantCardsEl().empty();
        //         this.GetAosListEl().empty();
        //         this.UpdateNavigationEl();
        //         this.ShowDataItemsEl();
        //     }
        // });
        this.GetAosListEl().on("scroll", (event) => { this.OnListScroll(); });
        this.GetSearchEl().on("input", (event) => { this.OnSearchInput(); });
        this.GetFormSearch().on("reset", (event) => this.ResetSearch());
        this.GetIframeEl().on("load", (event) => {
            this.OnLoadWebClient();
        });
        this.GetBtnBack().on("click", (event) => {
            if(this.m_bWebClientStarting == true || this.m_WindowWebClient != null && this.m_WindowWebClient["AOSCLIENT"]){
                if(this.m_bWebClientStarting == false)
                    this.m_WindowWebClient["AOSCLIENT"].OpenMenu("exit");
                return;
            }

            this.GetSearchEl().val("");

            if(this.m_SelectedItem != null)
                this.UnselectListItem();

            if(this.m_Navigation.length > 1){
                this.m_Navigation.pop();
                this.UpdateNavigationEl();
                this.ShowNavigationLastItem();
            }   
        });        
    }

    OnSearchInput(){
        this.GetBtnResetEl().show();
        
        if(this.m_TimerSearch != null)
            clearTimeout(this.m_TimerSearch);

        this.m_TimerSearch = setTimeout(() => {
            this.m_TimerSearch = null;

            var lastItem = this.GetNavigationLastItem();
            if(lastItem != null && lastItem["id"] == "search"){
                this.m_Navigation.pop();
                this.UpdateNavigationEl();
            }

            if(this.GetSearchEl().val()){       
                lastItem = this.GetNavigationLastItem();             
                var data = {"filter": this.GetSearchEl().val()};
    
                if(lastItem != null)
                    data["id"] = lastItem["id"];        
                
                this.SearchMaterails(data);
            }
            else{
                this.ShowNavigationLastItem();
            }
        }, 1500);
    }

    ResetSearch(){
        if(this.m_AjaxMaterials !== null) {
            this.m_AjaxMaterials.abort();
        }
        var lastItem = this.GetNavigationLastItem();
        if(lastItem != null && lastItem["id"] == "search"){
            this.m_Navigation.pop();
            this.UpdateNavigationEl();
        }
        this.ShowNavigationLastItem();
        this.GetBtnResetEl().hide();        
    }

    OnLoadWebClient(){ 
        var timer = setInterval(() => {
            this.InitWebClient();
            if(this.m_WindowWebClient)
                clearInterval(timer);
        }, 5000);
    }

    InitWebClient(){
        for(var i = 0; i < window.frames.length; i++){
            if(window.frames[i].AOSCLIENT){
                this.m_WindowWebClient = window.frames[i];                
                this.m_WindowWebClient["JSOPENED"] = true;
                this.m_bWebClientStarting = false;
                window.frames[i].AOSCLIENT.EventBeforeClose = () => { this.OnWebClientClose(); }                
            }
        }
    }

    OnWebClientClose(){
        this.m_WindowWebClient = null;
        this.GetIframeEl().attr("src", "");
        this.GetContentIframeEl().hide();
        this.GetContentCardsEl().show();
    }

    OnListScroll(){
        var el = this.GetAosListEl(),
            elHeight = el.innerHeight(),
            scTop = el.scrollTop(),
            scHeight = el.get(0).scrollHeight;

        //Подгрузка начинается при приближении к концу списка на расстояние 5% от видимой области
        if(scHeight - scTop <= (elHeight * 1.05) && this.m_AjaxMaterials == null){
            var lastItem = this.GetNavigationLastItem();
            if(lastItem != null && lastItem["loaded"] !== "true")
                this.LoadMaterials(lastItem);
        }
    }

    SearchMaterails(data){
        if(this.m_AjaxMaterials != null)
            this.m_AjaxMaterials.abort();

        this.GetAosListEl().empty();
        this.ShowContainerBtnLoad();

        this.m_AjaxMaterials = $.ajax({
            type: "POST",
            url:  '/?object=SelfTraining&method=SearchMaterials',
            data: data 
        })
        .always((dt, e, l) => {
            this.m_AjaxMaterials = null;

            this.HideContainerBtnLoad();

            if(dt && Array.isArray(dt["data"])){
                var dataFilter = {
                    "id": "search",
                    "name": "Результат поиска: " + dt["data"].length,
                    "loaded": "true",
                    "children": dt["data"]
                };
                
                this.m_Navigation.push(dataFilter);
                this.UpdateNavigationEl();
                this.ShowNavigationLastItem();
            }
            else
                this.ShowContainerBtnInfo("Нет данных");             
        });
    }

    LoadMaterials(data){        
        if(data && data["page"] > 0)
            this.ShowContainerBtnLoadPage();
        else
            this.ShowContainerBtnLoad();

        if(this.m_AjaxMaterials != null)
            this.m_AjaxMaterials.abort();

        var dataPost = data ? { "id": data["id"], "page": data["page"] + 1 } : new Object();

        this.m_AjaxMaterials = $.ajax({
            type: "POST",
            url:  '/?object=SelfTraining&method=GetMaterials',
            data: dataPost
        })
        .always((dt, e, l) => {
            this.m_AjaxMaterials = null;

            this.HideContainerBtnInfo();
            this.HideContainerBtnLoad();

            if(dt && Array.isArray(dt["data"]) && dt["data"].length > 0){
                data["page"] += 1;

                dt["data"].forEach(item => { 
                    item["page"] = 0;
                    item["children"] = new Array();

                    data["children"].push(item);

                    this.AddListItemEl(item);
                });
            }
            else{
                //Все страницы были загружены
                if(data["page"] != 0)
                    data["loaded"] = "true";
                else
                    this.ShowContainerBtnInfo("Нет данных");
            }                
        });
    }

    LoadMaterialsInfo(data){
        this.ShowContentInfoLoad();

        if(this.m_AjaxMaterials != null)
            this.m_AjaxMaterials.abort();

        this.m_AjaxMaterials = $.ajax({
            type: "POST",
            url:  '/?object=SelfTraining&method=GetMaterials',
            data: { "id": data["id"] }
        })
        .always((dt, e, l) => { 
            this.m_AjaxMaterials = null;

            this.HideContentInfoLoad();            

            if(dt && Array.isArray(dt["data"]) && dt["data"].length > 0){
                data["children"] = dt["data"];
                data["loaded"] = "true";
                this.ShowSelectedItemInfo();
            }
            else
                this.ShowContentInfo("Нет данных");
        });
    }

    AddDataFilterItem(data){
        this.m_DataFilter.push(data);        
        this.AddListItemEl(data);
    }

    ShowSelectedItemInfo(){
        this.HideContents();
        this.GetContainerHidden().show();
        this.GetContentCardsEl().show();

        var dataId = this.ParseItemId(this.m_SelectedItem["id"]);
        if(dataId["attribute_id"] == "13" && dataId["tool_id"])
            this.GetContainerCardsEl().append(this.GetTemplateContentEl(this.m_SelectedItem));
        else if(Array.isArray(this.m_SelectedItem["children"]))
            this.m_SelectedItem["children"].forEach(item => {
                this.GetContainerCardsEl().append(this.GetTemplateContentEl(item));
            });        
    }

    OnClickListItem(event, data){
        if($(event.currentTarget).hasClass("selected"))
            return;

        if(this.m_bWebClientStarting == true || this.m_WindowWebClient != null && this.m_WindowWebClient["AOSCLIENT"]){
            if(this.m_bWebClientStarting == false)
                this.m_WindowWebClient["AOSCLIENT"].OpenMenu("exit");
            return;
        }

        if(this.m_SelectedItem)
            this.UnselectListItem();

        if(data["is_last"] == "true")
            this.SelectListItem(data);
        else
            this.NextListItem(data);
    }

    SelectListItem(data){
        if(this.m_SelectedItem)
            this.GetAosListEl().find(".selected").click();

        this.m_SelectedItem = data;
        this.GetAosListEl().find(`[value="${ data["id"] }"]`).addClass("selected");
        this.GetContentCardsTitleEl().append(`
            <div class="header-caption-text" caption="${ data["name"] }">
                <div class="cards-title">${ data["name"] }</div>
            </div>
        `);

        if(data["loaded"] == "true")
            this.ShowSelectedItemInfo();
        else
            this.LoadMaterialsInfo(data);
    }

    NextListItem(data){
        this.m_Navigation.push(data);
        this.UpdateNavigationEl();

        if(data["children"].length > 0)
            this.ShowNavigationLastItem();
        else{
            this.GetAosListEl().empty();
            this.LoadMaterials(data);
        }
    }

    UnselectListItem(){        
        this.GetContainerHidden().hide();
        this.GetContainerCardsEl().empty();
        this.GetContentCardsTitleEl().empty();

        this.GetAosListEl().find(`[value="${ this.m_SelectedItem["id"] }"]`).removeClass("selected");

        this.m_SelectedItem = null;
    }

    //Обновить панель навигации
    UpdateNavigationEl(){
        this.GetHeaderCaptionEl().children().not(":first").remove();

        this.m_Navigation.forEach((item, index) => {
            if(index != 0){
                this.GetHeaderCaptionEl().append($(`
                    <div class="header-caption-text" caption="${ item["name"] }">
                        <div class="pic-arrow-black pic-st-arrow rotate-270"></div>
                        <div class="cards-title">${ item["name"] }</div>
                    </div>
                `));
            }
        });

        //Заменить второй элемент если третий не помещается на экран
        if(this.m_Navigation.length == 3){
            var elWidth = this.GetHeaderCaptionEl().innerWidth(),
                slWidth = this.GetHeaderCaptionEl().get(0).scrollWidth;

            if(slWidth > elWidth){
                this.GetHeaderCaptionEl()
                    .find(".header-caption-text")
                    .eq(0)
                    .find(".cards-title")
                    .text("...");
            }
        }

        if(this.m_Navigation.length > 1)
            this.GetBtnBack().removeAttr("disabled");
        else
            this.GetBtnBack().attr("disabled", "disabled");
    }

    ShowNavigationLastItem(){
        var data = this.GetNavigationLastItem();
        if(data == null)
            return;

        this.GetAosListEl().empty();

        if(Array.isArray(data["children"])){
            data["children"].forEach(item => {
                this.AddListItemEl(item);
            });

            if(data["children"].length == 0)
                this.ShowContainerBtnInfo("Нет данных");
        }
    }

    //Дабавление элемента на страницу
    AddListItemEl(data){
        this.GetAosListEl().append(this.GetTemplateBtnEl(data));
    }

    ShowContainerBtnInfo(text){        
        this.GetAosListEl().append(`
            <div class="item-group border-bottom info">
                <ul>
                    <li class="item center no-hover">
                        <span>${ text }</span>
                    </li>
                </ul>
            </div>
        `);
    }

    ShowContainerBtnLoadPage(){
        this.GetAosListEl().append(`
            <div class="item-group info">
                <ul>
                    <li class="item center no-hover load">
                        <div class="tmb-list-load">
                    </li>
                </ul>
            </div>
        `);
    }

    HideContainerBtnInfo(){        
        this.GetAosListEl().find(".info").remove();
    }
    
    ShowContainerBtnLoad(){        
        if(this.GetAosListEl().find(".container-load").length == 0)
            this.GetAosListEl().append(`            
                <div class="container-load">
                    <div class="tmb-list-load">
                </div>
            `);
    }

    HideContainerBtnLoad(){
        this.GetAosListEl().find(".container-load").remove();
    }

    ShowContentInfo(text, buttons){
        this.HideContents();
        this.GetContainerHidden().show();
        this.GetContentInfoEl().show();

        this.GetContentInfoEl().append(`
            <span>${ text }</span>
        `);        

        if(Array.isArray(buttons)){
            buttons.forEach(item => {
                var elButton = $(`
                    <button>${ item["name"] }</button>                    
                `);

                if(item["classes"])
                    elButton.addClass(item["classes"]);

                if(item["action"])
                    elButton.on("click", item["action"]);

                this.GetContentInfoEl().append(elButton);
            });
        }
    }
        
    HideContentInfo(){
        this.GetContentInfoEl().hide();
        this.GetContentInfoEl().empty();
    }

    ShowContentInfoLoad(){
        this.HideContents();
        this.GetContainerHidden().show();
        this.GetContainerHidden().append(`            
            <div class="container-load">
                <div class="tmb-list-load">
            </div>
        `);
    }

    HideContentInfoLoad(){
        this.GetContainerHidden().hide();
        this.GetContainerHidden().find(".container-load").remove();
    }

    GetNavigationLastItem(){
        if(this.m_Navigation.length > 0)
            return this.m_Navigation[this.m_Navigation.length - 1];
        else
            return null;
    }

    ParseItemId(id){
        var arr = id.split("_"),
            data = {
                "attribute_id": null,
                "learning_node_id": null,
                "tool_id": null
            };

        if(arr.length > 0)
            data["attribute_id"] = arr[0];
        if(arr.length > 1)
            data["learning_node_id"] = arr[1];
        if(arr.length > 2)
            data["tool_id"] = arr[2];

        return data;
    }

    HideContents(){
        this.GetContentCardsEl().hide();
        this.GetContentIframeEl().hide();
        this.HideContentInfo();
    }

    GetAosListEl(){
        return this.GetEl().find(".aos-list");
    }

    GetContainerHidden(){
        return this.GetEl().find(".container-hidden");
    }

    GetContentCardsEl(){
        return this.GetEl().find(".content-cards");
    }

    GetContainerCardsEl(){
        return this.GetEl().find(".container-cards");
    }    

    GetContentInfoEl(){
        return this.GetEl().find(".content-info");
    }

    GetContentIframeEl(){
        return this.GetEl().find(".content-iframe");
    }

    GetIframeEl(){
        return this.GetEl().find("iframe");
    }
    
    GetSearchEl(){
        return this.GetEl().find("#searchSelfTraining");
    }

    GetBtnResetEl() {
        return this.GetEl().find('#btnSearchSelfTraining');
    }

    GetFormSearch() {
        return this.GetEl().find('#formSearchSelfTraining');
    }

    GetHeaderCaptionTextEl(){
        return this.GetEl().find("#headerCaptionText");
    }

    GetHeaderCaptionEl(){
        return this.GetEl().find(".container-title .title");
    }

    GetBtnBack(){
        return this.GetEl().find(".btn-back");
    }

    GetContentCardsTitleEl(){
        return this.GetEl().find(".container-cards-title");
    }

    GetEl(){
        return $("#pageSelfTraining");
    }

    GetTemplateBtnEl(data){
        var tmbClass = "",
            attributeId = this.ParseItemId(data["id"])["attribute_id"];

        if(attributeId == "11")
            tmbClass = "tmb-ec";
        else if(attributeId == "12")
            tmbClass = "tmb-instruct";
        else if(attributeId == "13")
            tmbClass = "tmb-study-tool";
        else if(attributeId == "17")
            tmbClass = "tmb-simulator";
        
        var contentEl = `<div>${ data["name"] }</div>`;
        if(data["count"] !== undefined)
            contentEl += `<div>Доступно: ${ data["count"] }</div>`;

        var el = $(`
            <div class="item-group border-bottom">
                <ul>
                    <li class="item center" value="${ data["id"] }">
                        <div class="pic-tmb ${ tmbClass }"></div>
                        <div class="content">${ contentEl }</div>
                        <img src="/logo/arrow_black.svg" class="rotate-270">
                    </li>
                </ul>
            </div>
        `);

        el.find(".item").on("click", (event) => { this.OnClickListItem(event, data); })

        return el;
    }

    GetTemplateContentEl(data){
        var attributeId = this.ParseItemId(data["id"])["attribute_id"];

        var el = $(`
            <div class= 'container-card-st' value="${data["id"] }">
                <div class= 'card-st'>
                    <div class="container-self-traineng-data">
                        <img class="st-courses-img" src="">
                        <div class="container-card-data">
                            <div class= 'card-title'>
                                ${ attributeId == "13" ? "Наименование:" : "Раздел:" }    
                                ${ data["is_ios"] == "true" ? "<img class='info' src='logo/info.svg'>" : "" }
                            </div>
                            <div class= 'container-e-courses-section'>
                                <div class= 'e-courses-section'>
                                    ${ data["name"] }
                                </div>                  
                            </div>                     
                            <div class="section-contents-title">
                                ${ attributeId == "13" ? "" : "Содержание раздела:" }
                            </div>
                            <div class="container-step">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        if(data["path_preview"]){
            el.find(".st-courses-img").attr("src", data["path_preview"]);
            el.find(".st-courses-img").on("error", event => { 
                el.find(".st-courses-img").attr("src", this.GetPreviewDefault(data));
            });
        }
        else
            el.find(".st-courses-img").attr("src", this.GetPreviewDefault(data));

        if(data["run"] == "true")
            el.find(".container-e-courses-section").append(`<button class="button-action" value="${ data["id"] }"> Запустить </button>`);

        el.find(".card-title > img").on("click", event => { this.OpenDialogInfoIos(data) });
        el.find("button").on("click", event => { this.OnClickBtnRun(data); })

        var attributeId = this.ParseItemId(data["id"])["attribute_id"],
            steps = new Array();

        if(attributeId == "11" || attributeId == "12")
            steps = data["steps"];        
        else if(attributeId == "17")
            steps = data["faults"];
        else if(attributeId == "13"){
            steps = [{
                "name": "Владелец: " + data["pred_name"]
            },{
                "name": "Файл: " + data["file_name"],
                "download": data["download"]
            }];
        }
            
        steps.forEach(item => {
                var stepEl = $(`
                    <div class="step-name">
                        <div class="step-title">${ item["name"] }</div>
                    </div>
                `);

                if(item["run"] == "true"){
                    stepEl.append(`<button class="button-action" value="${ data["id"] }"> Запустить </button>`);
                    stepEl.find("button").on("click", event => { this.OnClickBtnRun(item); });
                }
                else if(item["download"] == "true"){
                    stepEl.append(`<button class="button-action" value="${ data["id"] }"> Скачать </button>`);
                    stepEl.find("button").on("click", event => { this.OnClickBtnDownload(data); });
                }

                el.find(".container-step").append(stepEl);
            });

        return el;
    }

    GetPreviewDefault(data){
        var pref = this.ParseItemId(data["id"])["attribute_id"];

        if(data["simulator_type_id"] >= 2 && data["simulator_type_id"] <= 5)
            pref += "_" + data["simulator_type_id"];

        return `logo/${ pref }_default.png`;
    }

    GetTemplateContentBlockEl(){

    }

    OnClickBtnDownload(data){
        var toolId = this.ParseItemId(data["id"])["tool_id"];
        if(toolId)
            nsiToolDownloadFile(toolId);
    }

    OpenDialogInfoIos(data){
        var imgEl = data["path_preview"] 
            ? `<img src="${ data["path_preview"]}"/>`
            : "";

        var contentEl = $(`
            <div>
                <div class="dialog-info-ios aos-scroll aos-scroll-darkgray phone-scroll-invisible">
                    <p>Для запуска тренажера вам необходимо:</p>
                    <p>1. Подключить плату, изображенную на картинке, к прибору</p>                        
                    <p>2. Подключить прибор к данному компьютеру</p>
                    <p>3. Выбрать интересующий вас раздел и нажать кнопку «Запустить».</p>
                    <p>${ imgEl }</p>                    
                </div>
            </div>
        `);

        contentEl.dialog({
            autoOpen: true,        
            modal: true,
            draggable: false,
            resizable: false,
            width: "auto",
            height: "auto",
            dialogClass: "no-close",
            title: "Начало работы с тренажером",
            classes: {
                "ui-dialog": "aos-dialog-style"
            },
            buttons: [{
                    id: 'cansel',
                    type: 'button',
                    text: "Закрыть",
                    click: () => {
                        contentEl.dialog("close");
                    }
                }
            ],
            close: () => {    
                contentEl.dialog("destroy");
            }
        });
    }

    OnClickBtnRun(data){
        if(data["simulator_type_id"] == "8")
            data["engine_type"] = "scorm";
        else if(data["simulator_type_id"])
            data["engine_type"] = "simulator";
        else
            data["engine_type"] = "self-preparition";

        var obj = new Object;
        obj["client"] = new Object;
        obj["client"]["url"] = "/start_selective";
        obj["client"]["data"] = new Object;
        obj["client"]["data"]["user_id"] = paramUser["userid"];
        obj["client"]["data"]["server_id"] = paramUser["serverid"];
        obj["client"]["data"]["node_id"] = data["learning_node_id"];
        obj["client"]["data"]["tool_id"] = data["tool_id"];
        obj["client"]["data"]["program_id"] = data["program_id"] || 1;
        obj["client"]["data"]["sim_view_id"] = data["simulator_type_id"];
        obj["client"]["data"]["engine_type"] = data["engine_type"];            

        if(IsRunWebClient(data)){
            this.GetContentCardsEl().hide();
            this.ShowContentInfo(`Запустить </br> "${ data["name"] }"`, [
                {
                    "name": "В новом окне",
                    "action": () => {
                        this.HideContentInfo();
                        this.GetContentCardsEl().show();
                        RunWebClient(obj["client"]["data"]);
                    }
                },
                {
                    "name": "В текущем окне",
                    "action": () => {                        
                        this.HideContentInfo();
                        this.GetContentIframeEl().show();
                        RunWebClient(obj["client"]["data"], this.GetIframeEl());
                        this.m_bWebClientStarting = true;
                    }
                },
                {
                    "name": "Назад",
                    "classes": "button-back",
                    "action": () => {
                        this.HideContentInfo();
                        this.GetContentCardsEl().show();
                    }
                }
            ]);
        }
        else
            CUStartPlan(obj, null, null);
    }
}
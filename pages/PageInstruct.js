var PageInstruct = class PageInstruct{
    constructor(){
        this.m_WindowWebClient = null;
    }

    Init(){
        this.InitTable();
    }

    InitTable(){
        this.ClearContainer();
        this.ShowContainerLoad();

        $.ajax({
            type: "POST",
            url:  '/?method=getInstruct',
            dataType: "json" 
        })
        .always((data, e, l) => {   
            this.HideContainerLoad();

            if(Array.isArray(data) && data.length > 0){
                data.forEach(item => { this.AddCard(item); });
            }
            else
                this.ShowInfo("Нет данных");            
        });
    }

    AddCard(data){
        var el = this.GetCardTempEl(data);
        el.find("button").on("click", (event) => { this.ActionCard($(event.currentTarget), data); });

        this.GetContainerEl().append(el);
    }

    ShowInfo(text){
        this.GetContainerEl().append(`
            <div class="card border-bottom info">
                <div style="margin-bottom: var(--margin);" >${ text }</div>
            </div>
        `);
    }

    HideInfo(){
        this.GetContainerEl().find(".info").remove();
    }

    ShowContainerLoad(){
        this.GetContainerEl().append(`
            <div class="container-load">
                <div class="tmb-load-green">
            </div>
        `);
    }

    HideContainerLoad(){        
        this.GetContainerEl().find(".container-load").remove();
    }

    ActionCard(el, data){
        if(data["status"] == "1" || data["status"] == "2"){
            this.RunClient(data);
        }        
    }

    RunClient(data){
        var obj = new Object;
        obj["server"] = new Object;
        obj["server"]["url"] = "/?method=getInstructPlan";

        obj["server"]["data"] = new Object;        
        obj["server"]["data"]["id"] = JSON.stringify(data["id"]);
        
        obj["client"] = new Object;
        obj["client"]["url"] = "/start_selective";
        obj["client"]["data"] = new Object;
        obj["client"]["data"]["user_id"] = paramUser["userid"];
        obj["client"]["data"]["server_id"] = paramUser["serverid"];
        obj["client"]["data"]["schedule_id"] = null;
        obj["client"]["data"]["instruct_id"] = JSON.stringify(data["id"]);
        obj["client"]["data"]["engine_type"] = "instruct";

        if(IsRunWebClient(obj["client"]["data"]))
            this.m_WindowWebClient = RunWebClient(obj["client"]["data"]);
        else
            CUStartPlan(obj, 
                (data) => { 
                    // Обновление строки
                    if(data && data["instruct"]){
                        this.InitTable();
                    }
                },
                // Обнволение всего списка
                () => { 
                    this.InitTable();
                }
            );                     
    }

    ClearContainer(){
        this.GetContainerEl().empty();
    }

    GetEl(){
        return $("#pageInstruct");
    }

    GetContainerEl(){
        return this.GetEl().find(".container-cards");
    }

    GetCardTempEl(data){
        var el =  $(`
            <div class="card border-bottom">
                <div class="img">
                    <img src="/logo/tmb_instruct.svg">
                </div>
                <div class="container-content">
                    <div class="content">
                        <div class="description">
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Тип:</td>
                                        <td>${ data["type"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Назначен:</td>
                                        <td>${ data["date"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Окончен:</td>
                                        <td>${ data["ended"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Система:</td>
                                        <td>${ data["system"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Результат:</td>
                                        <td>${ data["eval"] != "" ? data["eval"] : "-" }</td>
                                    </tr>
                                </tbody>
                            </table>                            
                        </div>
                        <div class="name">
                            ${ data["name"] }
                        </div>
                    </div>
                    <div class="buttons">
                    </div>
                </div>
            </div>
        `);

        
        if(!data["aos_tool_id"] && data["status"] == "1")
            el.find(".buttons").append(`<div>Данный инструктаж доступен для прохождения только в системе «СДО»</div>`);
        else if(data["status"] == "1")
            el.find(".buttons").append(`<button class="button-action">Запустить</button>`);
        else if(data["status"] == "2")
            el.find(".buttons").append(`<button class="button-action">Продолжить</button>`);

        return el;
    }
}
class PageLearning{
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
            url:  '/?method=getStudy',
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
                <div class="tmb-list-load">
            </div>
        `);
    }

    HideContainerLoad(){        
        this.GetContainerEl().find(".container-load").remove();
    }

    ActionCard(el, data){
        if(data["status_id"] == "1" || data["status_id"] == "2"){
            this.RunClient(data);
        }        
    }

    RunClient(data){
        var obj = new Object;
        obj["server"] = new Object;
        obj["server"]["url"] = "/?method=getStatusPlan";

        obj["server"]["data"] = new Object;        
        obj["server"]["data"]["id"] = JSON.stringify(data["id"]);        

        obj["client"] = new Object;
        obj["client"]["url"] = "/start_edu";
        obj["client"]["data"] = new Object;
        obj["client"]["data"]["user_id"] = paramUser["userid"];
        obj["client"]["data"]["server_id"] = paramUser["serverid"];
        obj["client"]["data"]["schedule_id"] = data["schedule_id"];
        obj["client"]["data"]["engine_type"] = "plan";

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
        return $("#pageLearning");
    }

    GetContainerEl(){
        return this.GetEl().find(".container-cards");
    }

    GetCardTempEl(data){
        var el =  $(`
            <div class="card border-bottom">
                <div class="img">
                    <img src="/logo/tmb_ec.svg">
                </div>
                <div class="container-content">
                    <div class="content">
                        <div class="description">
                            <table>
                                <tbody>
                                    <tr>
                                        <td>План:</td>
                                        <td>${ data["name"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Режим:</td>
                                        <td>${ data["type"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Выполнить до:</td>
                                        <td>${ data["to"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Статус:</td>
                                        <td>${ data["status"] || "-" }</td>
                                    </tr>
                                    <tr>
                                        <td>Результат:</td>
                                        <td>${ data["eval"] != "" ? data["eval"] : "-" }</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="learning-node">
                            
                        </div>
                    </div>
                    <div class="buttons">
                    </div>
                </div>
            </div>
        `);
        
        if(Array.isArray(data["learning_node"])){
            el.find(".learning-node").append(`
                <div><b>Состав программы:</b></div>
            `);

            data["learning_node"].forEach(item => {
                el.find(".learning-node").append(`
                    <div>${ item["name"] }</div>
                `);
            });
        }
        if(data["status_id"] == "1")
            el.find(".buttons").append(`<button class="button-action">Запустить</button>`);
        else if(data["status_id"] == "2")
            el.find(".buttons").append(`<button class="button-action">Продолжить</button>`);

        return el;
    }
}
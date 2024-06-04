class PageStudyPlanning {
  constructor() {
    this.m_TabClasses = new PageStudyPlanningTabClasses();
    this.m_TabEditClass = new PageStudyPlanningTabEditClass();

    this.m_TabClasses.EventOpenEditClass = (data) => { this.OpenTabEditClass(data); };
    this.m_TabEditClass.EventCloseEditClass = (data) => { this.OpenTabClasses(data); };
  }

  Init() {
    this.m_TabClasses.Open();
  }

  OpenTabEditClass(data) {
    this.m_TabClasses.Close();
    this.m_TabEditClass.Open(data ? data.class_id : undefined);
  }

  OpenTabClasses() {
    this.m_TabEditClass.Close();
    this.m_TabClasses.Open();
  }

  GetEl() {
    return $('#pageStudyPlanning');
  }
}

class PageStudyPlanningTabClasses {
  constructor() {
    this.m_Data = [];

    this.m_IsDataLoaded = false;

    this.m_SelectedClass = null;
    this.m_AjaxClasses = null;
    this.m_Filter = null;

    this.m_Page = 1;
    this.m_PageSize = 10;
    this.m_Sort = 'date';
  }

  Open() {
    this.GetEl().find('.container-tools button:not([action="add"])').hide();
    this.m_SelectedClass = null;

    this.GetEl().show();
    this.InitTable();
    this.InitEvent();
  }

  Close() {
    this.GetEl().hide();
  }

  InitTable() {
    this.ClearTable();
    // this.ShowTableRowLoad();
    this.LoadData();
  }

  LoadData() {
    if (this.m_Page == 1) { this.ShowTableLoad(); } else { this.ShowTableRowLoad(); }

    if (this.m_AjaxClasses != null) { this.m_AjaxClasses.abort(); }

    this.m_AjaxClasses = $.ajax({
      type: 'POST',
      url: '/?object=StudyPlanning&method=GetClasses',
      data: this.GetDataLoadParam(),
      dataType: 'json',
    })
      .always((dt, e, l) => {
        if (this.m_Page == 1) { this.HideTableLoad(); } else { this.HideTableRowLoad(); }

        this.m_AjaxClasses = null;

        if (Array.isArray(dt.data) && dt.data.length > 0) { this.m_Data = dt.data; }

        if (dt.data.length == 0 || dt.data.length < this.m_PageSize) { this.m_IsDataLoaded = true; }

        this.m_Data.forEach((item) => { this.AddTableRow(item); });

        if (!this.m_IsDataLoaded) { this.OnTableScroll(); }
      });
  }

  GetDataLoadParam() {
    return {
      page: this.m_Page,
      page_size: this.m_PageSize,
      sort: this.m_Sort,
      filter: this.m_Filter,
    };
  }

  InitEvent() {
    this.GetEl().find('.buttons > button').off('click');
    this.GetEl().find('.buttons > button').on('click', (event) => { this.OnButtonClick($(event.currentTarget)); });
    this.GetElTable().on('scroll', (event) => { this.OnTableScroll(); });
  }

  AddTableRow(data) {
    this.GetElTable().append(this.CreateElTableRow(data));
  }

  ShowTableLoad() {
    this.GetElTable().append(`            
            <div class="container-load">
                <div class="tmb-list-load">
            </div>
        `);
  }

  ShowTableRowLoad() {
    this.GetElTable().append(`            
            <div class="row-loader">
                <div class="container-load">
                    <div class="tmb-list-load">
                </div>
            </div>
        `);
  }

  HideTableLoad() {
    this.GetElTable().find('.container-load').remove();
  }

  HideTableRowLoad() {
    this.GetElTable().find('.container-load').parent().remove();
  }

  ClearTable() {
    this.m_Data = [];
    this.GetElTable().empty();
  }

  OnTableScroll() {
    const el = this.GetElTable();
    const elHeight = el.innerHeight();
    const scTop = el.scrollTop();
    const scHeight = el.get(0).scrollHeight;

    // Подгрузка начинается при приближении к концу списка на расстояние 5% от видимой области
    if (scHeight - scTop <= (elHeight * 1.05) && this.m_AjaxClasses == null && !this.m_IsDataLoaded) {
      this.m_Page += 1;
      this.LoadData();
    }
  }

  OnButtonClick(el) {
    const action = el.attr('action');
    console.log(action);
    if (action == 'add') { this.EventOpenEditClass(); } else if (action == 'add' || this.m_SelectedClass) { this.EventOpenEditClass(this.m_SelectedClass); }
  }

  EventOpenEditClass() {

  }

  CreateElTableRow(data) {
    const el = $(`
            <div class="row">
                <div>${data.name}</div>
                <div>
                    <div>Дата начала: ${data.date_begin ? formatDateForAOS(new Date(data.date_begin), false) : 'Не задана'}</div>
                    <div>Дата окончания: ${data.date_complete ? formatDateForAOS(new Date(data.date_complete), false) : 'Не задана'}</div>
                </div>
                <div>Режим: ${data.scheme_type_name}</div>
            </div>
        `);

    el.on('click', (event) => {
      if (el.hasClass('disabled')) { return; }

      if (el.hasClass('selected')) {
        el.removeClass('selected');
        this.GetEl().find('.container-tools button:not([action="add"])').hide();
        this.m_SelectedClass = null;
      } else {
        this.GetElTable().find('.selected').removeClass('selected');

        el.addClass('selected');
        this.GetEl().find('.container-tools button:not([action="add"])').show();
        this.m_SelectedClass = data;
      }
    });

    return el;
  }

  GetElTable() {
    return this.GetEl().find('#tableClasses');
  }

  GetEl() {
    return $('#tabClasses', '#pageStudyPlanning');
  }
}

class PageStudyPlanningTabEditClass {
  constructor() {
    this.m_Data = null;
    this.m_DataSchemeType = [];
  }

  Open(classId) {
    this.GetEl().show();

    this.InitDataDefault();
    this.InitSelectmenu();
    this.InitEvent();

    this.LoadDateSchemeType();
    if (classId) { this.LoadDate(classId); }
  }

  LoadDate(classId) {
    showPreloader('Загрузка...');

    $.ajax({
      type: 'POST',
      url: '/?object=StudyPlanning&method=GetClass',
      data: { class_id: classId },
      dataType: 'json',
    })
      .always((dt, e, l) => {
        hidePreloader();

        this.m_Data.name = dt.data.name;
        this.m_Data.date_start = dt.data.date_start;
        this.m_Data.date_end = dt.data.date_end;
        this.m_Data.scheme_type_id = dt.data.scheme_type_id;
        this.m_Data.arr_user = dt.data.arr_user;

        this.m_Data.arr_user.forEach((item) => {
          let arr = this.m_Data.arr_team.filter((itemF) => item.arr_team == itemF.arr_team);
          if (arr.length == 0 && item.team) { this.m_Data.arr_team.push({ team: item.team }); }

          if (Array.isArray(item.arr_task)) {
            item.arr_task.forEach((itemTask) => {
              arr = this.m_Data.arr_task.filter((itemF) => itemTask.task_id == itemF.task_id);
              if (arr.length == 0) { this.m_Data.arr_task.push(itemTask); }
            });
          }
        });

        this.UpdateEl();
      });
  }

  LoadDateSchemeType() {
    $.ajax({
      type: 'POST',
      url: '/?object=StudyPlanning&method=GetSchemeType',
      dataType: 'json',
    })
      .always((dt, e, l) => {
        this.m_DataSchemeType = dt.data;
        this.UpdateElSchemeType();
      });
  }

  Close() {
    this.GetElFieldName().find('input').val('');
    this.GetElFieldDateStart().find('input').val('');
    this.GetElFieldDateEnd().find('input').val('');

    this.GetElFieldUsers().find('.value').remove();
    this.GetElFieldTeams().find('.value').remove();
    this.GetElFieldTools().find('.value').remove();

    this.GetElSelectSchemeType().selectmenu('refresh');

    this.InitDataDefault();
    this.GetEl().hide();
  }

  InitData() {
    this.m_Data;
  }

  InitDataDefault() {
    this.m_Data = {
      arr_user: [],
      arr_team: [],
      arr_task: [],
    };
    this.m_DataSchemeType = [];
  }

  InitSelectmenu() {
    this.GetElSelectSchemeType().selectmenu({
      select: (event) => {

      },
    });
  }

  InitEvent() {
    this.GetEl().find('button, .icon-button').off('click');
    this.GetEl().find('button, .icon-button').on('click', (event) => { this.OnButtonClick($(event.currentTarget)); });
  }

  OnButtonClick(el) {
    const action = el.attr('action');
    let value = el.attr('value');

    if (value == undefined) { value = el.closest('.value').attr('value'); }

    console.log(action, value);
    if (action == 'close') { this.EventCloseEditClass(el); } else if (action == 'save') {
      if (this.m_Data.class_id) { this.SaveEdit(); } else { this.Add(); }
    } else if (action == 'addUser') { this.OpenDialogUser(); } else if (action == 'deleteUser' && value) { this.DeleteUser(value); } else if (action == 'addTool') { this.OpenDialogTool(); } else if (action == 'deleteTool' && value) { this.DeleteTool(value); } else if (action == 'addTeam') { this.AddTeam(); } else if (action == 'deleteTeam' && value) { this.DeleteTeam(value); } else if (action == 'editTeam' && value) {
      this.OpenDialogGeneral({
        type: 'team_user',
        team: value,
      });
    } else if (action == 'addTaskUser') {
      this.OpenDialogGeneral({
        type: 'task_user',
        arr_task: this.GetSelectedTasks(),
      });
    }
  }

  EventCloseEditClass() {

  }

  Add() {
    const data = this.GetDataSave();
    if (!this.ValidateDataSave(data)) {
      console.log('Не все поля заполнены');
      console.log(data);
      return;
    }

    showPreloader('Сохранение...');
    $.ajax({
      type: 'POST',
      url: '/?object=StudyPlanning&method=Add',
      data,
      dataType: 'json',
    })
      .always((dt, e, l) => {
        hidePreloader();

        // this.HideContainerLoad(this.GetElTableTools());
        // dt["data"].forEach(item => { this.AddTableToolsRow(item); });
      });
  }

  SaveEdit() {
    showPreloader('Сохранение изменений...');
    $.ajax({
      type: 'POST',
      url: '/?object=StudyPlanning&method=SaveEdit',
      data,
      dataType: 'json',
    })
      .always((dt, e, l) => {
        hidePreloader();

        // this.HideContainerLoad(this.GetElTableTools());
        // dt["data"].forEach(item => { this.AddTableToolsRow(item); });
      });
  }

  GetDataSave() {
    const data = new Object();

    data.name = this.GetElFieldName().find('input').val();
    data.scheme_type_id = this.GetElSelectSchemeType().val();
    data.date_start = this.GetElFieldDateStart().find('input').val();
    data.date_end = this.GetElFieldDateEnd().find('input').val();
    data.arr_user = this.m_Data.arr_user;

    return data;
  }

  ValidateDataSave(data) {
    const elError = [];

    if (!data.name || !data.name.trim()) { elError.push(this.GetElFieldName()); }
    if (!data.scheme_type_id) { elError.push(this.GetElFieldSchemeType()); }
    if (!data.date_start) { elError.push(this.GetElFieldDateStart()); }
    if (!data.date_end) { elError.push(this.GetElFieldDateEnd()); }
    if (!data.arr_user || data.arr_user.length == 0) {
      elError.push(this.GetElFieldUsers());
    }

    if (elError.length > 0) {
      elError.forEach((item) => {
        const color = item.css('color');
        item.css('color', 'red');
        item.animate({
          color,
        }, 8000);
      });
    }

    return elError.length == 0;
  }

  AddTeam() {
    if (!this.m_Data.arr_team) { this.m_Data.arr_team = []; }

    const { length } = this.m_Data.arr_team;
    const team = (length == 0) ? 1 : this.m_Data.arr_team[length - 1].team + 1;

    this.m_Data.arr_team.push({
      team,
    });

    this.UpdateElTeams();
  }

  DeleteTeam(teamId) {
    this.m_Data.arr_team = this.m_Data.arr_team.filter((item) => teamId != item.team);

    // Удалить бригаду у пользователей
    this.m_Data.arr_user = this.m_Data.arr_user.map((item) => {
      if (item.team == teamId) { delete item.team; }
      return item;
    });

    this.UpdateElUsers();
    this.UpdateElTeams();
  }

  DeleteUser(userId) {
    this.m_Data.arr_user = this.m_Data.arr_user.filter((item) => item.user_id != userId);

    this.UpdateElUsers();
  }

  DeleteTool(ToolId) {
    this.m_Data.arr_tool = this.m_Data.arr_tool.filter((item) => item.arr_tool != ToolId);

    this.UpdateElTasks();
  }

  OpenDialogUser(value) {
    this.GetElDialogUser().dialog({
      autoOpen: true,
      modal: true,
      draggable: false,
      resizable: false,
      width: 800,
      height: 700,
      dialogClass: 'no-close',
      title: 'Выбор обучаемых',
      classes: {
        'ui-dialog': 'phone-fullscreen phone-scroll-invisible aos-dialog-style',
      },
      buttons: [{
        id: 'save',
        type: 'button',
        text: 'Выбрать',
        click: () => {
          const tree = this.GetElTreeUsers().fancytree('getTree');
          if (tree) {
            this.m_Data.arr_user = $.map(tree.getSelectedNodes(), (item) => {
              if (item.data.is_last === 'true') {
                return {
                  user_id: item.data.user_id,
                  fio: item.title,
                };
              }
            });

            this.UpdateElUsers();
            this.UpdateElTeams();
          }

          this.GetElDialogUser().dialog('close');
        },
      }, {
        id: 'cansel',
        type: 'button',
        text: 'Закрыть',
        click: () => {
          this.GetElDialogUser().dialog('close');
        },
      },
      ],
      open: () => {
        this.InitUsers();
      },
      close: () => {
        this.GetElDialogUser().dialog('destroy');
      },
    });
  }

  InitUsers() {
    this.GetElTreeUsers().fancytree({
      checkbox: 'true',
      selectMode: 3,
      icon: false,
      autoScroll: true,
      source: {
        type: 'POST',
        url: '/?object=UNVSimulator&method=GetUsersTree',
        data: { type_tree: 'simulator' },
      },
      // extensions: ["filter"],
      // filter: {
      //     counter: true,
      //     highlight: true,
      //     autoExpand: true,
      //     mode: "hide"
      // },
      select: (e, l) => {
        // var selected = l.node.selected;

        // Найдем все нижние узлы
        // Рекурсия
        // var getLastItem = (item) =>{
        //     if(item.children && item.children.length > 0){
        //         item.children.forEach((child) =>{
        //             getLastItem(child);
        //         });
        //     }
        //     else if(item.data && item.data.is_last == "true" && item.checkbox !== false){
        //         if(selected == true)
        //             this.AddUserSelectable(item);
        //         else
        //             this.DeleteUserSelectable(item);
        //     }
        // }

        // getLastItem(l.node);
      },
      renderTitle: (e, l) => {
        // var toolName = "";
        // if(l.node.data.tool_name)
        //     toolName = (`<span style="font-weight: bold;"> (${l.node.data.tool_name})  </span>`);
        // else if(l.node.data.description)
        //     toolName = (`<span style="font-weight: bold;"> (${l.node.data.description})  </span>`);

        // return l.node.title + toolName;
      },
      init: () => {
        if (Array.isArray(this.m_Data.arr_user)) {
          this.m_Data.arr_user.forEach((item) => {
            const node = this.GetElTreeUsers().fancytree('getNodeByKey', String(item.user_id));
            if (node) {
              node.setSelected(true);
              node.setFocus(true);
            }
          });
        }
      },
    });
  }

  OpenDialogTool(value) {
    this.GetElDialogTools().dialog({
      autoOpen: true,
      modal: true,
      draggable: false,
      resizable: false,
      width: 800,
      height: 700,
      dialogClass: 'no-close',
      title: 'Выбор СТУ',
      classes: {
        'ui-dialog': 'phone-fullscreen phone-scroll-invisible aos-dialog-style',
      },
      buttons: [{
        id: 'save',
        type: 'button',
        text: 'Выбрать',
        click: () => {
          const arr = this.GetElTableTools().find('input[checked="checked"]');
          $.map(arr, (item) => {
            const data = $(item).closest('[value]').data();
            if (Array.isArray(data.arr_task)) { this.m_Data.arr_task = this.m_Data.arr_task.concat(data.arr_task); }
          });

          this.UpdateElTasks();
          this.GetElDialogTools().dialog('close');
        },
      }, {
        id: 'cansel',
        type: 'button',
        text: 'Закрыть',
        click: () => {
          this.GetElDialogTools().dialog('close');
        },
      },
      ],
      open: () => {
        this.InitTools();
      },
      close: () => {
        this.GetElDialogTools().dialog('destroy');
      },
    });
  }

  InitTools() {
    this.GetElTableTools().empty();
    this.ShowContainerLoad(this.GetElTableTools());

    $.ajax({
      type: 'GET',
      url: '/?object=StudyPlanning&method=GetTools',
      dataType: 'json',
    })
      .always((dt, e, l) => {
        this.HideContainerLoad(this.GetElTableTools());
        dt.data.forEach((item) => { this.AddTableToolsRow(item); });
      });
  }

  OpenDialogGeneral(data) {
    console.log(data);

    this.GetElDialogGeneral().dialog({
      autoOpen: true,
      modal: true,
      draggable: false,
      resizable: false,
      width: 800,
      height: 700,
      dialogClass: 'no-close',
      title: 'Выбор тем',
      classes: {
        'ui-dialog': 'phone-fullscreen phone-scroll-invisible aos-dialog-style',
      },
      buttons: [{
        id: 'save',
        type: 'button',
        text: 'Выбрать',
        click: () => {
          const arr = this.GetSelectedTableRow(this.GetElTableGeneral());

          this.m_Data.arr_user = this.m_Data.arr_user.map((item) => {
            const arrF = arr.filter((itemF) => itemF.id == item.user_id);

            if (arrF.length > 0) {
              if (data.type == 'team_user') { item.team = data.team; } else if (data.type == 'task_user') { item.arr_task = data.arr_task; }
            }

            return item;
          });

          this.UpdateElUsers();
          this.UpdateElTeams();

          this.GetElDialogGeneral().dialog('close');
        },
      }, {
        id: 'cansel',
        type: 'button',
        text: 'Закрыть',
        click: () => {
          this.GetElDialogGeneral().dialog('close');
        },
      },
      ],
      open: () => {
        this.InitTableGeneral(data);
      },
      close: () => {
        this.GetElDialogGeneral().dialog('destroy');
      },
    });
  }

  InitTableGeneral(data) {
    const arr = [];

    this.GetElTableGeneral().empty();

    if (data.type == 'team_user') {
      this.m_Data.arr_user.forEach((item) => {
        if (!item.team) {
          arr.push({
            id: item.user_id,
            name: item.fio,
          });
        }
      });
    } else if (data.type == 'task_user') {
      this.m_Data.arr_user.forEach((item) => {
        arr.push({
          id: item.user_id,
          name: item.fio,
        });
      });
    }

    arr.forEach((item) => {
      this.GetElTableGeneral().append(this.CreateElTableRow(item));
    });
  }

  ShowContainerLoad(elContainer) {
    elContainer.append(`
            <div class="container-load">
                <div class="tmb-list-load">
            </div>
        `);
  }

  HideContainerLoad(elContainer) {
    elContainer.find('.container-load').remove();
  }

  AddTableToolsRow(data) {
    this.GetElTableTools().append(this.CreateElTableToolsRow(data));
  }

  CreateElTableToolsRow(data) {
    const el = $(`
            <div class="row" value="${data.tool_id}">
                <div><input type="checkbox"/></div>
                <div>Наименование: ${data.name}</div>
            </div>
        `);

    el.data(data);

    el.on('click', (event) => {
      const elInput = $(event.currentTarget).find('input');
      elInput.removeAttr('checked');

      if (!event.target || event.target.nodeName != 'INPUT') { elInput.prop('checked', !elInput.prop('checked')); }

      if (elInput.prop('checked')) { elInput.attr('checked', 'checked'); }
    });

    return el;
  }

  CreateElTableRow(data) {
    const el = $(`
            <div class="row" value="${data.id}">
                <div><input type="checkbox"/></div>
                <div>${data.name}</div>
            </div>
        `);

    el.data(data);

    el.on('click', (event) => {
      const elInput = $(event.currentTarget).find('input');
      elInput.removeAttr('checked');

      if (!event.target || event.target.nodeName != 'INPUT') { elInput.prop('checked', !elInput.prop('checked')); }

      if (elInput.prop('checked')) { elInput.attr('checked', 'checked'); }
    });

    return el;
  }

  GetSelectedTableRow(elTable) {
    return $.map(elTable.find('input:checked').closest('[value]'), (item) => $(item).data());
  }

  UpdateElTasks() {
    if (!Array.isArray(this.m_Data.arr_task)) { return; }

    this.GetElFieldTools().find('.value').remove();

    this.m_Data.arr_task.forEach((item) => {
      const el = $(`
                <div class="value" value="${item.learning_node_id}">
                    <div><input type="checkbox"/></div>
                    <span>${item.block_name || ''} ${item.learning_node_name}</span>
                    <div class="icon-button icon-delete" action="deleteTool"></div>
                </div>
            `);

      el.data(item);

      this.GetElFieldTools().find('.values').append(el);
    });

    this.InitEvent();
  }

  GetSelectedTasks() {
    const input = this.GetElFieldTools().find('input:checked').closest('.value');
    const arr = [];

    $.map(input, (item) => {
      const data = $(item).data();
      if (data) { arr.push(data); }
    });

    return arr;
  }

  UpdateEl() {
    this.GetElFieldName().find('input').val(this.m_Data.name);
    this.GetElFieldDateStart().find('input').val(this.m_Data.date_start);
    this.GetElFieldDateEnd().find('input').val(this.m_Data.date_end);

    this.UpdateElUsers();
    this.UpdateElTeams();
    this.UpdateElTasks();
    this.UpdateElSchemeType();
  }

  UpdateElTeams() {
    if (!Array.isArray(this.m_Data.arr_team)) { return; }

    this.GetElFieldTeams().find('.value').remove();

    this.m_Data.arr_team.forEach((item) => {
      const elValues = this.GetElFieldTeams().find('.values');

      elValues.append(`
                <div class="value" value="${item.team}">
                    <span>Бригада ${item.team}</span>
                    <div class="icon-button icon-edit" action="editTeam"></div>
                    <div class="icon-button icon-delete" action="deleteTeam"></div>
                </div>
            `);

      if (Array.isArray(this.m_Data.arr_user)) {
        this.m_Data.arr_user.forEach((itemUser) => {
          if (itemUser.team == item.team) {
            elValues.append(`
                            <div class="value" value="${itemUser.user_id}" team="${item.team}">
                                <span><b>Бригада ${item.team}</b> ${itemUser.fio}</span>
                                <div class="icon-button icon-delete" action="deleteUserTeam"></div>
                            </div>
                        `);
          }
        });
      }
    });

    this.InitEvent();
  }

  UpdateElUsers() {
    if (!Array.isArray(this.m_Data.arr_user)) { return; }

    this.GetElFieldUsers().find('.value').remove();

    const elValues = this.GetElFieldUsers().find('.values');
    this.m_Data.arr_user.forEach((item) => {
      elValues.append(`
                <div class="value" value="${item.user_id}">
                    <span>${item.fio} ${item.team ? `<b>Бригада ${item.team}</b>` : ''}</span>
                    <div class="icon-button icon-delete" action="deleteUser"></div>
                </div>
            `);

      if (Array.isArray(item.arr_task) && item.arr_task.length > 0) {
        item.arr_task.forEach((itemT) => {
          elValues.append(`
                        <div class="value" value=${itemT.learning_node_id}>
                            <span><b> ${itemT.learning_node_name}</b></span>
                            <div class="icon-button icon-delete" action="deleteUser"></div>
                        </div>
                    `);
        });
      }
    });

    this.InitEvent();
  }

  UpdateElSchemeType() {
    this.GetElSelectSchemeType().empty();
    this.m_DataSchemeType.forEach((item) => {
      const selected = (item.scheme_type_id == this.m_Data.scheme_type_id) ? 'selected="selected"' : '';
      this.GetElSelectSchemeType().append(`
                <option ${selected} value="${item.scheme_type_id}">${item.name}</option>
            `);
    });
    this.GetElSelectSchemeType().selectmenu('refresh');
  }

  GetElTableTools() {
    return $('#tableTools');
  }

  GetElTableGeneral() {
    return $('#tableGeneral');
  }

  GetElTreeUsers() {
    return $('#treeUsers');
  }

  GetElDialogUser() {
    return $('#dialogUsers');
  }

  GetElDialogTools() {
    return $('#dialogTools');
  }

  GetElDialogGeneral() {
    return $('#dialogGeneral');
  }

  GetElSelectSchemeType() {
    return this.GetEl().find('#selectSchemeType');
  }

  GetElFieldName() {
    return this.GetEl().find('#fieldName');
  }

  GetElFieldSchemeType() {
    return this.GetEl().find('#fieldSchemeType');
  }

  GetElFieldDateStart() {
    return this.GetEl().find('#fieldDateStart');
  }

  GetElFieldDateEnd() {
    return this.GetEl().find('#fieldDateEnd');
  }

  GetElFieldTools() {
    return this.GetEl().find('#fieldTools');
  }

  GetElFieldUsers() {
    return this.GetEl().find('#fieldUsers');
  }

  GetElFieldTeams() {
    return this.GetEl().find('#fieldTeams');
  }

  GetEl() {
    return $('#tabEditClass', '#pageStudyPlanning');
  }
}

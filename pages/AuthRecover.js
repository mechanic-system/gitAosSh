function valid(){
  // Валидация плагином validate
      $("#authForm, #recoveryForm").validate({
          //debug: true,
          rules: {
              login: {
                  required: true,
                  //noSpace: true
              },
              email: {
                  required: true,
                  email: true
  
              },
              passwordAuth: {
                  required: true,
              },
              password: {
                  required: true,
                  noSpace: true,
                  minlength: "8",
                  symbols: true,
                  maxlength: "15"
  
              },
              password2: {
                  required: true,
                  equalTo: "#passwordField"
              },
              passwordOld: {
                  required: true,
                  noSpace: true
              },
              captcha: "required"
          },
          messages: {
              login: {
                  required: "Вы не заполнили поле логин",
                  noSpace: "Нельзя использовать пробелы"
              },
              email: {
                  required: "Вы не заполнили поле с E-mail",
                  email: "E-mail введен некорректно"
  
              },
              passwordAuth: {
                  required: "Вы не заполнили поле пароль"
              },
              password: {
                  required: "Вы не заполнили поле пароль",
                  noSpace: "Нельзя использовать пробелы",
                  minlength: "Пароль должен быть не короче 8 символов",
                  symbols: "Пароль не должен содержать русских букв и включать не менее трех из следующих четырех типов символов: прописные буквы (A-Z) , строчные буквы (a-z), цифры (0-9), специальные символы (~+$&#@% и т.п.).",
                  maxlength: "Пароль должен быть не длиннее 15 символов"
              },
              password2: {
                  required: "Повторно введите пароль",
                  equalTo: "Введенные пароли не совпадают"
              },
              passwordOld: {
                  required: "Вы не заполнили поле старый пароль",
                  noSpace: "Нельзя использовать пробелы"
              },
              captcha: "Вы не заполнили код с картинки"
          },
          submitHandler: function (form, e) {
              e.preventDefault();
  
              $('#serverMessage').empty();
              $("#message").empty();
  
              showPreloader();
              $.ajax({
                  type: "POST",
                  url: form.action,
                  data: $(form).serialize() // serializes the form elements.
              }).then(function (data) {
                  //console.log('then');
                  hidePreloader();
                  
                  if (data.result == "ok") {                    
                      
                      if (data.msg)
                          openInfoDialog("msgDlg", "button", "Система " + getSystemName(), data.msg).then(function () {
                              window.location.href = window.location.href;
                          });
                      else
                          window.location.href = window.location.href;
                  } else if (data.result == "msg") {
                      $("#captcha").attr("src", $("#captcha").attr("src"));
                      $("#captchaField").val('');
                      showAuthMessage(data.msg);
                      if (data.alert)
                          showServerMessage(data.alert); //this fix 26.03.2024
                  } else if (data.result == "needCnfrm") {
                      needConfirm();
                      showAuthMessage('Необходимо подтверждение пароля!')
                  } else if (data.result == "needLogin") {
                      $("#captcha").attr("src", $("#captcha").attr("src"));
                      $("#captchaField").val('');
                      needLogin();
                      showAuthMessage('Необходимо указать логин или фамилию!')
                  } else if (data.result == "needEmail") {
                      openQueryEmailDialog();
                  }
  
              }).catch(function () {
                  hidePreloader();
              });
              return false;
          },
          focusInvalid: true,
          errorClass: "input-error"
      });
  }
  
  valid()
  
  // Обновляем капчу
$('#captcha, #captchaRefresh').on('click', function (event) {
    const getSrc = $('#captcha').attr("src");
    const timeStamp = new Date().getTime(); // Случайный параметра времени
    $('#captcha').attr("src", getSrc + "?" + timeStamp);
});
function validatePassword() {

  let m_bValue = false;
  let m_bMessagError = false;
  const m_data_variable = new Map();
  
  const changepassForm = document.querySelector('#changepassForm');

  if(changepassForm) {

      const spanErrorArray = changepassForm.querySelectorAll('div.valid-icon-title > span')

      spanErrorArray.forEach((item) => {
          m_data_variable.set(item.getAttribute('data_variable'), item)
      });

      const forms = document.querySelectorAll('#changepassForm');

      forms.forEach((form) => {            
          const inputs = form.querySelectorAll('input');
          inputs.forEach((input) => {
              input.addEventListener('input', (event) => {
                  $("#message").empty();
                  inputError()

                  const {id} = event.target;
                  if(id === 'passwordField'){
                  for (let bValue of chackValidPassord(input).values()){
                      if(bValue){
                          m_bValue = true;
                      }else{
                          m_bValue = false;
                          break;
                      }
                  }
                  }  
              });
          })
      });  
  }

  function chackValidPassord(inputValid) {

      const divPassLength = document.querySelector('.error-validation-field.pass-length');
      const fromValue = divPassLength.getAttribute('from');
      const toValue = divPassLength.getAttribute('to');

      const m_collectionCheck = new Map();
      
      const regexLength = new RegExp(`(?=^.{${fromValue},${toValue}}$)`, 'gm');
      const regexNumber = /^(?=.*\d).*$/gm;
      const regexUppercase = /^(?=.*[A-Z]).*$/gm;
      const regexLowercase = /^(?=.*[a-z]).*$/gm;
      const regexSpecial = /[\!\\\"\#\$\%\&\'\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\]\^\_\`\{\|\}\~]/g;
      const regexCyrillic = /[а-яА-ЯёЁ]/gm;
      const regexSpace = /\s/;
      const regexIdenticalCharacters = /(.)\1{2}/g;

      const {value} = inputValid;

      m_collectionCheck.set('m_bInputLength', regexLength.test(value));
      m_collectionCheck.set('m_bInputValidLatinUppercase', regexUppercase.test(value));
      m_collectionCheck.set('m_bInputValidLatinLowercase', regexLowercase.test(value));
      m_collectionCheck.set('m_bInputValidNumber', regexNumber.test(value));
      m_collectionCheck.set('m_bInputLatinSpecial', regexSpecial.test(value));
      m_collectionCheck.set('m_bInputCirillic', !regexCyrillic.test(value));
      m_collectionCheck.set('m_bInputSpace', !regexSpace.test(value));
      m_collectionCheck.set('m_bInputIdenticalCharacters', !regexIdenticalCharacters.test(value));        

      changeIconValidation(m_collectionCheck);

      return m_collectionCheck;
  }

  // Изменение валидации при смене пароля
  function changeIconValidation(colelectionCheck) {
      
      for (let v_element of m_data_variable.keys()){        
          if(!colelectionCheck.get(v_element)) {        
              m_data_variable.get(v_element).className = "container-icon-validation pic-validation-fail";
          } else{        
              m_data_variable.get(v_element).className = 'container-icon-validation pic-validation-pass';
          }
      }
  }


  // Проверка при смене пароля 
  function inputError() {
      
      const m_bInputError = new Map()
      const m_bArray = new Array();

      $('.input-error').remove()
  
      const passwordOldField = document.getElementById('passwordOldField');
      const passwordField = document.getElementById('passwordField');
      const i_password = document.getElementById('i_password');
      const password2Field = document.getElementById('password2Field');

      let messageErrorPass;
      console.log('passwordOldField', passwordOldField);
      if(!passwordOldField.value) {
          messageErrorPass = 'Вы не заполнили поле старый пароль';
          showMessageFromInput(messageErrorPass, passwordOldField);
          m_bInputError.set(passwordOldField, false);
      } else {
          m_bInputError.set(passwordOldField, true);
      }

          if(!passwordField.value) {
          messageErrorPass = 'Вы не заполнили поле пароль';
          showMessageFromInput(messageErrorPass, i_password);
          m_bInputError.set(passwordField, false);
      } else {
          m_bInputError.set(passwordField, true);
      }

      if(passwordField.value !== password2Field.value) {            
          messageErrorPass = 'Введенные пароли не совпадают';
          showMessageFromInput(messageErrorPass, password2Field);
          m_bInputError.set(password2Field, false);
      } else {
          m_bInputError.set(password2Field, true);
      }
      
      for(let v_bValue of m_bInputError.values()) {
          m_bArray.push(v_bValue);
      }

      m_bMessagError = !m_bArray.includes(false);

  }

  function showMessageFromInput(textmessage, inputmessage){
      let paragraph = document.createElement('p');
      paragraph.className = 'input-error';
      paragraph.textContent = textmessage;
      inputmessage.parentNode.insertBefore(paragraph, inputmessage.nextSibling);
      return false;
  }

  $("#changepassForm").submit(function (e) {

      e.preventDefault();
      inputError()

      if(m_bValue && m_bMessagError){
          showPreloader();
          $.ajax({
              type: "POST",
              url: this.action,
              data: $(this).serialize() // serializes the form elements.
          }).then(function (data) {
              hidePreloader();
              
              if (data.result == "ok") {                    
                  
                  if (data.msg)
                      openInfoDialog("msgDlg", "button", "Система " + getSystemName(), data.msg).then(function () {
                          window.location.href = "/";
                      });
                  else
                      window.location.href = "/";
              } else if (data.result == "msg") {
                  $("#captcha").attr("src", $("#captcha").attr("src"));
                  $("#captchaField").val('');
                  showAuthMessage(data.msg);
                  if (data.alert)
                      showServerMessage( data.alert); //this fix 26.03.2024
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
              } else if(data.result === 'validatePassword'){
                  showAuthMessage(data.msg)                    
                  const { validates } = data;                  
                  const checkServerError = new Map(Object.entries(validates));
                  changeIconValidation(checkServerError);                
              }

          }).catch(function () {
              hidePreloader();
          });
          
          return false;
      } else {
          const errorMessage = 'Пароль не соответствует требованиям!'
          showAuthMessage(errorMessage)
      }
  });
  
}

validatePassword()
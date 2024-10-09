const showError = async (status, response) => {
    //Pops up an error at bottom of screen, then makes it disappear
    const errorModal = document.querySelector('.error-modal');
    const errorMessage = document.querySelector(".error-message");
    errorMessage.textContent = `${status}: ${response}`;
    errorModal.classList.remove('fade-in-hidden');
    errorModal.classList.add('fade-in-visible')
    //Hide modal after 5s
    setTimeout(hideError, 5000);
}

const hideError = () => {
    const errorModal = document.querySelector('.error-modal');
    errorModal.classList.remove('fade-in-visible');
    errorModal.classList.add('fade-in-hidden');
}

const fadeBackground = () => {
    //Fades in the background gray
    const background = document.querySelector('.background-fade');
    background.classList.remove('fade-in-hidden');
    background.classList.add('fade-in-visible');
}

const unfadeBackground = () => {
    const background = document.querySelector('.background-fade');
    background.classList.remove('fade-in-visible');
    background.classList.add('fade-in-hidden');
}


const showLogin = () => {
    fadeBackground();
    const loginModal = document.querySelector('.login-modal-container');
    loginModal.classList.remove('hidden');
}

const hideLogin = () =>{
    unfadeBackground();
    const loginModal = document.querySelector('.login-modal-container');
    loginModal.classList.add('hidden');
}

const displayAvatarCustomization = (targetContainer) => {
    //Creates the avatar from template and places it
  //Grab the avatar customization template and place it after the target Element
  //Either place it after the password field, or after the 'Customization modal title'
  //TODO: do the customization modal
  const avatarTemplate = document.getElementById('avatar-customization-template');
  let clonedTemplate = avatarTemplate.content.cloneNode(true);
  targetContainer.appendChild(clonedTemplate);
}

export { showError, hideError, showLogin, hideLogin, fadeBackground, unfadeBackground, displayAvatarCustomization};
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


const createAvatarShape = (selection) => {
    //Determines which svg the user avatar needs
    let path;
    let newShape;
    switch (selection) {
        case 1: //circle
            newShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            newShape.setAttribute('cx', 15);
            newShape.setAttribute('cy', 15);
            newShape.setAttribute('r', 7);
            break;
        case 2: //square
            newShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            newShape.setAttribute('x', 9);
            newShape.setAttribute('y', 9);
            newShape.setAttribute('width', 12);
            newShape.setAttribute('height', 12);
            newShape.setAttribute('rx', 2);
            break;
        case 3: //triangle
            newShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            newShape.setAttribute('points', '15, 5 6, 20 24, 20');

            break;
        case 4: //oval
            newShape = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
            newShape.setAttribute('cx', 15);
            newShape.setAttribute('cy', 15);
            newShape.setAttribute('rx', 10);
            newShape.setAttribute('ry', 5);
            break;
        default:
            break;
    }
    newShape.setAttribute('class', 'first');
    return newShape;
}

const createAvatar = (svgElement, avatarData) => {
    //Gets the colors and avi selection, and modifies the svg element to display on DOM, appends it to 
    let avatar = createAvatarShape(avatarData.portrait);
    avatar.setAttribute('fill', avatarData.firstColor);
    svgElement.querySelector('.background-circle').setAttribute('fill', avatarData.secondColor);
    svgElement.appendChild(avatar);
}

const displayAvatarCustomization = (targetContainer) => {
    //Creates the avatar customization widget from template and renders it (either on account creation page or preferences page)
    //Grab the avatar customization template and place it after the target Element
    //Either place it after the password field, or after the 'Customization modal title'
    //TODO: do the customization modal
    const avatarTemplate = document.getElementById('avatar-customization-template');
    let clonedTemplate = avatarTemplate.content.cloneNode(true);
    targetContainer.appendChild(clonedTemplate);
}

export { showError, hideError, showLogin, hideLogin, fadeBackground, unfadeBackground, createAvatar, displayAvatarCustomization};
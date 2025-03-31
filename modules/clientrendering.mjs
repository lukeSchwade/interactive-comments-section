//Module functions for most DOM manipulation
const error = {
    async showError (response, status = null) {
        //Pops up an error at bottom of screen, then makes it disappear
        const errorModal = document.querySelector('.error-modal');
        const errorMessage = document.querySelector(".error-message");
        if (status) {
            errorMessage.textContent = `${status}: ${response}`;
            
        } else {
            errorMessage.textContent = `${response}`;
            
        }
        errorModal.classList.remove('fade-in-hidden');
        errorModal.classList.add('fade-in-visible')
        //Hide modal after 5s
        setTimeout(() => {
            const errorModal = document.querySelector('.error-modal');
            errorModal.classList.remove('fade-in-visible');
            errorModal.classList.add('fade-in-hidden');
        }, 4000);
    }
}

const background = {
    //Allows you to pop up a modal and fade out the background
    fade(){
        const background = document.querySelector('.background-fade');
        background.classList.remove('fade-in-hidden');
        background.classList.add('fade-in-visible');
    },
    unfade(){
        const background = document.querySelector('.background-fade');
        background.classList.remove('fade-in-visible');
        background.classList.add('fade-in-hidden');
    }
}

const loginModal = {
    //Showing and hiding the loginScreen
    show(){
        background.fade();
        const loginModal = document.querySelector('.login-modal-container');
        loginModal.classList.remove('hidden');
    },
    hide(){
        background.unfade();
        const loginModal = document.querySelector('.login-modal-container');
        loginModal.classList.add('hidden');
    }
}

const createAvatarShape = (selection = 1) => {
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

const avi = {
    create(svgElement, avatarData){
        //Gets the colors and avi selection, and modifies the svg element to display on DOM
        let avatar = createAvatarShape(avatarData?.portrait);
        avatar.setAttribute('fill', avatarData.firstColor);
        svgElement.querySelector('.background-circle').setAttribute('fill', avatarData.secondColor);
        svgElement.appendChild(avatar);
    },
    displayCustomUI (targetContainer) {
        //Display the UI for customizing avatar in target container
        //Creates the avatar customization widget from template and renders it (either on account creation page or preferences page)
        //Grab the avatar customization template and place it after the target Element
        //Either place it after the password field, or after the 'Customization modal title'
        const avatarTemplate = document.getElementById('avatar-customization-template');
        let clonedTemplate = avatarTemplate.content.cloneNode(true);
        targetContainer.appendChild(clonedTemplate);
    }
}

const comment = {
    //Object for rendering comments
    build(){
        //build the comment
    },
    delete(targetComment){
        const cleanUpDeletedComment = (targetComment) => {
            //Delete the buttons and disable the upvotes
            //Clone element to remove all the eventlisteners
            const newElement = targetComment.cloneNode(true);
            try { 
                try {
                    newElement.querySelector('.you-flag').remove();
                } catch {
                }
                newElement.querySelector('.reply-btn').remove();
                newElement.querySelector('.delete-btn').remove();
            } finally {
                targetComment.replaceWith(newElement);
            }
        }
        //Client Side deletion of Node
        targetComment.classList.add('deleted-comment');
        targetComment.querySelector('.comment-content').textContent = "This Comment has been deleted";
        //targetComment.querySelector('.user-avatar').src = './images/avatars/image-deleted.png';
        targetComment.querySelector('.background-circle').setAttribute('fill', '#000000')
        let el = targetComment.querySelector('.first');
        if (el) el.remove();
        targetComment.querySelector('.username').textContent = 'Deleted';
        cleanUpDeletedComment(targetComment);
    },
}

const editWindow = {
    toggle(targetComment){
        //Toggle visibility of edit UI
        targetComment.querySelector('.delete-btn').classList.toggle('hidden');
        targetComment.querySelector('.reply-btn').classList.toggle('hidden');
        const commentContent = targetComment.querySelector('.text-container');
        const editContent = targetComment.querySelector('.edit-container');
        commentContent.classList.toggle('hidden');
        editContent.classList.toggle('hidden');
    },
    update(targetComment){
        //Update comment with new content
        const oldComment = targetComment.querySelector('.comment-content');
        const editedText = targetComment.querySelector('.edit-comment-input').value;
        oldComment.textContent = editedText;
    }
}
const commentSection = {
    clear(){
        //wipe out all the comments
        let comments = document.getElementsByClassName('comment-tree-grid-container');
        while (comments[0]) {
        comments[0].parentNode.removeChild(comments[0]);
        }   
    },
}

const settingsModal = {
    //A blank modal that modules can be put in
    show(){
        background.fade();
        const settingsModal = document.querySelector('.settings-modal-container');
        settingsModal.classList.remove('hidden');
    },
    hide(){
        background.unfade();
        const settingsModal = document.querySelector('.settings-modal-container');
        settingsModal.classList.add('hidden');
    }
}

export { error, loginModal, background, avi, comment, editWindow, commentSection, settingsModal};

//Replies are appended after 'child-comment-gridblock'

//global variable to keep track of where to append new comments, which comment to delete, etc.
let currentCommentFocus = document.getElementById('comments-section');
const commentsContainer = document.getElementById('comments-section');
//List of comment Nodes, with associated handlers for each one
let currentUser = null;
//global variable for saving text and node when editing comment
const upvoteHandlers = [];
//clientside var of how many comments in database total there are (for keeping track of ID assignment)
let totalComments;
//IMPORTS GO HERE
import { isCurrentUser, isAdmin } from "./modules/helpers.mjs";
import { showError, hideError, showLogin, hideLogin, fadeBackground, unfadeBackground, displayAvatarCustomization, createAvatar } from "./modules/clientrendering.mjs";
//import { get } from "mongoose";
class CommentTemplate {
    //Class for a comment data for purpose of building user replies
    //it mirrors the same format as a comment pulled from the database so it can be fed into buildComment
    constructor(content){
        this.id = ++totalComments;
        this.content = content;
        this.score = 0;
        this.createdAt = new Date();
        this.username = sessionStorage.getItem('username');
        //CHANGE WHEN USING NEW USERNAME and USER IMAGE SYSTEM
        this.user = {
            avatar: userData.avatar,
            username: sessionStorage.getItem('username'),
            image: userData.image   
        };
    }
}


class GeneralTree {
    //This renders a tree of comments and children and places them on the DOM
    constructor(){
        this.root = null;
    }
    printTreeAsString() {
        if (!this.root) throw new Error('Tree is empty')
        
        const getTreeString = (node = this.root, spaceCount = 0) => {
          let treeString = "\n";
    
          node.replies.forEach((child) => {
            treeString += `${" ".repeat(spaceCount)}● node | Username: ${child.user.username} - ${child.id} ${getTreeString(child, spaceCount + 4)}`
          })
    
          return treeString;
        }
        
        return console.log(`\n ● node | Username: ${this.root.user.username} - ${this.root.id} ${getTreeString(this.root, 4)}`)
        }
    
    preOrderTraversalRecursive(appendHere) {
        //Iterate over the tree recursively to build the comment tree on DOM
        //appendHere is where the fully-built tree must be appended at the end
        //usually to the comment section container (not if loading more comments, future proof)

        if (!this.root) throw new Error('Tree is empty');
        
        function traverse(currentNode, parentNode) {
            // recursive helper to traverse the tree
            if (!currentNode) return;

            //console.log(`build comment ${currentNode.id} and Comment Object here`);
            let builtComment = buildComment(currentNode);

            if (!builtComment.querySelector('.deleted-comment')){
                //Create an object for managing handlers if comment isn't deleted
                //COMMENTED OUT UNTIL FUNCTIONAL
                // commentNodeList.push(new CommentNode(currentNode.parentId, currentNode.id, builtComment.querySelector('.parent-comment'), currentNode.user.username));
                new CommentNode(currentNode.parentId, currentNode.id, builtComment.querySelector('.parent-comment'), currentNode.user.username);
                //REPLACE ABOVE WHEN FINISHED
            }
            const appendTarget = builtComment.querySelector('.child-comment-gridblock');
            // Add the node to the result array
            // Recursively traverse each of the node's children
            for (const childNode of currentNode.replies) {
                //as the loop bubbles back, append each built comment to its parent in previous scope
                appendTarget.appendChild(traverse(childNode, builtComment));
            }
            if (!currentNode.parentId) {
                //console.log("root comment is appended to DOM here");
                //Add an ID to find and then Delete when used
               
                appendHere.appendChild(builtComment);

            } else if (currentNode.parentId) {
                console.log(`Append node ${currentNode.id} to ${currentNode.parentId} here`);
                return builtComment;
            }
            return builtComment;
        }

        

        // Call the traverse helper with the root node to start the traversal
        const finalHTMLnode = traverse(this.root, commentsContainer);
        return;
    }
}


const toggleEditVisibility = (targetComment, visible) => {
    targetComment.querySelector('.delete-btn').classList.toggle('hidden');
    targetComment.querySelector('.reply-btn').classList.toggle('hidden');
    const commentContent = targetComment.querySelector('.text-container');
    const editContent = targetComment.querySelector('.edit-container');
    commentContent.classList.toggle('hidden');
    editContent.classList.toggle('hidden');
}
const submitEdit = (targetComment) => {
    const oldComment = targetComment.querySelector('.comment-content');
    const editedText = targetComment.querySelector('.edit-comment-input').value;
    oldComment.textContent = editedText;
}

const deleteComment = (currentComment) => {
    //Client Side deletion of Node
    currentComment.classList.add('deleted-comment');
    currentComment.querySelector('.comment-content').textContent = "This Comment has been deleted";
    currentComment.querySelector('.user-avatar').src = './images/avatars/image-deleted.png';
    currentComment.querySelector('.username').textContent = 'Deleted';
    cleanupDeletedComment(currentComment);
}

const cleanupDeletedComment = (targetComment) => {
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

const moveReplyCard = (targetNode) => {
    // if the currentCommentfocus is the comment section moves replycard to top of comments
    const replyCard = document.getElementById('reply-card');
    // target.appendChild(replyCard);
    targetNode.insertBefore(replyCard, targetNode.firstChild);
    // If you use After()you need to get the child to insert after
}

const submitReply = (evt) => {
    //Add reply Node to DOM, purely visual
    const targetButton = evt.target.closest('button');
    const replyWindow = targetButton.closest('.inline-reply-container'); 
    const parentWrapper = replyWindow.closest('.child-comment-gridblock')
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent);
    const newComment = buildComment(newNode, true);
    new CommentNode(newNode.parentId, newNode.id, newComment.querySelector('.parent-comment'), newNode.user.username, true);
    parentWrapper.insertBefore(newComment, replyWindow);

    replyWindow.remove();
}

const buildUserReplyNode = (content) => {
    //creates a new template Node that is compatible with the buildComment Function
    return new CommentTemplate(content);
}

const submitParentComment = () => {
    const replyWindow = document.getElementById('reply-card');
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent);
    const newComment = buildComment(newNode, true);
    new CommentNode(newNode.parentId, newNode.id, newComment.querySelector('.parent-comment'), newNode.user.username, true)
    const sortByWidget = document.getElementById('sort-by-dropdown');
    sortByWidget.after(newComment);
    replyWindow.querySelector('.submit-comment__input').value = '';
    //SEND SERVER UPDATE HERE
}

const commentNodeList = [];

const commentButtonHandler = (evt, username) => {
    //Determines which button was clicked
    //Global Click for closing edit window
    if (editHandler && editHandler.isOpen && !editHandler.targetComment.contains(evt.srcElement)) editHandler.closeEditWindow(); 

    if (evt.target.closest('button')) {
        const btnClassList = evt.target.closest('button').classList;
        if (btnClassList.contains("vote-btn")) {
            return 'vote';
        
        } else if (btnClassList.contains("reply-btn")) {
            if (isCurrentUser(username)) { 
                return 'edit';
            } else {return 'reply';} 
            //Only fire delete if user is correct (check serverside too)
        } else if (btnClassList.contains('delete-btn') && isCurrentUser(username)) {
            return 'delete';
        } else if (btnClassList.contains('edit-btn') && isCurrentUser(username)){
            return 'submitEdit';
        }

    } else {
        return 'null'
    }
}
class CommentNode {
    //WILL LINK ALL THE HANDLERS FROM EACH ASSOCIATED COMMENT
    //SERVER BACKEND STUFF
    //Tracks ID and Parent ID with associated HTML element node, and associated handlers
    //I feed this back to the database so it can sort through and modify the db when changes are made
    constructor (parentId, id, linkedCommentEl,username, isSubmitted) {
        // store the id and parent ID of the comment
        this.id = id;
        this.parentId = parentId;
        this.linkedCommentEl = linkedCommentEl;
        this.username = username;
        this.upvoteHandler = null;
        this.replyHandler = null;
        this.serverRequestHandler = null;
        this.init(isSubmitted);
        this.clickListener = this.linkedCommentEl.addEventListener('click', (evt) => this.onClick(evt)); 
        // the arrow func is bc arrow funcs do not have their own 'this' but reg functions do in an eventlistener
    }
    init(isSubmitted){
        //Create all the handlers
        this.upvoteHandler = new UpvoteHandler(this.linkedCommentEl.querySelector('.vote-container'), this.id);
        if (isSubmitted) this.upvoteHandler.selfUpvote();
        //this.replyHandler =  new ReplyHandler(this.linkedCommentEl, this.id);
    }
    onClick(evt){
        //Determine which button was clicked then determine which handler to pass it to
        const whichBtn = commentButtonHandler(evt, this.username);
        switch (whichBtn) {
            case 'vote':
                this.upvoteHandler.onClick(evt);
                //Send event to upvote Handler
                //Create Buffer object for server Update
                break;
            case 'reply':
                this.createReplyHandler();
                break;
            case 'edit':
                this.createEditHandler();
                break;
            case 'submitEdit': 
                editHandler.onclickSubmit()
                break;
            case 'delete':
                this.createDeleteHandler();
                break;
            default:
                break;
        }
    }
    createUpvoteHandler(){
        //Create an Upvote handler and attach it to this node
    }
    createReplyHandler(){
        //If there isn't already a replyhandler, initialize it
        if (!replyHandler) {
            replyHandler = new ReplyHandler(this.id, this.linkedCommentEl);
        } else {
            //Otherwise update it with new object info
            replyHandler.updateParentObjectData(this.id, this.linkedCommentEl);
        }
        replyHandler.repositionReplyCard(this.linkedCommentEl);
    }
    createEditHandler(){
        //Create handler if it doesn't exist otherwise update it.
        if (!editHandler) {
            editHandler = new EditHandler(this.id, this.linkedCommentEl);
        } else {
            //Otherwise update it with new object info
            editHandler.updateObjectData(this.id, this.linkedCommentEl);
            editHandler.openEditWindow();
        }
    }
    createDeleteHandler(){
        
        if (!deleteHandler) {
            deleteHandler = new DeleteHandler();
        }
        deleteHandler.updateData(this.id, this.linkedCommentEl);
        deleteHandler.showModal();
        //openDeleteModal(this.linkedCommentEl);
    }
    sendServerRequest(data){
        //Create an object that holds the info, and sends it to server after a delay
    }
    createSpamHandler(){
        //Create a handler that holds on to upvote state changes and sends them to server
    }

    deleteNode(){
        //Clear all references and listeners to free up memory when a comment is deleted
    }
}

class UpvoteHandler {
    //Attached to every upvote widget and manages the votes
    constructor (buttonWidget, id) {
        //-1 = downvote 0 = no vote 1 = upvote
        this.state = 0;
        this.buttonWidget = buttonWidget;
        this.upvoteBtn = this.buttonWidget.querySelector('.vote-btn.plus');
        this.downvoteBtn = this.buttonWidget.querySelector('.vote-btn.minus');
        this.id = id;
        this.spamHandler = null;
    }
    onClick(evt){
        //Find closest button
        //First implementation (will need to refactor to include all buttons, just a proof of concept)
        //This if statement wrapper catches exceptions
        //Determine how to update the state
        //Create an Upvote Payload 
        if (!this.spamHandler) this.spamHandler = new UpvotePayload(this.id, 'admin000', this.state) //FIXME: fix actual user ID
        
        if (evt.target.closest('button')) {
            let target = evt.target.closest('button');
            if (target.className.includes('plus')) {
                this.updateState(1);
            } else if (target.className.includes('minus')) {
                this.updateState(-1);
            }
        }


    }
    updateState(newState){
        //Change the state based on which button was pressed
        //Check that button hasn't already been clicked, reset it or update it
        if (newState == this.state) {
            this.state = 0;
            this.updateVisual(newState);
            //Send a server update HERE
            this.spamHandler.updateState(this.state)
        //If the state has to increment by more than 1 (eg +1 to -1)
        } else if (this.state + newState == 0) {
            this.state = newState;
            this.updateVisual(newState*2);
            //Send a server update HERE
            this.spamHandler.updateState(this.state)

        } else {
            this.state = newState;
            this.updateVisual(newState);
            //Send a server Update HERE
            this.spamHandler.updateState(this.state)

        }
    }
    updateVisual(newState) {
        //Change which button is highlighted based on what state it is
        const score = this.buttonWidget.querySelector('.comment-rating');
        switch (this.state) {
            case -1:
                this.downvoteBtn.classList.add("active");
                this.upvoteBtn.classList.remove("active");
                score.textContent = parseInt(score.textContent) + newState;
                break;
            
            case 0:
                this.upvoteBtn.classList.remove("active");
                this.downvoteBtn.classList.remove("active");
                score.textContent = parseInt(score.textContent) - newState;
                break;
            
            case 1:
                this.upvoteBtn.classList.add("active");
                this.downvoteBtn.classList.remove("active");
                score.textContent = parseInt(score.textContent) + newState;
                break;

            default:
                break;
        }
    }
    selfUpvote (){
        //Automatically upvote your own comment when submitted
        //doesn't call updateState to not mess with serverside (which will default +1 to new comments)
        this.state = 1;
        this.updateVisual(1);
    }
}

//The Single Reply Handler
let replyHandler;
class ReplyHandler {
    //Single reply handler object that is loosely attached to the corresponding parent comment via parentID and linked element
    constructor(parentId, parentComment) {
        //The ID of the parent comment that the reply will be appended to
        this.parentId = parentId;
        //The ID of the potential new Comment
        this.id = null;
        this.replyCard = null;
        this.submitReplyButton = null;
        this.init(parentComment);

    }

    init(parentComment){
        this.repositionReplyCard(parentComment);
     }
    repositionReplyCard(parentComment) {
        //Seperated so it can be run seperately if object is already initialized
        createReplyWindow (parentComment);
        this.replyCard = document.getElementById('reply-card-inline');
        this.submitReplyButton = this.replyCard.querySelector('.add-comment__btn');
        this.detachListener();
        this.attachListener();
    }
    attachListener(){
        this.submitReplyButton.addEventListener('click', this.onClickReply, {capture: true});

    }
    detachListener(){
        this.submitReplyButton.removeEventListener('click', this.onClickReply, {capture: true});

    }
    updateParentObjectData(parentId, parentComment){
        this.parentId = parentId;
        this.replyCard = parentComment;
    }
    onClickReply = (evt) => {
        //TODO: Check for innuendos
        //TODO: Check for any conflicts
        const textArea = evt.target.closest('.inline-reply-container').querySelector('.submit-comment__input');

        //Check for blanks, innuendos, etc
        if (textArea.value) {            
            //Build the HTML node of Comment
            submitReply(evt);
            //Update the ID before sending server request
            this.id = totalComments;
            //Create a server payload object
            //FIXME: Correct the user id  when finished
            new AddCommentPayload(this.id, this.parentId, 'admin000', textArea.value)
        }
        //payload: Parent comment ID, current user ID, current comment ID (resolve serverside), content of comment
    }

}
//Single Edit handler that is loosely attached to corresponding comment
let editHandler;
class EditHandler {
    constructor(commentId, targetComment) {
        this.targetComment = targetComment;
        this.id = commentId;
        this.isOpen = false;
        this.content = null;
        this.init();

    }
    init(){
        this.openEditWindow();
    }
    updateObjectData(newId, newComment){
        //Only one edit window allowed
        this.closeEditWindow();
        //Update the comment ID to proper one
        this.id = newId;
        this.targetComment = newComment;
    }
    onclickSubmit() {
       const textArea = this.targetComment.querySelector('.edit-comment-input');
       if (textArea.value){
        const newContent = textArea.value;
        submitEdit(this.targetComment);
        //SEND SERVER UPDATE HERE
        //FIXME: fix user id
        new EditPayload(this.id, 'admin000', newContent)
        this.closeEditWindow();
        
       }
    }
    openEditWindow(){
        if(!this.isOpen){
            this.isOpen = true;
            //Save the original text content
            this.content = this.targetComment.querySelector('.comment-content').textContent;
            //unhide Edit window
            const editContent = this.targetComment.querySelector('.edit-container');
            editContent.querySelector('.edit-comment-input').value = this.content;
            toggleEditVisibility(this.targetComment);
            this.targetComment.querySelector('.edit-comment-input').focus();
        }

    }
    closeEditWindow() {
        if (this.isOpen){
            toggleEditVisibility(this.targetComment);
            this.isOpen = false;
            this.content = null;
        }
    }
        

}

let deleteHandler;
class DeleteHandler {
    constructor(targetComment, id){
        this.targetComment = null;
        this.id = null;
        this.isOpen = false;
        document.querySelector('.confirm-delete-btn').addEventListener ('click', (e) => {
            this.onClickDeleteComment(this.targetComment);
            });
        document.querySelector('.confirm-cancel-btn').addEventListener ('click', (e) => {
            this.onClickCancel(this.targetComment);
            });
    }
    updateData(newId, newComment){
        this.targetComment = newComment;
        this.id = newId;
    }
    onClickDeleteComment(){
         //TODO: if it was deleted before sent to server delete it completely, otherwise leave it in tree

        deleteComment(this.targetComment);
        //FIXME: Correct the user ID when fixed
        new DeleteCommentPayload(this.id, 'admin000')
        this.hideModal();
        
        //CREATE SERVER UPDATE PAYLOAD HERE
    }
    onClickCancel(){
        this.hideModal();
    }
    showModal(){
        if (!this.isOpen){
            document.querySelector('.delete-comment-modal').style.display='block';
            this.isOpen = true;
            fadeBackground();
        }
    }
    hideModal(){
        if (this.isOpen){
            this.cleanUp();
            unfadeBackground();
            this.isOpen = false;

        }
    }
    cleanUp(){
        //clear data after modal is hidden to prevent unintended deletions
        this.targetComment = null;
        this.id = null;
        document.querySelector('.delete-comment-modal').style.display='none';
    }

}

let loginHandler;
class LoginHandler {
    constructor(){
        this.isOpen = false;
        this.addEventListeners();
        //Add the customization widget to the Login Modal
        displayAvatarCustomization(document.getElementById('registerCustomizationContainer'));
    }
    addEventListeners(){
        document.getElementById('loginForm').addEventListener('submit', this.submitLogin );
        document.getElementById('registerForm').addEventListener('submit', this.submitRegister);
        
    }
    async submitLogin(event){
        if (event) event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const serverUrl = `http://localHost:3000` //CHANGE ME
        const response = await fetch (`${serverUrl}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password})
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.status == 200) {
                // Handle successful login (e.g., redirect or show a message)
                console.log('Login successful: ', data);
                loginHandler.closeModal();
            } else {
                
            }
        })
        .catch((error) => {
            console.error('Error during login:', error);
        });
    }
    async submitRegister(event){
        console.log("register button clicked");
        //Await server response
        //If registration is successful, submit a login request as well
        event.preventDefault(); // Prevent the default form submission
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const serverUrl = `http://localHost:3000` //CHANGE ME
        const avatar = {
            portrait: document.querySelector('input[name="aviChoice"]:checked').value,
            firstColor: document.getElementById('first-color-picker').value,
            secondColor: document.getElementById('second-color-picker').value
        }
        const response = await fetch(`${serverUrl}/api/users/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, avatar })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status == 200){
                // Handle successful registration (e.g., redirect or show a message)
                console.log('Registration successful:', data);

                //Start a login
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').value = password;
                //this.submitLogin(event);

            } else {
                console.log('error');
                showError(`Error ${data.status}: ${data.message}`);
            }

        })
        .catch((error) => {
            console.error('Error during registration:', error);
            
        });
            
    }
    handleGlobalClick(evt){
        //If the click did not happen inside the Modal, close the modal
        if (loginHandler.isOpen && !evt.target.closest('.login-modal')){
            loginHandler.closeModal(); 
            //'this' refers to the event, so need to use loginHandler
        }
    }
    openModal(){
        //Open the modal
        showLogin();
        document.addEventListener('click', this.handleGlobalClick);
        this.isOpen = true;
        avatarHandler.refreshColors();
    }
    closeModal(){
        hideLogin();
        this.isOpen = false;
        this.cleanUp();
    }
    cleanUp(){
        //Remove eventlisteners and clean form inputs
        document.removeEventListener('click,', this.handleGlobalClick);
    }
}

loginHandler = new LoginHandler();
const submitLoginPayload = (username, password) => {

}
class AvatarButton {
    //A class for each button on customization page which keeps track of the colors of avis 
    constructor(targetIcon){
        this.targetIcon = targetIcon;
        this.svgFirstColor = targetIcon.querySelector('.first');
        this.svgSecondColor = targetIcon.querySelector('.second');

    }
    changeFirst (newColor){
        this.svgFirstColor.setAttribute('fill', newColor);
    }
    changeSecond(newColor){
        this.svgSecondColor.setAttribute('fill', newColor);

    }
}
class AvatarCustomizationHandler {
    constructor(){
        this.container = document.querySelector('avatar-customization-container');
        this.Buttons = []
        this.createEventHandlers();

    }
    createEventHandlers(){
        const firstColorInput = document.getElementById('first-color-picker');
        const secondColorInput = document.getElementById('second-color-picker');
        document.querySelectorAll('.avatar-button').forEach((button) => {
            this.Buttons.push(new AvatarButton(button));
        });
        firstColorInput.addEventListener('input', (evt) => {
            this.changeColors('front', evt.target.value);
        });
        secondColorInput.addEventListener('input', (evt) => {
            this.changeColors('back', evt.target.value);
        });
    }
    changeColors(whichColor, newColor){
        if (whichColor == 'front') {
            this.Buttons.forEach(icon => icon.changeFirst(newColor));
        } else if (whichColor == 'back') {
            this.Buttons.forEach(icon => icon.changeSecond(newColor));
            
        }
    }
    refreshColors(){
        //When the modal Opens, get the correct colors
        const newFront = document.getElementById('first-color-picker').value;
        const newBack = document.getElementById('second-color-picker').value;
        this.changeColors('front', newFront);
        this.changeColors('back', newBack);
    }
    moveModal(targetElement){
        //Moves the whole thing elsewhere
    }

}
//Make a handler for each icon
let avatarHandler = new AvatarCustomizationHandler();

const addSelfDestructingEventListener = (element, eventType, callback) => {
    //Add an EventListener that deletes itself when it's called
    //UNUSED
    let handler = () => {
        callback();
        element.removeEventListener(eventType, handler);
    };
    element.addEventListener(eventType, handler);
};
//Func for building comments from reply
const buildComment = (currentNode) => {
    let commentTemplate;
    //Comments made by current user have different buttons
    if (isCurrentUser(currentNode.user.username)) {
        commentTemplate = document.getElementById('you-parent-comment-template');
    } else {
        commentTemplate = document.getElementById('parent-comment-template');
    }
    let clonedComment = commentTemplate.content.cloneNode(true);
    const commentContainer = clonedComment.querySelector('.parent-comment');

    clonedComment.querySelector('.comment-content').textContent = currentNode.content;
    clonedComment.querySelector('.comment-rating').textContent = currentNode.score;
    clonedComment.querySelector('.username').textContent = currentNode.user.username;
    clonedComment.querySelector('.user-avatar').src = `${currentNode.user.image.png}`;
    const avatar = clonedComment.querySelector('.avatar-svg');
    createAvatar(avatar, currentNode.user.avatar)
    const timeAgo = clonedComment.querySelector('.time-ago');
    timeAgo.textContent = convertDateToFromNow(currentNode.createdAt);
    timeAgo.setAttribute('title', new Date(currentNode.createdAt));
    clonedComment.querySelector('.comment-number').textContent = `#${currentNode.id}`;

    //Add Deleted CSS flag to comment if it's deleted
    if (clonedComment.querySelector('.username').textContent == 'Deleted') {
        commentContainer.classList.add('deleted-comment');
        clonedComment.querySelector('.user-avatar').src = './images/avatars/image-deleted.png';
        clonedComment.querySelector('.reply-btn').remove();
    } 
    return clonedComment;
}


const filterCommentPayload = (instance) => {
    //Filters out any unnecessary keys from the instance 
    const allowedKeys = ['commentId', 'parentId', 'userId', 'content', 'payloadType', 'stateChange', 'increment']
    const finalPayload = {};
    Object.keys(instance).forEach(key => {
        if (allowedKeys.includes(key)) {
          finalPayload[key] = instance[key];
        }
      });
    
    return finalPayload;
}   

class SortHandler {
    constructor() {
        this.dropdownElement = document.getElementById('sort-dropdown');
        this.sortMethod = 'new'; //Default
        this.dropdownElement.addEventListener("change", (evt) => this.changeSelection(evt));
    }

    changeSelection(evt){
        const selection = evt.target.value;
        console.log('Sort by: ' + selection);
        //Server request goes here
    }
}
const sortHandler = new SortHandler();

const sendServerCommentPayload = (payload) => {
    //Default is get
    let requestMethod = 'GET';
    switch (payload.typeOfPayload) {
        case 'addComment':
            requestMethod = 'POST'
            break;
        case 'editComment':
        case 'deleteComment':
        case 'changeVote':
            requestMethod = 'PATCH'
            break;
        default:
            break;
    }
    console.log(`payload sent! body: ${payload}, method: ${requestMethod}`);

}




class ServerPayload {
    constructor(commentId) {
        //Types of server submissions: editComment, addComment, deleteComment, changeVote
        this.typeOfPayload;
        this.commentId = commentId;
    }
    messageServer(){
       // console.log (Object.getOwnPropertyNames(this));
        const payload = filterCommentPayload(this);
        //Send the Server the contents of the payload
        console.log(payload);
        this.markForCleanup();

    }
    markForCleanup(){
        //console.log("Payload marked for cleanup!")
        //Method that wipes out the object when a server response is made
    }
}


class AddCommentPayload extends ServerPayload {
    constructor(id, parentId, userId, content){
        //Contents: id, parent ID, userID, content, and type
        super(id);
        this.parentId = parentId;
        this.userId = userId;
        this.content = content;
        this.payloadType = "addComment";
        this.messageServer();
    }
}
class DeleteCommentPayload extends ServerPayload {
    constructor (id, userId){
        //Contents: id, userID, type
        super (id);
        this.userId = userId;
        this.payloadType = "deleteComment";
        this.messageServer();
    }
}

class EditPayload extends ServerPayload {
    constructor (id, userId, content){
        //contents: id, userID, and modified content
        super(id);
        this.userId = userId;
        this.content = content;
        this.payloadType = "editComment";
        this.messageServer();
    }
}
class UpvotePayload extends ServerPayload {
    //Possible pattern: create an array of upvote payloads, and every 60 seconds iterate through them and delete instances
    //with a completed key
    constructor(id, userId, initialStateChange){
        //contents: id, userID of voter, and stateChange
        super(id);
        this.userId = userId;
        //Should only be -1, 0 or +1
        this.initialState = initialStateChange;
        this.stateChange = initialStateChange;
        this.increment = 0;
        this.payloadType = "changeUpvote";
        this.initializeTimer();

    }
    initializeTimer(){
        //anti-spam timer that waits 2 seconds after the last state change before sending server request 

        this.remainingTime = 1;
        this.intervalTimer = setInterval(() => this.updateTimer(), 1000) // this uses the wrong 'this' without arrow function
        //If timer hits 0, send server request
    }
    updateTimer(){

        //Only send server request when the timer is 0, and if the state change is different from original
        if(this.remainingTime <= 0) {
            if (this.initialState != this.stateChange) {
                this.increment = this.stateChange-this.initialState; //The actual increment to send server
                this.messageServer();
                //Figure out the increment to tell server; if you went from +1 to -1, server needs to be sent -2
                
                //Reset the 'original' state to new state since last server reponse
                this.initialState = this.stateChange;
            }
            
            clearInterval(this.intervalTimer);
            this.intervalTimer = null;
        }
        this.remainingTime --;
    }
    updateState(newState){
       
        this.stateChange = newState;
         //If timer isn't running, restart it
        if (!this.intervalTimer) {
            this.initializeTimer();
            //and change the original state change
            
        } 
        this.resetTimer();
    }
    resetTimer(){
        this.remainingTime = 2;
    }
}


const createReplyWindow = (parentComment) => {
    //Create a type window, and place it under the Selected comment REUSE THIS FOR SUBMITTING COMMENT
    //const targetComment = targetButton.closest('.comment');
    const closestParentContainer = parentComment.closest('.comment-tree-grid-container');
    const closestChildContainer = closestParentContainer.querySelector('.child-comment-gridblock');
    let replyCard;
    //Create a new moving reply card if there isn't one already (the one at top does not move inline)
    if (!document.getElementById('reply-card-inline')) {
        replyCard = buildReplyCard();
    } else {
        // This is here bc if it doesn't find it, it throws an error and doesnt focus properly
        replyCard = document.getElementById('reply-card-inline');
        replyCard.querySelector('textarea').value = ''; 
    }//Append to proper location
    closestChildContainer.insertBefore(replyCard, closestChildContainer.firstChild);
    replyCard = document.getElementById('reply-card-inline');
    replyCard.querySelector('textarea').focus();
}

const buildReplyCard = () => {
    const replyCardTemplate = document.getElementById('reply-card-template');
    const clonedCard = replyCardTemplate.content.cloneNode(true);
    clonedCard.querySelector('.user-avatar').src = `${currentUser.image.png}`;
    const submitReplyBtn = clonedCard.querySelector('.add-comment__btn');
    return clonedCard;
}

const convertDateToFromNow = (date) => {
    //Convert Time to how long ago from now
    let returnedDate = '0 seconds ago';
    const commentDate = new Date(date);
    const currentDate = new Date();
    const timeDifference = currentDate.getTime() - commentDate.getTime();
    returnedDate = msToTime(timeDifference);
    return returnedDate;
}

const msToTime = (ms) => {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(ms / (1000 * 60));
    let hours = Math.floor((ms / (1000 * 60 * 60)));
    let days = Math.floor((ms / (1000 * 60 * 60 * 24)));
    let months = Math.floor((ms / (1000 * 60 * 60 * 24 * 30)))
    let years = Math.floor((ms / (1000 * 60 * 60 * 24 * 365)));
    let result;
    if (seconds < 60) result = `${seconds} ${toPlural(seconds, "second")}`;
    else if (minutes < 60) result = `${minutes} ${toPlural(minutes, "minute")}`;
    else if (hours < 24) result = `${hours} ${toPlural(hours, "hour")}`;
    else if (days < 30) result = `${days} ${toPlural(days, "day")}`;
    else if (months < 12) result = `${months} ${toPlural(months, "month")}`;
    else result = `${years} ${toPlural(years, "year")}`
    return result + " ago";
}

const toPlural = (qty, word) => {
    //Add s to word if it's plural
    return `${word}${qty === 1 ? "" : "s"}`
}

//TODO

//SYSTEM: 
//Add ID to currently edited comment "focusedComment" when its focuses, and delete it when another comment is being focused

//SPAM HANDLER OBJECT
//Everytime a request is made, it creates an object holding the request, and updates with new state changes
//Eg. if you press upvote 20 times, it will not contact the server until you stop pressing upvote for 2s, 
//then it will send the final state change to the server
//there will need to be server side spam detection to prevent workarounds (like refreshspamming to get around delay)

//Fetches a batch of comments from server and builds them on the DOM
//Object that handles interaction w the server
class ClientHandler {
    //Possibly unused framework for handling comments and keeping all the handlers together
    constructor(){
        this.totalComments = 0;
        //Nums to determine where the fetch starts and ends 
        this.fetchStart = 0;
        this.FetchEnd = 0;
    }
    initialFetchComments(){
        //initial fetch of comments with default sort method
    }
    fetchComments(){
        //Grab the sort method
        //Fetch the 
    }
}


const FetchComments = (sortBy) =>{
    //Fetch Comments
}
const initializeComments = async() => {
    //Fetches from Server, if that fails populates from test data
    const serverURL = `http://localhost:30550`;//CHANGE THIS to DIFFERENT ADDRESS LATER
    const defaultURL = './data.json';
    const fetchCommentData = async () => {
        return fetch(`${serverURL}/api/comments/get`)
        // JSONify the response
        .then(res => res.json())
        // return the data
        .then(data => data)
        .catch(err => {
            throw new Error("Error contacting server")
        });
    }
    const defaultFetchCommentData = async () => {
        //fetch locally stored placeholder comments
        return fetch(defaultURL)
        // JSONify the response
        .then(res => res.json())
        // return the data
        .then(data => data)
        .catch(err => console.log("Error resolving comments:", err))
    }
    const fetchCommentWrapper = async () => {
        //This tries to contact server, if it can't then it loads the default data
        let result;
        try {
            result = await fetchCommentData();
        } catch (error) {
            //Default function to fetch local data if server is unavailable
            result = await defaultFetchCommentData();
        } finally {
            return result;
        }
    }
    // TODO split currentUser and comments into separate files and change this logic
    const dataResult = await fetchCommentWrapper();
    //Split the recieved data into related fragments
    userData = dataResult.currentUser;
    totalComments = dataResult.totalComments;
    currentUser = dataResult.currentUser; //Will Change this when I have new system 
    sessionStorage.setItem("username", userData.username);
    const commentData = dataResult.comments;
    //Create seperate generalTree obj for each comment tree
    const treeArrays = [];
    //Store each comment tree in treeArrays and 
    commentData.forEach( (el, index) => {
        treeArrays.push(new GeneralTree());
        treeArrays[index].root = commentData[index];
    })
    for (const tree of treeArrays) {
        tree.printTreeAsString();
        //Create the HTML tree and simultaneously create the skeleton of Object Handlers
        tree.preOrderTraversalRecursive(commentsContainer);
    }
    //Move the reply card to top if it isn't already
    moveReplyCard(commentsContainer);
    //Add Evt listener to top comment reply widget
    const replyCardBtn = document.getElementById('reply-card-submit-btn');
    replyCardBtn.addEventListener('click', (e) => {
        //Only call if TextInput isn't empty
        const textArea = document.getElementById('add-comment-textarea');
        if (textArea.value) {
            const content = textArea.value;
            submitParentComment();
            //FIXME: Correct the actual user ID when it's done
            new AddCommentPayload (totalComments, 0, 'admin000', content);
        } 

    });
}
let userData;
//Show the comment Section
initializeComments();

const bugTest = () => {
    showError(401, `You can't do that`);
}

const bugTestLogin = (event) => {
    event.stopImmediatePropagation();

    if (!loginHandler.isOpen){
        loginHandler.openModal();
    }
}

document.querySelector('.bugtest-button').addEventListener('click', bugTest);
document.querySelector('.bugtest-login').addEventListener('click', bugTestLogin)
//INVALID USERNAMES: 'DELETED'
//TODO

//Will Need to change the position of pushing the node to handler list 
//from the tree to the buildComment Function
//When the state changes, read all the comments and update the Data file
//Add way to add comment to node tree and Database simultaneously
//builtComment.querySelector('div').setAttribute('id', 'editMe');
//const currentComment = document.getElementById('editMe');
//currentComment.removeAttribute('id');

//SPAM DETECTION
//Upvotes need to have a timeout on backend
//Limit to number of comments per day
//User can edit no more than 3 comments in a second

//Server-side will need to correct the ID of comments on the server-side, since client side will be wrong
//This might create bugs if the Parent IDs are incorrect client-side I'll think of a way to match
//(Maybe match Parent's text context just to double check)

//Add account creation
//Check if the user is currently logged in when they try to reply on a comment
//stores Username, password, choice of profile pic (only 8)
//PROFILE PIC IDEA: Choose from 1 of 8 images, and assign a random hue to that user (massive amount of variations)
//(random generated profile pics with slightly diff colors)
//fetchData();

 //Possible design pattern
//Build a tiered object system, where each object holds an ID and all the associated button handlers

//Each reply button onclick finds the closest ancestor using closest()
//everything is calculated relative to that
//EG you can insert the reply bar after the comment sibling, you can add the comment
//after the page
//Then separately add/delete entries to the data JSON

//Replies are appended after 'child-comment-gridblock'
let isProd = false; //flag for if testing server in development env
let isOnline = false; //Flag for if server was successfully contacted
//global variable to keep track of where to append new comments, which comment to delete, etc.
const commentsContainer = document.getElementById('comments-section');
//List of comment Nodes, with associated handlers for each one
let currentUser = null;
//clientside var of how many comments in database total there are (for keeping track of ID assignment)
let totalComments;
//IMPORTS GO HERE
import { isCurrentUser, isAdmin, convertDateToFromNow, msToTime, toPlural } from "./modules/helpers.mjs";
import { error, loginModal, background, avi, comment, editWindow, commentSection, settingsModal} from "./modules/clientrendering.mjs";
import getDataFromCookie from "./modules/getDataFromCookie.mjs";
//Function for sending API requests
//import apiRequest, {handleErrors} from './apiRequest.js';
import requestModule, {handleErrors} from './apiRequest.js';
const serverURL = `http://localhost:3000`;//CHANGE THIS to DIFFERENT ADDRESS LATER
const defaultURL = './data.json';

class TokenHandler {
    //Handler for access token that resolves issues with making requests before the request for a new token resolves
    //This clears up bugs where the client makes a request while an async request to update access token is
    //already pending, in this case if the tokenPromise is resolving it waits
    constructor(){
        this.accessToken = null; //Access token
        this.tokenPromise = null; //Promise that tracks resolution of token requests
    }
    async getToken(){
        if (this.accessToken) {
            return this.accessToken; // Return immediately if token alrdy exists
          }
      
          // If token is pending, wait for it to resolve
          if (this.tokenPromise) {
            return await this.tokenPromise;
          }
      
          // Otherwise, start token refresh and set the promise
          this.tokenPromise = requestModule.refreshAccessToken();
          try {
            this.accessToken = await this.tokenPromise;
            return this.accessToken;
          } finally {
            this.tokenPromise = null; // Clear the promise after resolving
          }
    }
    invalidateToken(){
        this.accessToken = null;
    }

}
class CommentTemplate {
    //Class for a comment data for purpose of building user replies
    //it mirrors the same format as a comment pulled from the database so it can be fed into buildComment
    constructor(content, id = totalComments++){
        this.id = id;
        this.content = content;
        this.score = 0;
        this.createdAt = new Date();
        this.username = sessionStorage.getItem('username');
        //CHANGE WHEN USING NEW USERNAME and USER IMAGE SYSTEM
        this.user = {
            avatar: user.avatar,
            username: user.username,
        };
        this.isDeleted = false;
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

            let builtComment = buildComment(currentNode);

            if (!builtComment.querySelector('.deleted-comment')){
                //Create an object for managing handlers if comment isn't deleted
                new CommentNode(currentNode.parentId, currentNode.id, builtComment.querySelector('.parent-comment'), currentNode.user.username, currentNode.initialVote);
            }
            const appendTarget = builtComment.querySelector('.child-comment-gridblock');
            // Add the node to the result array
            // Recursively traverse each of the node's children
            for (const childNode of currentNode.replies) {
                //as the loop bubbles back, append each built comment to its parent in previous scope
                appendTarget.appendChild(traverse(childNode, builtComment));
            }
            if (!currentNode.parentId) {
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

const moveReplyCard = (targetNode) => {
    // if the currentCommentfocus is the comment section moves replycard to top of comments
    const replyCard = document.getElementById('reply-card');
    // target.appendChild(replyCard);
    targetNode.insertBefore(replyCard, targetNode.firstChild);
    // If you use After()you need to get the child to insert after
}

const submitReply = (evt, commentId = totalComments++) => {
    //Add reply Node to DOM, purely visual
    const targetButton = evt.target.closest('button');
    const replyWindow = targetButton.closest('.inline-reply-container'); 
    const parentWrapper = replyWindow.closest('.child-comment-gridblock')
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent, commentId);
    const newComment = buildComment(newNode, true);
    new CommentNode(newNode.parentId, newNode.id, newComment.querySelector('.parent-comment'), newNode.user.username, 1);
    parentWrapper.insertBefore(newComment, replyWindow);
    replyWindow.remove();
}

const buildUserReplyNode = (content, commentId) => {
    //creates a new template Node that is compatible with the buildComment Function
    return new CommentTemplate(content, commentId);
}

const submitParentComment = (commentId = 1) => {
    const replyWindow = document.getElementById('reply-card');
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent, commentId);
    const newComment = buildComment(newNode, true);
    new CommentNode(newNode.parentId, newNode.id, newComment.querySelector('.parent-comment'), newNode.user.username, 1)
    const sortByWidget = document.getElementById('sort-by-dropdown');
    sortByWidget.after(newComment);
    replyWindow.querySelector('.submit-comment__input').value = '';
}

const commentButtonHandler = (evt, username) => {
    //Determines which button on the comment was clicked
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
    //Tracks ID and Parent ID with associated HTML element node, and associated handlers
    constructor (parentId, id, linkedCommentEl,username, initialState = 0) {
        // store the id and parent ID of the comment
        this.id = id;
        this.parentId = parentId;
        this.linkedCommentEl = linkedCommentEl;
        this.username = username;
        this.upvoteHandler = null;
        this.serverRequestHandler = null;
        this.init(initialState);
        this.clickListener = this.linkedCommentEl.addEventListener('click', (evt) => this.onClick(evt)); 
        // the arrow func is bc arrow funcs do not have their own 'this' but reg functions do in an eventlistener
    }
    init(initialState){
        //Create all the handlers
        this.upvoteHandler = new UpvoteHandler(this.linkedCommentEl.querySelector('.vote-container'), this.id);
        this.upvoteHandler.changeInitialVote(initialState);
    }
    onClick(evt){
        //Determine which button was clicked then determine which handler to pass it to
        const whichBtn = commentButtonHandler(evt, this.username);
        //All these buttons require you to be logged in, so check for login first
        if (user.isLoggedIn) {
            switch (whichBtn) {
                case 'vote':
                    this.upvoteHandler.onClick(evt);
                    //Send event to upvote Handler
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
        } else {
            //Prompt to login instead
            evt.stopImmediatePropagation();
            error.showError("You need to log in")
            if (!user.loginHandler.isOpen){
                user.openLoginModal();
            }
        }

    }
    createReplyHandler(){
        //If there isn't already a replyhandler, initialize it
        if (!user.replyHandler) {
            user.replyHandler = new ReplyHandler(this.id, this.linkedCommentEl);
        } else {
            //Otherwise update it with new object info
            user.replyHandler.updateParentObjectData(this.id, this.linkedCommentEl);
        }
        user.replyHandler.repositionReplyCard(this.linkedCommentEl);
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
        this.isOwner = false;
        if (this.upvoteBtn.closest('.comment').querySelector('.you-flag')) this.isOwner = true;
    }
    onClick(evt){
        //This if statement wrapper catches exceptions
        //Determine how to update the state
        //Create an Upvote Payload 
        
        if (!this.spamHandler) this.spamHandler = new UpvotePayload(this.id, user.id, this.state, this.isOwner ) 
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
    updateVisual(newState, changeNum = true) {
        //Change which button is highlighted based on what state it is
        const score = this.buttonWidget.querySelector('.comment-rating');
        switch (this.state) {
            case -1:
                this.downvoteBtn.classList.add("active");
                this.upvoteBtn.classList.remove("active");
                if (changeNum == true) score.textContent = parseInt(score.textContent) + newState;
                break;
            
            case 0:
                this.upvoteBtn.classList.remove("active");
                this.downvoteBtn.classList.remove("active");
                if (changeNum == true) score.textContent = parseInt(score.textContent) - newState;
                break;
            
            case 1:
                this.upvoteBtn.classList.add("active");
                this.downvoteBtn.classList.remove("active");
                if (changeNum == true) score.textContent = parseInt(score.textContent) + newState;
                break;

            default:
                break;
        }
    }
    changeInitialVote(initialVote = 0){
        //Change the visual state of the upvote indicator w/o msging server
        //Also dont increment score if message comes from server
        //Change the vote if this.isOwner is true;
        //and
        let changeNum = this.isOwner? true : false;
        if (this.isOwner && initialVote == 0 ){
            this.state = 1;
            this.updateVisual(1, false);
        }
        if (initialVote === 1) {
            this.state = 1;
            this.updateVisual(1, changeNum);
        } else if (initialVote === -1) {
            this.state = -1;
            this.updateVisual(-1, changeNum);
        }
    }

}

class ReplyHandler {
    //Single reply handler object that is loosely attached to the corresponding parent comment via parentID and linked element
    constructor(parentId, parentComment) {
        //The ID of the parent comment that the reply will be appended to
        this.parentId = parentId;
        //The ID of the potential new Comment
        this.id = null;
        this.replyCard = null;
        this.submitReplyButton = null;
        this.cancelReplyButton = null;
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
        this.cancelReplyButton = this.replyCard.querySelector('.cancel-reply__btn');
        this.detachListener();
        this.attachListener();
    }
    attachListener(){
        this.submitReplyButton.addEventListener('click', this.onClickReply, {capture: true});
        this.cancelReplyButton.addEventListener('click', this.onClickCancel,{capture: true});

    }
    detachListener(){
        this.submitReplyButton.removeEventListener('click', this.onClickReply, {capture: true});
        this.cancelReplyButton.removeEventListener('click', this.onClickCancel,{capture:true});

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
            //Different routes for if Website is online or not
            if (isOnline) {
                //Message Server
                let data = JSON.stringify({
                    parentId: this.parentId,
                    content: textArea.value

                });
                //send add comment request to server
                requestModule.request(serverURL + '/api/comments/add', 'POST', data, 1).then(handleErrors)
                .then(response => {
                    response.json()
                    .then(json =>{
                        submitReply(evt, json.id);
                    }) 
                })
                .catch(err => {
                    handleServerProblem(err);
                });
            } else {
                //Build the HTML node of Comment
                submitReply(evt);
               //Update the ID before sending server request
                this.id = totalComments;
                new AddCommentPayload(this.id, this.parentId, textArea.value);
            }

        }
        //payload: Parent comment ID, current user ID, current comment ID (resolve serverside), content of comment
    }
    onClickCancel = (evt) => {
        //Cancel the reply and close window
        this.replyCard.remove();
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
        const data = JSON.stringify({
            id: this.id,
            content: newContent
        });
        requestModule.request(serverURL + '/api/comments/edit', "POST", data, user.tokenHandler.getToken()).then(handleErrors)
        .then(response => {
            if (response.ok) editWindow.update(this.targetComment);
        })
        .catch(err => {
            handleServerProblem(err);
        });
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
            editWindow.toggle(this.targetComment);
            this.targetComment.querySelector('.edit-comment-input').focus();
        }
    }
    closeEditWindow() {
        if (this.isOpen){
            editWindow.toggle(this.targetComment);
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
    onClickDeleteComment(targetComment){
        const data = JSON.stringify({id: this.id})
        requestModule.request(serverURL + "/api/comments/delete", "POST", data, 1 ).then(handleErrors)
        .then(response => {
            if(response.ok) comment.delete(targetComment);
        })
        .catch(err => {
            handleServerProblem(err)
        });
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
            background.fade();
        }
    }
    hideModal(){
        if (this.isOpen){
            this.cleanUp();
            background.unfade();
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

//let loginHandler;
class genericModal {
    //CURRENTLY UNUSED
    //A generic modal that streamlines the multiple modals I have (settings, register etc )
    constructor(){
        this.isOpen
        this.typeOfModal = null; //What the window is being used for
        this.addEventListeners();
    }
    addEventListeners(){

    }
    handleGlobalClick(){

    }
    openModal(){

    }
    closeModal(){

    }

}

class settingsHandler {
    constructor(){
        this.isOpen = false;
        this.container = document.querySelector('.settings-modal');
        this.addEventListeners();
        this.currentSettings = {}//Store the original Settings
        // this.updatedSettings = {}//The changed settings
    }
    addEventListeners(){
        document.getElementById("settingsForm").addEventListener('submit', this.saveSettings);
    }
    // updateSetting(key, value){
    //     if (this.currentSettings[key] !== value){
    //         this.updatedSettings[key] = value;
    //     }
    // }
    async saveSettings(event){
        //Send server request to change settings

        //prevent default form submission
        if (event) event.preventDefault();//prevent default form submission
        // if (Object.keys(this.updatedSettings).length === 0){
        //     console.log("no changes, skipping");
        //     return;
        // }
        let updatedSettings = {
            nightMode: document.getElementById('nightModeButton').checked,
            avatar: {
                portrait: user.settingsHandler.container.querySelector('input[name="aviChoice"]:checked').value,
                firstColor: user.settingsHandler.container.querySelector('#first-color-picker').value,
                secondColor: user.settingsHandler.container.querySelector('#second-color-picker').value
            }
        }
        let payload = JSON.stringify(updatedSettings);
        try {
            requestModule.request(serverURL +'/api/users/save-settings', 'POST', payload, 1)
            .then(handleErrors)
            .then(response => {
                response.json()
                .then(json => {
                    user.settingsHandler.closeModal();
                    error.showError("Settings Saved");
                })
            })
        } catch (error) {
            
        }
    
    }
    handleGlobalClick(evt){
        //If the click did not start inside the modal or end inside the modal
        if (user.settingsHandler.isOpen && (!evt.target.closest('.modal') && !globalClick.startedInsideModal)){
            user.settingsHandler.closeModal(); 
            globalClick.reset();
            //'this' refers to the event, so need to use settingsHandler
            let avatar = {
                portrait: document.querySelector('input[name="aviChoice"]:checked').value,
                firstColor: document.getElementById('first-color-picker').value,
                secondColor: document.getElementById('second-color-picker').value
                }
            
        }
    }
    openModal(){
        //Open the modal
        settingsModal.show();
        //If the avi customizer exists somewhere move it to this container otherwise make new one
        if (document.querySelector('.avatar-customization-container') && !this.container.contains(document.querySelector('.avatar-customization-container'))){
            avatarHandler.moveModal(document.getElementById('settingsCustomizationContainer'))
        } else if (!document.querySelector('.avatar-customization-container')){
            avi.displayCustomUI(document.getElementById('settingsCustomizationContainer'));
        }
        document.addEventListener('mouseup', this.handleGlobalClick);
        document.addEventListener('mousedown', trackMouseDown);
        this.isOpen = true;
        avatarHandler.refreshColors(1);
    }
    closeModal(){
        settingsModal.hide();
        this.isOpen = false;
        this.cleanUp();
    }
    cleanUp(){
        //Remove eventlisteners and clean form inputs
        document.removeEventListener('mouseup', this.handleGlobalClick);
        document.removeEventListener('mousedown', trackMouseDown);

    }
}
class LoginHandler {
    constructor(){
        this.isOpen = false;
        this.addEventListeners();
        //Add the customization widget to the Login Modal
        this.container = document.querySelector('.login-modal');
        avi.displayCustomUI(document.getElementById('registerCustomizationContainer'));
    }
    addEventListeners(){
        document.getElementById('loginForm').addEventListener('submit', this.submitLogin );
        document.getElementById('registerForm').addEventListener('submit', this.submitRegister);
    }
    async submitLogin(event){
        if (event) event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        let data = JSON.stringify({ username, password});
        //Send request
        requestModule.request(serverURL + '/api/users/login', 'POST', data).then(handleErrors)
        .then(response => {
            response.json()
            .then(json => {
                //Possibly remove this
                user.login(true, json.token, json.id, json.username, json.avatar)
                user.loginHandler.closeModal();
                location.reload();
            });
        })
        .catch(err => {
            handleServerProblem(err);

        });
 
    }
    async submitRegister(event){
        console.log("register button clicked");
        //Await server response
        //If registration is successful, submit a login request as well
        event.preventDefault(); // Prevent the default form submission
        let username =document.getElementById('registerUsername').value;
        let password = document.getElementById('registerPassword').value;
        let avatar = {
                    portrait: document.querySelector('input[name="aviChoice"]:checked').value,
                    firstColor: document.getElementById('first-color-picker').value,
                    secondColor: document.getElementById('second-color-picker').value
                    }
        const data = JSON.stringify({ username, password, avatar});
        requestModule.request(serverURL + '/api/users/signup', 'POST', data).then(handleErrors)
        .then(response =>{
            response.json()
            .then(json => {
                //possibly remove this
                user.login(true, json.token, json.id, json.username, json.avatar);
                user.loginHandler.closeModal();
                location.reload();
            })
        })
        .catch(err => {
            handleServerProblem(err);
        });
    }
    handleGlobalClick(evt){
        //If the click did not start inside the modal or end inside the modal
        if (user.loginHandler.isOpen && (!evt.target.closest('.modal') && !globalClick.startedInsideModal)){
            user.loginHandler.closeModal(); 
            globalClick.reset();
            //'this' refers to the event, so need to use loginHandler
        }
    }

    openModal(){
        //Open the modal
        loginModal.show();
        //If its missing move it to right spot otherwise make new one
        if (document.querySelector('.avatar-customization-container')&& !this.container.contains(document.querySelector('.avatar-customization-container'))){
            avatarHandler.moveModal(document.getElementById('loginCustomizationContainer'))
        } else if (!document.querySelector('.avatar-customization-container')){
            avi.displayCustomUI(document.getElementById('loginCustomizationContainer'));
        }
        document.addEventListener('mouseup', this.handleGlobalClick);
        document.addEventListener('mousedown', trackMouseDown);
        this.isOpen = true;
        avatarHandler.refreshColors();
    }
    closeModal(){
        loginModal.hide();
        this.isOpen = false;
        this.cleanUp();
    }
    cleanUp(){
        //Remove eventlisteners and clean form inputs
        document.removeEventListener('mouseup', this.handleGlobalClick);
        document.removeEventListener('mousedown', trackMouseDown);

    }
}
const trackMouseDown = (evt) => {
    //These functions store where the mouse was when you first clicked
    //so you can click on modal and drag mouse off and it won't close modal
    globalClick.isInsideModal(evt);
}
const globalClick = {
    startedInsideModal: false,
    isInsideModal(evt){
        this.startedInsideModal = evt.target.closest('.modal')? true : false;
    },
    reset(){
        this.startedInsideModal = false;
    }
}

class SortHandler {
    constructor() {
        this.dropdownElement = document.getElementById('sort-dropdown');
        this.dropdownElement.addEventListener("change", (evt) => this.changeSelection(evt));
    }
    changeSelection(evt){
        user.sortMethod = evt.target.value;
        console.log('user sort By: ' + user.sortMethod);
        fetchComments()
        .then (response => {
            renderComments(response.commentTree);
        })
    }
}

const getButtonName = (element, buttonName) => {
    //Provided with an element and category of button (eg tray buttons, comment buttons)
    //This finds and returns the identifier of the button for handling
    // Check if the element has any class that starts with "buttonName-"
    for (const className of element.classList) {
        if (className.startsWith(`${buttonName}-`)) {
            // Use a regular expression to extract the variable word
            const match = className.match(/^tray-(.+?)-/);
            if (match) {
                return match[1]; // Return the variable word
            }
        }
    }
    return null; // Return null if no matching class is found
}
const headerClickHandler = (evt) => {
    evt.stopImmediatePropagation();

    if (evt.target.closest('button')) {
        return getButtonName (evt.target.closest('button'), "tray");

    } else {
        return null;
    }
}
class HeaderHandler {
    //Handler for the buttons in the header
    constructor(){
        document.querySelector('.utility-nav-tray').addEventListener('click', (evt) => this.onClick(evt))
    }

    onClick(evt){
        const whichBtn = headerClickHandler(evt);
        switch (whichBtn) {
            case 'login':
                this.clickLogin();
                break;
            case 'logout':
                this.clickLogout();
                break;
            case 'settings':
                this.clickSettings();
                break;
            case 'profile':
                this.clickProfile();
                break;
            default:
                break;
        }
    }
    clickLogin(){

        if (!user.isLoggedIn && !user.loginHandler.isOpen){
            user.loginHandler.openModal();
        }
    }
    clickLogout(){
        //log the user out
        user.logout();
    }
    clickSettings(){
        //Open settings modal
        if (user.isLoggedIn &&!user.settingsHandler.isOpen) user.settingsHandler.openModal();
    }
    clickProfile(){
        if (!user.isLoggedIn && !user.loginHandler.isOpen) {
            //If not logged in, it opens login modal
            user.loginHandler.openModal();
        } else {
            //otherwise it opens user profile modal
        }
        //Open Profile modal
    }
    login(){
        //Hide the elements that shouldnt be shown when you're logged in
        document.querySelector('.tray-login-btn').classList.add('hidden');
        document.querySelector('.tray-settings-btn').classList.remove('hidden');
        document.querySelector('.tray-logout-btn').classList.remove('hidden');
        let headerAvis = document.getElementsByClassName('avatar-svg user-avi');
        for (let i = 0; i < headerAvis.length; i++) {
            avi.create(headerAvis[i], user.avatar)
        };
    }
    logout(){
        console.log("headerhandler logout called");
        //Hide the elements that shouldnt be shown when you're logged out
        document.querySelector('.tray-login-btn').classList.remove('hidden');
        document.querySelector('.tray-settings-btn').classList.add('hidden');
        document.querySelector('.tray-logout-btn').classList.add('hidden');
        let headerAvis = document.getElementsByClassName('avatar-svg user-avi');
        for (let i = 0; i < headerAvis.length; i++) {
            headerAvis[i].querySelector('.background-circle').setAttribute('fill', '#000000')
            let el = headerAvis[i].querySelector('.first');
            if (el) el.remove();
        };
    }
}


class UserHandler {
    //Object for organizing all the handlers into one spot
    constructor(){
        this.sortMethod = 'new'; //top, new or old

        this.totalComments = 0; //Tally of total comments for purpose of keeping track of totals
        //List of handlers
        this.loginHandler;
        this.replyHandler;
        this.sortHandler ;
        this.headerHandler;
        this.isLoggedIn = false;
        this.tokenHandler = null; //Handler for token and requests
        this.id = null;
        this.username = null;
        this.avatar = null;
    }
    async checkLoginStatus(){
        //Send refresh token to server to see if the user is logged in
        try {
            const response = await fetch (`${serverURL}/api/users/refresh/check-auth`, {
                method: "GET",
                credentials: "include", //Sends the cookie!
            });

            const data = await response.json();
            if (data.loggedIn) {
                this.isLoggedIn = true;

                //Get an access token as well
                const token = await this.tokenHandler.getToken();
                this.setAccessToken(token);
                //update user data
                this.login(true, token, data.id, data.username, data.avatar)
            } else {
                this.isLoggedIn = false;
                this.updateStates(false)
            }
        } catch (err){
            console.error("Error checking login status:", err);
        }

        //Update page state to be visually logged out or in
        if (this.isLoggedIn) {
            this.updateStates(true);
        } else {
            this.updateStates(false);
        }
    }
    openLoginModal(){
        this.loginHandler.openModal();
    }

    login (isLoggedIn, token, id, username, avatar){
        //change user state to logged in
        this.isLoggedIn = isLoggedIn;
        this.tokenHandler.accessToken = token; 
        this.id = id;
        this.username = username;
        this.avatar = avatar;
        //document.cookie = "token=" + token + "; path=/";
        document.cookie = "userId=" + id + "; path=/";
        document.cookie = "name=" + username + "; path=/";
        localStorage.setItem("username", username);
        localStorage.setItem("avatar", JSON.stringify(avatar));
        this.updateStates(true)
    }
    async logout(){
        //change user state to logged out

        //send server request to clear logout token
        try {
            const response = await fetch(`${serverURL}/api/users/logout`, {
              method: "POST",
              credentials: "include", // Ensures cookies are sent!
            });
            const data = await response.json();
            if (data.message === "Logged out") {
                user.isLoggedIn = false;
                user.id = null;
                console.log ("logged out");
                document.cookie = "userId =; expires = 12-12-1998; path=/;";
                document.cookie = "name =; expires = 12-12-1998; path=/";
                localStorage.removeItem("username");
                localStorage.removeItem("avatar");
                this.updateStates(false);
                location.reload();

            }     
       
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }
    requestUserInfo(){
        //Depreciated, just log out the user if theres an error
        //request user info from the server
        requestModule.request(serverURL + '/api/users/validate'+ this.id, 'GET', null, 1)
        .then(handleErrors)
        .then(response => {
            user.login(true, user.tokenHandler.getToken(), response.id, response.username, response.avatar)
        })
        .catch(err => {
            error.showError(err, 400)
            //Log out if theres an error
        });
    }
    updateStates(loggedIn){
        //updates states of all the elements that change whether logged in or not
        if (loggedIn) {
            this.headerHandler.login();
        } else {
            this.headerHandler.logout();
        }
    }
    setAccessToken(token){
        this.tokenHandler.accessToken = token;
        console.log("access token refreshed");
    }
    reLogin(){
        //If theres an error with tokens log out user and prompt them to log in again
        user.updateStates(false);
        user.loginHandler.openModal();
        error.showError("An error occured, please log in again");
    }
}
const user = new UserHandler();
requestModule.setUser(user);
user.loginHandler = new LoginHandler();
user.settingsHandler = new settingsHandler();
user.sortHandler = new SortHandler();
user.headerHandler = new HeaderHandler();
user.tokenHandler = new TokenHandler();
await user.checkLoginStatus();
//These are declared afterwards to prevent undefined errors

const handleServerProblem =(error) => {
    const {response} = error;
    response.json().then(body => {
        switch (body.message) {
            case 'Refresh token failure':
                console.error("Refresh token error. logging out");
                user.reLogin();
                break;
            case 'Unauthorized':
                if (!user.loginHandler.isOpen) {
                    user.openLoginModal();
                }
                break;
            default: 
                console.error(`API Error: ${body.message}`);
        }
    });
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
        this.container = document.querySelector('.avatar-customization-container');
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
        //iterate over each button and change the colors for each
        if (whichColor == 'front') {
            this.Buttons.forEach(icon => icon.changeFirst(newColor));
        } else if (whichColor == 'back') {
            this.Buttons.forEach(icon => icon.changeSecond(newColor));
            
        }
    }
    refreshColors(input = null){
        //When the modal Opens, get the correct colors
        let newFront;
        let newBack;
        if (input) {
             newFront = user.avatar.firstColor;
             newBack = user.avatar.secondColor;
        } else {
             newFront = document.getElementById('first-color-picker').value;
             newBack = document.getElementById('second-color-picker').value;
        }
      
        this.changeColors('front', newFront);
        this.changeColors('back', newBack);
    }
    moveModal(targetContainer){
        //Moves the whole thing elsewhere
        targetContainer.appendChild(this.container);
    }

}
//Make a handler for each icon
let avatarHandler = new AvatarCustomizationHandler();


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
    //clonedComment.querySelector('.user-avatar').src = `${currentNode.user.image.png}`;
    const avatar = clonedComment.querySelector('.avatar-svg');
    avi.create(avatar, currentNode.user.avatar);
    const timeAgo = clonedComment.querySelector('.time-ago');
    timeAgo.textContent = convertDateToFromNow(currentNode.createdAt);
    timeAgo.setAttribute('title', new Date(currentNode.createdAt));
    //clonedComment.querySelector('.comment-number').textContent = `#${currentNode.id}`;
    //Add Deleted CSS flag to comment if it's deleted
    if (clonedComment.querySelector('.username').textContent == 'Deleted') {
        commentContainer.classList.add('deleted-comment');
        //clonedComment.querySelector('.user-avatar').src = './images/avatars/image-deleted.png';
        clonedComment.querySelector('.reply-btn').remove();
    } 
    return clonedComment;
}


const filterCommentPayload = (instance) => {
    //Filters out any unnecessary keys from the instance 
    const allowedKeys = ['commentId', 'parentId', 'content', 'stateChange', 'increment']
    const finalPayload = {};
    Object.keys(instance).forEach(key => {
        if (allowedKeys.includes(key)) {
          finalPayload[key] = instance[key];
        }
      });
    
    return finalPayload;
}   
class UpvotePayload {
    //Possible pattern: create an array of upvote payloads, and every 60 seconds iterate through them and delete instances
    //with a completed key
    constructor(id, userId, initialStateChange, isOwner){
        //contents: id, userID of voter, and stateChange
        this.commentId = id;
        this.userId = userId;
        //Should only be -1, 0 or +1
        this.initialState = initialStateChange;
        this.stateChange = initialStateChange;
        this.increment = 0;
        this.isOwner = isOwner;
        this.initializeTimer();
    }
    messageServer(){
        // console.log (Object.getOwnPropertyNames(this));
         const payload = filterCommentPayload(this);
         const data = JSON.stringify ({
            id: this.commentId,
            stateChange: this.stateChange,
            increment: this.increment,
            initialState: this.initialState,
         })
         //Only send server request if the vote is made on a comment not owned by the User
        if (!this.isOwner) {
            requestModule.request(serverURL + '/api/comments/vote', "POST", data, 1).then(handleErrors)
            .then (response => {
                //add sound effect or something idk
            })
            .catch (err => {
                handleServerProblem(err);
            })
        }
         console.log(this.isOwner);
         console.log(data);
 
         this.markForCleanup();
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
    markForCleanup(){
        //console.log("Payload marked for cleanup!")
        //Method that wipes out the object when a server response is made
    }
}
class ServerPayload {
    //These are currently unused, just here as a historical document of previous design pattern
    //Except for the upvote payload, I am still using the spam-protection
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
    constructor(id, parentId, content){
        //Contents: id, parent ID, userID, content, and type
        super(id);
        this.parentId = parentId;
        //this.userId = userId; //unnecessary
        this.content = content;
        //this.payloadType = "addComment";
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
// class UpvotePayload extends ServerPayload {
//     //Possible pattern: create an array of upvote payloads, and every 60 seconds iterate through them and delete instances
//     //with a completed key
//     constructor(id, userId, initialStateChange){
//         //contents: id, userID of voter, and stateChange
//         super(id);
//         this.userId = userId;
//         //Should only be -1, 0 or +1
//         this.initialState = initialStateChange;
//         this.stateChange = initialStateChange;
//         this.increment = 0;
//         this.payloadType = "changeUpvote";
//         this.initializeTimer();
//     }
//     initializeTimer(){
//         //anti-spam timer that waits 2 seconds after the last state change before sending server request 

//         this.remainingTime = 1;
//         this.intervalTimer = setInterval(() => this.updateTimer(), 1000) // this uses the wrong 'this' without arrow function
//         //If timer hits 0, send server request
//     }
//     updateTimer(){

//         //Only send server request when the timer is 0, and if the state change is different from original
//         if(this.remainingTime <= 0) {
//             if (this.initialState != this.stateChange) {
//                 this.increment = this.stateChange-this.initialState; //The actual increment to send server
//                 this.messageServer();
//                 //Figure out the increment to tell server; if you went from +1 to -1, server needs to be sent -2
                
//                 //Reset the 'original' state to new state since last server reponse
//                 this.initialState = this.stateChange;
//             }
            
//             clearInterval(this.intervalTimer);
//             this.intervalTimer = null;
//         }
//         this.remainingTime --;
//     }
//     updateState(newState){
       
//         this.stateChange = newState;
//          //If timer isn't running, restart it
//         if (!this.intervalTimer) {
//             this.initializeTimer();
//             //and change the original state change 
//         } 
//         this.resetTimer();
//     }
//     resetTimer(){
//         this.remainingTime = 2;
//     }
// }

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
    if (user.isLoggedIn) {
        //if theres a current user update the user
        const avatar = clonedCard.querySelector('.avatar-svg');
        avi.create(avatar, user.avatar);
        //TODO: Change this to the user from server

    } else {
        const avatar = clonedCard.querySelector('.avatar-svg');
        avi.create(avatar, currentUser.avatar);
        }
    const submitReplyBtn = clonedCard.querySelector('.add-comment__btn');
    return clonedCard;
}

//Fetches a batch of comments from server and builds them on the DOM
//Object that handles interaction w the server

const fetchComments = async () =>{
    //Fetch Comments
    return requestModule.request(serverURL + '/api/comments/get/' + user.sortMethod, "GET", null, user.tokenHandler.accessToken).then(handleErrors)
    .then(response => response.json())
    .then(data => data)
    .catch(err => {
        handleServerProblem(err);
    });
}
const renderComments = async (commentData) => {
    //
    commentSection.clear();
    const treeArrays = [];

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
}
const initializeComments = async() => {
    // initial fetching of comments on page load

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
            result = await fetchComments();
            isProd = true;
            isOnline = true;
            document.querySelector('.online-status').textContent = 'Online';
        } catch (error) {
            //Default function to fetch local data if server is unavailable
            isProd = false;
            isOnline = false;
            document.querySelector('.online-status').textContent = 'Offline';
            result = await defaultFetchCommentData();
        } finally {
            return result;
        }
    }
    // TODO split currentUser and comments into separate files and change this logic
    const dataResult = await fetchCommentWrapper();
    //Split the recieved data into related fragments
    let commentData;
    if (isOnline) {
        commentData = dataResult.commentTree;
    } else {
        //Otherwise work off Default Data
        userData = dataResult.currentUser;
        user.avatar = userData.avatar;
        totalComments = dataResult.totalComments;
        currentUser = dataResult.currentUser; //Will Change this when I have new system 
        sessionStorage.setItem("username", userData.username);
        commentData = dataResult.comments;

    }  
    //Store each comment tree as an entry in treeArrays
    renderComments(commentData);
    // const treeArrays = [];

    // commentData.forEach( (el, index) => {
    //     treeArrays.push(new GeneralTree());
    //     treeArrays[index].root = commentData[index];
    // })
    // for (const tree of treeArrays) {
    //     tree.printTreeAsString();
    //     //Create the HTML tree and simultaneously create the skeleton of Object Handlers
    //     tree.preOrderTraversalRecursive(commentsContainer);
    // }
    // //Move the reply card to top if it isn't already
    // moveReplyCard(commentsContainer);
    //Add Evt listener to top comment reply widget
    const replyCardBtn = document.getElementById('reply-card-submit-btn');
    replyCardBtn.addEventListener('click', (e) => {
        //Only call if TextInput isn't empty
        const textArea = document.getElementById('add-comment-textarea');
        if (textArea.value) {
            const content = textArea.value;
            if (isOnline) {
                //Message Server
                let data = JSON.stringify({
                    parentId: null,
                    content: textArea.value,
                    id: user.id
                });
                //send add comment request to server
                requestModule.request(serverURL + '/api/comments/add', 'POST', data, 1).then(handleErrors)
                .then(response => {

                    response.json()
                    .then(json =>{
                        console.log(json);
                        submitParentComment(json.id);
                    })
                })
                .catch(err => {
                    handleServerProblem(err);
                });
            } else {
                //Build the HTML node of Comment
                submitParentComment();
                new AddCommentPayload (totalComments, null, content);
            }

        } 
    });
}
let userData;
//Show the comment Section
initializeComments();

const bugTest = () => {
    error.showError('You cant do that', 404);
}

const bugTestLogin = (event) => {
    event.stopImmediatePropagation();

    if (!user.loginHandler.isOpen){
        user.loginHandler.openModal();
    }
}
const bugTestGeneral = (evt) => {
    console.log("bugtest");
  const test = localStorage.getItem("blahblah");
  const test2 = getDataFromCookie("blah");
  const test3 = JSON.parse(localStorage.getItem("avatar"));
    console.log(test3);
}
document.querySelector('.bugtest-button').addEventListener('click', bugTest);
document.querySelector('.bugtest-login').addEventListener('click', bugTestLogin);
document.querySelector('.bugtest-general').addEventListener('click', bugTestGeneral);
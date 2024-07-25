//Things that are different on user comment
//the "you" icon between username and time-ago,
//A delete button before reply button
//the reply button is instead an Edit button
//the upvote downvote buttons are disabled

//Replies are appended after 'child-comment-gridblock'

//global variable to keep track of where to append new comments, which comment to delete, etc.
let currentCommentFocus = document.getElementById('comments-section');
const commentsContainer = document.getElementById('comments-section');
//List of comment Nodes, with associated handlers for each one
const commentsList = [];
const editHandlers = [];
let currentUser = null;
//global variable for saving text and node when editing comment
let savedText = '';
const upvoteHandlers = [];
//clientside var of how many comments in database total there are (for keeping track of ID assignment)
let totalComments;
//IMPORTS GO HERE
let testvar = null;
class CommentTemplate {
    //Class for a comment data for purpose of building replies
    //it mirrors the same format as a comment pulled from the database so it can be fed into buildComment
    constructor(content){
        this.id = ++totalComments;
        this.content = content;
        this.score = 0;
        this.createdAt = new Date();
        this.username = sessionStorage.getItem('username');
        //CHANGE WHEN USING NEW USERNAME and USER IMAGE SYSTEM
        this.user = {
            username: sessionStorage.getItem('username'),
            image: userData.image   
        };
    }
}
class GeneralTree {
    //A single tree of comments with a root parent and children
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

            console.log(`build comment ${currentNode.id} and Comment Object here`);
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
                //as the loop bubbles back, append each built comment to it's parent in previous scope
                appendTarget.appendChild(traverse(childNode, builtComment));
            }
            if (!currentNode.parentId) {
                console.log("root comment is appended to DOM here");
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
        //This creates the parallel object tree with associated handlers
        return;
    }
}

const replyClick = (targetButton) => {
    //Create a type window, and place it under the Selected comment REUSE THIS FOR SUBMITTING COMMENT
    const targetComment = targetButton.closest('.comment');
    const closestParentContainer = targetComment.closest('.comment-tree-grid-container');
    const closestChildContainer = closestParentContainer.querySelector('.child-comment-gridblock');
    let replyCard;
    // Create a new moving reply card if there isn't one already (the one at top does not move inline)
    if (document.getElementById('reply-card-inline')) {
        replyCard = document.getElementById('reply-card-inline');
        replyCard.remove();
    }
    replyCard = buildReplyCard();
    //Old system that moved reply card, new one always deletes and makes new one (to avoid duplicate eventListeners)
    // if (!document.getElementById('reply-card-inline')) {
    //     replyCard = buildReplyCard();
    // } else {
    //     // This is here bc if it doesn't find it, it throws an error and doesnt focus properly
    //     replyCard = document.getElementById('reply-card-inline')
    // }
    
    //Append to proper location
    closestChildContainer.insertBefore(replyCard, closestChildContainer.firstChild);
    replyCard = document.getElementById('reply-card-inline');
    replyCard.querySelector('textarea').focus();
}

const editClick = (targetButton) => {
    //Hide the Comment Content and unhide the TypeArea and resubmit button
    const targetComment = targetButton.closest('.comment');
    //Close previous edit window if it's still open
    currentCommentFocus = targetComment;
    const commentContent = targetComment.querySelector('.text-container');
    const editContent = targetComment.querySelector('.edit-container');
    savedText = targetComment.querySelector('.comment-content').textContent;
    editContent.querySelector('.edit-comment-input').value = savedText;
    toggleEditVisibility(targetComment);
    targetComment.querySelector('.edit-comment-input').focus();
    savedText = targetComment.querySelector('.comment-content').textContent;
    const submitEditBtn = targetComment.querySelector('.edit-btn');
    //closes edit window when user clicks away
    document.addEventListener('click', globalListenerWrapper); 
}
const globalListenerWrapper = (evt) => {
    //Need the wrapper to pass multiple args into handleGlobalClick
    handleGlobalClick(evt, currentCommentFocus);
}
const handleGlobalClick = (evt, targetComment) => {
    if (!targetComment.contains(evt.srcElement)){
        closeEditWindow(targetComment);
        document.removeEventListener('click', globalListenerWrapper);
    }
} 

const closeEditWindow = (targetComment) => {
    //Reset everything to normal
    try {
        toggleEditVisibility (targetComment);
    } catch (error) {
        console.log(error);
    }
}

const toggleEditVisibility = (targetComment) => {
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
    //Server update goes HERE
}

const isCurrentUser = (input) => {
    // Check if a variable is current user
    const currentUser = sessionStorage.getItem('username');
    return input == currentUser ? true : false;
}

const isAdmin = () => {
    return false;
}

const openDeleteModal = (currentButton) => {
    document.querySelector('.delete-comment-modal').style.display='block';
    const currentComment = currentButton.closest('.comment');
    document.querySelector ('.confirm-delete-btn').addEventListener ('click', (e) => {
        deleteComment(currentComment);
    });
    document.querySelector ('delete-comment-modal .cancel-btn');
}

const deleteComment = (currentComment) => {
    //TODO: if it was deleted before sent to server delete it completely, otherwise leave it in tree
    currentComment.classList.add('deleted-comment');
    currentComment.querySelector('.comment-content').textContent = "This Comment has been deleted";
    currentComment.querySelector('.user-avatar').src = './images/avatars/image-deleted.png';
    currentComment.querySelector('.username').textContent = 'Deleted';
    cleanupDeletedComment(currentComment);
    document.querySelector('.delete-comment-modal').style.display='none';

    //ADD SERVER UPDATE HERE
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
    const targetButton = evt.target.closest('button');
    const replyWindow = targetButton.closest('.inline-reply-container'); 
    const parentWrapper = replyWindow.closest('.child-comment-gridblock')
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent);
    const newComment = buildComment(newNode, true);
    new CommentNode(newNode.parentId, newNode.id, newComment.querySelector('.parent-comment'), newNode.user.username);
    console.log('hii')
    parentWrapper.insertBefore(newComment, replyWindow);

    //SEND SERVER UPDATE HERE
    replyWindow.remove();
    //replyHandlerStack = null;
}

const buildUserReplyNode = (content) => {
    //creates a new template Node that is compatible with the buildComment Function
    return new CommentTemplate(content);
}

const submitComment = () => {
    //Check for innuendos
    const replyWindow = document.getElementById('reply-card');
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent);
    const newComment = buildComment(newNode, true);
    replyWindow.after(newComment);
    replyWindow.querySelector('.submit-comment__input').value = '';
    //SEND SERVER UPDATE HERE
}

const commentNodeList = [];

const commentButtonHandler = (evt, username) => {
    //Determines which button was clicked
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
    constructor (parentId, id, linkedCommentEl,username) {
        // store the id and parent ID of the comment
        this.id = id;
        this.parentId = parentId;
        this.linkedCommentEl = linkedCommentEl;
        this.username = username;
        //this.clickHandler = null;
        this.upvoteHandler = null;
        this.replyHandler = null;
        this.serverRequestHandler = null;
        this.init();
        this.clickListener = this.linkedCommentEl.addEventListener('click', (evt) => this.onClick(evt)); 
        // the arrow func is bc arrow funcs do not have their own 'this' but reg functions do in an eventlistener
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
                //this.replyHandler.onClick(this.linkedCommentEl);
                //If hasnt been created, create a new one
                //if (!this.replyHandler) this.replyHandler = new ReplyHandler(this.linkedCommentEl, this.id);
                repositionReplyCard()
                //Otherwise just send it info
                console.log('reply btn clicked');
                //send to reply handler
                break;
            case 'edit':
                console.log('edit button clicked');
                //send to edit handler
                break;
            case 'delete':
                console.log('delete btn clicked');
                //Send to delete handler
                break;
            default:
                break;
        }
        //If 
    }
    createUpvoteHandler(){
        //Create an Upvote handler and attach it to this node
    }
    createReplyHandler(){
        //Create a reply handler and attach it to this node
    }
    createEditHandler(){
        //Create an edit handler and attach it to this node
    }
    createDeleteHandler(){
        //Create handler for managing deleted comments
    }
    sendServerRequest(data){
        //Create an object that holds the info, and sends it to server after a delay
    }
    createSpamHandler(){
        //Create a handler that holds on to upvote state changes and sends them to server
    }
    init(){
        //Create all the handlers
       // this.clickHandler = new ClickHandler(this.username);
        this.upvoteHandler = new UpvoteHandler(this.linkedCommentEl.querySelector('.vote-container'), this.id);
        //this.replyHandler =  new ReplyHandler(this.linkedCommentEl, this.id);
    }
    deleteNode(){
        //Clear all references and listeners to free up memory when a comment is deleted
    }
}


class ClickHandler {
    //Handler tied to comment which checks which button was pressed and passes that to respective handler
    //UNUSED
    constructor(username) {
        this.username = username;
    }
    checkClick(evt){
        //Returns what kind of button click it was
        if (evt.target.closest('button')) {
            const btnClassList = evt.target.closest('button').classList;
            if (btnClassList.contains("vote-btn")) {
                return 'vote';
            
            } else if (btnClassList.contains("reply-btn")) {
                if (isCurrentUser(this.username)) { 
                    return 'edit';
                } else {return 'reply';} 
                //Only fire delete if user is correct (check serverside too)
            } else if (btnClassList.contains('delete-btn') && isCurrentUser(this.username)) {
                return 'delete';
            }
        }
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
        //this.buttonWidget.addEventListener('click', (e) => this.onClick(e));
        //this.upvoteBtn.addEventListener('click', (e) => this.onclick(e, 1));
        //this.downvoteBtn.addEventListener('click', (e) => this.onclick(e, -1));
        this.id = id;
    }
    onClick(evt){
        //Find closest button
        //First implementation (will need to refactor to include all buttons, just a proof of concept)
        //This if statement wrapper catches exceptions
        //Determine how to update the state
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
        //If the state has to increment by more than 1 (eg +1 to -1)
        } else if (this.state + newState == 0) {
            this.state = newState;
            this.updateVisual(newState*2);
            //Send a server update HERE
        } else {
            this.state = newState;
            this.updateVisual(newState);
            //Send a server Update HERE
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
let replyHandler = new ReplyHandler();
class ReplyHandler {
    constructor(parentComment, parentId) {
        //The ID of the parent comment that the reply will be appended to
        this.parentId = null;
        //The ID of the potential new Comment
        this.id = null;
        this.replyCard = null;
        this.submitReplyButton = null;
        this.init(parentComment);
        this.submitReplyButton.addEventListener('click', this.onClickReply, {capture: true});

    }

    init(parentComment){
        this.repositionReplyCard(parentComment);
        this.replyCard = document.getElementById('reply-card-inline');
        this.submitReplyButton = this.replyCard.querySelector('.add-comment__btn');
        //this.submitReplyButton.replaceWith(this.submitReplyButton.cloneNode(true));


     }
    repositionReplyCard(parentComment) {
        //Seperated so it can be run seperately if object is already initialized
        createReplyWindow (parentComment);

    }
    onClickReply = (evt) => {
        //TODO: Check for innuendos
        //TODO: Check for any conflicts
        console.log("onCLickReplyFires");
        console.log(`Comment to be attached to: ${this.parentId}, comment ID: ${this.id}`)
        // if (evt.target.closest('.add-comment__btn')) {
        //     //If it's the button run Submit
        //     const textArea = evt.target.closest('.inline-reply-container').querySelector('.submit-comment__input');
        //     if (textArea.value) submitReply(evt);
        
        // } else if (!evt.target.closest('.inline-reply-container')) {
        //     //this.destroy();
        // }
        // Else if you click outside the reply box, kill the object
        const textArea = evt.target.closest('.inline-reply-container').querySelector('.submit-comment__input');
        if (textArea.value) {
            submitReply(evt);
            this.destroy();
        }
        //Server UPdate here
        //payload: Parent comment ID, current user ID, current comment ID (resolve serverside), content of comment
    }
    destroy(){
        this.submitReplyButton.removeEventListener('click', this.onClick, {capture: true});
        this.replyCard.remove();

    }
    UpdateParentComment(parentId, ){
        this.parentId = 
        //Possible other design pattern
        //A single Reply Handler that updates it's position and the object it's linked to onClick
    }
}
class EditHandler {
    //Handler for the Edit Comment box, currently unused
    constructor(targetComment, textContent) {
        this.comment = targetComment;
        //Corresponding ID of the comment (server)
        this.id = null;
        this.isOpen = false;
        this.content = textContent;
    }
    openEditWidget(){
        //change the comment to a text field with a button
    }
    onclickSubmit() {
        //Check if the edit should be submitted (innuendos, blank, etc)
    }

    submitEdit(){
        //Create Handler for Server Update HERE
    }
    deleteEditWindow() {
        //Revert back to normal and delete reference to this handler
        //if it was a cancel edit throw up the cancel sign
    }

}

const addSelfDestructingEventListener = (element, eventType, callback) => {
    //Add an EventListener that deletes itself when it's called
    let handler = () => {
        callback();
        element.removeEventListener(eventType, handler);
    };
    element.addEventListener(eventType, handler);
};
//Func for building comments from reply
const buildComment = (currentNode, isSubmitted) => {
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
    const timeAgo = clonedComment.querySelector('.time-ago');
    timeAgo.textContent = convertDateToFromNow(currentNode.createdAt);
    timeAgo.setAttribute('title', new Date(currentNode.createdAt));
    clonedComment.querySelector('.comment-number').textContent = `#${currentNode.id}`;

    //Add Deleted CSS flag to comment if it's deleted
    if (clonedComment.querySelector('.username').textContent == 'Deleted') {
        commentContainer.classList.add('deleted-comment');
        clonedComment.querySelector('.user-avatar').src = './images/avatars/image-deleted.png';
    } else {
        //Will need to refactor this
        //upvoteHandlers.push(new UpvoteHandler(clonedComment.querySelector('.vote-container'), currentNode.id));
        //Add auto self-upvote when submitting comment IMPORTANT BRING BACK
        //if (isSubmitted) upvoteHandlers[upvoteHandlers.length-1].selfUpvote();

        //Attach Eventlisteners to the seperate  buttons (deprecated)
        // if (isCurrentUser(currentNode.user.username) || isAdmin()) {
        //     const deleteBtn = clonedComment.querySelector('.delete-btn');
        //     deleteBtn.addEventListener('click', (evt) => {
        //         console.log(evt);
        //         openDeleteModal(evt.srcElement);
        //     });
        //     // Edit button
        //     const editBtn = clonedComment.querySelector('.reply-btn');
        //     editBtn.addEventListener('click', (evt) => {
        //         editClick(evt.srcElement);
        //     });
        //     //Edit submit button
        //     const submitEditBtn = clonedComment.querySelector('.edit-btn');
        //     submitEditBtn.addEventListener('click', (evt) => {
        //         const currentComment = evt.srcElement.closest('.comment');
        //         submitEdit(currentComment);
        //         closeEditWindow(currentComment);
        //     });
        // } else {
        //     //reply button
        //     const replyBtn = clonedComment.querySelector('.reply-btn');
        //     replyBtn.addEventListener('click', (evt) => {
        //         replyClick(evt.srcElement);
                
        //     });
        // }
    }
    return clonedComment;
}

class ServerPayload {
    constructor(data, id, parentID) {
        //The object that gets sent to the server 
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


const waitForUserInput = async () => {

}

// Proof of concept Time conversion will use plugin later
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
    let years = Math.floor((ms / (1000 * 60 * 60 * 24 * 365)));
    let result;
    if (seconds < 60) result = `${seconds} ${toPlural(seconds, "second")}`;
    else if (minutes < 60) result = `${minutes} ${toPlural(minutes, "minute")}`;
    else if (hours < 24) result = `${hours} ${toPlural(hours, "hour")}`;
    else if (days < 365) result = `${days} ${toPlural(days, "day")}`;
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

//OVERHAUL THE EVENT LISTENER LOGIC
//Need to create one listener per comment and determine what the click is doing with delegation

//Fetches a batch of comments from server and builds them on the DOM
const initializeComments = async() => {
    // Fetch the comment Data from server
    const fetchData2 = async () => {
        return fetch('./data.json')
        // JSONify the response
        .then(res => res.json())
        // return the data
        .then(data => data)
        .catch(err => console.log("Error resolving comments:", err))
    }
    // Seperate json data into userData and commentData
    // TODO split currentUser and comments into separate files and change this logic
    const dataResult = await fetchData2();
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
        if (textArea.value) submitComment();

    });
}
let userData;
//Show the comment Section
initializeComments();


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
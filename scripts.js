//Things that are different on user comment
//the "you" icon between username and time-ago,
//A delete button before reply button
//the reply button is instead an Edit button
//the upvote downvote buttons are disabled

//Replies are appended after 'child-comment-gridblock'

//global variable to keep track of where to append new comments, which comment to delete, etc.
let currentCommentFocus = document.getElementById('comments-section');
const commentsContainer = document.getElementById('comments-section');
const commentsList = [];
let currentUser = null;
//global variable for saving text and node when editing comment
let savedText = '';
let savedTextArea;
const upvoteHandlers = [];
//clientside var of how many comments in database total there are (for keeping track of ID assignment)
let totalComments;

class CommentTemplate {
    //Class for a comment data for purpose of building replies
    //it mirrors the same format as a comment pulled from the database so it can be fed into buildComment
    constructor(content){
        this.id = ++totalComments;
        this.content = content;
        this.score = 0;
        this.createdAt = '0 seconds ago'; //CHANGE TO CURRENT TIME WHEN TIME SYSTEM IMPLEMENTED
        this.username = sessionStorage.getItem('username');
        //CHANGE WHEN USING NEW USERNAME SYSTEM
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
    
    // iterate over the tree recursively (useful for building comment tree at first)
    preOrderTraversalRecursive(appendHere) {
        //appendHere is where the fully-built tree must be appended at the end
        //usually to the comment section container (not if loading more comments, future proof)

        if (!this.root) throw new Error('Tree is empty');   
        // recursive helper to traverse the tree
        function traverse(currentNode, parentNode) {
            // If the current node is null, exit
            if (!currentNode) return;

            console.log(`build comment ${currentNode.id} here`);
            let builtComment = buildComment(currentNode);
            const appendTarget = builtComment.querySelector('.child-comment-gridblock');
            // Add the node to the result array
            // Recursively traverse each of the node's children
            for (const childNode of currentNode.replies) {
                //as the loop bubbles back, append each built comment to it's parent in previous scope
                appendTarget.appendChild(traverse(childNode, builtComment));
            }
            if (!currentNode.parentId) {
                console.log("root comment is appended to DOM here");
                appendHere.appendChild(builtComment);
            } else if (currentNode.parentId) {
                console.log(`Append node ${currentNode.id} to ${currentNode.parentId} here`);
                return builtComment;
            }
            return builtComment;
        }

        // Call the helper with the root node to start the traversal
        const finalHTMLnode = traverse(this.root, commentsContainer);
        return;
    }
}
const replyClick = (targetButton) => {
    //Create a type window, and place it under the Selected comment REUSE THIS FOR SUBMITTING COMMENT
    const targetComment = targetButton.closest('.comment');
    const closestParentContainer = targetComment.closest('.comment-tree-grid-container');
    const closestChildContainer = closestParentContainer.querySelector('.child-comment-gridblock');
    let replyCard;
    //Create a new moving reply card if there isn't one already (the one at top does not move inline)
    if (!document.getElementById('reply-card-inline')) {
        replyCard = buildReplyCard();

    } else {
        // This is here bc if it doesn't find it, it throws an error and doesnt focus properly
        replyCard = document.getElementById('reply-card-inline');
    }
    closestChildContainer.insertBefore(replyCard, closestChildContainer.firstChild);
    replyCard = document.getElementById('reply-card-inline');
    replyCard.querySelector('textarea').focus();
}


const editClick = (targetButton) => {
    //Hide the Comment Content and unhide the TypeArea and resubmit button
    savedText = currentComment.querySelector('.comment-content').textContent;

    focusedComment.querySelector('.comment-content');
    //TODO: FINISH THIS

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

const buildUserReplyNode = (content) => {
    return new CommentTemplate(content);
}
const submitReply = (targetButton) => {
    //TODO: Check for innuendos
    //TODO: Check for any conflicts

    const replyWindow = targetButton.closest('.inline-reply-container'); 
    const parentWrapper = replyWindow.closest('.child-comment-gridblock')
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent);
    const newComment = buildComment(newNode);
    parentWrapper.insertBefore(newComment, replyWindow);
    //SEND SERVER UPDATE HERE
    replyWindow.remove();
}

const submitComment = () => {
    //Check for innuendos
    const replyWindow = document.getElementById('reply-card');
    const newContent = replyWindow.querySelector('.submit-comment__input').value;
    const newNode = buildUserReplyNode(newContent);
    const newComment = buildComment(newNode);
    replyWindow.after(newComment);
    replyWindow.querySelector('.submit-comment__input').value = '';
}
class upvoteHandler {
    //Attached to every upvote widget and manages the votes
    constructor (buttonWidget, id) {
        //-1 = downvote 0 = no vote 1 = upvote
        this.state = 0;
        this.buttonWidget = buttonWidget;
        this.upvoteBtn = this.buttonWidget.querySelector('.vote-btn.plus');
        this.downvoteBtn = this.buttonWidget.querySelector('.vote-btn.minus');
        this.upvoteBtn.addEventListener('click', (e) => this.onclick(e, 1));
        this.downvoteBtn.addEventListener('click', (e) => this.onclick(e, -1));
        this.id = id;
    }
    onclick(evt, newState){
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
    defaultUpvote (){
        //TODO: automatically upvote when you submit a comment
    }
}
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
    clonedComment.querySelector('.time-ago').textContent = currentNode.createdAt;
    clonedComment.querySelector('.comment-number').textContent = `#${currentNode.id}`;

    //Add Deleted CSS flag to comment if it's deleted
    if (clonedComment.querySelector('.username').textContent == 'Deleted') {
        commentContainer.classList.add('deleted-comment');
        clonedComment.querySelector('.user-avatar').src = './images/avatars/image-deleted.png';
    } else {
        upvoteHandlers.push(new upvoteHandler(clonedComment.querySelector('.vote-container'), currentNode.id));
        if (isCurrentUser(currentNode.user.username) || isAdmin()) {
            const deleteBtn = clonedComment.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (evt) => {
                console.log(evt);
                openDeleteModal(evt.srcElement);
            });
            // Edit button
            const editBtn = clonedComment.querySelector('.reply-btn');
            editBtn.addEventListener('click', (evt) => {
                editClick(evt.srcElement);
            });
        } else {
            //reply button
            const replyBtn = clonedComment.querySelector('.reply-btn');
            replyBtn.addEventListener('click', (evt) => {
                replyClick(evt.srcElement);
                
            });
        }
    }

    return clonedComment;
}

const buildReplyCard = () => {
    const replyCardTemplate = document.getElementById('reply-card-template');
    const clonedCard = replyCardTemplate.content.cloneNode(true);
    clonedCard.querySelector('.user-avatar').src = `${currentUser.image.png}`;
    const submitReplyBtn = clonedCard.querySelector('.add-comment__btn');
    submitReplyBtn.addEventListener('click', (evt) => {
        const textArea = evt.srcElement.closest('.inline-reply-container').querySelector('.submit-comment__input');
        if (textArea.value) submitReply(evt.srcElement);
    });
    return clonedCard;
}


//array of comment nodes, which have the associated ID, 
const CommentsNodesArray = [];
class CommentNode {
    //UNUSED CURRENTLY, WILL BE USED LATER
    //WILL LINK ALL THE HANDLERS FROM EACH ASSOCIATED COMMENT
    //SERVER BACKEND STUFF
    //Tracks ID and Parent ID with associated HTML element node
    //I feed this back to the database so it can sort through and modify the db when changes are made
    constructor (parentId, id, linkedEl) {
        // store the id and parent ID of the comment
        this.parentId = parentId;
        this.id = id;
        this.linkedEl = linkedEl;
        this.replies = [];
    }

}

//TODO SPAM HANDLER OBJECT
//build an object that takes a state change, waits until theres no spam, then sends to server
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
    userData = dataResult.currentUser;
    totalComments = dataResult.totalComments;
    //Will Change this when I have new system (random generated profile pics with slightly diff colors)
    currentUser = dataResult.currentUser;
    sessionStorage.setItem("username", userData.username);
    const commentData = dataResult.comments;
    //Create seperate generalTree obj for each comment tree
    const treeArrays = [];
    commentData.forEach( (el, index) => {
        treeArrays.push(new GeneralTree());
        treeArrays[index].root = commentData[index];
    })
    for (const tree of treeArrays) {
        tree.printTreeAsString();
        tree.preOrderTraversalRecursive(commentsContainer);
    }
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

//When the state changes, read all the comments and update the Data file
//Add way to add comment to node tree and Database simultaneously


//SPAM DETECTION
//Upvotes need to have a timeout on backend
//Limit to number of comments per day


//Add account creation
//Check if the user is currently logged in when they try to reply on a comment
//stores Username, password, choice of profile pic (only 8)
//PROFILE PIC IDEA: Choose from 1 of 8 images, and assign a random hue to that user (massive amount of variations)

//fetchData();

 //Possible design pattern
//Build a tiered object system, where each object holds an ID and all the associated button handlers

//Each reply button onclick finds the closest ancestor using closest()
//everything is calculated relative to that
//EG you can insert the reply bar after the comment sibling, you can add the comment
//after the page
//Then separately add/delete entries to the data JSON
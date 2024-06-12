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

const addReply = () => {
    //placeholder bugtest Function
    const commentTemplate = document.getElementById('you-parent-comment-template');
    //Create cloned fragment of template
    const clonedNode = commentTemplate.content.cloneNode(true);
    const templist = document.getElementsByClassName('comment-tree-grid-container');
    //Append as child to lowest comment
    const appendHere = templist[templist.length - 1].getElementsByClassName('child-comment-gridblock')[0];
    const button = clonedNode.querySelector('.comment');
    button.addEventListener('click', (e) => writeHi(e));
    appendHere.appendChild(clonedNode);
    //Move Reply Card to bottom
    moveReplyCard(currentCommentFocus);
}


class GeneralTree {
    //A single tree of comments with a root parent and children
    constructor(){
        this.root = null;
        this.rootComment = null;
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
    // iterate over the tree (iterative pre-order Traversal)
    preOrderTraversalIterative(appendHere){
        if (!this.root) throw new Error('Tree is empty')

        // Create a stack to hold nodes to be processed and
        // an array to hold all the comments
        const stack = [this.root];
        const result = [];

        // loop through the stack until all nodes have been processed
        while (stack.length){
            // Pop the last node from stack and do something with it
            const currentNode = stack.pop();
            const currentHTMLNode = buildComment(currentNode);
            result.push(currentNode.id);
            console.log(currentNode.id);
            // buildComment(currentNode);
            // We want to visit the leftmost child first, since the child array is stored
            // in reverse order
            // So we need to push them to stack in reverse
            for (let i = currentNode.replies.length -1; i >= 0; i--) {
                stack.push(currentNode.replies[i]);
            }
        }
        return result;
    }
    // iterate over the tree recursively (useful for building comment tree at first)
    preOrderTraversalRecursive(appendHere) {
        //appendHere is where the fully-built tree must be appended at the end
        //usually to the comment section container (maybe not if loading more comments?)

        if (!this.root) throw new Error('Tree is empty')

        // Create an array to hold the result of the traversal
        //And an array to hold all the comment HTML nodes
        const result = []
        // recursive helper to traverse the tree
        function traverse(currentNode, parentNode) {
            // If the current node is null, exit
            if (!currentNode) return;

            console.log(`build comment ${currentNode.id} here`);
            let builtComment = buildComment(currentNode);
            const appendTarget = builtComment.querySelector('.child-comment-gridblock');
            // Add the node to the result array
            result.push(builtComment);
            // Recursively traverse each of the node's children
            for (const childNode of currentNode.replies) {
                appendTarget.appendChild(traverse(childNode, builtComment));
            }
            //as the loop bubbles back, append each built comment to it's parent in previous scope
            if (!currentNode.parentId) {
                console.log("root comment is appended to DOM here");
                appendHere.appendChild(builtComment);
            } else if (currentNode.parentId) {
                console.log(`Append node ${currentNode.id} to ${currentNode.parentId} here`);
                //parentNode.appendChild(builtComment);
                return builtComment;
                //appendTarget 
            }
            return builtComment;
        }

        // Call the helper with the root node to start the traversal
        const finalHTMLnode = traverse(this.root, commentsContainer);

        //Append the full tree to the comment container
        //commentsContainer.appendChild(finalHTMLnode);
        return result;
        //appendHere.appendChild
    }
    buildCommentTree (AppendTarget, commentList){

    }

}
const replyClick = (targetButton) => {
    //Create a type window, and place it under the Selected comment
    const targetComment = targetButton.closest('.comment');
    const closestParentContainer = targetComment.closest('.comment-tree-grid-container');
    const closestChildContainer = closestParentContainer.querySelector('.child-comment-gridblock');
    let replyCard;
    if (!document.getElementById('reply-card-inline')) {
        replyCard = buildReplyCard();

    } else {
        replyCard = document.getElementById('reply-card-inline');
    }
   closestChildContainer.insertBefore(replyCard, closestChildContainer.firstChild);
    replyCard.querySelector('textarea').focus()
}

const submitComment = () => {
    //Check for innuendos
    //Apply it to the frontEnd
    //TODO Update the server
}
const isCurrentUser = (input) => {
    // Check if a variable is current user
    const currentUser = sessionStorage.getItem('username');
    return input == currentUser ? true : false;
}

const isAdmin = () => {
    return false;
}

const openDeleteModal = (currentComment) => {
    document.querySelector('.delete-comment-modal').style.display='block'
    document.querySelector ('.confirm-delete-btn').addEventListener ( (e) => {})
    document.querySelector ('.')
}

const deleteComment = () => {
    // Delete the comment, still leaving its place in the tree
    // if it was deleted by admin, write "deleted by admin"
    // Otherwise deleted by user
}

const moveReplyCard = (targetNode) => {
    // if the currentCommentfocus is the comment section moves replycard to top of comments
    const replyCard = document.getElementById('reply-card');
    // target.appendChild(replyCard);
    targetNode.insertBefore(replyCard, targetNode.firstChild);
    // If you use After()you need to get the child to insert after
}
class CommentNode {
    //Tracks ID and Parent ID with associated HTML node
    constructor (parentId, id, linkedNode) {
        // store the id and parent ID of the comment
        this.parentId = parentId;
        this.id = id;
        // If a comment doesnt have a parentID it is a root comment
        this.isRoot = !parentId ? 1 : 0;
        // Attach an associated HTML node
        this.linkedNode = linkedNode;
    }

}



const buildComment = (currentNode) => {
    let commentTemplate;
    //Comments made by current user have different buttons
    if (isCurrentUser(currentNode.user.username)) {
        commentTemplate = document.getElementById('you-parent-comment-template');
    } else {
        commentTemplate = document.getElementById('parent-comment-template');
    }

    const clonedComment = commentTemplate.content.cloneNode(true);
    const commentContainer = clonedComment.querySelector('.parent-comment');
    clonedComment.querySelector('.comment-content').textContent = currentNode.content;
    clonedComment.querySelector('.comment-rating').textContent = currentNode.score;
    clonedComment.querySelector('.username').textContent = currentNode.user.username;
    clonedComment.querySelector('.user-avatar').src = `${currentNode.user.image.png}`;
    clonedComment.querySelector('.time-ago').textContent = currentNode.createdAt;

    //Add Deleted CSS flag to comment if it's deleted
    if (clonedComment.querySelector('.username').textContent == 'Deleted') {
        commentContainer.classList.add('deleted-comment');
    }
    // Add EventListeners to node to buttons
    const upvoteBtn = clonedComment.querySelector('.vote-btn.plus');
    upvoteBtn.addEventListener('click', (evt) => {
        console.log(evt);
    });
    const downvoteBtn = clonedComment.querySelector('.vote-btn.minus');
    downvoteBtn.addEventListener('click', (evt) => {
        console.log(evt);
    });
    if (isCurrentUser(currentNode.user.username) || isAdmin()) {
        const deleteBtn = clonedComment.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (evt) => {
            console.log(evt);
            //openDeleteModal(evt.)
        });
        // Edit button
        const editBtn = clonedComment.querySelector('.reply-btn');
        editBtn.addEventListener('click', (evt) => {
            console.log(evt);
        });
    } else {
        const replyBtn = clonedComment.querySelector('.reply-btn');
        replyBtn.addEventListener('click', (evt) => {
            console.log(evt.srcElement);
            replyClick(evt.srcElement);
            //replyBtn
        });
    }
    return clonedComment;
}

const buildReplyCard = () => {
    const replyCardTemplate = document.getElementById('reply-card-template');
    const clonedCard = replyCardTemplate.content.cloneNode(true);
    clonedCard.querySelector('.user-avatar').src = `${currentUser.image.png}`;
    return clonedCard;
}
const renderComments = () => {
    // iterate through all the comments in comment database and add them
}

//I have to figure out how to associate specific comments with unique IDs after I've rendered them
const CommentsData = [];


const initializeComments = async() => {
    // Fetch the comment Data from server
    const fetchData2 = async () => {
        return fetch('/data.json')
        // JSONify the response
        .then(res => res.json())
        // return the data
        .then(data => data)
        .catch(err => console.log("Error resolving comments:", err))
    }
    // Seperate json data into userData and commentData
    // TODO split currentUser and comments into separate files and change this logic
    const dataResult = await fetchData2();
    const userData = dataResult.currentUser;
    //Will Change this when I have new system (random generated profile pics with slightly diff colors)
    currentUser = dataResult.currentUser;
    sessionStorage.setItem("username", userData.username);
    const commentData = dataResult.comments;
   
    
    //Create seperate generalTree obj for each Comment Tree
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
        
    //Bugtest
    //const tree = new GeneralTree();
    // tree.root = commentData[1];
    // tree.printTreeAsString();
    // console.log('PRE-ORDER TRAVERSAL:');
    //For root comments they're appended to the comment container
    //const TestResult = tree.preOrderTraversalIterative(commentsContainer);
    //const testResult = tree.preOrderTraversalRecursive(commentsContainer);
    //moveReplyCard(commentsContainer);

}
let userData;
//Show the comment Section
//initializeComments();

const clearComments = () => {
    elements = document.getElementsByClassName('comment-tree-grid-container');
    while (elements.length > 0) {
        elements.firstChild.remove();
    }

        
}

//TODO

//NEED to figure out a way to attach nodes to parent nodes inside the traversal function
//When the state changes, read all the comments and update the Data file
//Add way to add comment to node tree and Database simultaneously

//SPAM DETECTION
//Upvotes need to have a timeout on backend
//Limit to number of comments per day


//Add account creation
//stores Username, password, choice of profile pic (only 8)

//fetchData();



// function fetchData(){
//     //Grab Comments data
//      fetch('./data.json')
//         //a then statement creates a chained "function" that passes return values ot next 'then'
//         .then(response => {
//             if (!response.ok) {
//             throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         //You can access a specific entry by title, or return the entire thing
//         .then(data => {
//             commentData = data.comments;

//             userData = data.currentUser;
//             //commentData = data;

//         })
//         .then(initializePage)
//         .catch(error => {
//             console.error('Error initializing comments:', error);
//         });
// }
 //Possible design pattern
//Each reply button onclick finds the closest ancestor using closest()
//everything is calculated relative to that
//EG you can insert the reply bar after the comment sibling, you can add the comment
//after the page
//Then separately add/delete entries to the data JSON
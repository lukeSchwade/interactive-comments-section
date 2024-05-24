//Things that are different on user comment
//the "you" icon between username and time-ago,
//A delete button before reply button
//the reply button is instead an Edit button
//the upvote downvote buttons are disabled

//Replies are appended after 'child-comment-gridblock'

//global variable to keep track of where to append new comments, which comment to delete, etc.
let currentCommentFocus = document.getElementById('comments-section');
const commentsContainer = document.getElementById('comments-section');
const addReply = () => {
    //placeholder bugtest Function
    const commentTemplate = document.getElementById('you-parent-comment-template');
    //Create cloned fragment of template
    const clonedNode = commentTemplate.content.cloneNode(true);
    const templist = document.getElementsByClassName('comment-tree-grid-container');
    //Append as child to lowest comment
    const appendHere = templist[templist.length - 1].getElementsByClassName('child-comment-gridblock')[0];
    const button = clonedNode.querySelector('.comment');
    button.addEventListener('click', () => writeHi());
    appendHere.appendChild(clonedNode);
    //Move Reply Card to bottom
    moveReplyCard(currentCommentFocus);
}


class GeneralTree {
    constructor(){
        this.root = null;
    }
    // Print each tree as a string in console
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
    preOrderTraversalIterative(){
        //Check empty tree
        if (!this.root) throw new Error('Tree is empty')
        // Create a stack to hold nodes to be processed and
        // an array to hold the result of the traversal
        const stack = [this.root];
        const result = [];

        // loop through the stack until all nodes have been processed
        while (stack.length){
            // Pop the last node from stack and do something with it
            const currentNode = stack.pop();
            result.push(currentNode.id);
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
    preOrderTraversalRecursive() {
        // Check if the tree is empty
        if (!this.root) throw new Error('Tree is empty')

        // Create an array to hold the result of the traversal
        const result = []
        // recursive helper to traverse the tree
        //Build the first node
        let rootComment;
        function traverse(currentNode, parentNode) {
        // If the current node is null, exit
        if (!currentNode) return;

        // build a comment based on current node
        const currentHTMLNode = buildComment(currentNode);
        
        //TODO THIS DOES NOT WORK
        if (currentNode.parentId) {
            // Parent comments are appended to div "comments-section"
            parentNode.appendChild
        } else {
            // replies are appended to child-comment-gridblock of previous node
            //Find the parentNode
            //TODO THIS DOES NOT WORK
            parentHTMLNode.querySelector('.child-comment-gridblock').appendChild(newHTMLNode);

        }

        // Add the node's data to the result array
        result.push(currentNode.id);
        if (!currentNode.replies.length)
        // Recursively traverse each of the node's children
        for (const childNode of currentNode.replies) {
            traverse(childNode, newHTMLNode);
            }
        }

        // Call the helper with the root node to start the traversal
        traverse(this.root, null);

        //Append the full tree to the comment container
        commentsContainer.appendChild(rootComment);
        return result;
    }

}
const replyClick = () => {

}
const isCurrentUser = (input) => {
    // Check if a variable is current user
    const currentUser = sessionStorage.getItem('username');
    return input == currentUser ? true : false;
}

const isAdmin = () => {
    return false;
}

const openDeleteModal = () => {
    // Open the delete modal for corresponding comment
    // Add event listener for the delete comment corresponding to the comment
}

const deleteComment = () => {
    // Delete the comment, still leaving its place in the tree
    // if it was deleted by admin, write "deleted by admin"
    // Otherwise deleted by user
}


const moveReplyCard = (target) => {
    // if the currentCommentfocus is the comment section moves replycard to bottom of comments
    const replyCard = document.getElementById('reply-card');
    // target.appendChild(replyCard);
    target.appendChild(replyCard);
    // If you use After()you need to get the child to insert after
}
class CommentNode {
    // separate object for each comment not currently used
    constructor (parentId, id, linkedNode) {
        // store the id and parent ID of the comment
        this.parentId = parentId;
        this.id = id;
        // If a comment doesnt have a parentID it is a root comment
        this.isParent = !parentId ? 1 : 0;
        // Attach an associated HTML node
        this.linkedNode = linkedNode;
    }
    addChild(child){
        // add a child to this Comment Node
    }
    deleteComment(){
        // Open the Modal

    }

}

const writeHi = () => {
    console.log('hi');
}

const generateCommentTrees = (element, index, parentArray) => {
    // Generate new node tree (not necessary?)
}

const buildComment = (currentNode) => {

    let commentTemplate;
    if (isCurrentUser(currentNode.user.username)) {
        commentTemplate = document.getElementById('you-parent-comment-template');
    } else {
        commentTemplate = document.getElementById('parent-comment-template');
    }

    const clonedComment = commentTemplate.content.cloneNode(true);
    // Add correct content
    clonedComment.querySelector('.comment-content').textContent = currentNode.content;
    clonedComment.querySelector('.comment-rating').textContent = currentNode.score;
    clonedComment.querySelector('.username').textContent = currentNode.user.username;
    clonedComment.querySelector('.user-avatar').src = `${currentNode.user.image.png}`;
    clonedComment.querySelector('.time-ago').textContent = currentNode.createdAt;
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
        });
        // Edit button
        const editBtn = clonedComment.querySelector('.reply-btn');
        editBtn.addEventListener('click', (evt) => {
            console.log(evt);
        });
    } else {
        const replyBtn = clonedComment.querySelector('.reply-btn');
        replyBtn.addEventListener('click', (evt) => {
            console.log(evt);
        });
    }
    return clonedComment;
}
const renderComments = () => {
    // iterate through all the comments in comment database and add them
}


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
    const result = await fetchData2();
    const userData = result.currentUser;
    sessionStorage.setItem("username", userData.username);
    const commentData = result.comments;
    const parentComments = [];
    // For each parent comment
    // Create a new General Tree, place it in the tree array
    // Iterate through the comments, building a new comment for each node
    const tree = new GeneralTree();
    // Create array of commentTrees
    const commentTrees = [];
    tree.root = commentData[1];
    tree.printTreeAsString();
    console.log('PRE-ORDER TRAVERSAL:');
    tree.preOrderTraversalRecursive();
    moveReplyCard(commentsContainer);

}
let userData;
//Show the comment Section
initializeComments();


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
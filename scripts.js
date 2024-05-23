//Things that are different on user comment
//the "you" icon between username and time-ago,
//A delete button before reply button
//the reply button is instead an Edit button
//the upvote downvote buttons are disabled

//Replies are appended after Child-comment-gridblock
//Add parent-comment or child-comment class to each comment when inserted

//By default, comments are appended to bottom of comment tree, clicking reply refocuses this
let currentCommentFocus = document.getElementById('comments-section');

const addReply = () => {
    //placeholder bugtest Function
    const parentContainerTemplate = document.getElementById('parent-container-template')
    const commentTemplate = document.getElementById('parent-comment-template');
    const clonedNode = commentTemplate.content.cloneNode(true);
    const templist = document.getElementsByClassName('comment-tree-grid-container');
    const appendHere = templist[templist.length - 1].getElementsByClassName('child-comment-gridblock')[0];
    appendHere.appendChild(clonedNode);
    moveReplyCard(currentCommentFocus);
}

const buildComment = () => {
    //Grab the template which includes the grid container
    //Parent comments are appended to div "comments-section"
    //replies are appended to child-comment-gridblock.
    const commentTemplate = document.getElementById('parent-comment-template');
    //foreach CommentData entry, run the recursive comment build
    const parentComment = commentTemplate.content.cloneNode(true);

}

class Node {
    constructor(val, data) {
    this.key = val;
    // all children are stored in an array
    this.data = data;
    this.children = [];
    }
}

class GeneralTree {
    constructor(){
        this.root = null;
    }
    //Print each tree as a string in console
    printTreeAsString() {
        if (!this.root) throw new Error('Tree is empty')
        
        const getTreeString = (node = this.root, spaceCount = 0) => {
          let treeString = "\n";
    
          node.replies.forEach((child) => {
            treeString += `${" ".repeat(spaceCount)}● node | Username: ${child.user.username} - ${child.parentId} ${getTreeString(child, spaceCount + 4)}`
          })
    
          return treeString
        }
        
        return console.log(`\n ● node | Username: ${this.root.user.username} - ${this.root.username} ${getTreeString(this.root, 4)}`)
      }
      //Iterative pre-order Traversal
      preOrderTraversalIterative(){
        //Check empty tree
        if (!this.root) throw new Error('Tree is empty')
        // Create a stack to hold nodes to be processed and
        // an array to hold the result of the traversal
        const stack = [this.root];
        const result = [];

        //loop through the stack until all nodes have been processed
        while (stack.length){
            //Pop the last node from stack and add
            const currentNode = stack.pop();
            result.push(currentNode.data);
            //We want to visit the leftmost child first, since the child array is stored
            //in reverse order
            //So we need to push them to stack in reverse
            for (let i = currentNode.children.length -1; i >= 0; i--) {
                stack.push(currentNode.children[i]);
            }
        }
        return result;
      }

}



     

const checkIfUser = () => {
    //If the comment is created by the user,
    //add the 'you' flag between username and time-ago
    //Add delete button before reply button
    //Change the reply button to an edit button
    //Disable upvotes on your own comment

    //return true
    //else return false
}

const openDeleteModal = () => {
    //Open the delete modal for corresponding comment
    //Add event listener for the delete comment corresponding to the comment
}

const deleteComment = () => {
    //Delete the comment, still leaving its place in the tree
    //if it was deleted by admin, write "deleted by admin"
    //Otherwise deleted by user
}

const loadComments = () => {
    //fetch comments from data file and create an object
}

const moveReplyCard = (target) => {
    //if the currentCommentfocus is the comment section moves replycard to bottom of comments
    const replyCard = document.getElementById('reply-card');
    //target.appendChild(replyCard);
    target.appendChild(replyCard);
    //If you use After()you need to get the child to insert after
}
class Comment {
    //separate object for each comment
    constructor (parentId, id) {
        //store the id and parent ID of the comment
        this.parentId = parentId;
        this.id = id;
        this.childComments = [];
    }
    addChild(){
        //add a child to
    }
}



const initializePage = () => {
    //do all the things that need to be done on pageload

    //Traverse the array of comments
    //For each comment entry
    tree.root = commentData[1];
    tree.printTreeAsString();
    console.log('PRE-ORDER TRAVERSAL:')
    tree.preOrderTraversalIterative();
    //Build a comment
    //Check if it has replies (recursively)
    //
}

let commentData = null;
let userData = null;
const tree = new GeneralTree();
fetchData();



function fetchData(){
    //Grab Comments data
     fetch('./data.json')
        //a then statement creates a chained "function" that passes return values ot next 'then'
        .then(response => {
            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            return response.json();
        })
        //You can access a specific entry by title, or return the entire thing
        .then(data => {
            commentData = data.comments;

            userData = data.currentUser;
            //commentData = data;

        })
        .then(initializePage)
        .catch(error => {
            console.error('Error initializing comments:', error);
        });
}

//Possible design pattern
//Each reply button onclick finds the closest ancestor using closest()
//everything is calculated relative to that
//EG you can insert the reply bar after the comment sibling, you can add the comment
//after the page
//Then separately add/delete entries to the data JSON
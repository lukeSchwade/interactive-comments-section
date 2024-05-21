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
    moveReplyCard(appendHere);
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
class comment {
    //separate object for each comment
    constructor (parentId) {
        //store the parent id of the comment
        this.parentId = parentId;
        //
    }
}

let commentData = null;
fetchCommentData();
// Fetch JSON data from a file
async function fetchCommentData(){

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
            
            // Access a specific entry by title or ID
            const specificEntry = data.find(entry => entry.title === 'Work');
            commentData = data;
        })
        .catch(error => {
            console.error('Error fetching JSON data:', error);
        });
}
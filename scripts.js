//Things that are different on user comment
//the "you" icon between username and time-ago,
//A delete button before reply button
//the reply button is instead an Edit button
//the upvote downvote buttons are disabled

//Replies are appended after Child-comment-gridblock
//Add parent-comment or child-comment class to each comment when inserted

const addReply = () => {
    const parentContainerTemplate = document.getElementById('parent-container-template')
    const commentTemplate = document.getElementById('parent-comment-template');
    const clonedNode = commentTemplate.content.cloneNode(true);
    const templist = document.getElementsByClassName('comment-tree-grid-container');
    const appendHere = templist[templist.length - 1].getElementsByClassName('child-comment-gridblock')[0];
    appendHere.appendChild(clonedNode);
}

const ifUser = () => {
    //If the comment is created by the user,
    //add the 'you' flag between username and time-ago
    //Add delete button before reply button
    //Change the reply button to an edit button
    //Disable upvotes on your own comment

    //return true
    //else return false
}
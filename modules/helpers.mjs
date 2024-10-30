const isCurrentUser = (input) => {
    // Check if a variable is current user
    const currentUser = sessionStorage.getItem('username');
    return input == currentUser ? true : false;
}

const isAdmin = () => {
    return false;
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


export {isCurrentUser, isAdmin, convertDateToFromNow, msToTime, toPlural};
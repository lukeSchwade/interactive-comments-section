# Frontend Mentor - Interactive comments section solution

This is a solution to the [Interactive comments section challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/interactive-comments-section-iG1RugEG9). Frontend Mentor challenges help you improve your coding skills by building realistic projects. 

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
- [Author](#author)
- [Acknowledgments](#acknowledgments)


## Overview

### The challenge

Users should be able to:

- View the optimal layout for the app depending on their device's screen size
- See hover states for all interactive elements on the page
- Create, Read, Update, and Delete comments and replies
- Upvote and downvote comments
- **Bonus**: If you're building a purely front-end project, use `localStorage` to save the current state in the browser that persists when the browser is refreshed.
- **Bonus**: Instead of using the `createdAt` strings from the `data.json` file, try using timestamps and dynamically track the time since the comment or reply was posted.

### Screenshot

![](./screenshot.jpg)




### Links

- Solution URL: [Add solution URL here](https://your-solution-url.com)
- [Live Site URL](https://lukeschwade.github.io/interactive-comments-section/)

## My process

### Built with

- Semantic HTML5 markup
- CSS custom properties
- Flexbox
- CSS Grid
- Mobile-first workflow
- [SASS](https://sass-lang.com/) - For CSS precompiler


### What I learned
- How to use SASS mixins for media breakpoints, which was tremendously useful
- Using `<slot>` and `<template>` for creating comment templates which were useful for creating modular elements
- How incredibly useful grid layouts are for mobile-first design where the elements need to shift around for desktop.
- Introduction to data structures traversing, and recursion for the purpose of drawing comments, I've learned react's framework of managing seperate states for buttons may be ideal for future projects
- Event delegation; instead of applying an event handler to every button on a comment, which is memory intensive, create an onClick handler that determines the target and delegates downwards
- Management of objects to deal with every aspect of an element's behavior
- how JS manages timecodes and timezones

```html
<h1>Some HTML code I'm proud of</h1>
```
```css
.proud-of-this-css {
  color: papayawhip;
}
```
I liked this solution I came up with for preventing user from upvoting comments twice if it's already been clicked, and a case for managing when you go from +1 to -1 (difference of 2 score instead of 1)
```js
updateUpvoteState(newState){
        //Change the state based on which button was pressed
        //Check that button hasn't already been clicked, then update it
        if (newState == this.state) {
            this.state = 0;
            this.updateVisual(newState);
        //If the state has to increment by more than 1 (eg +1 to -1)
        } else if (this.state + newState == 0) {
            this.state = newState;
            this.updateVisual(newState*2);
        } else {
            this.state = newState;
            this.updateVisual(newState);
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
```



### Continued development

I want to continue to build on this and maybe eventually build a web-facing app that lets people add comments


### Useful resources

- [Mixins media breakpoints](https://stackoverflow.com/questions/54594580/sass-media-query-mixin-combination) - Very helpful implementation of how to do media breakpoints with mixin
- [Managing heirarchal data](https://mikehillyer.com/articles/managing-hierarchical-data-in-mysql/) - A good article for thinking about managing heirarchal data (such as when displaying recursive comments)


## Author
- Frontend Mentor - [@lukeSchwade](https://www.frontendmentor.io/profile/lukeSchwade)
- Twitter - [@yourusername](https://www.twitter.com/yourusername)


## Acknowledgments

Many thanks to Pratham as always for letting me bounce ideas off of him


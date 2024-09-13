const showError = async (status, response) => {
    //Pops up an error at bottom of screen, then makes it disappear
    const errorModal = document.querySelector('.error-modal');
    const errorMessage = document.querySelector(".error-message");
    errorMessage.textContent = `${status}: ${response}`;
    errorModal.classList.remove('fade-in-hidden');
    errorModal.classList.add('fade-in-visible')
    //Hide modal after 5s
    setTimeout(hideError, 5000);
}

const hideError = () => {
    const errorModal = document.querySelector('.error-modal');
    errorModal.classList.remove('fade-in-visible');
    errorModal.classList.add('fade-in-hidden');
}


export { showError, hideError };
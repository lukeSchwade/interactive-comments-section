const serverURL = `http://localhost:3000`;

class ServerError extends Error {
  constructor(data){
    super(data.message);
    this.status = data.status;
    this.serverMessage = data.message
  }
}

const refreshAccessToken  = async() => {
  //Sends request and returns with a new accessToken
  try {
    const response = await fetch (`${serverURL}/api/users/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      mode: "cors"
    })
    
    const data = await response.json();
    if (data.accessToken) {
      //Set new access token
      return data.accessToken;
    } else {
      throw new Error ('Failed to refresh token');
    }
  } catch (error) {
    throw new Error ('Failed to refresh token');
  }
}
const apiRequest = (url, method, data = null, accessToken = false) => {
    let init = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      mode: "cors"
    };
    if (method !== "GET") {
      init.body = data;
    }
    //Add token if there is one
    if (accessToken) {
      init.headers.Authorization = `Bearer ${accessToken}`;
      
    }
    return fetch(url, init)
      .then(result => {
        return result;
      })
      .catch(result => {
        return result;
      });
  };

  const requestWrapper = async (url, method, data = null, accessToken = false) => {
    //Send a request, if the response is that access token expired, refresh token, then resend same request
    let response;
    try {
       response = await apiRequest(url, method, data, accessToken);
      if (response.status === 401 && response.body.tokenExpired){
        let newAccessToken = await refreshAccessToken();
        //set new access token
        response = await apiRequest(url, method, data, newAccessToken);
      }
      return response;
    } catch (error) {
      return error;
    }
    
  }
  
  export function handleErrors(response) {
    //chaining this at end of APIrequest with .then() means it either passes the response thru the chain
    //or throws an error that can be caught
    if (response.ok) { //response.ok means an http status in the 200-299 range
      return response
    }
    throw new ServerError(response);
    
  }

  export default requestWrapper
  
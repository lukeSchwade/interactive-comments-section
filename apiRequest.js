const serverURL = `http://localhost:3000`;

let user = null;


function setUser(userReference) {
  // you can update user info by passing a reference to the user object to the module.  
  // any changes made to the user object in the module will also reflect 
  // in the global user object in scripts.js.
  user = userReference;
}

const refreshAccessToken = async() => {
    const init = {
      method: 'GET',
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      mode: "cors"
    }
    try {
      const response = await fetch(`${serverURL}/api/users/refresh`, init);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error (`Refresh token failure: ${errorData.message}`);
      }
      const data = await response.json();
      if (data.accessToken){
        return data.accessToken;
      } else {
        throw new Error (`Refresh token failure`);
      }
    } catch (error) {
      if (user) {
        user.reLogin();
      }
      throw new Error (`Refresh token failure`);
    }
    
}

const apiRequest = async (url, method, data = null, accessToken = false) => {
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

const request = async (url, method, data = null, accessToken = false) => {
  //Send a request, if the response is that access token expired, refresh token, then resend same request
  let response;
  try {
    response = await apiRequest(url, method, data, accessToken);
    if (!response.ok){
      const body = await response.json();
      if (body.tokenExpired) {
        //Refresh token then resend request
        const newAccessToken = await refreshAccessToken();
        if (user) user.refreshAccessToken(newAccessToken);
        response = await apiRequest(url, method, data, newAccessToken);
      }
    }
    return response;
  } catch (error) {
    //user.reLogin();
    return error;
  }
  
};
  
export function handleErrors(response) {
  //chaining this at end of APIrequest with .then() means it either passes the response thru the chain
  //or throws an error that can be caught
  if (response.ok) { //response.ok means an http status in the 200-299 range
    return response;
  }
  throw new Error(response);
  
};

export default {
  request,
  setUser,
  apiRequest,
  refreshAccessToken
}
  
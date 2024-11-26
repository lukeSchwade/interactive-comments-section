const apiRequest = (url, method, data = null, additionalHeaders = false) => {
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
    if (additionalHeaders) {
      init.headers.token = additionalHeaders;
    }
    return fetch(url, init)
      .then(result => {
        return result;
      })
      .catch(result => {
        return result;
      });
  };
  
  export function handleErrors(response) {
    //chaining this at end of APIrequest with .then() means it either passes the response thru the chain
    //or throws an error that can be caught
    if (response.ok) { //response.ok means an http status in the 200-299 range
      return response
    }
    throw Error(response)
  }
  export default apiRequest
  
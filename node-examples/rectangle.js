module.exports = (x,y,callback) => {
    
    if (x <= 0 || y <= 0) {
        setTimeout(() => 
            callback(new Error("Rectangle dimensions should be greater than zero : l = " + x + ", and b = " + y), null) ,             
            2000);
    }
    else {
        setTimeout(() => 
            callback(null , 
            {
                perimeter: () => (2*(x + y)),     
                //no need to pass arguments as it will take values passed above in the function. This shows the closure property of JavaScript.
                area: () => (x * y)
                //no need to pass arguments as it will take values passed above in the function. This shows the closure property of JavaScript.
            }) ,             
            2000);
    }
    
}

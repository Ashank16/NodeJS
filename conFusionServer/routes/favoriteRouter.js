const express = require("express");
const bodyParser = require("body-parser");
const Favorites = require("../models/favorite");
const verifyUser = require("../authenticate").verifyUser;
const cors = require('./cors');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route("/")
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user._id })
    .populate("dishes")
    .populate("user")
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
    },err => next(err))
    .catch(err => next(err));
})
.post(cors.corsWithOptions, verifyUser, (req, res, next) => {
    /*
        req is an array like this:
        [
            {"_id": "5bb952eeef1bb1785facd3ac"},
            {"_id":  "5bb95873a2c0d37e3662a2a3"}
        ]
    */

let newDishes = req.body.map(elem => elem._id); 
    // convert array of objs to array of values ["5bb952", "5bb95"]

    Favorites.findOne({ user: req.user._id })
    .then(favorite => {
        if (!favorite) {
            Favorites.create({ user: req.user._id })
            .then(favorite => {
                console.log("New Favorite created");
                const oldDishes = [];
                const dishes = concatDishes(newDishes, oldDishes);
                favorite.dishes = dishes;
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate("user")
                    .populate("dishes")
                    .then(favorite => {
                        console.log("dishes added to favorites");
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite);
                    });
                });
            })
            .catch(err => next(err));
        } 
        else {
            const oldDishes = favorite.dishes.map(elem => elem.toString());
            const dishes = concatDishes(newDishes, oldDishes);
            favorite.dishes = dishes;
            favorite.save()
            .then(favorite => {
                Favorites.findById(favorite._id)
                .populate("user")
                .populate("dishes")
                .then(favorite => {
                    console.log("dishes added to favorites");
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                });
            });
        }
    },err => next(err))
    .catch(err => next(err));
})
.put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites");
})
.delete(cors.corsWithOptions, verifyUser, (req, res, next) => {
    Favorites.deleteOne({ user: req.user._id })
    .then(resp => {        
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(resp);
    },err => next(err))
    .catch(err => next(err));
});

favoriteRouter.route("/:dishId")
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exists": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exists": true, "favorites": favorites});
            }
        }
    },err => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, verifyUser, (req, res, next) => {
    // we will apply logic from route "/", instead of req.body we will use req.params.dishId

    Favorites.findOne({ user: req.user._id })
    .then(favorite => {        
        if (!favorite) {
            Favorites.create({ user: req.user._id })
            .then(favorite => {
                console.log("New Favorite created");
                favorite.dishes.push(req.params.dishId);
                favorite.save()
                .then((favorite) => {
                    Favorites.findById(favorite._id)
                    .populate("user")
                    .populate("dishes")
                    .then((favorite) => {
                        console.log("dish added to favorites");
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite);
                    });
                })
            },err => next(err))
            .catch(err => next(err));
        } 
        else {
            const oldDishes = favorite.dishes.map(elem => elem.toString());
            const dishes = concatDishes(newDishes, oldDishes);
            favorite.dishes = dishes;
            favorite.save()
            .then(favorite => {
                Favorites.findById(favorite._id)
                .populate("user")
                .populate("dishes")
                .then((favorite) => {
                    console.log("dish added to favorites");
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                });
            });
        }
    },err => next(err))
    .catch(err => next(err));
})
.put(cors.corsWithOptions, verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /favorites/:dishId");
})
.delete(cors.corsWithOptions, verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then(favorite => {        
        if (favorite) {
            const oldDishes = favorite.dishes.map(elem => elem.toString());       //ObjectId to String
            const dishes = new Set(oldDishes);                                    // array to set
            const dishId = req.params.dishId;
            if (!dishes.has(dishId)) {
                err = new Error(`Dish  ${dishId}  not found in favorites`);
                err.status = 404;
                return next(err);
            } 
            else {
                dishes.delete(dishId);
                dishes = [...dishes];                                          // convert set to array
                favorite.dishes = dishes;
                favorite.save()
                .then(favorite => {
                    Favorites.findById(favorite._id)
                    .populate("user")
                    .populate("dishes")
                    .then(favorite => {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite);
                    });
                });
            }
        } 
        else {
            err = new Error(`Favorites for user  ${req.user._id}  doesn't exist`);
            err.status = 404;
            return next(err);
        }
    },err => next(err))
    .catch(err => next(err));
});

//this function concatenates two arrays into one with unique values

function concatDishes(newDishes, oldDishes) {
    let dishes = newDishes.concat(oldDishes);
    dishes = new Set(dishes);
    console.log("Set(dishes) ", dishes);
    dishes = [...dishes];                                                      // convert set to array
    return dishes;
}

module.exports = favoriteRouter;

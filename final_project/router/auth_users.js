const express = require('express');
const jwt = require('jsonwebtoken');
const { randomBytes, scryptSync, timingSafeEqual } = require("crypto");
const jwtSecret = process.env.BOOK_REVIEW_JWT_SECRET || randomBytes(32);
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
}

const authenticatedUser = (username, password) => {
    const user = users.find((entry) => entry.username === username);
  
    if (!user) {
      return false;
    }
  
    const savedHash = Buffer.from(user.passwordHash, "hex");
    const enteredHash = scryptSync(password, user.salt, 64);
    return timingSafeEqual(savedHash, enteredHash);
  };
  
  regd_users.post("/login", (req, res, next) => {
    const { username, password } = req.body || {};
  
    if (typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ message: "Username and password are required." });
    }
  
    const name = username.trim();
  
    if (!authenticatedUser(name, password)) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
  
    req.session.regenerate((error) => {
      if (error) {
        return next(error);
      }
  
      req.session.token = jwt.sign({ username: name }, jwtSecret, { expiresIn: "1h" });
      return res.json({ message: "User logged in successfully." });
    });
  });

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.query;

  if (!Object.prototype.hasOwnProperty.call(books, isbn)) {
    return res.status(404).json({ message: "Book not found." });
  }

  if (typeof review !== "string" || !review.trim()) {
    return res.status(400).json({ message: "A review is required." });
  }

  const book = books[isbn];
  book.reviews = {
    ...book.reviews,
    [req.reviewUsername]: review.trim()
  };

  return res.json({
    message: "Review added or updated successfully.",
    reviews: book.reviews
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const username = req.reviewUsername;
  
    if (!Object.prototype.hasOwnProperty.call(books, isbn)) {
      return res.status(404).json({ message: "Book not found." });
    }
  
    const reviews = books[isbn].reviews;
  
    if (!Object.prototype.hasOwnProperty.call(reviews, username)) {
      return res.status(404).json({ message: "You have no review for this book." });
    }
  
    delete reviews[username];
    return res.json({ message: "Review deleted successfully." });
  });


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.jwtSecret = jwtSecret;

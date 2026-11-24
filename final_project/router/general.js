const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const { randomBytes, scryptSync } = require("crypto");
const axios = require("axios");
const bookApi = axios.create({
  baseURL: "http://127.0.0.1:5000",
  timeout: 5000,
  proxy: false
});


public_users.post("/register", (req, res) => {
    const { username, password } = req.body || {};
  
    if (typeof username !== "string" || !username.trim() ||
        typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ message: "Username and password are required." });
    }
  
    const name = username.trim();
  
    if (users.some((user) => user.username === name)) {
      return res.status(409).json({ message: "Username already exists." });
    }
  
    const salt = randomBytes(16).toString("hex");
    const passwordHash = scryptSync(password, salt, 64).toString("hex");
    users.push({ username: name, salt, passwordHash });
  
    return res.status(201).json({ message: "User registered successfully." });
  });

// Get the book list available in the shop
public_users.get("/", (req, res) => {
    return res.json(books);
  });

// Get book details based on ISBN
public_users.get("/isbn/:isbn", (req, res) => {
    const { isbn } = req.params;
  
    if (!Object.prototype.hasOwnProperty.call(books, isbn)) {
      return res.status(404).json({ message: "Book not found." });
    }
  
    return res.json(books[isbn]);
  });
  
// Get book details based on author
public_users.get("/author/:author", (req, res) => {
    const { author } = req.params;
    const matchingBooks = Object.entries(books).filter(
      ([, book]) => book.author === author
    );
  
    return res.json(Object.fromEntries(matchingBooks));
  });

// Get all books based on title
public_users.get("/title/:title", (req, res) => {
    const { title } = req.params;
    const matchingBooks = Object.entries(books).filter(
      ([, book]) => book.title === title
    );
  
    return res.json(Object.fromEntries(matchingBooks));
  });

//  Get book review
public_users.get("/review/:isbn", (req, res) => {
    const { isbn } = req.params;
  
    if (!Object.prototype.hasOwnProperty.call(books, isbn)) {
      return res.status(404).json({ message: "Book not found." });
    }
  
    const { reviews } = books[isbn];
  
    if (Object.keys(reviews).length === 0) {
      return res.json({ message: "No reviews found for this book." });
    }
  
    return res.json(reviews);
  });

module.exports.general = public_users;

module.exports.getAllBooks = async function getAllBooks() {
    const { data } = await bookApi.get("/");
    return data;
  };
  
  module.exports.getBookByISBN = async function getBookByISBN(isbn) {
    const { data } = await bookApi.get(`/isbn/${encodeURIComponent(isbn)}`);
    return data;
  };
  
  module.exports.getBooksByAuthor = async function getBooksByAuthor(author) {
    const { data } = await bookApi.get(`/author/${encodeURIComponent(author)}`);
    return data;
  };
  
  module.exports.getBooksByTitle = async function getBooksByTitle(title) {
    const { data } = await bookApi.get(`/title/${encodeURIComponent(title)}`);
    return data;
  };
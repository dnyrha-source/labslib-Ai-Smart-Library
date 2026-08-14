import dotenv from 'dotenv';
dotenv.config();

import { bookService } from './src/data/services/book.service.js';

async function test() {
  try {
    const books = await bookService.searchBooks('carikan buku tentang astronomi');
    console.log("Books found:", books.length);
  } catch (err) {
    console.error("Book Service Error:", err);
  }
}

test();

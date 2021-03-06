// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'pizza_hunt' and set it to version 1
const request = indexedDB.open("tracker", 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)

request.onupgradeneeded = function (event) {
  // Save a reference to the database
  const db = event.target.result;

  // Create an object store called 'new_transaction', set it to have an auto incrementing primary key of sorts
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  // When db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // Check if app is online, if yes, run uploadTransaction() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // Acces the object store for 'new_transaction'
  const transactObjectStore = transaction.objectStore("new_transaction");

  // Add record to your store with add method
  transactObjectStore.add(record);
}

function uploadTransaction() {
  // open a transaction on your db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // Access your object store
  const transactObjectStore = transaction.objectStore("new_transaction");

  // Get all records from the store and set to a variable
  const getAll = transactObjectStore.getAll();

  // Upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, let's send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          response.json();
        })
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");

          // Acces the new_transaction object store
          const transactObjectStore =
            transaction.objectStore("new_transaction");

          // clear all items in your store
          transactObjectStore.clear();

          alert("All saved pizza has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadTransaction);
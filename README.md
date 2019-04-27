# ![Shopping Buddy](https://shop.randseq.org/favicon.png "Logo") Shopping Buddy

This is a simple shopping list PWA that I have built as a replacement for my original [Android app](https://play.google.com/store/apps/details?id=com.sevencoins.shoppingbuddy) of the same name. It is also an opportunity for me to learn more about PWA, [pouchdb](https://pouchdb.com/) and [Onsen UI](https://onsen.io).

This app lets you create shared shopping lists. Edits are synchronized in real-time across all instances of the same list. List items can be categorized via hash tags. Photos can also be attached to any list item.

Shopping Buddy has so far been tested on Chrome (Windows, Android) and Safari (iOS).

A production demo can be found at [https://shop.randseq.org/](https://shop.randseq.org/)

# Screenshots
![Screenshot](https://shop.randseq.org/screenshots/screenshot01.png "Screenshot 1")
![Screenshot](https://shop.randseq.org/screenshots/screenshot02.png "Screenshot 2")
![Screenshot](https://shop.randseq.org/screenshots/screenshot03.png "Screenshot 3")
![Screenshot](https://shop.randseq.org/screenshots/screenshot04.png "Screenshot 4") 

# Libraries used

* [Onsen UI](https://onsen.io) for the UI. As a personal preference, I chose to fix the look-and-feel (Material) instead of letting it vary with the platform. 

* [CouchDB](http://couchdb.apache.org) as the backend database.

* [pouchdb](https://pouchdb.com/) to connect to CouchDB in Javascript. This helps take care of the synchronization of data between different instances of the app.

* [PHPOnCouch](https://php-on-couch.readthedocs.io/) to allow the backend PHP script to connect to CouchDB

* [pica](https://github.com/nodeca/pica) to allow scaling down of photo attachments on memory-constrained mobile devices.

# How to run

If you wish to run Shopping Buddy on your own server, first install CouchDB by following the setup guide for your server paltform. Then you need to enable [private database per user](https://docs.couchdb.org/en/stable/config/couch-peruser.html) for CouchDB. Finally, make sure PHP is enabled on your web server so  ```php/request.php``` can be executed. The actual CouchDB admin passward also needs to be set in the PHP file (```COUCHDB_PASS``` constant).

Internally, how it works is that there is no user registration or login for the app. Each list created corresponds to a CouchDB user/database. The frontend calls ```php/request.php``` to create a new CouchDB user/database every time a new list is created. This way the admin password is never exposed, and the frontend only has control over the CouchDB users/databases that it owns and nothing more.

# License

This project is licensed under [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
## Installation Guide
1. Install Node.js and MongoDB
2. For insert the first user, you can use the **insert_data.js** script. Before executing it edit the file and insert safe credentials for the admin.
You can now execute the script using the command **node insert_data.js**; then remember to delete this file.
3. Install the server with **npm install**
4. Update the .env with right values. You can skip for now the TURN variables. 
5. You also need to create two certificates for HTTPS, even self signed is okay
6. Run the server with the command **node server.js**

### Before putting the Server on a public IP
Remember to delete the line '--ignore-certificate-errors' in the Local_Server_Teleop. If you do this you'll need to use valid certificates in the Server_Teleop.

## Using TURN
TURN servers haven't been tested but there is an attempt that should work in the code (with CoTURN server).

For enabling them, you need to
- in the folder **private/javascripts** you need to uncomment the ICEServer configuration according to the authentication method that you will use.
- in the routes folder edit the routes **POST /login** and **/teleop:robot** of the **index.js** file. Uncomment the res.render according to the authentication method (and comment the return res.render already present).
- if you are using the REST API, you also need to uncomment some codes in the **server.js** file, where it is indicated with TURN REST API block of comment and where there is the access of the users into the socket.io rooms (the two block of comments with the name TURN CREDENZIALI)
- update the .env file

Remember that the TURN server and this server must have their clock in sync if you are using the REST API.

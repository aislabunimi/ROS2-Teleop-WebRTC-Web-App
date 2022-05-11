## Installation Guide
1. Install Node.js and MongoDB
2. For insert the first user, you can use the  ```insert_data.js ``` script. Before executing it edit the file and insert safe credentials for the admin.
You can now execute the script using the command  ```node insert_data.js ```; then remember to delete this file.
3. Install the server with  ```npm install ```
4. Update the .env with right values. You can skip for now the TURN variables. 
5. You also need to create two certificates for HTTPS, even self signed is okay
6. Run the server with the command  ```node server.js ```

## Registering a User and a Robot
For registering a User and a Robot you should use the admin page offered by the Server.
The document schema is the following:
- Username: the name of the user or of the robot.
- Group: the group of the user. The user can be a human, a robot or an admin.
- Robotids: the robotids that the user can teleop. A robotid is an id that shows the privilege for controlling the robot. An human user can have one or more robotids while a robot **MUST** have a single robotid. The robotid of the robot is used for creating the WebRTC room.
- Password: the password of the user or of the robot.

The username of the robot **MUST** be equivalent to his robotid. The robotid **MUST** be in the form of one of the ROBOTX_MODEL.  
For example, if ROBOT1_MODEL=turtlebot3, the robotids must be in the form of turtlebot3_1, turtlebot3_2, turtlebot3_asd...  
If you don't follow this rules the application won't work. Also usernames, passwords and robotids must not contain spaces, $, {, }, &, <, >, " and ' .

## Before putting the Server on a public IP
Remember to delete the line  ``` --ignore-certificate-errors ``` in the Local_Server_Teleop. If you do this you'll need to use valid certificates in the Server_Teleop.

## Using TURN
TURN servers haven't been tested but there is an attempt that should work in the code (with CoTURN server).

For enabling them, you need to
- in the folder  ``` private/javascripts ``` you need to uncomment the ICEServer configuration according to the authentication method that you will use.
- in the routes folder edit the routes  ```POST /login ``` and  ```/teleop:robot ``` of the  ```index.js ``` file. Uncomment the res.render according to the authentication method (and comment the return res.render already present).
- if you are using the REST API, you also need to uncomment some codes in the  ```server.js ``` file, where it is indicated with TURN REST API block of comment and where there is the access of the users into the socket.io rooms (the two block of comments with the name TURN CREDENZIALI)
- update the .env file

Remember that the TURN server and this server must have their clock in sync if you are using the REST API.
